import os
import json
import time
from datetime import datetime
from decimal import Decimal
from google import genai
from google.genai import types
import requests
from django.conf import settings
from django.core.cache import cache
from .models import AICallLog, PromptLibrary

class AIBudgetGuard:
    """
    Redis-based cost tracking and circuit breaker.
    Default budget: $25/month.
    """
    MONTHLY_LIMIT_USD = 25.0
    REDIS_KEY_PREFIX = "ai_budget:"

    @classmethod
    def get_monthly_key(cls):
        return f"{cls.REDIS_KEY_PREFIX}{datetime.now().strftime('%Y-%m')}"

    @classmethod
    def get_current_spend(cls):
        # Using Django's cache which points to Redis
        spend = cache.get(cls.get_monthly_key())
        return float(spend) if spend else 0.0

    @classmethod
    def track_cost(cls, cost_usd):
        key = cls.get_monthly_key()
        current = cls.get_current_spend()
        # Set with no timeout to persist through the month
        cache.set(key, current + float(cost_usd), timeout=None)

    @classmethod
    def can_make_call(cls):
        return cls.get_current_spend() < cls.MONTHLY_LIMIT_USD

class AIModelClient:
    """
    Routes tasks to optimal models:
    - Financial Extraction, Scoring, Legal Scan -> Gemini 2.0 Flash
    - Memo Draft, QoE Analysis -> DeepSeek R1
    """
    
    # Model Mappings — All tasks route to Gemini
    TASK_ROUTING = {
        "financial_extraction": "gemini-flash-latest",
        "scoring": "gemini-flash-latest", 
        "legal_scan": "gemini-flash-latest",
        "memo_draft": "gemini-flash-latest",
        "qoe_analysis": "gemini-flash-latest",
        "commercial_analysis": "gemini-flash-latest",
        "operational_analysis": "gemini-flash-latest",
        "valuation_generation": "gemini-flash-latest",
        "term_sheet_draft": "gemini-flash-latest",
        "spa_draft": "gemini-flash-latest",
    }

    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.deepseek_api_key = os.environ.get("DEEPSEEK_API_KEY")

    def get_model_for_task(self, task_type):
        return self.TASK_ROUTING.get(task_type, "gemini-2.0-flash")

    def _call_gemini(self, model_name, system_prompt, user_prompt, document=None):
        max_retries = 3
        backoff = 10
        
        for attempt in range(max_retries):
            try:
                start_time = time.time()
                # Use a specific configuration to avoid SDK overhead
                config = types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.1,
                    # Disable AFC to prevent hangs/latency
                    automatic_function_calling=types.AutomaticFunctionCallingConfig(
                        disable=True
                    ) if hasattr(types, 'AutomaticFunctionCallingConfig') else None
                )
                
                contents = [user_prompt]
                if document:
                    # Logic to attach file part
                    try:
                        file_path = document.local_file.path if document.local_file else None
                        if file_path and os.path.exists(file_path):
                            mime = document.mime_type or "application/pdf"
                            # Only attach if it is a supported file type for Gemini (PDF, images)
                            if mime == "application/pdf" or mime.startswith("image/"):
                                with open(file_path, "rb") as f:
                                    file_data = f.read()
                                    contents.append(types.Part.from_bytes(data=file_data, mime_type=mime))
                    except:
                        pass # Fallback to text only

                response = self.client.models.generate_content(
                    model=model_name,
                    config=config,
                    contents=contents
                )
                latency = int((time.time() - start_time) * 1000)
                
                # Metadata
                text = response.text
                prompt_tokens = len(system_prompt + user_prompt) // 4
                completion_tokens = len(text) // 4
                
                # Gemini 3.1 Flash Cost (Estimated)
                cost = (prompt_tokens + completion_tokens) * 0.0000001
                
                return text, prompt_tokens, completion_tokens, latency, cost
            except Exception as e:
                # Log specific error for debugging
                import logging
                logging.getLogger('django').error(f"Gemini Call failed (Attempt {attempt+1}): {str(e)}")
                
                if "429" in str(e) or "ResourceExhausted" in str(e):
                    # If we hit a "limit: 0" error, it's a project/tier restriction. Fallback immediately.
                    if "limit: 0" in str(e):
                         import logging
                         # Progressive Fallback: 2.0 -> 1.5 Flash -> 1.5 Pro
                         if "2.0" in model_name:
                             next_model = "gemini-flash-latest"
                         elif "flash" in model_name:
                             next_model = "gemini-1.5-pro"
                         else:
                             raise e
                             
                         logging.getLogger('django').warning(f"Gemini hit quota restriction. Falling back to {next_model} immediately.")
                         return self._call_gemini(next_model, system_prompt, user_prompt, document=document)

                    if attempt == max_retries - 1:
                        # Final attempt with the most stable model
                        if "flash" in model_name:
                            return self._call_gemini("gemini-1.5-pro", system_prompt, user_prompt, document=document)
                        raise e
                    time.sleep(backoff)
                    backoff *= 2
                elif "404" in str(e):
                    # Fallback to 1.5 if 2.0 is not available (common in some regions)
                    if "2.0" in model_name or "gemini-3" in model_name:
                        return self._call_gemini("gemini-1.5-flash", system_prompt, user_prompt)
                    raise e
                else:
                    raise e

    def _call_deepseek(self, model_name, system_prompt, user_prompt):
        url = "https://api.deepseek.com/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.deepseek_api_key}"
        }
        data = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.7
        }
        
        start_time = time.time()
        response = requests.post(url, headers=headers, json=data, timeout=60)
        latency = int((time.time() - start_time) * 1000)
        
        if response.status_code != 200:
            raise Exception(f"DeepSeek API Error: {response.text}")
            
        res_json = response.json()
        text = res_json['choices'][0]['message']['content']
        usage = res_json.get('usage', {})
        prompt_tokens = usage.get('prompt_tokens', 0)
        completion_tokens = usage.get('completion_tokens', 0)
        
        # DeepSeek R1 Cost: ~$0.14 input / $0.55 output per 1M tokens
        cost = (prompt_tokens * 0.00000014) + (completion_tokens * 0.00000055)
        
        return text, prompt_tokens, completion_tokens, latency, cost

    def execute_task(self, task_type, context_data, project=None, document=None):
        """
        Main entry point for executing a structured AI task.
        Handles budget guarding, prompt retrieval, execution, and logging.
        """
        if not AIBudgetGuard.can_make_call():
            raise Exception(f"AI Budget Exceeded (Limit: ${AIBudgetGuard.MONTHLY_LIMIT_USD}). Circuit breaker active.")

        # 1. Get Prompt
        try:
            prompt_obj = PromptLibrary.objects.get(task_type=task_type, is_active=True)
        except PromptLibrary.DoesNotExist:
            raise Exception(f"No active prompt found in library for task: {task_type}")

        system_prompt = prompt_obj.system_prompt
        
        user_prompt = prompt_obj.user_prompt_template
        
        # 1. Robust Placeholder Replacement ([[key]], {key}, and nested [[key.subkey]])
        import re
        def replace_match(match):
            # Extract key name, removing [[, ]], {, or }
            raw_key = match.group(1)
            key_path = raw_key.split('.')
            val = context_data
            try:
                for k in key_path:
                    val = val.get(k)
                    if val is None: break
                
                if val is not None:
                    return str(val)
                # Fallback to key name if not found in context_data
                return match.group(0)
            except:
                return match.group(0)
        
        # Replace [[key.subkey]] and [[key]]
        user_prompt = re.sub(r'\[\[(.*?)\]\]', replace_match, user_prompt)
        # Replace {key} - but only if it looks like a variable (no spaces, alphanumeric/underscores)
        # to avoid accidentally replacing JSON braces.
        user_prompt = re.sub(r'(?<!\{)\{([a-zA-Z0-9_\.]+)\}(?!\})', replace_match, user_prompt)
        
        # Note: We skip standard .format() entirely to prevent crashes with JSON braces {{ }} in templates.
        
        # Ensure formatting instructions are appended if not already in the template
        if "formatting_instruction" in context_data and "{formatting_instruction}" not in prompt_obj.user_prompt_template:
            user_prompt += "\n\n" + context_data["formatting_instruction"]
        model_name = self.get_model_for_task(task_type)

        # DEBUG: Log the payload being sent to the AI
        import logging
        logger = logging.getLogger('django')
        logger.info(f"--- AI CALL START [{task_type}] ---")
        logger.info(f"Model: {model_name}")
        logger.info(f"System Prompt Length: {len(system_prompt)}")
        logger.info(f"User Prompt Length: {len(user_prompt)}")
        # Print first 500 chars of user prompt
        logger.info(f"Prompt Sample: {user_prompt[:500]}...")

        try:
            # 2. Call AI
            if "gemini" in model_name:
                text, p_tokens, c_tokens, latency, cost = self._call_gemini(model_name, system_prompt, user_prompt, document=document)
            else:
                text, p_tokens, c_tokens, latency, cost = self._call_deepseek(model_name, system_prompt, user_prompt)

            logger.info(f"--- AI CALL SUCCESS [{task_type}] ---")
            logger.info(f"Latency: {latency}ms | Cost: ${cost:.6f} | Tokens: {p_tokens + c_tokens}")
            logger.info(f"--- AI CALL END ---")

            # 3. Log Success
            AICallLog.objects.create(
                task_type=task_type,
                model_name=model_name,
                prompt_tokens=p_tokens,
                completion_tokens=c_tokens,
                total_tokens=p_tokens + c_tokens,
                estimated_cost_usd=Decimal(str(round(cost, 6))),
                latency_ms=latency,
                status='SUCCESS',
                project=project,
                document=document
            )
            
            # 4. Update Budget
            AIBudgetGuard.track_cost(cost)
            
            return text

        except Exception as e:
            # Log Failure
            AICallLog.objects.create(
                task_type=task_type,
                model_name=model_name,
                status='ERROR',
                error_message=str(e),
                project=project,
                document=document
            )
            raise e
