import os
import json
import time
from datetime import datetime
from decimal import Decimal
import google.generativeai as genai
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
    def can_make_call(cls):
        return cls.get_current_spend() < cls.MONTHLY_LIMIT_USD

    @classmethod
    def track_cost(cls, cost_usd):
        key = cls.get_monthly_key()
        current = cls.get_current_spend()
        # Set with no timeout to persist through the month
        cache.set(key, current + float(cost_usd), timeout=None)

class AIModelClient:
    """
    Routes tasks to optimal models:
    - Financial Extraction, Scoring, Legal Scan -> Gemini 2.0 Flash
    - Memo Draft, QoE Analysis -> DeepSeek R1
    """
    
    # Model Mappings
    TASK_ROUTING = {
        "financial_extraction": "gemini-2.0-flash",
        "scoring": "gemini-2.0-flash",
        "legal_scan": "gemini-2.0-flash",
        "memo_draft": "deepseek-reasoner", # DeepSeek R1 (Reasoner)
        "qoe_analysis": "deepseek-reasoner",
        "commercial_analysis": "gemini-2.0-flash",
        "operational_analysis": "gemini-2.0-flash",
    }

    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.deepseek_api_key = os.environ.get("DEEPSEEK_API_KEY")

    def get_model_for_task(self, task_type):
        return self.TASK_ROUTING.get(task_type, "gemini-2.0-flash")

    def _call_gemini(self, model_name, system_prompt, user_prompt):
        model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=system_prompt
        )
        start_time = time.time()
        response = model.generate_content(user_prompt)
        latency = int((time.time() - start_time) * 1000)
        
        # Metadata
        text = response.text
        # Rough token estimation if metadata is unavailable
        prompt_tokens = len(system_prompt + user_prompt) // 4
        completion_tokens = len(text) // 4
        
        # Gemini 2.0 Flash Cost: ~$0.10 per 1M tokens (blended)
        cost = (prompt_tokens + completion_tokens) * 0.0000001
        
        return text, prompt_tokens, completion_tokens, latency, cost

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
        Main entry point for AI tasks.
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
        user_prompt = prompt_obj.user_prompt_template.format(**context_data)
        model_name = self.get_model_for_task(task_type)

        try:
            # 2. Call AI
            if "gemini" in model_name:
                text, p_tokens, c_tokens, latency, cost = self._call_gemini(model_name, system_prompt, user_prompt)
            else:
                text, p_tokens, c_tokens, latency, cost = self._call_deepseek(model_name, system_prompt, user_prompt)

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
