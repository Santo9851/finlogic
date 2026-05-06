import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'finlogic_api.settings')
django.setup()

from deals.models import PromptLibrary

p = PromptLibrary.objects.get(task_type='memo_draft', is_active=True)
p.system_prompt = (
    "You are a senior investment associate at a top-tier private equity firm in Nepal. "
    "Your task is to draft a rigorous, high-stakes Investment Committee (IC) memo "
    "that adheres to both international standards and Nepal's specific regulatory context. "
    "You must be analytical, objective, and focused on value creation and risk mitigation. "
    "Crucially, ground your analysis in the Nepalese context, including SEBON guidelines, "
    "NRB regulations, FITTA requirements (if applicable), and local tax implications (e.g., TDS, VAT). "
    "For every fact, address the 'So What?' (why it matters for returns in the Nepal market). "
    "Ensure a professional, persuasive, but balanced tone."
)
p.user_prompt_template = (
    "Draft a comprehensive 9-section IC Memo for the following project, grounded in the NEPALESE market context:\n"
    "Project: {project_name}\n"
    "Sector: {sector}\n"
    "Deal Type: {deal_type}\n"
    "Financial Data (NPR): {financials}\n"
    "Scoring Summary (FINLO Framework): {scoring_summary}\n"
    "Red Flags & Risks (including Nepal-specific risks like policy changes/forex): {red_flags}\n"
    "Commercial Analysis (Nepal market landscape): {commercial_analysis}\n"
    "Operational Analysis (local supply chain/infrastructure): {operational_analysis}\n"
    "Regulatory Context (SEBON/NRB/FITTA): {regulatory}\n\n"
    "The memo MUST include these sections as keys in a JSON object:\n"
    "1. executive_summary: Summary of 'The Ask', business overview, thesis, and estimated returns (IRR/MOIC) in NPR.\n"
    "2. company_overview: Business model in Nepal, core products/services, and organizational summary (including local management).\n"
    "3. market_analysis: TAM/SAM/SOM in Nepal, local industry tailwinds, and competitive landscape (Moat against local and regional players).\n"
    "4. financial_analysis: Historical performance in NPR, Quality of Earnings (QofE) with local accounting adjustments, and cash flow profile.\n"
    "5. investment_thesis: Specific growth levers in Nepal (e.g., geographic expansion across provinces, digital transformation) and operational improvements.\n"
    "6. deal_terms: Proposed structure (Equity/Convertible), sources and uses of funds in NPR, and exit strategy timeline (e.g., IPO in NEPSE or Strategic Sale).\n"
    "7. risk_assessment: A high-level textual overview of key risks, including Nepal-specific regulatory and economic risks.\n"
    "8. risks_table: A JSON array of objects for the risk matrix: [{\"risk\": \"string\", \"impact\": \"High/Med/Low\", \"mitigation\": \"string\"}].\n"
    "9. due_diligence: Key findings from Legal (OCRs, Tax, Labor), Commercial, and Technical audits.\n"
    "10. investment_recommendation: Definitive statement, SEBON compliance notes, and closing conditions.\n\n"
    "Return ONLY a JSON object with these 10 keys. Use HTML for formatting within the text values (e.g., <ul>, <strong>)."
)
p.save()
print("Prompt updated successfully with Nepal context.")
