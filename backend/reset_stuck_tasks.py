
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'finlogic_api.settings')
django.setup()

from deals.models import PEProject

# Find all projects where progress is stuck in 'processing'
stuck_projects = PEProject.objects.filter(analysis_progress__icontains='processing')

print(f"Found {stuck_projects.count()} projects with potentially stuck progress.")

for project in stuck_projects:
    print(f"Resetting progress for: {project.legal_name} (ID: {project.id})")
    # Reset any 'processing' or 'pending' states to None or remove them
    progress = project.analysis_progress or {}
    new_progress = {}
    for k, v in progress.items():
        if v not in ['processing', 'pending']:
            new_progress[k] = v
            
    project.analysis_progress = new_progress
    project.save()

print("Progress reset complete.")
