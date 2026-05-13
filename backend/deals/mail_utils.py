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

def send_capital_call_notification(lp_profile, fund, project, amount_npr, due_date):
    """
    Send a professional capital call notice to an LP.
    """
    try:
        frontend_base = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:3000')
        portal_url = f'{frontend_base}/lp/dashboard'
        
        # Determine display name (masked if not closed, matching frontend logic)
        project_display = project.legal_name if project.status == 'CLOSED' else "Restricted Investment Project"
        
        subject = f'Capital Call Notice: {fund.name} - Drawdown Request'
        
        text_body = (
            f"Dear {lp_profile.full_name},\n\n"
            f"This is a formal Capital Call notice for your commitment in '{fund.name}'.\n\n"
            f"Investment Detail: {project_display}\n"
            f"Drawdown Amount: NPR {amount_npr:,.2f}\n"
            f"Due Date: {due_date}\n\n"
            f"Please log in to the LP Portal to review the drawdown protocol and wire instructions:\n"
            f"{portal_url}\n\n"
            f"If you have any questions regarding this capital call, please contact our investor relations team.\n\n"
            f"Best regards,\n"
            f"Finlogic Capital Team"
        )
        
        html_body = f"""
        <html>
          <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1a2c5b; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #1a2c5b; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Capital Call Notice</h1>
            </div>
            
            <div style="padding: 40px; border: 1px solid #e1e8f0; border-top: none; border-radius: 0 0 12px 12px; background: #ffffff;">
              <p>Dear <strong>{lp_profile.full_name}</strong>,</p>
              
              <p>This is a formal Capital Call notice for your commitment in <strong>{fund.name}</strong>.</p>
              
              <div style="background: #f8fafc; border-left: 4px solid #1a2c5b; padding: 25px; margin: 30px 0; border-radius: 4px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding-bottom: 10px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Investment Entity</td>
                  </tr>
                  <tr>
                    <td style="padding-bottom: 20px; font-weight: bold; font-size: 18px;">{project_display}</td>
                  </tr>
                  <tr>
                    <td style="padding-bottom: 10px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Drawdown Amount</td>
                  </tr>
                  <tr>
                    <td style="padding-bottom: 20px; font-weight: bold; font-size: 24px; color: #1a2c5b;">NPR {amount_npr:,.2f}</td>
                  </tr>
                  <tr>
                    <td style="padding-bottom: 10px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Payment Due Date</td>
                  </tr>
                  <tr>
                    <td style="font-weight: bold; font-size: 16px; color: #e11d48;">{due_date}</td>
                  </tr>
                </table>
              </div>
              
              <p>Please log in to the <strong>Finlogic Investor Portal</strong> to review the drawdown protocol, fund performance data, and secure wire instructions.</p>
              
              <p style="text-align: center; margin: 40px 0;">
                <a href="{portal_url}"
                   style="background: #1a2c5b; color: #ffffff; padding: 18px 36px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; box-shadow: 0 10px 15px -3px rgba(26, 44, 91, 0.3); text-transform: uppercase; letter-spacing: 1px; font-size: 14px;">
                  Access Investor Portal →
                </a>
              </p>
              
              <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 15px; margin-top: 30px;">
                <p style="margin: 0; color: #92400e; font-size: 13px;">
                  <strong>Action Required:</strong> Please ensure the payment is initiated at least 48 hours before the due date to account for inter-bank clearing times.
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e1e8f0; margin: 40px 0;" />
              
              <p style="font-size: 11px; color: #94a3b8; text-align: center;">
                This is an automated institutional notice from Finlogic Capital.<br/>
                If you have questions, please reach out to <a href="mailto:ir@finlogiccapital.com" style="color: #1a2c5b;">ir@finlogiccapital.com</a>
              </p>
            </div>
            
            <div style="text-align: center; padding-top: 20px; color: #94a3b8; font-size: 11px;">
              Finlogic Capital | Nepal Private Equity Platform<br/>
              Kathmandu, Nepal
            </div>
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
            msg.tags = ['capital-call-notice']

        msg.send(fail_silently=False)
        return True
    except Exception as exc:
        logger.error(f"Failed to send capital call email to {lp_profile.user.email}: {exc}")
        return False
