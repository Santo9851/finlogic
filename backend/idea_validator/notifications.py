import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from core.models import Notification

logger = logging.getLogger(__name__)

def notify_validation_complete(session):
    """
    Send an email notification and create an in-app notification 
    when the polished report is ready.
    """
    user = session.user
    frontend_base = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:3000')
    report_url = f"{frontend_base}/validate/report/{session.id}"
    
    subject = f"Finlogic Idea Validator: {session.verdict or 'Analysis'} is Ready"
    
    # Branded Email context
    verdict_summary = f"Your business idea analysis is complete. Our Sovereign Venture Architect has assigned a verdict of **{session.verdict}**."
    
    text_body = (
        f"Dear {user.first_name or user.username},\n\n"
        f"{verdict_summary}\n\n"
        f"View your full strategic report here:\n{report_url}\n\n"
        f"This AI-generated analysis is provided by Finlogic Capital.\n\n"
        f"Best regards,\n"
        f"Finlogic Capital Team"
    )
    
    # Dark theme with gold accent (#F59F01)
    html_body = f"""
    <html>
      <body style="font-family: 'Inter', Arial, sans-serif; background-color: #05010d; color: #ffffff; padding: 40px; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #100226; border: 1px solid #2d1b4d; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
          <div style="padding: 40px; text-align: center; border-bottom: 1px solid #2d1b4d;">
            <h1 style="color: #F59F01; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Analysis Complete</h1>
          </div>
          <div style="padding: 40px;">
            <p style="font-size: 16px;">Dear {user.first_name or user.username},</p>
            <p style="font-size: 16px; color: #b0a0cc;">The <strong>Sovereign Venture Architect</strong> has completed the deep-dive analysis of your business idea.</p>
            
            <div style="margin: 30px 0; padding: 20px; background-color: rgba(245, 159, 1, 0.05); border-left: 4px solid #F59F01; border-radius: 8px;">
              <p style="margin: 0; font-weight: bold; color: #F59F01; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Verdict</p>
              <p style="margin: 10px 0 0 0; font-size: 20px; font-weight: 900; color: #ffffff;">{session.verdict}</p>
            </div>

            <p style="font-size: 14px; color: #b0a0cc; margin-bottom: 30px;">
              Your strategic validation report, including the full competitive landscape, SWOT analysis, and financial feasibility, is now available.
            </p>

            <div style="text-align: center;">
              <a href="{report_url}" 
                 style="display: inline-block; background-color: #F59F01; color: #000000; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                View Full Report →
              </a>
            </div>
          </div>
          <div style="padding: 20px; background-color: #05010d; text-align: center; border-top: 1px solid #2d1b4d;">
            <p style="font-size: 10px; color: #5c4d7d; text-transform: uppercase; letter-spacing: 1px; margin: 0;">
              Finlogic Capital | Institutional Private Equity for Nepal
            </p>
          </div>
        </div>
      </body>
    </html>
    """
    
    try:
        # 1. Send Email
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@finlogiccapital.com')
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=from_email,
            to=[user.email]
        )
        msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=False)
        logger.info(f"Email notification sent to {user.email} for session {session.id}")
        
        # 2. Create In-app Notification
        Notification.objects.create(
            user=user,
            title="Validator Report Ready",
            message=f"The Sovereign Venture Architect has assigned a verdict of {session.verdict} to your business idea.",
            link=f"/validate/report/{session.id}"
        )
        logger.info(f"In-app notification created for {user.email}")
        
    except Exception as e:
        logger.error(f"Failed to send validation notification to {user.email}: {str(e)}")

def notify_red_team_ready(session):
    """Notify super-admins (if necessary) - placeholder for now."""
    pass
