from django.db import migrations

def seed_filing_types(apps, schema_editor):
    FilingTypeConfig = apps.get_model('deals', 'FilingTypeConfig')
    
    defaults = [
        {
            "name": "Annual Audited Report",
            "filing_type": "ANNUAL_REPORT",
            "regulatory_basis": "SIF Rules 2075 §6",
            "default_days_offset": 180, # 6 months
            "penalty_description": "SEBON fine and potential license suspension."
        },
        {
            "name": "Quarterly Progress Report",
            "filing_type": "QUARTERLY_REPORT",
            "regulatory_basis": "SEBON Securities Act",
            "default_days_offset": 30,
            "penalty_description": "Delayed filing fee per day."
        },
        {
            "name": "AGM Report to SEBON",
            "filing_type": "AGM_REPORT",
            "regulatory_basis": "SIF Rules 2075 §6",
            "default_days_offset": 30,
            "penalty_description": "Compliance warning from SEBON."
        },
        {
            "name": "Material Event Disclosure",
            "filing_type": "MATERIAL_EVENT",
            "regulatory_basis": "SEBON Disclosure Guidelines",
            "default_days_offset": 0, # Immediate
            "penalty_description": "High risk of market integrity penalty."
        },
        {
            "name": "AML/CFT Suspicious Transaction Report",
            "filing_type": "AML_STR",
            "regulatory_basis": "AMLA 2008",
            "default_days_offset": 3, # 3 working days
            "penalty_description": "Criminal liability for non-reporting."
        },
        {
            "name": "Tax Filing (IRD)",
            "filing_type": "TAX_FILING",
            "regulatory_basis": "Income Tax Act",
            "default_days_offset": 90,
            "penalty_description": "Interest and penalty as per IRD rules."
        },
        {
            "name": "Fund Amendment",
            "filing_type": "FUND_AMENDMENT",
            "regulatory_basis": "SIF Rules",
            "default_days_offset": 15,
            "penalty_description": "Invalidation of amendment if not notified."
        },
    ]
    
    for item in defaults:
        FilingTypeConfig.objects.get_or_create(
            filing_type=item['filing_type'],
            defaults=item
        )

class Migration(migrations.Migration):
    dependencies = [
        ('deals', '0024_filingtypeconfig_and_more'),
    ]

    operations = [
        migrations.RunPython(seed_filing_types),
    ]
