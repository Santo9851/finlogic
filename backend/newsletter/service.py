import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone
from django.db import transaction
from .models import Subscriber, Issue, SendEvent, UnsubscribeToken
from .template import render_welcome_email, render_issue_email

logger = logging.getLogger(__name__)

def subscribe(email, first_name=None, segment='general', source=None, ip_address=None):
    """
    Subscribes a user to the newsletter. Reactivates if they were unsubscribed.
    """
    subscriber, created = Subscriber.objects.get_or_create(
        email=email,
        defaults={
            'first_name': first_name or '',
            'segment': segment,
            'source': source or '',
            'ip_address': ip_address,
            'status': 'active',
            'confirmed_at': timezone.now()
        }
    )

    if not created:
        if subscriber.status != 'active':
            subscriber.status = 'active'
            subscriber.unsubscribed_at = None
            subscriber.save()
        if first_name:
            subscriber.first_name = first_name
            subscriber.save()

    # Create UnsubscribeToken if it doesn't exist
    UnsubscribeToken.objects.get_or_create(subscriber=subscriber)

    # Fire welcome email
    send_welcome_email(subscriber)

    return subscriber, created

def send_welcome_email(subscriber):
    """
    Sends the branded welcome email.
    """
    try:
        subject = "Welcome to Capital Lines · Finlogic Capital"
        html_content = render_welcome_email(subscriber)
        text_content = f"Hello {subscriber.first_name or 'Friend'},\n\nWelcome to Capital Lines by Finlogic Capital. You are now part of our exclusive strategic dispatch."
        
        from_email = f"{getattr(settings, 'NEWSLETTER_FROM_NAME', 'Capital Lines')} <{getattr(settings, 'NEWSLETTER_FROM_EMAIL', 'capitallines@finlogiccapital.com')}>"
        
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=[subscriber.email],
        )
        msg.attach_alternative(html_content, "text/html")
        
        if 'anymail' in getattr(settings, 'EMAIL_BACKEND', ''):
            msg.tags = ['newsletter-welcome']
            
        msg.send(fail_silently=True)
    except Exception as e:
        logger.error(f"Failed to send welcome email to {subscriber.email}: {e}")

def send_issue(issue, dry_run=False):
    """
    Sends a newsletter issue to all active subscribers in the target segment.
    """
    if issue.status == 'sent' and not dry_run:
        logger.warning(f"Issue {issue.issue_number} has already been sent.")
        return 0

    subscribers = Subscriber.objects.filter(status='active')
    if issue.target_segment != 'general':
        subscribers = subscribers.filter(segment=issue.target_segment)

    count = 0
    from_email = f"{getattr(settings, 'NEWSLETTER_FROM_NAME', 'Capital Lines')} <{getattr(settings, 'NEWSLETTER_FROM_EMAIL', 'capitallines@finlogiccapital.com')}>"

    for sub in subscribers:
        try:
            with transaction.atomic():
                # Create send event for tracking
                send_event, created = SendEvent.objects.get_or_create(
                    issue=issue,
                    subscriber=sub
                )
                
                html_content = render_issue_email(issue, sub, send_event)
                text_content = f"Capital Lines Issue {issue.issue_number}: {issue.title}\n\nView this issue online at {getattr(settings, 'NEWSLETTER_BASE_URL', '')}/newsletter/issues/{issue.slug}"
                
                if not dry_run:
                    msg = EmailMultiAlternatives(
                        subject=issue.subject_line,
                        body=text_content,
                        from_email=from_email,
                        to=[sub.email],
                    )
                    msg.attach_alternative(html_content, "text/html")
                    
                    if 'anymail' in getattr(settings, 'EMAIL_BACKEND', ''):
                        msg.tags = ['newsletter-issue', f'issue-{issue.issue_number}']
                        msg.metadata = {'tracking_token': str(send_event.tracking_token)}
                    
                    msg.send(fail_silently=False)
                
                count += 1
        except Exception as e:
            logger.error(f"Failed to send issue {issue.issue_number} to {sub.email}: {e}")

    if not dry_run:
        issue.status = 'sent'
        issue.sent_at = timezone.now()
        issue.sent_count = count
        issue.save()

    return count

def record_open(tracking_token):
    """
    Records an email open event.
    """
    try:
        event = SendEvent.objects.get(tracking_token=tracking_token)
        event.record_open()
        return True
    except SendEvent.DoesNotExist:
        return False

def record_click(tracking_token):
    """
    Records a link click event.
    """
    try:
        event = SendEvent.objects.get(tracking_token=tracking_token)
        event.record_click()
        return True
    except SendEvent.DoesNotExist:
        return False

def unsubscribe_by_token(token):
    """
    Unsubscribes a user via their unique token.
    """
    try:
        unsub_token = UnsubscribeToken.objects.get(token=token)
        unsub_token.subscriber.unsubscribe()
        return True
    except UnsubscribeToken.DoesNotExist:
        return False

def handle_brevo_webhook(event_type, email):
    """
    Handles Brevo webhooks for hard bounces and unsubscribes.
    """
    try:
        subscriber = Subscriber.objects.get(email=email)
        if event_type == 'hard_bounce':
            subscriber.status = 'bounced'
            subscriber.save()
        elif event_type == 'unsubscribe':
            subscriber.unsubscribe()
        return True
    except Subscriber.DoesNotExist:
        return False

def get_issue_stats(issue):
    """
    Returns statistics for a specific issue.
    """
    total_sent = issue.sent_count
    if total_sent == 0:
        return {
            'total_sent': 0,
            'open_rate': 0,
            'click_rate': 0,
            'bounces': 0
        }

    opens = SendEvent.objects.filter(issue=issue, opened=True).count()
    clicks = SendEvent.objects.filter(issue=issue, clicked=True).count()
    bounces = SendEvent.objects.filter(issue=issue, bounced=True).count()

    return {
        'total_sent': total_sent,
        'open_rate': round((opens / total_sent) * 100, 2),
        'click_rate': round((clicks / total_sent) * 100, 2),
        'bounces': bounces
    }
