from django.db import migrations

def seed_prompts(apps, schema_editor):
    PromptLibrary = apps.get_model('deals', 'PromptLibrary')
    prompts = [
        {
            "name": "Financial Extraction",
            "task_type": "financial_extraction",
            "system_prompt": "You are an expert financial analyst. Extract key metrics from the provided document. Output JSON format.",
            "user_prompt_template": "Document content: {document_text}. Extract: Revenue, EBITDA, Net Debt, and Working Capital for the last 3 fiscal years.",
            "output_schema": {}
        },
        {
            "name": "QoE Analysis",
            "task_type": "qoe_analysis",
            "system_prompt": "You are a senior investment director. Perform a Quality of Earnings (QoE) analysis. Focus on non-recurring items and EBITDA adjustments.",
            "user_prompt_template": "Analyze the following financial data for earnings quality: {financial_data}",
            "output_schema": {}
        },
        {
            "name": "Commercial Analysis",
            "task_type": "commercial_analysis",
            "system_prompt": "You are a market research expert. Analyze the commercial viability of this business. Evaluate TAM, SAM, and SOM.",
            "user_prompt_template": "Market data: {market_data}. Business description: {business_desc}.",
            "output_schema": {}
        },
        {
            "name": "Operational Analysis",
            "task_type": "operational_analysis",
            "system_prompt": "You are an operations consultant. Analyze the operational efficiency and risks. Focus on supply chain and scalability.",
            "user_prompt_template": "Operational data: {ops_data}.",
            "output_schema": {}
        },
        {
            "name": "Legal Red Flag Scan",
            "task_type": "legal_scan",
            "system_prompt": "You are a corporate lawyer. Identify potential red flags in this document. Focus on litigation, change of control, and encumbrances.",
            "user_prompt_template": "Legal document text: {document_text}.",
            "output_schema": {}
        },
        {
            "name": "20-Criteria Scoring",
            "task_type": "scoring",
            "system_prompt": "You are a PE investment committee member. Score this deal based on 20 predefined criteria including management, market, moats, and financial health.",
            "user_prompt_template": "Deal summary: {summary}. Data room highlights: {highlights}.",
            "output_schema": {}
        },
        {
            "name": "Investment Memo Draft",
            "task_type": "memo_draft",
            "system_prompt": "You are an investment associate. Draft a comprehensive investment memo for the committee. Use a professional, persuasive tone.",
            "user_prompt_template": "Project: {project_name}. Summary: {summary}. DD findings: {dd_findings}.",
            "output_schema": {}
        }
    ]
    for p in prompts:
        PromptLibrary.objects.get_or_create(
            task_type=p["task_type"],
            version=1,
            defaults={
                "name": p["name"],
                "system_prompt": p["system_prompt"],
                "user_prompt_template": p["user_prompt_template"],
                "output_schema": p["output_schema"],
                "is_active": True
            }
        )

class Migration(migrations.Migration):
    dependencies = [
        ('deals', '0007_aicalllog_promptlibrary'),
    ]
    operations = [
        migrations.RunPython(seed_prompts),
    ]
