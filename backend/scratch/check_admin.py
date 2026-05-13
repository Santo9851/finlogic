import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'finlogic_api.settings')
django.setup()

from django.contrib import admin
from idea_validator.models import IdeaValidatorQuota

print("Registered models in admin:")
for model, admin_class in admin.site._registry.items():
    print(f"- {model.__module__}.{model.__name__}")

if IdeaValidatorQuota in admin.site._registry:
    print("\nSUCCESS: IdeaValidatorQuota is registered.")
else:
    print("\nFAILURE: IdeaValidatorQuota is NOT registered.")
