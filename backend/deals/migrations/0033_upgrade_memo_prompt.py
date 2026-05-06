from django.db import migrations

def upgrade_memo_prompt(apps, schema_editor):
    PromptLibrary = apps.get_model('deals', 'PromptLibrary')
    
    # We'll update the existing memo_draft prompt to be much more rigorous
    memo_prompt = PromptLibrary.objects.filter(task_type='memo_draft', is_active=True).first()
    if memo_prompt:
        memo_prompt.system_prompt = (
            "You are a senior investment associate at a top-tier private equity firm. "
            "Your task is to draft a rigorous, high-stakes Investment Committee (IC) memo "
            "that adheres to international standards. You must be analytical, objective, "
            "and focused on value creation and risk mitigation. "
            "For every fact, address the 'So What?' (why it matters for returns). "
            "Ensure a professional, persuasive, but balanced tone."
        )
        memo_prompt.user_prompt_template = (
            "Draft a comprehensive 9-section IC Memo for the following project:\n"
            "Project: {project_name}\n"
            "Sector: {sector}\n"
            "Deal Type: {deal_type}\n"
            "Financial Data: {financials}\n"
            "Scoring Summary: {scoring_summary}\n"
            "Red Flags & Risks: {red_flags}\n"
            "Commercial Analysis: {commercial_analysis}\n"
            "Operational Analysis: {operational_analysis}\n"
            "Regulatory Context: {regulatory}\n\n"
            "The memo MUST include these 9 sections as keys in a JSON object:\n"
            "1. executive_summary: Summary of 'The Ask', business overview, thesis, and estimated returns (IRR/MOIC).\n"
            "2. company_overview: Business model, core products/services, and organizational summary.\n"
            "3. market_analysis: TAM/SAM/SOM, industry tailwinds, and competitive landscape (Moat).\n"
            "4. financial_analysis: Historical performance highlights, Quality of Earnings (QofE) notes, and cash flow profile.\n"
            "5. investment_thesis: Specific growth levers (M&A, expansion, digital) and operational improvements.\n"
            "6. deal_terms: Proposed structure, sources and uses of funds, and exit strategy timeline.\n"
            "7. risk_assessment: A high-level textual overview of key risks.\n"
            "8. risks_table: A JSON array of objects for the risk matrix: [{{\"risk\": \"string\", \"impact\": \"High/Med/Low\", \"mitigation\": \"string\"}}].\n"
            "9. due_diligence: Key findings from Legal, Commercial, and Technical audits.\n"
            "10. investment_recommendation: Definitive statement and closing conditions.\n\n"
            "Return ONLY a JSON object with these 10 keys. Use HTML for formatting within the text values (e.g., <ul>, <strong>)."
        )
        memo_prompt.save()

class Migration(migrations.Migration):
    dependencies = [
        ('deals', '0032_dealmemo_ic_notes_and_more'),
    ]
    operations = [
        migrations.RunPython(upgrade_memo_prompt),
    ]
