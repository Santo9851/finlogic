import logging
from django.utils import timezone
from django.db import transaction
from .models import IdeaValidatorQuota, QuotaAdjustmentLog
from deals.models import ImmutableAuditEvent

logger = logging.getLogger(__name__)

def get_or_init_quota(user):
    """
    Retrieves the user's quota. If it's a new quarter, resets it to 1.
    """
    current_q = IdeaValidatorQuota.get_current_quarter_string()
    quota, created = IdeaValidatorQuota.objects.get_or_create(
        user=user,
        defaults={'last_reset_quarter': current_q, 'remaining_validations': 1}
    )
    
    if not created and quota.last_reset_quarter != current_q:
        quota.remaining_validations = 1
        quota.last_reset_quarter = current_q
        quota.save()
    
    return quota

@transaction.atomic
def adjust_quota(user, change_amount, admin_user, note):
    """
    Adjusts the user's quota and logs the change.
    """
    quota = get_or_init_quota(user)
    old_value = quota.remaining_validations
    quota.remaining_validations += change_amount
    quota.save()
    
    QuotaAdjustmentLog.objects.create(
        user=user,
        adjusted_by=admin_user,
        old_value=old_value,
        new_value=quota.remaining_validations,
        change_amount=change_amount,
        note=note
    )

    # Log to Immutable Audit Trail
    log_audit_event(
        ImmutableAuditEvent.EventType.QUOTA_ADJUSTED,
        quota,
        actor=admin_user,
        payload={
            'target_user': user.email,
            'change': change_amount,
            'note': note
        }
    )
    
    return quota

def log_audit_event(event_type, obj, actor=None, payload=None, request=None):
    """Helper to create an ImmutableAuditEvent safely for Idea Validator."""
    try:
        ip = None
        if request:
            x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
            ip = (
                x_forwarded.split(',')[0].strip()
                if x_forwarded
                else request.META.get('REMOTE_ADDR')
            )
        ImmutableAuditEvent.objects.create(
            event_type=event_type,
            actor=actor,
            object_id=obj.pk if hasattr(obj, 'pk') else None,
            object_repr=str(obj)[:200],
            content_type_label=f'{obj._meta.app_label}.{obj._meta.object_name}',
            payload=payload or {},
            ip_address=ip,
        )
    except Exception as exc:
        logger.error("Failed to write ImmutableAuditEvent for Idea Validator: %s", exc)
