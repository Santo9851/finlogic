from deals.models import PromptLibrary
PromptLibrary.objects.update_or_create(
    task_type='valuation_generation',
    defaults={
        'user_prompt_template': """Analyze the following data for {project_name} ({sector}, {deal_type}) and generate valuation assumptions.

### Financial History (NPR):
{financials}

### Quality of Earnings Analysis:
Status: {qoe_status}
Details: {qoe_adjustments}

### Market Intelligence:
{commercial_notes}

### FINLO Scoring Score:
{scoring_total}

### Economic Context:
{nepal_context}

### Output Requirements:
Return a valid JSON object with the following structure:
{{
  "dcf": {{
    "current_revenue": float,
    "revenue_growth_rate": float (decimal),
    "ebitda_margin": float (decimal),
    "tax_rate": 0.25,
    "projection_years": 5,
    "wacc": float (decimal),
    "terminal_growth_rate": float (decimal),
    "net_debt": float
  }},
  "lbo": {{
    "entry_revenue": float,
    "entry_ebitda": float,
    "entry_multiple": float,
    "exit_multiple": float,
    "exit_year": 5,
    "revenue_growth": float (decimal),
    "ebitda_margin": float (decimal),
    "tax_rate": 0.25,
    "debt_financing": [
       {{"name": "Senior Debt", "amount": float, "rate": float}}
    ]
  }},
  "rationale": "Concise justification for the key assumption shifts (max 150 words)."
}}"""
    }
)
print("Prompt updated successfully with escaped braces.")
