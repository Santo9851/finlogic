
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'finlogic_api.settings')
django.setup()

from deals.models import PromptLibrary

def update_scoring_prompt():
    p, created = PromptLibrary.objects.get_or_create(task_type='scoring', is_active=True, defaults={"name": "Consolidated Scoring"})
    
    p.system_prompt = (
        "You are a Senior Investment Committee member at a Private Equity fund. "
        "Your task is to provide a quantitative and qualitative scoring for a growth-stage company "
        "based on the FINLO 5-Pillar Framework. Ensure absolute precision, citing specific evidence "
        "from the provided project data."
    )
    
    p.user_prompt_template = (
        "SCORING RUBRIC:\n{pillars_definition}\n\n"
        "PROJECT CONTEXT:\n{project_data}\n\n"
        "GUARDRAILS:\n{precision_guardrails}\n\n"
        "OUTPUT FORMAT:\n"
        "Return ONLY a JSON object with the following structure:\n"
        "{\n"
        "  \"pillar_results\": {\n"
        "    \"F\": {\n"
        "      \"criteria_scores\": {\n"
        "        \"problem_clarity\": { \"score\": 8, \"rationale\": \"...\", \"confidence\": 0.9, \"evidence\": [\"...\"] }\n"
        "      }\n"
        "    },\n"
        "    \"I\": { ... },\n"
        "    \"N\": { ... },\n"
        "    \"L\": { ... },\n"
        "    \"O\": { ... }\n"
        "  }\n"
        "}"
    )
    
    p.save()
    print("Scoring prompt updated successfully.")

if __name__ == "__main__":
    update_scoring_prompt()
