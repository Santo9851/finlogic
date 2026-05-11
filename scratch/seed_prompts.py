import os
import django
import sys

# Setup django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'finlogic_api.settings')
django.setup()

from deals.models import PromptLibrary

def seed_missing_prompts():
    prompts = [
        {
            "task_type": "valuation_generation",
            "name": "Gemini Valuation Assumptions Engine",
            "system_prompt": (
                "You are a senior Private Equity Analyst specializing in valuation modelling for the Nepal market. "
                "Your goal is to synthesize financial, qualitative, and market data into realistic DCF and LBO assumptions. "
                "Focus on accuracy, conservatism, and local market nuances (Nepal)."
            ),
            "user_prompt_template": (
                "Analyze the following data for {project_name} ({sector}, {deal_type}) and generate valuation assumptions.\n\n"
                "### Financial History (NPR):\n{financials}\n\n"
                "### Quality of Earnings Analysis:\nStatus: {qoe_status}\nDetails: {qoe_adjustments}\n\n"
                "### Market Intelligence:\n{commercial_notes}\n\n"
                "### FINLO Scoring Score:\n{scoring_total}\n\n"
                "### Economic Context:\n{nepal_context}\n\n"
                "### Output Requirements:\n"
                "Return a valid JSON object with the following structure:\n"
                "{\n"
                "  \"dcf\": {\n"
                "    \"current_revenue\": float,\n"
                "    \"revenue_growth_rate\": float (decimal),\n"
                "    \"ebitda_margin\": float (decimal),\n"
                "    \"tax_rate\": 0.25,\n"
                "    \"projection_years\": 5,\n"
                "    \"wacc\": float (decimal),\n"
                "    \"terminal_growth_rate\": float (decimal),\n"
                "    \"net_debt\": float\n"
                "  },\n"
                "  \"lbo\": {\n"
                "    \"entry_revenue\": float,\n"
                "    \"entry_ebitda\": float,\n"
                "    \"entry_multiple\": float,\n"
                "    \"exit_multiple\": float,\n"
                "    \"exit_year\": 5,\n"
                "    \"revenue_growth\": float (decimal),\n"
                "    \"ebitda_margin\": float (decimal),\n"
                "    \"tax_rate\": 0.25,\n"
                "    \"debt_financing\": [\n"
                "       {\"name\": \"Senior Debt\", \"amount\": float, \"rate\": float}\n"
                "    ]\n"
                "  },\n"
                "  \"rationale\": \"Concise justification for the key assumption shifts (max 150 words).\"\n"
                "}"
            ),
            "is_active": True
        },
        {
            "task_type": "term_sheet_draft",
            "name": "PE Term Sheet Drafter",
            "system_prompt": "You are a legal counsel specializing in Private Equity term sheets in Nepal. Draft professional, balanced, and legally sound term sheets in Markdown format.",
            "user_prompt_template": "Draft a term sheet for {project_name}. Context: {context}. Valuation: {valuation_data}.",
            "is_active": True
        },
        {
            "task_type": "spa_draft",
            "name": "PE SPA Drafter",
            "system_prompt": "You are a legal counsel drafting a Share Purchase Agreement (SPA) for a PE deal in Nepal. Focus on standard representations, warranties, and closing conditions.",
            "user_prompt_template": "Draft an SPA based on the signed term sheet: {term_sheet_content}.",
            "is_active": True
        }
    ]

    for p in prompts:
        obj, created = PromptLibrary.objects.update_or_create(
            task_type=p['task_type'],
            defaults={
                'name': p['name'],
                'system_prompt': p['system_prompt'],
                'user_prompt_template': p['user_prompt_template'],
                'is_active': p['is_active']
            }
        )
        if created:
            print(f"Created prompt for: {p['task_type']}")
        else:
            print(f"Updated prompt for: {p['task_type']}")

if __name__ == "__main__":
    seed_missing_prompts()
