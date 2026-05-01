import logging
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from core.models import User, Project, ProjectFile, Deal, ArticleCompletion, ReaderProfile
from deals.models import FundDocument, IRDocument, GovernanceProposal, GPDividend, GPShareholder, PEProject, PEProjectDocument

logger = logging.getLogger(__name__)

def dispatch_styled_email(subject, text_content, html_content, recipient_list):
    try:
        send_mail(
            subject=subject,
            message=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipient_list,
            html_message=html_content,
            fail_silently=True,
        )
    except Exception as e:
        logger.error(f"Failed to send email to {recipient_list}: {e}")

# ---------------------------------------------------------------------------
# 1. Admin Confirms User (Account Approval)
# ---------------------------------------------------------------------------
@receiver(pre_save, sender=User)
def track_user_approval(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_user = User.objects.get(pk=instance.pk)
            instance._was_approved = old_user.is_approved
        except User.DoesNotExist:
            instance._was_approved = False
    else:
        instance._was_approved = False

@receiver(post_save, sender=User)
def notify_user_approved(sender, instance, created, **kwargs):
    was_approved = getattr(instance, '_was_approved', False)
    if not was_approved and instance.is_approved:
        # User just got approved
        subject = "Account Approved - Welcome to Finlogic Capital"
        frontend_url = getattr(settings, 'FRONTEND_URL', 'https://finlogiccapital.com').rstrip('/')
        
        text_content = f"Hello {instance.first_name},\n\nYour account has been fully approved by our administration team. You can now log in and access the portal at {frontend_url}/auth/login"
        
        html_content = f"""
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #100226; color: #ffffff; padding: 40px; border-radius: 12px; border-top: 4px solid #F59F01;">
            <h2 style="color: #F59F01; margin-top: 0;">Account Approved</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0;">Hello {instance.first_name},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0;">We are pleased to inform you that your Finlogic Capital account has been fully approved by our administration team.</p>
            
            <a href="{frontend_url}/auth/login" style="display: inline-block; background-color: #F59F01; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 8px; margin: 20px 0;">Log In to Portal</a>
            
            <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;">
            <p style="font-size: 13px; color: #94a3b8; margin: 0;">&copy; Finlogic Capital Limited.</p>
        </div>
        """
        dispatch_styled_email(subject, text_content, html_content, [instance.email])

# ---------------------------------------------------------------------------
# 2. Confirmation of Submission to Entrepreneur
# ---------------------------------------------------------------------------
@receiver(pre_save, sender=Project)
@receiver(pre_save, sender=PEProject)
def track_project_status(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_project = Project.objects.get(pk=instance.pk)
            instance._old_status = old_project.status
        except Project.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None

@receiver(post_save, sender=Project)
@receiver(post_save, sender=PEProject)
def notify_entrepreneur_submission(sender, instance, created, **kwargs):
    old_status = getattr(instance, '_old_status', None)
    
    # If a new project is created with SUBMITTED status, or changes from Draft to SUBMITTED
    if instance.status == 'SUBMITTED' and old_status != 'SUBMITTED':
        user = instance.user if hasattr(instance, 'user') else instance.entrepreneur_user
        if not user:
            return
            
        subject = f"Submission Received: {instance.title if hasattr(instance, 'title') else instance.legal_name}"
        text_content = f"Hello {user.first_name},\n\nWe have successfully received your project submission for '{instance.title if hasattr(instance, 'title') else instance.legal_name}'. Our Investment Committee will review your materials."
        
        html_content = f"""
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #100226; color: #ffffff; padding: 40px; border-radius: 12px; border-top: 4px solid #F59F01;">
            <h2 style="color: #F59F01; margin-top: 0;">Submission Received</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0;">Hello {user.first_name},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0;">We have successfully received your submission for <strong>{instance.title if hasattr(instance, 'title') else instance.legal_name}</strong>.</p>
            <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0;">Our Investment Committee will review your materials and reach out regarding next steps.</p>
            
            <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;">
            <p style="font-size: 13px; color: #94a3b8; margin: 0;">&copy; Finlogic Capital Limited.</p>
        </div>
        """
        dispatch_styled_email(subject, text_content, html_content, [user.email])

# ---------------------------------------------------------------------------
# 3. Document Uploaded (Notify GP/Admin)
# ---------------------------------------------------------------------------
@receiver(post_save, sender=ProjectFile)
@receiver(post_save, sender=PEProjectDocument)
def notify_gp_document_upload(sender, instance, created, **kwargs):
    if created:
        admin_email = getattr(settings, 'ADMIN_EMAIL', 'info@finlogiccapital.com')
        project_name = instance.project.title if hasattr(instance.project, 'title') else instance.project.legal_name
        file_name = instance.file_name if hasattr(instance, 'file_name') else instance.filename
        
        subject = f"New Document Uploaded: {project_name}"
        
        text_content = f"A new document ({file_name}) has been uploaded to the project '{project_name}'."
        html_content = f"""
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; color: #0f172a; padding: 30px; border-radius: 8px;">
            <h2 style="margin-top: 0;">New Document Uploaded</h2>
            <p><strong>Project:</strong> {project_name}</p>
            <p><strong>Document:</strong> {file_name}</p>
            <p><strong>Category:</strong> {instance.get_category_display()}</p>
        </div>
        """
        dispatch_styled_email(subject, text_content, html_content, [admin_email])

# ---------------------------------------------------------------------------
# 4. New Deal for LP Investors
# ---------------------------------------------------------------------------
@receiver(post_save, sender=Deal)
def notify_lps_new_deal(sender, instance, created, **kwargs):
    if created:
        from deals.models import LPProfile
        
        # Get all LPs who want notifications
        lps = LPProfile.objects.filter(wants_notifications=True).select_related('user')
        lp_emails = [lp.user.email for lp in lps if lp.user and lp.user.is_approved]
        
        if not lp_emails:
            return
            
        frontend_url = getattr(settings, 'FRONTEND_URL', 'https://finlogiccapital.com').rstrip('/')
        subject = f"New Investment Opportunity: {instance.portfolio_company.name}"
        
        text_content = f"A new deal for {instance.portfolio_company.name} is now available in your portal."
        html_content = f"""
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #100226; color: #ffffff; padding: 40px; border-radius: 12px; border-top: 4px solid #F59F01;">
            <h2 style="color: #F59F01; margin-top: 0;">New Investment Opportunity</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0;">A new deal for <strong>{instance.portfolio_company.name}</strong> has been finalized and added to the platform.</p>
            
            <a href="{frontend_url}/investors" style="display: inline-block; background-color: #F59F01; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 8px; margin: 20px 0;">View Deal Details</a>
            
            <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;">
            <p style="font-size: 13px; color: #94a3b8; margin: 0;">You are receiving this because you opted into LP deal notifications.<br>&copy; Finlogic Capital Limited.</p>
        </div>
        """
        # Send as BCC or loop to send individually. Sending as BCC in recipient_list via Django is tricky with default send_mail, 
        # so we will dispatch to each email individually to maintain privacy.
        for email in lp_emails:
            dispatch_styled_email(subject, text_content, html_content, [email])

# ---------------------------------------------------------------------------
# 5. Fund Document Portal Updates (IR Documents for GPs and LPs)
# ---------------------------------------------------------------------------
@receiver(post_save, sender=FundDocument)
def notify_investors_document(sender, instance, created, **kwargs):
    if created and instance.is_published:
        frontend_url = getattr(settings, 'FRONTEND_URL', 'https://finlogiccapital.com').rstrip('/')
        
        # Define which document types go to which user groups
        gp_doc_types = [
            FundDocument.DocType.BOARD_MINUTES,
            FundDocument.DocType.SHAREHOLDER_REPORT,
            FundDocument.DocType.ANNUAL_REPORT,
            FundDocument.DocType.GP_QUARTERLY_REPORT,
        ]
        
        lp_doc_types = [
            FundDocument.DocType.LPA,
            FundDocument.DocType.PPM,
            FundDocument.DocType.CAPITAL_CALL,
            FundDocument.DocType.DISTRIBUTION,
            FundDocument.DocType.QUARTERLY_REPORT,
            FundDocument.DocType.TAX_DOCUMENT,
        ]

        recipient_emails = []
        portal_link = f"{frontend_url}/investors"
        group_name = ""

        # Route to GP Shareholders
        if instance.document_type in gp_doc_types:
            group_name = "GP Shareholder"
            gp_users = User.objects.filter(roles__contains='gp_investor', is_approved=True)
            recipient_emails = [u.email for u in gp_users]
            
        # Route to LPs
        elif instance.document_type in lp_doc_types:
            from deals.models import LPProfile
            group_name = "Limited Partner"
            lps = LPProfile.objects.filter(wants_notifications=True).select_related('user')
            recipient_emails = [lp.user.email for lp in lps if lp.user and lp.user.is_approved]
            
        # If it's OTHER or KYC, we don't spam everyone
        else:
            return

        if not recipient_emails:
            return

        subject = f"New {group_name} Document Available: {instance.title}"
        text_content = f"A new document ({instance.title}) has been uploaded for the fund {instance.fund.name}."
        html_content = f"""
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #100226; color: #ffffff; padding: 40px; border-radius: 12px; border-top: 4px solid #F59F01;">
            <h2 style="color: #F59F01; margin-top: 0;">New {group_name} Document</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0;">A new document <strong>{instance.title}</strong> has been published for the fund <strong>{instance.fund.name}</strong>.</p>
            <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0;">Document Type: {instance.get_document_type_display()}</p>
            
            <a href="{portal_link}" style="display: inline-block; background-color: #F59F01; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 8px; margin: 20px 0;">Access Portal</a>
            <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;">
            <p style="font-size: 13px; color: #94a3b8; margin: 0;">&copy; Finlogic Capital Limited.</p>
        </div>
        """
        for email in recipient_emails:
            dispatch_styled_email(subject, text_content, html_content, [email])

# ---------------------------------------------------------------------------
# 6. GP Shareholder Dividends
# ---------------------------------------------------------------------------
@receiver(post_save, sender=GPDividend)
def notify_gp_dividend(sender, instance, created, **kwargs):
    if created and instance.status == 'PAID':
        user = instance.shareholder.user
        subject = f"Dividend Payment Notification: {instance.fiscal_year}"
        frontend_url = getattr(settings, 'FRONTEND_URL', 'https://finlogiccapital.com').rstrip('/')
        
        text_content = f"Hello {user.first_name},\n\nA dividend of NPR {instance.amount_npr:,} for the fiscal year {instance.fiscal_year} has been processed."
        html_content = f"""
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #100226; color: #ffffff; padding: 40px; border-radius: 12px; border-top: 4px solid #F59F01;">
            <h2 style="color: #F59F01; margin-top: 0;">Dividend Paid</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0;">Hello {user.first_name},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0;">We are pleased to inform you that a dividend payment of <strong>NPR {instance.amount_npr:,}</strong> has been processed for your shareholding.</p>
            <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0;"><strong>Fiscal Year:</strong> {instance.fiscal_year}</p>
            <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0;"><strong>Date:</strong> {instance.payment_date}</p>
            
            <a href="{frontend_url}/investors" style="display: inline-block; background-color: #F59F01; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 8px; margin: 20px 0;">View in GP Portal</a>
            
            <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;">
            <p style="font-size: 13px; color: #94a3b8; margin: 0;">&copy; Finlogic Capital Limited.</p>
        </div>
        """
        dispatch_styled_email(subject, text_content, html_content, [user.email])

# ---------------------------------------------------------------------------
# 7. GP Governance Proposals
# ---------------------------------------------------------------------------
@receiver(post_save, sender=GovernanceProposal)
def notify_gp_proposal(sender, instance, created, **kwargs):
    # Detect transition to ACTIVE status
    if instance.status == GovernanceProposal.Status.ACTIVE:
        gp_users = User.objects.filter(roles__contains='gp_investor', is_approved=True)
        gp_emails = [u.email for u in gp_users]
        
        if not gp_emails:
            return
            
        subject = f"New Governance Proposal: {instance.title}"
        frontend_url = getattr(settings, 'FRONTEND_URL', 'https://finlogiccapital.com').rstrip('/')
        
        text_content = f"A new governance proposal '{instance.title}' has been activated for voting."
        html_content = f"""
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #100226; color: #ffffff; padding: 40px; border-radius: 12px; border-top: 4px solid #F59F01;">
            <h2 style="color: #F59F01; margin-top: 0;">Action Required: New Proposal</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0;">A new governance proposal has been published and is now open for voting.</p>
            <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0;"><strong>Title:</strong> {instance.title}</p>
            <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0;"><strong>Deadline:</strong> {instance.expiry_date:%Y-%m-%d}</p>
            
            <a href="{frontend_url}/investors" style="display: inline-block; background-color: #F59F01; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 8px; margin: 20px 0;">Cast Your Vote</a>
            
            <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;">
            <p style="font-size: 13px; color: #94a3b8; margin: 0;">&copy; Finlogic Capital Limited.</p>
        </div>
        """
        for email in gp_emails:
            dispatch_styled_email(subject, text_content, html_content, [email])

# ---------------------------------------------------------------------------
# 8. GP IR Documents
# ---------------------------------------------------------------------------
@receiver(post_save, sender=IRDocument)
def notify_gp_ir_document(sender, instance, created, **kwargs):
    if created and instance.is_published:
        gp_users = User.objects.filter(roles__contains='gp_investor', is_approved=True)
        gp_emails = [u.email for u in gp_users]
        
        if not gp_emails:
            return
            
        subject = f"New Shareholder Document: {instance.title}"
        frontend_url = getattr(settings, 'FRONTEND_URL', 'https://finlogiccapital.com').rstrip('/')
        
        text_content = f"A new shareholder document '{instance.title}' ({instance.get_category_display()}) is available."
        html_content = f"""
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #100226; color: #ffffff; padding: 40px; border-radius: 12px; border-top: 4px solid #F59F01;">
            <h2 style="color: #F59F01; margin-top: 0;">New IR Document Available</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0;">A new document has been published for GP Shareholders.</p>
            <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0;"><strong>Title:</strong> {instance.title}</p>
            <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0;"><strong>Category:</strong> {instance.get_category_display()}</p>
            
            <a href="{frontend_url}/investors" style="display: inline-block; background-color: #F59F01; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 8px; margin: 20px 0;">Access Documents</a>
            
            <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;">
            <p style="font-size: 13px; color: #94a3b8; margin: 0;">&copy; Finlogic Capital Limited.</p>
        </div>
        """
        for email in gp_emails:
            dispatch_styled_email(subject, text_content, html_content, [email])

# ---------------------------------------------------------------------------
# 9. GP Shareholder Profile Changes
# ---------------------------------------------------------------------------
@receiver(pre_save, sender=GPShareholder)
def track_shareholder_changes(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_record = GPShareholder.objects.get(pk=instance.pk)
            instance._old_shares = old_record.shares_held
            instance._old_vesting = old_record.vesting_status
        except GPShareholder.DoesNotExist:
            instance._old_shares = None
            instance._old_vesting = None

@receiver(post_save, sender=GPShareholder)
def notify_shareholder_changes(sender, instance, created, **kwargs):
    if created:
        # Potentially notify on first record creation if desired
        return
        
    old_shares = getattr(instance, '_old_shares', None)
    old_vesting = getattr(instance, '_old_vesting', None)
    
    changes = []
    if old_shares is not None and old_shares != instance.shares_held:
        changes.append(f"Shares Held: {old_shares} -> {instance.shares_held}")
    if old_vesting is not None and old_vesting != instance.vesting_status:
        changes.append(f"Vesting Status: {old_vesting} -> {instance.vesting_status}")
        
    if changes:
        user = instance.user
        subject = "Update to Your GP Shareholder Record"
        frontend_url = getattr(settings, 'FRONTEND_URL', 'https://finlogiccapital.com').rstrip('/')
        
        change_text = "\n".join([f"- {c}" for c in changes])
        change_html = "".join([f"<li>{c}</li>" for c in changes])
        
        text_content = f"Hello {user.first_name},\n\nYour GP Shareholder record has been updated with the following changes:\n\n{change_text}"
        html_content = f"""
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #100226; color: #ffffff; padding: 40px; border-radius: 12px; border-top: 4px solid #F59F01;">
            <h2 style="color: #F59F01; margin-top: 0;">Shareholder Record Updated</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0;">Hello {user.first_name},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0;">Administrative changes have been made to your shareholding record in the GP Management Company:</p>
            <ul style="color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                {change_html}
            </ul>
            
            <a href="{frontend_url}/investors" style="display: inline-block; background-color: #F59F01; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 8px; margin: 20px 0;">View in GP Portal</a>
            
            <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;">
            <p style="font-size: 13px; color: #94a3b8; margin: 0;">&copy; Finlogic Capital Limited.</p>
        </div>
        """
        dispatch_styled_email(subject, text_content, html_content, [user.email])
        
# ---------------------------------------------------------------------------
# 10. Article Completion (Update ReaderProfile)
# ---------------------------------------------------------------------------
@receiver(post_save, sender=ArticleCompletion)
def update_reader_stats(sender, instance, created, **kwargs):
    if created:
        profile, _ = ReaderProfile.objects.get_or_create(user=instance.user)
        # Recalculate total completed articles for this user
        count = ArticleCompletion.objects.filter(user=instance.user).count()
        profile.completed_articles = count
        profile.save()
