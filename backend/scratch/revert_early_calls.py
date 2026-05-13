import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'finlogic_api.settings')
django.setup()

from deals.models import PEProject, CapitalCall

def revert_projects():
    # Find projects in CAPITAL_CALLED status
    projects = PEProject.objects.filter(status='CAPITAL_CALLED')
    
    reverted_count = 0
    for project in projects:
        # Check if any capital calls exist for this project
        calls_exist = CapitalCall.objects.filter(project=project).exists()
        
        if not calls_exist:
            print(f"Reverting project: {project.legal_name} ({project.id})")
            project.status = 'CONTRACT_SIGNED'
            project.save(update_fields=['status'])
            reverted_count += 1
        else:
            print(f"Project {project.legal_name} has active capital calls. Skipping.")

    print(f"\nMigration complete. {reverted_count} projects reverted to CONTRACT_SIGNED.")

if __name__ == "__main__":
    reverted = revert_projects()
