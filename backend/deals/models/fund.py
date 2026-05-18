from django.contrib.auth import get_user_model
"""
deals/models.py
Private-Equity deal management models.

Deliberately isolated from core.Project (VC-focused).
All monetary amounts are in NPR (Nepalese Rupees).
"""
import uuid
import re

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.db import models
from django.db.models import Q
from django.utils import timezone

User = settings.AUTH_USER_MODEL


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

User = get_user_model()

class Fund(models.Model):
    """PE Fund – tracks capital raise, commitments & fund economics."""

    class ManagementFeeBasis(models.TextChoices):
        COMMITTED = 'COMMITTED', 'Committed Capital'
        INVESTED = 'INVESTED', 'Invested Capital'

    class Status(models.TextChoices):
        RAISING = 'RAISING', 'Raising'
        INVESTING = 'INVESTING', 'Investing'
        HARVESTING = 'HARVESTING', 'Harvesting'
        CLOSED = 'CLOSED', 'Closed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    legal_name = models.CharField(max_length=200)
    vintage_year = models.IntegerField()
    target_size_npr = models.DecimalField(max_digits=15, decimal_places=2)
    committed_capital_npr = models.DecimalField(
        max_digits=15, decimal_places=2, default=0
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.RAISING
    )
    preferred_return_pct = models.FloatField(default=8.0)
    management_fee_pct = models.FloatField(default=2.0)
    management_fee_basis = models.CharField(
        max_length=20, 
        choices=ManagementFeeBasis.choices, 
        default=ManagementFeeBasis.COMMITTED
    )
    management_fee_frequency_months = models.IntegerField(default=3)
    investment_period_end_date = models.DateField(null=True, blank=True)
    post_investment_management_fee_pct = models.FloatField(null=True, blank=True)
    post_investment_management_fee_basis = models.CharField(
        max_length=20, 
        choices=ManagementFeeBasis.choices, 
        null=True, 
        blank=True
    )
    carry_pct = models.FloatField(default=20.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_funds'
        ordering = ['-vintage_year', 'name']

    def __str__(self):
        return f'{self.name} ({self.vintage_year}) – {self.get_status_display()}'

    @property
    def uncalled_capital_npr(self):
        return self.target_size_npr - self.committed_capital_npr


# ---------------------------------------------------------------------------
# 2. PEProject  (PE Deal)
# ---------------------------------------------------------------------------


class LPProfile(models.Model):
    """Limited Partner profile – extends the core User."""

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='lp_profile'
    )
    full_name = models.CharField(max_length=200)
    organization = models.CharField(max_length=255, blank=True)
    country = models.CharField(max_length=100, blank=True)
    accredited_status = models.BooleanField(default=False)
    wants_notifications = models.BooleanField(default=True, help_text="Receive email notifications for new deals and updates.")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'lp_profiles'
        ordering = ['full_name']

    def __str__(self):
        return f'LP: {self.full_name} ({self.user.email})'


# ---------------------------------------------------------------------------
# 5. LPKYCDocument (Local Storage)
# ---------------------------------------------------------------------------


class LPKYCDocument(models.Model):
    """
    KYC documents uploaded by LPs for verification.
    Stored locally on the Django server.
    """
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Verification'
        VERIFIED = 'VERIFIED', 'Verified'
        REJECTED = 'REJECTED', 'Rejected'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lp_profile = models.ForeignKey('LPProfile', on_delete=models.CASCADE, related_name='kyc_documents')
    file = models.FileField(
        upload_to='kyc/%Y/%m/%d/',
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'jpeg', 'png'])]
    )
    document_type = models.CharField(max_length=50, help_text="e.g. Passport, Citizenship, PAN")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    rejection_reason = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_lp_kyc_documents'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f'{self.lp_profile.full_name} - {self.document_type} ({self.status})'


# ---------------------------------------------------------------------------
# 6. EntrepreneurKYBDocument (Local Storage)
# ---------------------------------------------------------------------------


class LPFundCommitment(models.Model):
    """Tracks an LP's capital commitment to a fund."""

    class ManagementFeeBasis(models.TextChoices):
        COMMITTED = 'COMMITTED', 'Committed Capital'
        INVESTED = 'INVESTED', 'Invested Capital'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lp_profile = models.ForeignKey('LPProfile', on_delete=models.CASCADE, related_name='fund_commitments'
    )
    fund = models.ForeignKey('Fund', on_delete=models.PROTECT, related_name='lp_commitments'
    )
    committed_amount_npr = models.DecimalField(max_digits=15, decimal_places=2)
    called_amount_npr = models.DecimalField(
        max_digits=15, decimal_places=2, default=0
    )
    credit_balance_npr = models.DecimalField(
        max_digits=15, decimal_places=2, default=0,
        help_text="Excess capital credits from equalization or refunds, available for netting."
    )
    commitment_date = models.DateField()
    
    # Custom LP rates (Side Letters)
    management_fee_override_pct = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    management_fee_override_basis = models.CharField(
        max_length=20, 
        choices=ManagementFeeBasis.choices, 
        null=True, 
        blank=True
    )
    fee_start_date_override = models.DateField(null=True, blank=True)
    fee_end_date_override = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'lp_fund_commitments'
        unique_together = [('lp_profile', 'fund')]
        ordering = ['-commitment_date']

    def __str__(self):
        return (
            f'{self.lp_profile.full_name} → {self.fund.name} '
            f'NPR {self.committed_amount_npr:,}'
        )

    @property
    def uncalled_amount_npr(self):
        return self.committed_amount_npr - self.called_amount_npr

    def clean(self):
        """
        Validate that commitments do not exceed fund target size.
        """
        from django.db.models import Sum
        from decimal import Decimal
        import logging
        logger = logging.getLogger(__name__)
        
        target_size = Decimal(str(self.fund.target_size_npr))
        current_amount = Decimal(str(self.committed_amount_npr))
        
        # 1. Individual check
        if current_amount > target_size:
            logger.warning(f"Validation Failed: Individual commitment {current_amount} > Target Size {target_size}")
            raise ValidationError({
                'committed_amount_npr': f"Individual LP commitment (NPR {current_amount:,.2f}) cannot exceed total fund target size (NPR {target_size:,.2f})."
            })
            
        # 2. Aggregate check
        # We need the sum of ALL other commitments to this fund
        existing_total_query = LPFundCommitment.objects.filter(fund=self.fund)
        if self.pk:
            existing_total_query = existing_total_query.exclude(pk=self.pk)
            
        existing_total = existing_total_query.aggregate(
            total=Sum('committed_amount_npr')
        )['total'] or Decimal('0')
        
        existing_total = Decimal(str(existing_total))
        new_total = existing_total + current_amount
        
        logger.info(f"Checking Aggregate: Existing {existing_total} + New {current_amount} = {new_total} (Limit: {target_size})")
        
        if new_total > target_size:
             logger.warning(f"Validation Failed: Aggregate total {new_total} > Target Size {target_size}")
             raise ValidationError({
                 'committed_amount_npr': f"Total fund commitments (NPR {new_total:,.2f}) would exceed target fund size (NPR {target_size:,.2f}). Current committed by others: NPR {existing_total:,.2f}."
             })

    def save(self, *args, **kwargs):
        # Force validation logic even if not called by a form
        self.full_clean()
        super().save(*args, **kwargs)


# ---------------------------------------------------------------------------
# 6. PEInvestment
# ---------------------------------------------------------------------------


class PEInvestment(models.Model):
    """Closed investment made from a fund into a PE project/portfolio company."""

    class ExitType(models.TextChoices):
        TRADE_SALE = 'TRADE_SALE', 'Trade Sale'
        IPO = 'IPO', 'IPO'
        SECONDARY = 'SECONDARY', 'Secondary Sale'
        WRITE_OFF = 'WRITE_OFF', 'Write-Off'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey('PEProject', on_delete=models.PROTECT, related_name='investments'
    )
    fund = models.ForeignKey('Fund', on_delete=models.PROTECT, related_name='investments'
    )
    investment_date = models.DateField()
    investment_amount_npr = models.DecimalField(max_digits=15, decimal_places=2)
    ownership_pct = models.DecimalField(max_digits=6, decimal_places=3)
    valuation_at_entry_npr = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True
    )
    # Exit info (filled on exit)
    exit_date = models.DateField(null=True, blank=True)
    exit_value_npr = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True
    )
    exit_type = models.CharField(
        max_length=20, choices=ExitType.choices, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_investments'
        ordering = ['-investment_date']

    def __str__(self):
        return (
            f'{self.fund.name} → {self.project.legal_name} '
            f'NPR {self.investment_amount_npr:,}'
        )

    @property
    def moic(self):
        """Money-On-Invested-Capital (only meaningful post-exit)."""
        if self.exit_value_npr and self.investment_amount_npr:
            return float(self.exit_value_npr / self.investment_amount_npr)
        return None


# ---------------------------------------------------------------------------
# 7. CapitalCall
# ---------------------------------------------------------------------------


class CapitalCall(models.Model):
    """A drawdown of LP committed capital for investment purposes."""

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        CALLED = 'CALLED', 'Called'
        PAID = 'PAID', 'Paid (Awaiting Verification)'
        VERIFIED = 'VERIFIED', 'Verified (Awaiting Superadmin Approval)'
        RECEIVED = 'RECEIVED', 'Received'
        DEFAULTED = 'DEFAULTED', 'Defaulted'

    class CallType(models.TextChoices):
        INVESTMENT = 'INVESTMENT', 'Capital Investment'
        MANAGEMENT_FEE = 'MANAGEMENT_FEE', 'Management Fee'
        FUND_EXPENSE = 'FUND_EXPENSE', 'Fund Expense'
        EQUALIZATION = 'EQUALIZATION', 'Equalization Catch-up'
        OTHER = 'OTHER', 'Other'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    fund = models.ForeignKey('Fund', on_delete=models.PROTECT, related_name='capital_calls'
    )
    project = models.ForeignKey('PEProject', on_delete=models.PROTECT, related_name='capital_calls',
        null=True, blank=True,
        help_text='The deal this capital call is funding'
    )
    lp_commitment = models.ForeignKey('LPFundCommitment',
        on_delete=models.PROTECT,
        related_name='capital_calls',
        null=True,
        blank=True,
    )
    call_date = models.DateField()
    due_date = models.DateField()
    amount_npr = models.DecimalField(max_digits=15, decimal_places=2)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    call_type = models.CharField(
        max_length=20, choices=CallType.choices, default=CallType.INVESTMENT
    )
    notice_sent_at = models.DateTimeField(null=True, blank=True)
    received_at = models.DateTimeField(null=True, blank=True)
    payment_proof = models.FileField(
        upload_to='payments/%Y/%m/%d/', 
        null=True, 
        blank=True,
        help_text='LP upload for bank transfer proof'
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_capital_calls'
        ordering = ['-call_date']

    def __str__(self):
        return (
            f'Capital Call {self.call_date} – {self.fund.name} '
            f'NPR {self.amount_npr:,}'
        )


# ---------------------------------------------------------------------------
# 8. Distribution
# ---------------------------------------------------------------------------


class Distribution(models.Model):
    """Cash / proceeds returned to LPs from a fund."""

    class DistributionType(models.TextChoices):
        RETURN_OF_CAPITAL = 'RETURN_OF_CAPITAL', 'Return of Capital'
        PREFERRED_RETURN = 'PREFERRED_RETURN', 'Preferred Return'
        CARRIED_INTEREST = 'CARRIED_INTEREST', 'Carried Interest'
        EQUALIZATION_REFUND = 'EQUALIZATION_REFUND', 'Equalization Refund'
        DIVIDEND = 'DIVIDEND', 'Dividend'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    fund = models.ForeignKey('Fund', on_delete=models.PROTECT, related_name='distributions'
    )
    project = models.ForeignKey(
        'PEProject',
        on_delete=models.SET_NULL,
        related_name='distributions',
        null=True,
        blank=True,
    )
    lp_commitment = models.ForeignKey('LPFundCommitment',
        on_delete=models.PROTECT,
        related_name='distributions',
        null=True,
        blank=True,
    )
    distribution_date = models.DateField()
    amount_npr = models.DecimalField(max_digits=15, decimal_places=2)
    distribution_type = models.CharField(
        max_length=30,
        choices=DistributionType.choices,
        default=DistributionType.RETURN_OF_CAPITAL,
    )
    waterfall_run = models.ForeignKey(
        'WaterfallRun',
        on_delete=models.SET_NULL,
        related_name='distributions',
        null=True,
        blank=True,
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pe_distributions'
        ordering = ['-distribution_date']

    def __str__(self):
        return (
            f'Distribution {self.distribution_date} – {self.fund.name} '
            f'NPR {self.amount_npr:,}'
        )


# ---------------------------------------------------------------------------
# 9. ManagementFeeAccrual
# ---------------------------------------------------------------------------



# ---------------------------------------------------------------------------
# 10. PEFormTemplate  &  PEProjectFormResponse
# ---------------------------------------------------------------------------


class ImmutableAuditEvent(models.Model):
    """
    Append-only audit log for key PE workflow events.
    Records are NEVER updated or deleted – enforced via save() override.
    """

    class EventType(models.TextChoices):
        PROJECT_CREATED = 'PROJECT_CREATED', 'Project Created'
        PROJECT_STATUS_CHANGED = 'PROJECT_STATUS_CHANGED', 'Project Status Changed'
        INVITATION_SENT = 'INVITATION_SENT', 'Invitation Sent'
        DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED', 'Document Uploaded'
        FORM_STEP_SAVED = 'FORM_STEP_SAVED', 'Form Step Saved'
        PROJECT_SUBMITTED = 'PROJECT_SUBMITTED', 'Project Submitted'
        INVESTMENT_CREATED = 'INVESTMENT_CREATED', 'Investment Created'
        INVESTMENT_CLOSED = 'INVESTMENT_CLOSED', 'Investment Closed'
        CAPITAL_CALL_ISSUED = 'CAPITAL_CALL_ISSUED', 'Capital Call Issued'
        CAPITAL_CALLED = 'CAPITAL_CALLED', 'Capital Called'
        CAPITAL_RECEIVED = 'CAPITAL_RECEIVED', 'Capital Received'
        DISTRIBUTION_MADE = 'DISTRIBUTION_MADE', 'Distribution Made'
        SEBON_FILING_SUBMITTED = 'SEBON_FILING_SUBMITTED', 'SEBON Filing Submitted'
        USER_MANAGEMENT = 'USER_MANAGEMENT', 'User Management Action'
        FUND_MANAGEMENT = 'FUND_MANAGEMENT', 'Fund Management Action'
        PROMPT_MANAGEMENT = 'PROMPT_MANAGEMENT', 'Prompt Library Action'
        COMPLIANCE_REVIEW = 'COMPLIANCE_REVIEW', 'Compliance Review Action'
        # Deal conversion events
        VALUATION_OVERRIDE = 'VALUATION_OVERRIDE', 'Valuation Override'
        TERM_OVERRIDE = 'TERM_OVERRIDE', 'Term Sheet Override'
        SPA_OVERRIDE = 'SPA_OVERRIDE', 'SPA Draft Override'
        IC_MEMO_SIGNED = 'IC_MEMO_SIGNED', 'IC Memo Signed'
        LOI_ISSUED = 'LOI_ISSUED', 'LOI Issued'
        LOI_SIGNED_BY_ENTREPRENEUR = 'LOI_SIGNED_BY_ENTREPRENEUR', 'LOI Signed by Entrepreneur'
        MEMO_FINALIZED = 'MEMO_FINALIZED', 'IC Memo Finalized'
        SCORING_OVERRIDE = 'SCORING_OVERRIDE', 'Scoring Override'
        COMPLIANCE_CLEARED = 'COMPLIANCE_CLEARED', 'Compliance Gate Cleared'
        COMPLIANCE_RESET = 'COMPLIANCE_RESET', 'Compliance Gate Reset'
        DEAL_APPROVED_FOR_LP = 'DEAL_APPROVED_FOR_LP', 'Deal Approved for LP'
        # Idea Validator events
        VALIDATION_SUBMITTED = 'VALIDATION_SUBMITTED', 'Idea Validation Submitted'
        QUOTA_ADJUSTED = 'QUOTA_ADJUSTED', 'Validator Quota Adjusted'
        RED_TEAM_REPORT_ACCESSED = 'RED_TEAM_REPORT_ACCESSED', 'Red-Team Report Accessed'
        RED_TEAM_REPORT_TRIGGERED = 'RED_TEAM_REPORT_TRIGGERED', 'Red-Team Report Triggered'
        # Market Intelligence events
        SECTOR_REPORT_EDITED = 'SECTOR_REPORT_EDITED', 'Sector Report Edited'
        SECTOR_REPORT_PUBLISHED = 'SECTOR_REPORT_PUBLISHED', 'Sector Report Published'
        COMPS_UPSERTED = 'COMPS_UPSERTED', 'Comps Upserted'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_type = models.CharField(max_length=50, choices=EventType.choices)
    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_events',
    )
    # Generic FK fields (store the UUID of the affected object + its model label)
    object_id = models.UUIDField(null=True, blank=True)
    object_repr = models.CharField(max_length=200, blank=True)
    content_type_label = models.CharField(
        max_length=100,
        blank=True,
        help_text="e.g. 'deals.PEProject'",
    )
    payload = models.JSONField(
        default=dict,
        help_text="Arbitrary context: old/new values, metadata, etc.",
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pe_audit_events'
        ordering = ['-created_at']
        # Prevent bulk-update (immutability contract at ORM level)
        # Real protection comes from DB-level triggers in production.

    def __str__(self):
        actor = getattr(self.actor, 'email', 'system')
        return f'[{self.event_type}] {actor} @ {self.created_at:%Y-%m-%d %H:%M}'

    def save(self, *args, **kwargs):
        """Enforce immutability: new records only, no updates."""
        if self.pk and ImmutableAuditEvent.objects.filter(pk=self.pk).exists():
            raise ValidationError("ImmutableAuditEvent records cannot be modified.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("ImmutableAuditEvent records cannot be deleted.")


# ---------------------------------------------------------------------------
# 7. Fund Document Management (SEBON Compliant)
# ---------------------------------------------------------------------------


class GPShareholder(models.Model):
    """Tracks shares held by users in the GP Management Company."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='gp_shareholding')
    shares_held = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    ownership_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    vesting_status = models.CharField(max_length=50, default='Fully Vested')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_gp_shareholders'
        verbose_name = 'GP Shareholder'
        verbose_name_plural = 'GP Shareholders'

    def __str__(self):
        return f'{self.user.email} ({self.shares_held} shares)'



class GPDividend(models.Model):
    """Tracks dividend distributions to GP Shareholders."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shareholder = models.ForeignKey('GPShareholder', on_delete=models.CASCADE, related_name='dividends')
    amount_npr = models.DecimalField(max_digits=15, decimal_places=2)
    payment_date = models.DateField()
    fiscal_year = models.CharField(max_length=20) # e.g. 2080/81
    status = models.CharField(max_length=20, choices=[('PENDING', 'Pending'), ('PAID', 'Paid')], default='PAID')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pe_gp_dividends'
        ordering = ['-payment_date']

    def __str__(self):
        return f'{self.shareholder.user.email} – NPR {self.amount_npr:,} ({self.fiscal_year})'


# ---------------------------------------------------------------------------
# 13. GP Governance & Voting
# ---------------------------------------------------------------------------


class LPSupportRequest(models.Model):
    """Support tickets submitted by Limited Partners."""
    
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        RESOLVED = 'RESOLVED', 'Resolved'
        CLOSED = 'CLOSED', 'Closed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lp_profile = models.ForeignKey('LPProfile', on_delete=models.CASCADE, related_name='support_requests'
    )
    subject = models.CharField(max_length=255)
    message = models.TextField()
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    admin_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_lp_support_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"Support: {self.subject} ({self.lp_profile.full_name})"


class ManagementFeeAccrual(models.Model):
    """Tracks periodic management fee accruals for each LP."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    fund = models.ForeignKey('Fund', on_delete=models.CASCADE, related_name='fee_accruals')
    lp_commitment = models.ForeignKey('LPFundCommitment', on_delete=models.CASCADE, related_name='fee_accruals')
    
    period_start_date = models.DateField()
    period_end_date = models.DateField()
    accrual_date = models.DateField(help_text="The date this accrual was recorded")
    
    fee_basis_amount = models.DecimalField(max_digits=15, decimal_places=2, help_text="The capital basis used for calculation")
    fee_pct_used = models.FloatField(help_text="The annual percentage rate used")
    fee_amount = models.DecimalField(max_digits=15, decimal_places=2)
    is_called = models.BooleanField(default=False)
    capital_call = models.ForeignKey(
        'CapitalCall', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='linked_accruals'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_management_fee_accruals'
        ordering = ['-accrual_date']

    def __str__(self):
        return f"Fee Accrual: {self.fund.name} - {self.lp_commitment.lp_profile.full_name} ({self.accrual_date})"
