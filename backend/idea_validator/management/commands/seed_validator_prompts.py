from django.core.management.base import BaseCommand
from idea_validator.models import ValidatorPrompt
from idea_validator.prompts import (
    POLISHED_REPORT_SYSTEM_PROMPT, 
    POLISHED_REPORT_USER_PROMPT,
    RED_TEAM_SYSTEM_PROMPT,
    RED_TEAM_USER_PROMPT
)

class Command(BaseCommand):
    help = 'Seeds initial AI prompts for the Idea Validator'

    def handle(self, *args, **options):
        prompts = [
            {
                "task_type": "polished_report",
                "system_prompt": POLISHED_REPORT_SYSTEM_PROMPT,
                "user_prompt_template": POLISHED_REPORT_USER_PROMPT,
            },
            {
                "task_type": "red_team_report",
                "system_prompt": RED_TEAM_SYSTEM_PROMPT,
                "user_prompt_template": RED_TEAM_USER_PROMPT,
            },
        ]

        for p in prompts:
            obj, created = ValidatorPrompt.objects.update_or_create(
                task_type=p["task_type"],
                defaults=p
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created prompt: {p["task_type"]}'))
            else:
                self.stdout.write(f'Updated prompt: {p["task_type"]}')
