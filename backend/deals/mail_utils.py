from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def send_statement_notification(lp_profile, fund, quarter, year):
    """
    Send an email notification to the LP about a new capital account statement.
    """
    try:
        frontend_base = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:3000')
        portal_url = f'{frontend_base}/lp/documents'
        
        subject = f'New Capital Account Statement: {fund.name} - {quarter} {year}'
        
        text_body = (
            f"Dear {lp_profile.full_name},\n\n"
            f"A new Capital Account Statement for '{fund.name}' for the period {quarter} {year} "
            f"has been generated and is now available in your document portal.\n\n"
            f"You can view and download it at:\n{portal_url}\n\n"
            f"If you have any questions, please contact the GP team.\n\n"
            f"Finlogic Capital Team"
        )
        
        html_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #F59F01;">Statement Available</h2>
            <p>Dear {lp_profile.full_name},</p>
            <p>A new <strong>Capital Account Statement</strong> for <strong>{fund.name}</strong> 
               for the period <strong>{quarter} {year}</strong> has been generated and is now 
               available in your document portal.</p>
            <p>
              <a href="{portal_url}"
                 style="background:#F59F01;color:#000;padding:12px 24px;
                        border-radius:4px;text-decoration:none;display:inline-block;font-weight:bold;">
                Access Document Portal →
              </a>
            </p>
            <hr/>
            <p style="font-size:12px;color:#aaa;">
              Finlogic Capital | Nepal Private Equity Platform
            </p>
          </body>
        </html>
        """
        
        from django.core.mail import EmailMultiAlternatives
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@finlogiccapital.com')
        
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=from_email,
            to=[lp_profile.user.email],
        )
        msg.attach_alternative(html_body, 'text/html')

        if 'anymail' in getattr(settings, 'EMAIL_BACKEND', ''):
            msg.tags = ['statement-notification']

        msg.send(fail_silently=False)
        return True
    except Exception as exc:
        logger.error(f"Failed to send statement notification email to {lp_profile.user.email}: {exc}")
        return False
