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


def _send_submission_confirmation_email(project: PEProject) -> None:
    """
    Send a confirmation email to the entrepreneur after final submission.
    """
    try:
        from django.core.mail import EmailMultiAlternatives
        
        subject = f'Submission Confirmed – {project.legal_name}'
        text_body = (
            f"Dear Entrepreneur,\n\n"
            f"This is to confirm that your deal submission for '{project.legal_name}' "
            f"has been successfully received by the Finlogic Capital team.\n\n"
            f"What happens next?\n"
            f"1. Our investment team will review your submission.\n"
            f"2. You can track the status of your application in your dashboard.\n"
            f"3. We will reach out via email if additional documents are required.\n\n"
            f"Contact us: investment@finlogiccapital.com\n\n"
            f"Best regards,\n"
            f"Finlogic Capital Team"
        )
        html_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #16c784;">Submission Received</h2>
            <p>Dear Entrepreneur,</p>
            <p>Your deal submission for <strong>{project.legal_name}</strong> has been successfully received.</p>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Next Steps</h3>
              <ul>
                <li>Review by our investment team</li>
                <li>Status tracking via your dashboard</li>
                <li>Manual outreach for detailed DD if required</li>
              </ul>
            </div>
            <p>If you have any questions, please reach out to us at <a href="mailto:investment@finlogiccapital.com">investment@finlogiccapital.com</a>.</p>
            <hr/>
            <p style="font-size:12px;color:#aaa;">
              Finlogic Capital | Nepal Private Equity Platform
            </p>
          </body>
        </html>
        """

        email = project.entrepreneur_user.email if project.entrepreneur_user else None
        if not email: return

        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@finlogiccapital.com')
        msg = EmailMultiAlternatives(subject, text_body, from_email, [email])
        msg.attach_alternative(html_body, 'text/html')
        msg.send(fail_silently=False)
        logger.info("Submission confirmation email sent to %s for project %s", email, project.pk)
    except Exception as exc:
        logger.error("Failed to send submission confirmation for project %s: %s", project.pk, exc)


# ---------------------------------------------------------------------------
# PEProject signals
# ---------------------------------------------------------------------------

# Track old data for change detection
_PEPROJECT_OLD_DATA: dict[str, dict] = {}


@receiver(pre_save, sender=PEProject)
def pe_project_pre_save(sender, instance, **kwargs):
    """Cache current status and submission state before save so we can detect changes post-save."""
    if instance.pk:
        try:
            old = PEProject.objects.get(pk=instance.pk)
            _PEPROJECT_OLD_DATA[str(instance.pk)] = {
                'status': old.status,
                'submitted_at': old.submitted_at
            }
        except PEProject.DoesNotExist:
            pass


@receiver(post_save, sender=PEProject)
def pe_project_post_save(sender, instance, created, **kwargs):
    is_invite = instance.submission_type == PEProject.SubmissionType.ENTREPRENEUR_INVITED
    
    # We send the invite if it's new OR if we just updated the entrepreneur_user on an existing one
    if created or is_invite:
        if is_invite:
            # Generate or refresh token
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
        old_data = _PEPROJECT_OLD_DATA.pop(str(instance.pk), {})
        old_status = old_data.get('status')
        old_submitted_at = old_data.get('submitted_at')

        if old_status and old_status != instance.status:
            _log_audit_event(
                ImmutableAuditEvent.EventType.PROJECT_STATUS_CHANGED,
                instance,
                payload={'old_status': old_status, 'new_status': instance.status},
            )
            # If moved to SCREENING or GP_APPROVED, trigger B2 move for any local documents
            if instance.status in [PEProject.Status.SCREENING, PEProject.Status.GP_APPROVED]:
                try:
                    from .tasks import move_project_documents_to_b2
                    move_project_documents_to_b2.delay(str(instance.id))
                except Exception as e:
                    logger.error(f"Failed to trigger B2 migration task: {e}")

        # ── Project submitted audit & email ───────────────────────────────
        # We trigger this when submitted_at transitions from None to a value
        if instance.submitted_at and not old_submitted_at:
            _log_audit_event(
                ImmutableAuditEvent.EventType.PROJECT_SUBMITTED,
                instance,
                payload={'submitted_at': str(instance.submitted_at)},
            )
            # Send confirmation email to entrepreneur
            _send_submission_confirmation_email(instance)


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
