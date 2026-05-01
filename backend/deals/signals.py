"""
deals/signals.py
Django signals for the PE Deals app.

Key behaviours
--------------
1. When a PEProject is created with submission_type=ENTREPRENEUR_INVITED:
   - Generate a UUID invitation_token
   - Set invitation_expires_at to now + 7 days
   - Send invitation email via Brevo (django-anymail)

2. Log key model changes to ImmutableAuditEvent.
"""
import logging
import uuid
from datetime import timedelta

from django.conf import settings
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone

from .models import (
    PEProject,
    PEInvestment,
    CapitalCall,
    Distribution,
    ImmutableAuditEvent,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _log_audit_event(event_type, obj, actor=None, payload=None, request=None):
    """Helper to create an ImmutableAuditEvent safely."""
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
    except Exception as exc:  # pragma: no cover – audit must not break the request
        logger.error("Failed to write ImmutableAuditEvent: %s", exc)


def _send_invitation_email(project: PEProject) -> None:
    """
    Send the entrepreneur invitation email via Brevo (anymail).
    Falls back to console email if anymail is not configured.
    """
    try:
        from django.core.mail import EmailMultiAlternatives

        frontend_base = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:3000')
        invite_url = f'{frontend_base}/entrepreneur/invite/{project.invitation_token}'

        subject = f'You\'ve been invited to submit a deal – {project.legal_name}'
        text_body = (
            f"Dear Entrepreneur,\n\n"
            f"You have been invited to submit deal information for '{project.legal_name}' "
            f"on the Finlogic Capital platform.\n\n"
            f"Please click the link below to get started:\n{invite_url}\n\n"
            f"This invitation expires on "
            f"{project.invitation_expires_at.strftime('%d %B %Y, %H:%M UTC')}.\n\n"
            f"If you believe this was sent in error, please ignore this email.\n\n"
            f"Finlogic Capital Team"
        )
        html_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #1a2c5b;">Deal Submission Invitation</h2>
            <p>Dear Entrepreneur,</p>
            <p>You have been invited to submit deal information for
               <strong>{project.legal_name}</strong> on the
               <strong>Finlogic Capital</strong> platform.</p>
            <p>
              <a href="{invite_url}"
                 style="background:#1a2c5b;color:#fff;padding:12px 24px;
                        border-radius:4px;text-decoration:none;display:inline-block;">
                Start Submission →
              </a>
            </p>
            <p style="color:#888;font-size:12px;">
              Invitation expires: {project.invitation_expires_at.strftime('%d %B %Y, %H:%M UTC')}
            </p>
            <hr/>
            <p style="font-size:12px;color:#aaa;">
              Finlogic Capital | Nepal Private Equity Platform
            </p>
          </body>
        </html>
        """

        entrepreneur_email = (
            project.entrepreneur_user.email
            if project.entrepreneur_user
            else None
        )
        if not entrepreneur_email:
            logger.warning(
                "Cannot send invitation for project %s: no entrepreneur email.",
                project.pk,
            )
            return

        from django.core.mail import EmailMultiAlternatives
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@finlogiccapital.com')
        
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=from_email,
            to=[entrepreneur_email],
        )
        msg.attach_alternative(html_body, 'text/html')

        # Add Anymail-specific features if using an Anymail backend
        if 'anymail' in getattr(settings, 'EMAIL_BACKEND', ''):
            msg.tags = ['pe-deal-invitation']
            template_id = getattr(settings, 'BREVO_INVITE_TEMPLATE_ID', None)
            if template_id:
                msg.template_id = template_id

        msg.send(fail_silently=False)
        logger.info(
            "Invitation email sent to %s for project %s",
            entrepreneur_email,
            project.pk,
        )
    except Exception as exc:
        logger.error("Failed to send invitation email for project %s: %s", project.pk, exc)


# ---------------------------------------------------------------------------
# PEProject signals
# ---------------------------------------------------------------------------

# Track old status for change detection
_PEPROJECT_OLD_STATUS: dict[str, str] = {}


@receiver(pre_save, sender=PEProject)
def pe_project_pre_save(sender, instance, **kwargs):
    """Cache current status before save so we can detect changes post-save."""
    if instance.pk:
        try:
            old = PEProject.objects.get(pk=instance.pk)
            _PEPROJECT_OLD_STATUS[str(instance.pk)] = old.status
        except PEProject.DoesNotExist:
            pass


@receiver(post_save, sender=PEProject)
def pe_project_post_save(sender, instance, created, **kwargs):
    is_invite = instance.submission_type == PEProject.SubmissionType.ENTREPRENEUR_INVITED
    
    # We send the invite if it's new OR if we just updated the entrepreneur_user on an existing one
    if created or is_invite:
        if is_invite and (created or not instance.invitation_token):
            token = uuid.uuid4()
            expires = timezone.now() + timedelta(days=7)
            PEProject.objects.filter(pk=instance.pk).update(
                invitation_token=token,
                invitation_sent_at=timezone.now(),
                invitation_expires_at=expires,
            )
            # Refresh in-memory instance so the email has the right values
            instance.refresh_from_db()
            _send_invitation_email(instance)

            _log_audit_event(
                ImmutableAuditEvent.EventType.INVITATION_SENT,
                instance,
                actor=instance.created_by,
                payload={
                    'token': str(instance.invitation_token),
                    'entrepreneur_email': (
                        instance.entrepreneur_user.email
                        if instance.entrepreneur_user else None
                    ),
                },
            )

    if created:
        # ── Project created audit ─────────────────────────────────────────
        _log_audit_event(
            ImmutableAuditEvent.EventType.PROJECT_CREATED,
            instance,
            actor=instance.created_by,
            payload={'status': instance.status, 'fund_id': str(instance.fund_id)},
        )
    else:
        # ── Status change audit ───────────────────────────────────────────
        old_status = _PEPROJECT_OLD_STATUS.pop(str(instance.pk), None)
        if old_status and old_status != instance.status:
            _log_audit_event(
                ImmutableAuditEvent.EventType.PROJECT_STATUS_CHANGED,
                instance,
                payload={'old_status': old_status, 'new_status': instance.status},
            )

        # ── Project submitted audit ───────────────────────────────────────
        if instance.submitted_at and instance.status == PEProject.Status.SUBMITTED:
            if old_status and old_status != PEProject.Status.SUBMITTED:
                _log_audit_event(
                    ImmutableAuditEvent.EventType.PROJECT_SUBMITTED,
                    instance,
                    payload={'submitted_at': str(instance.submitted_at)},
                )


# ---------------------------------------------------------------------------
# PEInvestment signals
# ---------------------------------------------------------------------------

@receiver(post_save, sender=PEInvestment)
def pe_investment_post_save(sender, instance, created, **kwargs):
    if created:
        _log_audit_event(
            ImmutableAuditEvent.EventType.INVESTMENT_CREATED,
            instance,
            payload={
                'fund_id': str(instance.fund_id),
                'project_id': str(instance.project_id),
                'amount_npr': str(instance.investment_amount_npr),
                'ownership_pct': str(instance.ownership_pct),
            },
        )


# ---------------------------------------------------------------------------
# CapitalCall signals
# ---------------------------------------------------------------------------

@receiver(post_save, sender=CapitalCall)
def capital_call_post_save(sender, instance, created, **kwargs):
    if created:
        _log_audit_event(
            ImmutableAuditEvent.EventType.CAPITAL_CALL_ISSUED,
            instance,
            payload={
                'fund_id': str(instance.fund_id),
                'amount_npr': str(instance.amount_npr),
                'call_date': str(instance.call_date),
                'due_date': str(instance.due_date),
            },
        )


# ---------------------------------------------------------------------------
# Distribution signals
# ---------------------------------------------------------------------------

@receiver(post_save, sender=Distribution)
def distribution_post_save(sender, instance, created, **kwargs):
    if created:
        _log_audit_event(
            ImmutableAuditEvent.EventType.DISTRIBUTION_MADE,
            instance,
            payload={
                'fund_id': str(instance.fund_id),
                'amount_npr': str(instance.amount_npr),
                'distribution_type': instance.distribution_type,
                'distribution_date': str(instance.distribution_date),
            },
        )
