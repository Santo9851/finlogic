from django.conf import settings
from django.utils.safestring import mark_safe

def render_welcome_email(subscriber):
    """
    Renders a branded welcome email for new subscribers.
    """
    frontend_url = getattr(settings, 'NEWSLETTER_BASE_URL', 'https://finlogiccapital.com')
    accent_color = "#F59F01"
    bg_dark = "#100226"
    text_light = "#e2e8f0"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Georgia, serif; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }}
            .container {{ max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; }}
            .header {{ background-color: {bg_dark}; padding: 40px; text-align: center; border-bottom: 4px solid {accent_color}; }}
            .content {{ padding: 40px; line-height: 1.6; color: #1a1a1a; }}
            .footer {{ background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; }}
            .btn {{ display: inline-block; padding: 12px 24px; background-color: {accent_color}; color: #000; text-decoration: none; font-weight: bold; border-radius: 4px; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="color: {accent_color}; margin: 0; font-size: 24px; letter-spacing: 1px;">CAPITAL LINES</h1>
                <p style="color: {text_light}; margin: 10px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Where Vision Meets Wisdom</p>
            </div>
            <div class="content">
                <h2 style="font-family: Arial, sans-serif;">Welcome to the Fold, {subscriber.first_name or 'Friend'}.</h2>
                <p>Thank you for joining <strong>Capital Lines</strong>, the strategic dispatch from Finlogic Capital.</p>
                <p>You are now part of an exclusive circle of founders, investors, and visionaries navigating the frontier of private equity and venture capital in Nepal and beyond.</p>
                <p>Every week, we bring you unfiltered signals, deep-dive theses, and the data that matters.</p>
                <a href="{frontend_url}" class="btn">Explore the Portal</a>
            </div>
            <div class="footer">
                <p>&copy; Finlogic Capital Limited. All rights reserved.</p>
                <p>Kathmandu, Nepal</p>
            </div>
        </div>
    </body>
    </html>
    """
    return html

def render_issue_email(issue, subscriber, send_event):
    """
    Renders a high-fidelity, institutional newsletter issue using 
    table-based layout and web-safe typography.
    """
    base_url = getattr(settings, 'NEWSLETTER_BASE_URL', 'https://finlogiccapital.com').rstrip('/')
    tracking_url = f"{base_url}/newsletter/track/open/{send_event.tracking_token}/"
    
    # Get unsubscribe token
    if subscriber.pk:
        from newsletter.models import UnsubscribeToken
        unsub_token_obj, _ = UnsubscribeToken.objects.get_or_create(subscriber=subscriber)
        unsubscribe_url = f"{base_url}/newsletter/unsubscribe/{unsub_token_obj.token}/"
    else:
        unsubscribe_url = f"{base_url}/newsletter/unsubscribe/00000000-0000-0000-0000-000000000000/"
    
    # Brand Colors (Premium Palette)
    ink = "#111009"
    ivory = "#f8f4ed"
    warm_white = "#fdfaf5"
    gold = "#c09736"
    gold_dim = "#8a6d24"
    muted = "#7a7060"
    rule = "#ddd6c8"
    card_bg = "#f3ece0"
    sage = "#3d5c4a"
    slate = "#354359"

    # Pre-render sections for HTML (preserving line breaks)
    s_signal = issue.section_signal.replace('\n', '<br>')
    s_thesis = issue.section_thesis.replace('\n', '<br>')
    s_founders = issue.section_founders.replace('\n', '<br>')
    s_lp = issue.section_lp.replace('\n', '<br>')
    s_data = issue.section_data.replace('\n', '<br>')
    s_question = issue.section_question.replace('\n', '<br>')

    html = f"""
    <!DOCTYPE html>
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>{issue.title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: {warm_white}; font-family: 'Georgia', serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: {warm_white};">
            <tr>
                <td align="center" style="padding: 40px 10px;">
                    <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid {rule}; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                        
                        <!-- MASTHEAD -->
                        <tr>
                            <td bgcolor="{ink}" style="padding: 20px 40px; border-bottom: 1px solid #2a2620;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td style="font-family: 'Georgia', serif; font-size: 13px; font-weight: bold; color: {gold}; text-transform: uppercase; letter-spacing: 2px;">
                                            Capital Lines &bull; Finlogic
                                        </td>
                                        <td align="right" style="font-family: 'Arial', sans-serif; font-size: 9px; color: {muted}; text-transform: uppercase; letter-spacing: 2px;">
                                            Issue {issue.issue_number} &nbsp;&bull;&nbsp; {issue.sent_at.strftime('%B %Y') if issue.sent_at else 'Dispatch'}
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- COVER / HERO -->
                        <tr>
                            <td bgcolor="{ink}" style="padding: 60px 40px 50px; border-bottom: 1px solid #2a2620;">
                                <div style="font-family: 'Arial', sans-serif; font-size: 9px; color: {gold}; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 20px;">
                                    ISSUE {issue.issue_number} &bull; {issue.title}
                                </div>
                                <h1 style="font-family: 'Georgia', serif; font-size: 48px; font-weight: bold; color: {ivory}; line-height: 1.1; margin: 0; letter-spacing: -1px;">
                                    {issue.title.replace('.', '.<br>')}
                                </h1>
                                <p style="font-family: 'Georgia', serif; font-size: 16px; color: #8a8070; line-height: 1.6; margin-top: 25px; max-width: 480px;">
                                    {issue.deck}
                                </p>
                            </td>
                        </tr>

                        <!-- TOC BAR -->
                        <tr>
                            <td bgcolor="{ink}" style="padding: 0 40px; border-bottom: 1px solid #2a2620;">
                                <table border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td style="padding: 15px 25px 15px 0; font-family: 'Arial', sans-serif; font-size: 9px; color: {gold}; text-transform: uppercase; letter-spacing: 1px;">The Signal</td>
                                        <td style="padding: 15px 25px 15px 0; font-family: 'Arial', sans-serif; font-size: 9px; color: {muted}; text-transform: uppercase; letter-spacing: 1px;">The Thesis</td>
                                        <td style="padding: 15px 25px 15px 0; font-family: 'Arial', sans-serif; font-size: 9px; color: {muted}; text-transform: uppercase; letter-spacing: 1px;">Founders</td>
                                        <td style="padding: 15px 25px 15px 0; font-family: 'Arial', sans-serif; font-size: 9px; color: {muted}; text-transform: uppercase; letter-spacing: 1px;">LPs</td>
                                        <td style="padding: 15px 0 15px 0; font-family: 'Arial', sans-serif; font-size: 9px; color: {muted}; text-transform: uppercase; letter-spacing: 1px;">Data</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- BODY CONTENT -->
                        <tr>
                            <td style="padding: 50px 40px;">
                                
                                <!-- SECTION: THE SIGNAL -->
                                <div style="font-family: 'Arial', sans-serif; font-size: 9px; color: {gold}; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 15px; border-bottom: 1px solid {rule}; padding-bottom: 10px;">
                                    01 &bull; The Signal &bull; Editor's Note
                                </div>
                                <p style="font-family: 'Georgia', serif; font-size: 19px; font-style: italic; color: {slate}; line-height: 1.6; margin-bottom: 30px; padding-left: 20px; border-left: 2px solid {rule};">
                                    {s_signal.split('<br>')[0] if '<br>' in s_signal else s_signal}
                                </p>
                                <div style="font-family: 'Georgia', serif; font-size: 15px; color: {ink}; line-height: 1.8; margin-bottom: 40px;">
                                    {s_signal.split('<br>', 1)[1] if '<br>' in s_signal else ''}
                                </div>

                                <hr style="border: none; border-top: 1px solid {rule}; margin: 40px 0;" />

                                <!-- SECTION: THE THESIS -->
                                <div style="font-family: 'Arial', sans-serif; font-size: 9px; color: {gold}; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 15px; border-bottom: 1px solid {rule}; padding-bottom: 10px;">
                                    02 &bull; The Thesis &bull; Long Read
                                </div>
                                <h2 style="font-family: 'Georgia', serif; font-size: 26px; font-weight: bold; color: {ink}; line-height: 1.2; margin-bottom: 20px;">
                                    {issue.title}
                                </h2>
                                <div style="font-family: 'Georgia', serif; font-size: 15px; color: {ink}; line-height: 1.8; margin-bottom: 40px;">
                                    {s_thesis}
                                </div>

                                <!-- SECTION: FOUNDERS (Dark Box) -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: {ink}; margin-bottom: 40px;">
                                    <tr>
                                        <td style="padding: 35px 30px;">
                                            <div style="font-family: 'Arial', sans-serif; font-size: 9px; color: {gold}; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 15px; border-bottom: 1px solid #2a2620; padding-bottom: 10px;">
                                                03 &bull; Founders Circle &bull; Strategy
                                            </div>
                                            <h3 style="font-family: 'Georgia', serif; font-size: 22px; font-weight: bold; color: {ivory}; margin-bottom: 15px;">
                                                What Investors See
                                            </h3>
                                            <div style="font-family: 'Georgia', serif; font-size: 14px; color: #9a9080; line-height: 1.7;">
                                                {s_founders}
                                            </div>
                                        </td>
                                    </tr>
                                </table>

                                <!-- SECTION: LP (Sage Treatment) -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f0ebe0; border-top: 2px solid {sage}; margin-bottom: 40px;">
                                    <tr>
                                        <td style="padding: 35px 30px;">
                                            <div style="font-family: 'Arial', sans-serif; font-size: 9px; color: {sage}; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 15px; border-bottom: 1px solid #c5d5c8; padding-bottom: 10px;">
                                                04 &bull; LP Perspective &bull; Capital Allocation
                                            </div>
                                            <div style="font-family: 'Georgia', serif; font-size: 14px; color: #3a4030; line-height: 1.7;">
                                                {s_lp}
                                            </div>
                                        </td>
                                    </tr>
                                </table>

                                <!-- SECTION: DATA -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid {rule}; margin-bottom: 40px;">
                                    <tr>
                                        <td style="padding: 30px; position: relative;">
                                            <div style="font-family: 'Arial', sans-serif; font-size: 42px; font-weight: bold; color: {gold_dim}; line-height: 1; margin-bottom: 10px;">
                                                {s_data.split('%')[0] if '%' in s_data else '27.7'}%
                                            </div>
                                            <div style="font-family: 'Arial', sans-serif; font-size: 13px; color: {muted}; line-height: 1.5;">
                                                {s_data.split('%', 1)[1] if '%' in s_data else s_data}
                                            </div>
                                        </td>
                                    </tr>
                                </table>

                                <!-- SECTION: QUESTION -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: {ivory}; border-top: 2px solid {gold};">
                                    <tr>
                                        <td style="padding: 35px 30px;">
                                            <div style="font-family: 'Arial', sans-serif; font-size: 9px; color: {gold}; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 15px;">
                                                06 &bull; One Question
                                            </div>
                                            <div style="font-family: 'Georgia', serif; font-size: 20px; font-style: italic; color: {slate}; line-height: 1.5;">
                                                {s_question}
                                            </div>
                                            <div style="font-family: 'Arial', sans-serif; font-size: 11px; color: {muted}; margin-top: 15px;">
                                                Reply to this email to join the conversation.
                                            </div>
                                        </td>
                                    </tr>
                                </table>

                            </td>
                        </tr>

                        <!-- FOOTER -->
                        <tr>
                            <td bgcolor="#f9f9f9" style="padding: 40px; text-align: center; border-top: 1px solid #eee;">
                                <div style="font-family: 'Arial', sans-serif; font-size: 11px; font-weight: bold; color: {ink}; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">
                                    Capital Lines &bull; Finlogic Capital
                                </div>
                                <div style="font-family: 'Arial', sans-serif; font-size: 10px; color: {muted};">
                                    Kathmandu, Nepal &bull; info@finlogiccapital.com
                                </div>
                                <div style="margin-top: 25px; font-family: 'Arial', sans-serif; font-size: 10px; color: {muted};">
                                    You are receiving this because you joined the Finlogic network.<br>
                                    <a href="{unsubscribe_url}" style="color: {gold}; text-decoration: underline;">Unsubscribe from this list</a>
                                </div>
                            </td>
                        </tr>

                    </table>

                    <!-- TRACKING PIXEL -->
                    <img src="{tracking_url}" width="1" height="1" border="0" alt="" style="display:none; visibility:hidden;" />
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    return html
