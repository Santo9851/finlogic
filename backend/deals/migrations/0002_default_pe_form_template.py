"""
deals/migrations/0002_default_pe_form_template.py
Data migration: creates the default 5-step PE Deal Submission form template.
"""
from django.db import migrations


DEAL_SUBMISSION_STEPS = [
    {
        "step_index": 1,
        "step_name": "company_info",
        "title": "Company Information",
        "description": "Basic company details and registration information.",
        "fields": [
            {
                "name": "company_name",
                "label": "Company Name",
                "type": "text",
                "required": True,
                "max_length": 200,
            },
            {
                "name": "date_of_incorporation",
                "label": "Date of Incorporation",
                "type": "date",
                "required": True,
            },
            {
                "name": "registered_address",
                "label": "Registered Address",
                "type": "textarea",
                "required": True,
            },
            {
                "name": "website",
                "label": "Company Website",
                "type": "url",
                "required": False,
            },
            {
                "name": "num_employees",
                "label": "Number of Employees",
                "type": "integer",
                "required": True,
                "min_value": 1,
            },
        ],
    },
    {
        "step_index": 2,
        "step_name": "deal_overview",
        "title": "Deal Overview",
        "description": "Details about the investment opportunity.",
        "fields": [
            {
                "name": "deal_type",
                "label": "Deal Type",
                "type": "select",
                "required": True,
                "choices": [
                    {"value": "GROWTH", "label": "Growth Capital"},
                    {"value": "BUYOUT", "label": "Buyout"},
                    {"value": "RECAP", "label": "Recapitalisation"},
                ],
            },
            {
                "name": "sector",
                "label": "Sector",
                "type": "select",
                "required": True,
                "choices": [
                    {"value": "Hydropower", "label": "Hydropower"},
                    {"value": "Banking", "label": "Banking & Finance"},
                    {"value": "Manufacturing", "label": "Manufacturing"},
                    {"value": "Tourism", "label": "Tourism"},
                    {"value": "IT", "label": "Information Technology"},
                    {"value": "Agriculture", "label": "Agriculture"},
                    {"value": "Infrastructure", "label": "Infrastructure"},
                    {"value": "Health", "label": "Healthcare"},
                    {"value": "Education", "label": "Education"},
                    {"value": "Other", "label": "Other"},
                ],
            },
            {
                "name": "investment_amount_min_npr",
                "label": "Minimum Investment Sought (NPR)",
                "type": "decimal",
                "required": True,
                "min_value": 0,
            },
            {
                "name": "investment_amount_max_npr",
                "label": "Maximum Investment Sought (NPR)",
                "type": "decimal",
                "required": True,
                "min_value": 0,
            },
            {
                "name": "use_of_funds",
                "label": "Use of Funds",
                "type": "textarea",
                "required": True,
                "max_length": 2000,
            },
            {
                "name": "business_description",
                "label": "Business Description",
                "type": "textarea",
                "required": True,
                "max_length": 3000,
            },
        ],
    },
    {
        "step_index": 3,
        "step_name": "financials",
        "title": "Financial Information",
        "description": "Key financial metrics and projections.",
        "fields": [
            {
                "name": "revenue_fy1_npr",
                "label": "Revenue FY-1 (NPR)",
                "type": "decimal",
                "required": True,
            },
            {
                "name": "revenue_fy2_npr",
                "label": "Revenue FY-2 (NPR)",
                "type": "decimal",
                "required": False,
            },
            {
                "name": "ebitda_fy1_npr",
                "label": "EBITDA FY-1 (NPR)",
                "type": "decimal",
                "required": True,
            },
            {
                "name": "pat_fy1_npr",
                "label": "PAT (Profit After Tax) FY-1 (NPR)",
                "type": "decimal",
                "required": True,
            },
            {
                "name": "total_assets_npr",
                "label": "Total Assets (NPR)",
                "type": "decimal",
                "required": True,
            },
            {
                "name": "total_debt_npr",
                "label": "Total Debt (NPR)",
                "type": "decimal",
                "required": True,
            },
            {
                "name": "pre_money_valuation_npr",
                "label": "Pre-Money Valuation (NPR)",
                "type": "decimal",
                "required": False,
            },
            {
                "name": "revenue_projection_3yr_npr",
                "label": "3-Year Revenue Projection (NPR)",
                "type": "decimal",
                "required": False,
            },
        ],
    },
    {
        "step_index": 4,
        "step_name": "documents",
        "title": "Document Upload",
        "description": "Upload required due diligence documents.",
        "fields": [
            {
                "name": "audited_financials",
                "label": "Audited Financial Statements (last 3 years)",
                "type": "file_upload",
                "required": True,
                "category": "FINANCIAL",
                "accepted_types": ["application/pdf"],
            },
            {
                "name": "moa_aoa",
                "label": "Memorandum & Articles of Association",
                "type": "file_upload",
                "required": True,
                "category": "LEGAL",
                "accepted_types": ["application/pdf"],
            },
            {
                "name": "company_registration",
                "label": "Company Registration Certificate (OCR)",
                "type": "file_upload",
                "required": True,
                "category": "LEGAL",
                "accepted_types": ["application/pdf", "image/jpeg", "image/png"],
            },
            {
                "name": "pitch_deck",
                "label": "Investor Pitch Deck",
                "type": "file_upload",
                "required": True,
                "category": "COMMERCIAL",
                "accepted_types": [
                    "application/pdf",
                    "application/vnd.ms-powerpoint",
                    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                ],
            },
            {
                "name": "business_plan",
                "label": "Business Plan / Information Memorandum",
                "type": "file_upload",
                "required": False,
                "category": "COMMERCIAL",
                "accepted_types": ["application/pdf"],
            },
        ],
    },
    {
        "step_index": 5,
        "step_name": "review",
        "title": "Review & Submit",
        "description": "Review your submission before sending it to the GP team.",
        "fields": [
            {
                "name": "declaration_accurate",
                "label": "I confirm that all information provided is accurate and complete.",
                "type": "checkbox",
                "required": True,
            },
            {
                "name": "declaration_authorized",
                "label": "I am authorized to submit this information on behalf of the company.",
                "type": "checkbox",
                "required": True,
            },
            {
                "name": "additional_comments",
                "label": "Additional Comments (optional)",
                "type": "textarea",
                "required": False,
                "max_length": 1000,
            },
        ],
    },
]


def create_default_form_template(apps, schema_editor):
    PEFormTemplate = apps.get_model('deals', 'PEFormTemplate')
    PEFormTemplate.objects.update_or_create(
        form_type='DEAL_SUBMISSION',
        version=1,
        defaults={
            'is_active': True,
            'steps': DEAL_SUBMISSION_STEPS,
        },
    )


def reverse_default_form_template(apps, schema_editor):
    PEFormTemplate = apps.get_model('deals', 'PEFormTemplate')
    PEFormTemplate.objects.filter(
        form_type='DEAL_SUBMISSION', version=1
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('deals', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(
            create_default_form_template,
            reverse_code=reverse_default_form_template,
        ),
    ]
