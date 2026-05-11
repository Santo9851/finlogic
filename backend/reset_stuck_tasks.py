
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'finlogic_api.settings')
django.setup()

from deals.models import PEProject

def reset_project_progress():
    # You might need to adjust the ID or find the specific project
    projects = PEProject.objects.filter(analysis_progress__contains={'Scoring': 'processing'})
    for p in projects:
        progress = p.analysis_progress or {}
        if progress.get('Scoring') == 'processing':
            progress['Scoring'] = 'pending'
            p.analysis_progress = progress
            p.save()
            print(f"Reset progress for project: {p.legal_name}")

if __name__ == "__main__":
    reset_project_progress()
