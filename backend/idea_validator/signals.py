from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import IdeaValidatorQuota

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_quota(sender, instance, created, **kwargs):
    if created:
        IdeaValidatorQuota.objects.get_or_create(
            user=instance,
            defaults={
                'last_reset_quarter': IdeaValidatorQuota.get_current_quarter_string(),
                'remaining_validations': 1
            }
        )
