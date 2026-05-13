import os
import time
import requests
import logging
from django.conf import settings
from google import genai
from google.genai import types
from .models import ValidatorPrompt
from .prompts import (
    POLISHED_REPORT_SYSTEM_PROMPT, 
    POLISHED_REPORT_USER_PROMPT,
    RED_TEAM_SYSTEM_PROMPT,
    RED_TEAM_USER_PROMPT
)

logger = logging.getLogger('django')

class ValidatorAIClient:
    def __init__(self):
        self.gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.deepseek_api_key = os.environ.get("DEEPSEEK_API_KEY")

    def get_prompts(self, task_type):
        """Fetch prompts from DB with fallback to hardcoded defaults."""
        try:
            prompt_obj = ValidatorPrompt.objects.filter(task_type=task_type, is_active=True).first()
            if prompt_obj:
                return prompt_obj.system_prompt, prompt_obj.user_prompt_template
        except Exception as e:
            logger.warning(f"Failed to fetch {task_type} prompt from DB: {str(e)}")
        
        # Fallback
        if task_type == 'polished_report':
            return POLISHED_REPORT_SYSTEM_PROMPT, POLISHED_REPORT_USER_PROMPT
        return RED_TEAM_SYSTEM_PROMPT, RED_TEAM_USER_PROMPT

    def call_gemini(self, system_prompt, user_prompt):
        """Used for the Polished Report (Venture Architect persona)."""
        try:
            config = types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.7,
                top_p=0.9,
                max_output_tokens=2048,
            )
            # Use gemini-flash-latest for consistency with other services (deals/insights)
            response = self.gemini_client.models.generate_content(
                model="gemini-flash-latest",
                config=config,
                contents=[user_prompt]
            )
            return response.text
        except Exception as e:
            logger.error(f"Gemini call failed for Validator: {str(e)}")
            # Fallback to 1.5 Pro if available or retry
            try:
                response = self.gemini_client.models.generate_content(
                    model="gemini-1.5-pro",
                    config=config,
                    contents=[user_prompt]
                )
                return response.text
            except:
                raise e

    def call_deepseek_r1(self, system_prompt, user_prompt):
        """Used for the Red-Team Report (Ruthless Adversary persona)."""
        if not self.deepseek_api_key:
            logger.warning("DeepSeek API Key missing, falling back to Gemini for Red Team.")
            return self.call_gemini(system_prompt + "\n\n(Note: Act as a ruthless adversary, simulate DeepSeek R1 reasoning)", user_prompt)

        url = "https://api.deepseek.com/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.deepseek_api_key}"
        }
        data = {
            "model": "deepseek-reasoner", # DeepSeek R1
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.5
        }
        
        try:
            response = requests.post(url, headers=headers, json=data, timeout=90)
            if response.status_code == 200:
                res_json = response.json()
                return res_json['choices'][0]['message']['content']
            else:
                logger.error(f"DeepSeek API Error: {response.text}")
                return self.call_gemini(system_prompt + "\n\n(Reason deeply and be ruthless)", user_prompt)
        except Exception as e:
            logger.error(f"DeepSeek call failed: {str(e)}")
            return self.call_gemini(system_prompt + "\n\n(Reason deeply and be ruthless)", user_prompt)

def build_answer_context(session):
    from .models import Question
    answers = session.answers.all().order_by('question_number')
    context_lines = []
    
    q_map = {q.order: q for q in Question.objects.all()}
    
    for ans in answers:
        q_data = q_map.get(ans.question_number)
        q_title = q_data.title_en if q_data else f"Question {ans.question_number}"
        
        line = f"Q{ans.question_number} ({q_title}): MCQ = \"{ans.selected_option or 'N/A'}\""
        if ans.other_text:
            line += f", Other = \"{ans.other_text}\""
        if ans.free_text_response:
            line += f", Free text = \"{ans.free_text_response}\""
        context_lines.append(line)
        
    return "\n".join(context_lines)
