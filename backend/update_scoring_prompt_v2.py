
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'finlogic_api.settings')
django.setup()

from deals.models import PromptLibrary

def update_scoring_prompt_escaped():
    try:
        p = PromptLibrary.objects.get(task_type='scoring', is_active=True)
    except PromptLibrary.DoesNotExist:
        print("Scoring prompt not found.")
        return
    
    # We MUST escape { and } by doubling them in the template for string.Formatter
    p.user_prompt_template = (
        "SCORING RUBRIC:\n{pillars_definition}\n\n"
        "PROJECT CONTEXT:\n{project_data}\n\n"
        "GUARDRAILS:\n{precision_guardrails}\n\n"
        "OUTPUT FORMAT:\n"
        "Return ONLY a JSON object with the following structure (ensure all braces are closed):\n"
        "{{\n"
        "  \"pillar_results\": {{\n"
        "    \"F\": {{\n"
        "      \"criteria_scores\": {{\n"
        "        \"problem_clarity\": {{ \"score\": 8, \"rationale\": \"...\", \"confidence\": 0.9, \"evidence\": [\"...\"] }}\n"
        "      }}\n"
        "    }},\n"
        "    \"I\": {{ ... }},\n"
        "    \"N\": {{ ... }},\n"
        "    \"L\": {{ ... }},\n"
        "    \"O\": {{ ... }}\n"
        "  }}\n"
        "}}"
    )
    
    p.save()
    print("Scoring prompt (escaped) updated successfully.")

if __name__ == "__main__":
    update_scoring_prompt_escaped()
