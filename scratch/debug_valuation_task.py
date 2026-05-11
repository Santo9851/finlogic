import os
import django
import json
import sys

# Setup django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'finlogic_api.settings')
django.setup()

from deals.models import PEProject, ExtractedFinancials
from django.contrib.auth import get_user_model

def debug_valuation(project_id):
    project = PEProject.objects.get(id=project_id)
    print(f"Project: {project.legal_name}")
    
    financials = list(project.financials.values(
        'fiscal_year_bs', 
        'revenue_npr', 
        'ebitda_npr', 
        'net_profit_npr',
        'total_assets_npr', 
        'total_debt_npr'
    ))
    
    print(f"Financials Count: {len(financials)}")
    print(f"Financials Data: {json.dumps(financials, indent=2, default=str)}")
    
    context_data = {
        "project_name": project.legal_name,
        "financials": json.dumps(financials, default=str),
    }
    print(f"Context Data: {json.dumps(context_data, indent=2)}")

if __name__ == "__main__":
    # Get Green Rabit ID
    p = PEProject.objects.get(legal_name='Green Rabit')
    debug_valuation(str(p.id))
