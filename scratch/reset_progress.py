import os
import django
import sys

# Setup django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'finlogic_api.settings')
django.setup()

from deals.models import PEProject

def reset_stale_progress():
    projects = PEProject.objects.all()
    count = 0
    for p in projects:
        if p.analysis_progress and p.analysis_progress.get('Valuation') == 'processing':
            p.analysis_progress['Valuation'] = 'failed'
            p.save()
            count += 1
            print(f"Reset stale Valuation progress for: {p.legal_name}")
    
    if count == 0:
        print("No stale valuation tasks found.")

if __name__ == "__main__":
    reset_stale_progress()
