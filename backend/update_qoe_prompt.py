import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'finlogic_api.settings')
django.setup()

from deals.models import PromptLibrary

try:
    p = PromptLibrary.objects.get(task_type='qoe_analysis', is_active=True)
except PromptLibrary.DoesNotExist:
    p = PromptLibrary.objects.create(task_type='qoe_analysis', name='QoE Analysis', is_active=True, version=1)

p.system_prompt = (
    "You are a senior private equity investment director at Finlogic Capital. Your task is to perform an "
    "institutional-grade Quality of Earnings (QoE) analysis on the target company. "
    "You must analyze the sustainability of reported earnings, particularly EBITDA, and identify potential areas for adjustment. "
    "Provide a highly rigorous, detailed, and professional analysis formatted in markdown. "
    "Ensure there are absolutely no hypothetical placeholders (like [Company Name] or [Hypothetical]). "
    "Always use the target company's real name and sector. "
    "Use Nepalese Rupee (NPR) values and proper formatting for all figures, aligning with local and international financial standards. "
    "Always refer to Nepalese fiscal years (e.g., FY 2087/88) as provided in the context."
)

p.user_prompt_template = (
    "Perform a Quality of Earnings (QoE) analysis for the target company:\n"
    "- Target Company: {project_name}\n"
    "- Sector: {sector}\n\n"
    "Financial Data Provided:\n"
    "{financial_data}\n\n"
    "Structure your report into the following exact sections with Markdown:\n\n"
    "# Quality of Earnings (QoE) Analysis: {project_name}\n"
    "**To**: Investment Committee  \n"
    "**From**: Senior Investment Director  \n"
    "**Date**: October 26, 2023  \n"
    "**Subject**: Quality of Earnings Analysis - {project_name} ({sector})\n\n"
    "## 1. Executive Summary\n"
    "Provide a high-fidelity summary of findings. Explicitly evaluate the sustainability of {project_name}'s "
    "earnings and highlight any key concerns, discrepancies, or volatility in growth and margins.\n\n"
    "## 2. Overview of Financial Performance\n"
    "Include a markdown table summarizing the financials (Revenue, EBITDA, PAT, Assets, Debt, EBITDA Margin %, PAT Margin %, Debt/Assets %) "
    "for each fiscal year, along with calculated CAGR or YoY growth. Discuss the trends.\n\n"
    "## 3. EBITDA Adjustments & Normalization\n"
    "Identify potential non-recurring items or anomalies that distort sustainable earnings. Ground adjustments in the context of {project_name} "
    "operating in the {sector} sector. Group adjustments into:\n"
    "- **Deductions from Reported EBITDA** (e.g., non-recurring revenue, related party gains, one-time contract windfalls).\n"
    "- **Add-backs to Reported EBITDA** (e.g., non-recurring startup costs, M&A expenses, extraordinary legal fees).\n"
    "Provide a structured normalization table estimating Adjusted/Normalized EBITDA and explain the adjustments.\n\n"
    "## 4. Balance Sheet Strength & Risk Profile\n"
    "Discuss the changes in Assets and Debt. Specifically analyze the deleveraging trend, asset growth, and implications on the overall financial risk profile of {project_name}.\n\n"
    "## 5. Detailed Investment Recommendations\n"
    "Outline concrete next steps for the due diligence team, such as requesting specific general ledger details, cash flow reconciliations, management interviews, and verification of high-margin sustainability.\n\n"
    "Ensure the tone is highly professional, rigorous, and tailored to the private equity context. No hypothetical placeholders or placeholders of any kind should remain in the output."
)

p.save()
print("QoE Prompt updated successfully with high-fidelity Nepalese/sector context.")
