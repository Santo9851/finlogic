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
from django.utils import timezone

User = settings.AUTH_USER_MODEL


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def validate_ocr_number(value: str) -> None:
    """
    OCR (Office of Company Registrar) Nepal format.
    Accepted patterns:
      - 12345/67/68  (old style)
      - 123456-78/79 (new style)
      - Ka-12345/67  (prefixed)
    A liberal regex that allows digits, hyphens, slashes and optional
    Nepali-character prefixes (represented as Ka-, Kha-, etc.).
    """
    pattern = r'^[A-Za-z]{0,3}[-]?\d{4,8}[/\-]\d{2,5}([/\-]\d{2,5})?$'
    if not re.match(pattern, value.strip()):
        raise ValidationError(
            f"'{value}' is not a valid Nepal OCR registration number. "
            "Expected formats: 12345/67/68 or Ka-12345/67."
        )


# ---------------------------------------------------------------------------
# 1. Fund
# ---------------------------------------------------------------------------

class Fund(models.Model):
    """PE Fund – tracks capital raise, commitments & fund economics."""

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

class PEProject(models.Model):
    """
    A Private-Equity deal record.
    Named PEProject to avoid collision with core.Project (VC submissions).
    """

    class DealType(models.TextChoices):
        GROWTH = 'GROWTH', 'Growth Capital'
        BUYOUT = 'BUYOUT', 'Buyout'
        RECAP = 'RECAP', 'Recapitalisation'

    class Sector(models.TextChoices):
        HYDROPOWER = 'Hydropower', 'Hydropower'
        BANKING = 'Banking', 'Banking & Finance'
        MANUFACTURING = 'Manufacturing', 'Manufacturing'
        TOURISM = 'Tourism', 'Tourism & Hospitality'
        IT = 'IT', 'Information Technology'
        AGRICULTURE = 'Agriculture', 'Agriculture'
        INFRASTRUCTURE = 'Infrastructure', 'Infrastructure'
        HEALTH = 'Health', 'Healthcare'
        EDUCATION = 'Education', 'Education'
        RETAIL = 'Retail', 'Retail & FMCG'
        OTHER = 'Other', 'Other'

    class Status(models.TextChoices):
        SUBMITTED = 'SUBMITTED', 'Submitted'
        SCREENING = 'SCREENING', 'Screening'
        AI_REVIEW_NEEDED = 'AI_REVIEW_NEEDED', 'AI Review Needed'
        GP_APPROVED = 'GP_APPROVED', 'GP Approved'
        SHORTLISTED = 'SHORTLISTED', 'Shortlisted'
        VIDEO_PITCH = 'VIDEO_PITCH', 'Video Pitch'
        DUE_DILIGENCE = 'DUE_DILIGENCE', 'Due Diligence'
        TERM_SHEET = 'TERM_SHEET', 'Term Sheet'
        CLOSED = 'CLOSED', 'Closed'
        DECLINED = 'DECLINED', 'Declined'

    class SubmissionType(models.TextChoices):
        MANUAL_GP = 'MANUAL_GP', 'Manual (GP Created)'
        ENTREPRENEUR_INVITED = 'ENTREPRENEUR_INVITED', 'Entrepreneur Invited'

    # Primary key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Fund association
    fund = models.ForeignKey(
        Fund, on_delete=models.PROTECT, related_name='pe_projects'
    )

    # Company / Deal info
    legal_name = models.CharField(max_length=200)
    ocr_registration_number = models.CharField(
        max_length=50,
        unique=True,
        validators=[validate_ocr_number],
        help_text="Nepal OCR registration number e.g. 12345/67/68",
    )
    deal_type = models.CharField(
        max_length=20, choices=DealType.choices, default=DealType.GROWTH
    )
    sector = models.CharField(
        max_length=50, choices=Sector.choices, default=Sector.OTHER
    )

    # Investment size
    investment_range_min_npr = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True
    )
    investment_range_max_npr = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True
    )

    # Workflow
    status = models.CharField(
        max_length=30, choices=Status.choices, default=Status.SUBMITTED
    )
    submission_type = models.CharField(
        max_length=30,
        choices=SubmissionType.choices,
        default=SubmissionType.MANUAL_GP,
    )

    # Entrepreneur invite
    entrepreneur_user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invited_pe_projects',
    )
    invitation_token = models.UUIDField(null=True, blank=True, unique=True)
    invitation_sent_at = models.DateTimeField(null=True, blank=True)
    invitation_expires_at = models.DateTimeField(null=True, blank=True)

    # Multi-step form progress
    form_step_completed = models.IntegerField(
        default=0,
        help_text="Index of last completed form step (0 = none completed)",
    )
    submitted_at = models.DateTimeField(null=True, blank=True)

    # Ownership
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_pe_projects',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_projects'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status'], name='idx_pep_status'),
            models.Index(fields=['fund'], name='idx_pep_fund'),
            models.Index(fields=['entrepreneur_user'], name='idx_pep_entrepreneur'),
            models.Index(fields=['invitation_token'], name='idx_pep_token'),
        ]

    def __str__(self):
        return f'{self.legal_name} [{self.get_status_display()}]'

    @property
    def data_room_completeness(self) -> int:
        """
        Percentage of required document categories present in the data room.
        Required categories: FINANCIAL, LEGAL, COMMERCIAL.
        """
        required = {'FINANCIAL', 'LEGAL', 'COMMERCIAL'}
        uploaded = set(
            self.documents.filter(
                category__in=list(required)
            ).values_list('category', flat=True).distinct()
        )
        if not required:
            return 100
        return int(len(uploaded & required) / len(required) * 100)

    @property
    def is_invitation_valid(self) -> bool:
        if not self.invitation_token:
            return False
        if self.invitation_expires_at and timezone.now() > self.invitation_expires_at:
            return False
        return True


# ---------------------------------------------------------------------------
# 3. PEProjectDocument
# ---------------------------------------------------------------------------

class PEProjectDocument(models.Model):
    """Files stored on Backblaze B2; only metadata lives here."""

    class Category(models.TextChoices):
        FINANCIAL = 'FINANCIAL', 'Financial'
        LEGAL = 'LEGAL', 'Legal'
        COMMERCIAL = 'COMMERCIAL', 'Commercial'
        OTHER = 'OTHER', 'Other'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        PEProject, on_delete=models.CASCADE, related_name='documents'
    )
    file_key = models.CharField(
        max_length=500,
        help_text="Backblaze B2 object key (path within bucket)",
    )
    filename = models.CharField(max_length=255)
    file_size = models.BigIntegerField(help_text="File size in bytes")
    mime_type = models.CharField(max_length=100, blank=True)
    category = models.CharField(
        max_length=20, choices=Category.choices, default=Category.OTHER
    )
    uploaded_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='uploaded_pe_docs'
    )
    is_confirmed = models.BooleanField(
        default=False,
        help_text="True if client confirmed successful upload to B2",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pe_project_documents'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f'{self.filename} ({self.get_category_display()}) – {self.project.legal_name}'


# ---------------------------------------------------------------------------
# 4. LPProfile
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
    lp_profile = models.ForeignKey(LPProfile, on_delete=models.CASCADE, related_name='kyc_documents')
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

class EntrepreneurKYBDocument(models.Model):
    """
    KYB (Know Your Business) documents uploaded by entrepreneurs for startup verification.
    Stored locally on the Django server.
    """
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Verification'
        VERIFIED = 'VERIFIED', 'Verified'
        REJECTED = 'REJECTED', 'Rejected'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='entrepreneur_kyb_documents')
    file = models.FileField(
        upload_to='kyb/entrepreneur/%Y/%m/%d/',
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'jpeg', 'png'])]
    )
    document_type = models.CharField(max_length=50, help_text="e.g. Incorporation, PAN, Tax Clearance")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    rejection_reason = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_entrepreneur_kyb_documents'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f'{self.user.email} - {self.document_type} ({self.status})'


# ---------------------------------------------------------------------------
# 7. LPFundCommitment
# ---------------------------------------------------------------------------

class LPFundCommitment(models.Model):
    """Tracks an LP's capital commitment to a fund."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lp_profile = models.ForeignKey(
        LPProfile, on_delete=models.CASCADE, related_name='fund_commitments'
    )
    fund = models.ForeignKey(
        Fund, on_delete=models.PROTECT, related_name='lp_commitments'
    )
    committed_amount_npr = models.DecimalField(max_digits=15, decimal_places=2)
    called_amount_npr = models.DecimalField(
        max_digits=15, decimal_places=2, default=0
    )
    commitment_date = models.DateField()
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
    project = models.ForeignKey(
        PEProject, on_delete=models.PROTECT, related_name='investments'
    )
    fund = models.ForeignKey(
        Fund, on_delete=models.PROTECT, related_name='investments'
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
        RECEIVED = 'RECEIVED', 'Received'
        DEFAULTED = 'DEFAULTED', 'Defaulted'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    fund = models.ForeignKey(
        Fund, on_delete=models.PROTECT, related_name='capital_calls'
    )
    lp_commitment = models.ForeignKey(
        LPFundCommitment,
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
    notice_sent_at = models.DateTimeField(null=True, blank=True)
    received_at = models.DateTimeField(null=True, blank=True)
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
        DIVIDEND = 'DIVIDEND', 'Dividend'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    fund = models.ForeignKey(
        Fund, on_delete=models.PROTECT, related_name='distributions'
    )
    lp_commitment = models.ForeignKey(
        LPFundCommitment,
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
# 9. PEFormTemplate  &  PEProjectFormResponse
# ---------------------------------------------------------------------------

class PEFormTemplate(models.Model):
    """
    Configurable multi-step form definition (stored as JSON schema).
    Each step has a name, order index, and a JSON schema for the fields.
    """

    class FormType(models.TextChoices):
        DEAL_SUBMISSION = 'DEAL_SUBMISSION', 'Deal Submission'
        LP_ONBOARDING = 'LP_ONBOARDING', 'LP Onboarding'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    form_type = models.CharField(
        max_length=30,
        choices=FormType.choices,
        default=FormType.DEAL_SUBMISSION,
    )
    version = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    steps = models.JSONField(
        default=list,
        help_text=(
            "Ordered list of step definitions. Each element: "
            '{"step_index": 1, "step_name": "company_info", '
            '"title": "Company Info", "fields": [...]}'
        ),
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_form_templates'
        ordering = ['-version']
        unique_together = [('form_type', 'version')]

    def __str__(self):
        return f'{self.get_form_type_display()} v{self.version} (active={self.is_active})'


class PEProjectFormResponse(models.Model):
    """Stores an entrepreneur's step-by-step form responses."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        PEProject,
        on_delete=models.CASCADE,
        related_name='form_responses',
    )
    template = models.ForeignKey(
        PEFormTemplate,
        on_delete=models.PROTECT,
        related_name='responses',
    )
    step_index = models.PositiveIntegerField()
    step_name = models.CharField(max_length=100)
    response_data = models.JSONField(default=dict)
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_project_form_responses'
        unique_together = [('project', 'step_index')]
        ordering = ['step_index']

    def __str__(self):
        return f'Step {self.step_index} ({self.step_name}) – {self.project.legal_name}'


# ---------------------------------------------------------------------------
# 10. ImmutableAuditEvent
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
        CAPITAL_CALL_ISSUED = 'CAPITAL_CALL_ISSUED', 'Capital Call Issued'
        DISTRIBUTION_MADE = 'DISTRIBUTION_MADE', 'Distribution Made'

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

class FundDocument(models.Model):
    """
    Documents associated with a Fund, accessible by LPs.
    Complies with SEBON SIF Rules 2075 reporting requirements.
    """
    class DocType(models.TextChoices):
        LPA = 'LPA', 'Limited Partnership Agreement'
        PPM = 'PPM', 'Private Placement Memorandum'
        CAPITAL_CALL = 'CAPITAL_CALL', 'Capital Call Notice'
        DISTRIBUTION = 'DISTRIBUTION', 'Distribution Notice'
        QUARTERLY_REPORT = 'QUARTERLY_REPORT', 'LP Quarterly Progress Report'
        GP_QUARTERLY_REPORT = 'GP_QUARTERLY_REPORT', 'GP Quarterly Report'
        ANNUAL_REPORT = 'ANNUAL_REPORT', 'Annual Audited Report'
        TAX_DOCUMENT = 'TAX_DOCUMENT', 'Tax Certificate/Document'
        KYC_AML = 'KYC_AML', 'KYC/AML Document'
        SHAREHOLDER_REPORT = 'SHAREHOLDER_REPORT', 'GP Shareholder Report'
        BOARD_MINUTES = 'BOARD_MINUTES', 'Board Meeting Minutes'
        OTHER = 'OTHER', 'Other Fund Document'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    fund = models.ForeignKey(Fund, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    document_type = models.CharField(max_length=30, choices=DocType.choices, default=DocType.OTHER)
    
    # Backblaze B2 reference
    file_key = models.CharField(max_length=500)
    file_name = models.CharField(max_length=255)
    file_size = models.BigIntegerField()
    mime_type = models.CharField(max_length=100)
    
    # Publishing logic
    is_published = models.BooleanField(default=False)
    publish_date = models.DateTimeField(null=True, blank=True)
    requires_acknowledgment = models.BooleanField(default=False)
    
    # Capital Call specifics (if CC type)
    capital_call_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    capital_call_due_date = models.DateField(null=True, blank=True)
    
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_fund_documents'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f'[{self.get_document_type_display()}] {self.title}'


class LPDocumentAccess(models.Model):
    """Tracks which LPs have viewed/acknowledged specific documents."""
    lp_profile = models.ForeignKey('LPProfile', on_delete=models.CASCADE, related_name='document_access')
    document = models.ForeignKey(FundDocument, on_delete=models.CASCADE, related_name='access_logs')
    viewed_at = models.DateTimeField(auto_now_add=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        db_table = 'pe_lp_document_access'
        unique_together = ('lp_profile', 'document')

    def __str__(self):
        return f'{self.lp_profile.user.email} – {self.document.title}'


# ---------------------------------------------------------------------------
# 12. GP Shareholder & Dividend Accounting
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
    shareholder = models.ForeignKey(GPShareholder, on_delete=models.CASCADE, related_name='dividends')
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

class GovernanceProposal(models.Model):
    """Proposals that GP Shareholders can vote on."""
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        ACTIVE = 'ACTIVE', 'Active'
        CLOSED = 'CLOSED', 'Closed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    expiry_date = models.DateTimeField()
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_proposals')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_governance_proposals'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class ProposalVote(models.Model):
    """Individual votes cast by GP Shareholders."""
    class Choice(models.TextChoices):
        FOR = 'FOR', 'For'
        AGAINST = 'AGAINST', 'Against'
        ABSTAIN = 'ABSTAIN', 'Abstain'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    proposal = models.ForeignKey(GovernanceProposal, on_delete=models.CASCADE, related_name='votes')
    shareholder = models.ForeignKey(GPShareholder, on_delete=models.CASCADE, related_name='votes')
    choice = models.CharField(max_length=20, choices=Choice.choices)
    
    # Snapshot of voting weight at time of vote
    shares_at_voting = models.DecimalField(max_digits=15, decimal_places=2)
    
    voted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pe_proposal_votes'
        unique_together = ('proposal', 'shareholder')

    def __str__(self):
        return f'{self.shareholder.user.email} - {self.proposal.title} ({self.choice})'


# ---------------------------------------------------------------------------
# 14. IR Documents (Global Shareholder Relations)
# ---------------------------------------------------------------------------

class IRDocument(models.Model):
    """Global documents for GP Shareholders (Annual Reports, Notices)."""
    class Category(models.TextChoices):
        FINANCIAL = 'FINANCIAL', 'Financial Report'
        LEGAL = 'LEGAL', 'Legal/Regulatory'
        MEETING = 'MEETING', 'Board/Shareholder Meeting'
        GENERAL = 'GENERAL', 'General Announcement'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='ir_docs/%Y/%m/%d/')
    category = models.CharField(max_length=30, choices=Category.choices, default=Category.GENERAL)
    is_published = models.BooleanField(default=False)
    
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='uploaded_ir_docs')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_ir_documents'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f'{self.title} ({self.category})'


# ---------------------------------------------------------------------------
# 15. AI Infrastructure
# ---------------------------------------------------------------------------

class AICallLog(models.Model):
    """Logs all AI requests for auditing and budget tracking."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task_type = models.CharField(max_length=50)
    model_name = models.CharField(max_length=100)
    prompt_tokens = models.IntegerField(default=0)
    completion_tokens = models.IntegerField(default=0)
    total_tokens = models.IntegerField(default=0)
    estimated_cost_usd = models.DecimalField(max_digits=10, decimal_places=6, default=0)
    latency_ms = models.IntegerField(default=0)
    status = models.CharField(max_length=20, default='SUCCESS')
    error_message = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Metadata for filtering/reporting
    project = models.ForeignKey(PEProject, on_delete=models.SET_NULL, null=True, blank=True, related_name='ai_logs')
    document = models.ForeignKey(PEProjectDocument, on_delete=models.SET_NULL, null=True, blank=True, related_name='ai_logs')

    class Meta:
        db_table = 'pe_ai_call_logs'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.task_type} via {self.model_name} ({self.status})'


class PromptLibrary(models.Model):
    """Central repository for AI prompts with version control."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    task_type = models.CharField(max_length=50, db_index=True)
    system_prompt = models.TextField()
    user_prompt_template = models.TextField()
    output_schema = models.JSONField(
        default=dict, 
        blank=True, 
        help_text="Expected JSON structure for AI output validation."
    )
    version = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_prompt_library'
        verbose_name_plural = 'Prompt Libraries'
        unique_together = ('task_type', 'version')
        ordering = ['task_type', '-version']

    def __str__(self):
        return f'{self.name} v{self.version} ({self.task_type})'


class ExtractedFinancials(models.Model):
    """
    Structured financial data extracted from documents (Balance Sheets, P&L).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(PEProject, on_delete=models.CASCADE, related_name='financials')
    source_document = models.ForeignKey(PEProjectDocument, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Financial periods (BS = Bikram Sambat for Nepal context)
    fiscal_year_bs = models.CharField(max_length=10, help_text="e.g. 2080/81")
    
    # Core P&L / BS items (NPR)
    revenue = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    ebitda = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    pat = models.DecimalField(max_digits=15, decimal_places=2, default=0, help_text="Profit After Tax")
    total_assets = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_debt = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Calculated Margins & Growth (Stored for performance)
    gross_margin_pct = models.FloatField(default=0)
    ebitda_margin_pct = models.FloatField(default=0)
    pat_margin_pct = models.FloatField(default=0)
    revenue_yoy_growth = models.FloatField(default=0)
    ebitda_yoy_growth = models.FloatField(default=0)
    
    # AI Metadata
    extraction_confidence = models.FloatField(default=0, help_text="0.0 to 1.0 scale")
    raw_ai_output = models.JSONField(default=dict, blank=True)
    
    # Verification
    is_verified_by_gp = models.BooleanField(default=False)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_financials')
    verified_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_extracted_financials'
        ordering = ['-fiscal_year_bs']
        unique_together = ('project', 'fiscal_year_bs')

    def __str__(self):
        return f'{self.project.legal_name} - {self.fiscal_year_bs}'


class QoEReport(models.Model):
    """
    Quality of Earnings report generated by AI.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(PEProject, on_delete=models.CASCADE, related_name='qoe_reports')
    report_text = models.TextField()
    analysis_data = models.JSONField(default=dict, help_text="Structured flags and scores")
    
    # Red/Yellow/Green Flags
    status = models.CharField(max_length=20, choices=[('CLEAN', 'Green'), ('CAUTION', 'Yellow'), ('HIGH_RISK', 'Red')], default='CLEAN')
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pe_qoe_reports'
        ordering = ['-created_at']

    def __str__(self):
        return f'QoE Report: {self.project.legal_name} ({self.created_at:%Y-%m-%d})'


class CommercialAnalysis(models.Model):
    """Commercial due diligence findings."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(PEProject, on_delete=models.CASCADE, related_name='commercial_analyses')
    customer_concentration_pct = models.FloatField(default=0)
    top_customer_names = models.TextField(blank=True, help_text="Comma-separated or bulleted list of top customers")
    market_positioning_notes = models.TextField(blank=True)
    ai_call_log = models.ForeignKey('AICallLog', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pe_commercial_analyses'
        ordering = ['-created_at']

    def __str__(self):
        return f'Commercial Analysis: {self.project.legal_name}'


class OperationalAnalysis(models.Model):
    """Operational due diligence findings."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(PEProject, on_delete=models.CASCADE, related_name='operational_analyses')
    technology_stack = models.JSONField(default=dict, blank=True)
    key_person_risk_score = models.IntegerField(default=0, help_text="1 to 10 scale")
    supply_chain_risks = models.JSONField(default=list, blank=True)
    operational_red_flags = models.JSONField(default=list, blank=True)
    ai_call_log = models.ForeignKey('AICallLog', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pe_operational_analyses'
        ordering = ['-created_at']

    def __str__(self):
        return f'Operational Analysis: {self.project.legal_name}'


class RedFlagPattern(models.Model):
    """Pre-defined patterns to look for in legal documents."""
    name = models.CharField(max_length=100)
    pattern_regex = models.CharField(max_length=500, help_text="Regex pattern to match")
    severity = models.CharField(max_length=20, choices=[('INFO', 'Info'), ('WARNING', 'Warning'), ('CRITICAL', 'Critical')], default='WARNING')
    description = models.TextField()
    nepal_context_note = models.TextField(blank=True, help_text="Specific relevance to Nepal (e.g. FITTA, SEBON)")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pe_red_flag_patterns'

    def __str__(self):
        return f"{self.name} ({self.severity})"


class RedFlagFinding(models.Model):
    """Occurrences of red flags in specific documents."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(PEProject, on_delete=models.CASCADE, related_name='red_flags')
    document = models.ForeignKey(PEProjectDocument, on_delete=models.CASCADE, related_name='red_flag_findings')
    pattern = models.ForeignKey(RedFlagPattern, on_delete=models.SET_NULL, null=True, blank=True)
    context_snippet = models.TextField(help_text="The text snippet where the match was found")
    severity = models.CharField(max_length=20)
    ai_analysis = models.TextField(blank=True, help_text="AI's explanation of why this is a risk")
    is_reviewed_by_gp = models.BooleanField(default=False)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pe_red_flag_findings'
        ordering = ['-created_at']

    def __str__(self):
        return f"Red Flag: {self.pattern.name if self.pattern else 'AI Finding'} in {self.document.filename}"


class ScoringRun(models.Model):
    """Execution instance of the FINLO scoring framework."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(PEProject, on_delete=models.CASCADE, related_name='scoring_runs')
    triggered_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='triggered_scorings')
    
    status = models.CharField(max_length=20, choices=[
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed')
    ], default='PENDING')
    
    total_deal_score = models.FloatField(default=0, help_text="Weighted final score (1-10)")
    gp_assessment_summary = models.TextField(blank=True, help_text="Mandatory GP final assessment (>100 words)")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_scoring_runs'
        ordering = ['-created_at']

    def __str__(self):
        return f"Scoring Run for {self.project.legal_name} ({self.created_at:%Y-%m-%d})"


class CriterionScore(models.Model):
    """Score for a specific criterion within the FINLO framework."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    scoring_run = models.ForeignKey(ScoringRun, on_delete=models.CASCADE, related_name='criteria_scores')
    
    pillar = models.CharField(max_length=1, choices=[
        ('F', 'Foresight'),
        ('I', 'Insight'),
        ('N', 'Nexus'),
        ('L', 'Logic'),
        ('O', 'Odyssey')
    ])
    criterion_id = models.CharField(max_length=50, help_text="e.g. problem_clarity")
    
    # AI Results
    ai_score = models.IntegerField(default=0, help_text="1-10 scale")
    ai_rationale = models.TextField(blank=True)
    ai_confidence = models.FloatField(default=0)
    evidence_quotes = models.JSONField(default=list, blank=True)
    
    # GP Overrides
    gp_score = models.IntegerField(null=True, blank=True, help_text="1-10 scale")
    gp_notes = models.TextField(blank=True)
    overridden_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    overridden_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'pe_criterion_scores'
        unique_together = ('scoring_run', 'criterion_id')

    def __str__(self):
        return f"{self.criterion_id}: {self.ai_score} (GP: {self.gp_score})"


class ComplianceGate(models.Model):
    """Compliance checklists required before deal approval."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    scoring_run = models.ForeignKey(ScoringRun, on_delete=models.CASCADE, related_name='compliance_gates')
    
    gate_id = models.CharField(max_length=50, choices=[
        ('FITTA', 'FITTA Approval'),
        ('AML_KYC', 'AML/KYC Clearance'),
        ('FINANCIAL_AUDIT', 'Financial Audit Verification'),
        ('LEGAL_STRUCTURE', 'Legal Structure Validity'),
        ('SEBON_MAPPING', 'SEBON Mapping & Compliance')
    ])
    
    status = models.CharField(max_length=20, choices=[
        ('PENDING', 'Pending'),
        ('CLEARED', 'Cleared'),
        ('FAILED', 'Failed')
    ], default='PENDING')
    
    cleared_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    cleared_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    documents = models.ManyToManyField(PEProjectDocument, blank=True, related_name='compliance_gates')

    class Meta:
        db_table = 'pe_compliance_gates'
        unique_together = ('scoring_run', 'gate_id')

    def __str__(self):
        return f"{self.gate_id}: {self.status}"


class ValuationModel(models.Model):
    """Container for DCF and LBO financial models."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(PEProject, on_delete=models.CASCADE, related_name='valuations')
    model_type = models.CharField(max_length=10, choices=[('DCF', 'DCF'), ('LBO', 'LBO')])
    
    assumptions = models.JSONField(default=dict)
    outputs = models.JSONField(default=dict)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_valuation_models'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.model_type} for {self.project.legal_name}"


class DCFAssumptions(models.Model):
    """Specific parameters for DCF analysis."""
    valuation = models.OneToOneField(ValuationModel, on_delete=models.CASCADE, related_name='dcf_detail')
    projection_years = models.IntegerField(default=5)
    revenue_growth_rate = models.FloatField(help_text="Decimal, e.g. 0.15 for 15%")
    ebitda_margin = models.FloatField()
    tax_rate = models.FloatField(default=0.25)
    wacc = models.FloatField()
    terminal_growth_rate = models.FloatField(default=0.03)

    class Meta:
        db_table = 'pe_valuation_dcf_assumptions'


class LBOAssumptions(models.Model):
    """Specific parameters for LBO analysis."""
    valuation = models.OneToOneField(ValuationModel, on_delete=models.CASCADE, related_name='lbo_detail')
    entry_ebitda = models.DecimalField(max_digits=20, decimal_places=2)
    purchase_multiple = models.FloatField()
    debt_financing = models.JSONField(help_text="List of debt tranches with rates/tenures")
    exit_year = models.IntegerField(default=5)
    exit_multiple = models.FloatField()

    class Meta:
        db_table = 'pe_valuation_lbo_assumptions'


class RegulatoryChecklist(models.Model):
    """Nepal-specific compliance checklist for PE deals."""
    project = models.OneToOneField(PEProject, on_delete=models.CASCADE, related_name='regulatory_checklist')
    
    # FITTA (Foreign Investment and Technology Transfer Act)
    fitta_approval_required = models.BooleanField(default=False)
    fitta_approval_obtained = models.BooleanField(default=False)
    
    # NRB (Nepal Rastra Bank)
    nrb_approval_required = models.BooleanField(default=False)
    nrb_approval_obtained = models.BooleanField(default=False)
    
    # SEBON (Securities Board of Nepal)
    sebon_reporting_compliant = models.BooleanField(default=True)
    
    # Industry specific
    industry_specific_license_required = models.BooleanField(default=False)
    industry_specific_license_obtained = models.BooleanField(default=False)
    license_details = models.TextField(blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_regulatory_checklists'

    def __str__(self):
        return f"Compliance for {self.project.legal_name}"


class SEBONFilingDeadline(models.Model):
    """Tracks mandatory filing deadlines with SEBON for PE funds."""
    title = models.CharField(max_length=200)
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=[
        ('PENDING', 'Pending'),
        ('SUBMITTED', 'Submitted'),
        ('OVERDUE', 'Overdue')
    ], default='PENDING')
    
    submitted_at = models.DateTimeField(null=True, blank=True)
    submitted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    document = models.ForeignKey(FundDocument, on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pe_sebon_filing_deadlines'
        ordering = ['due_date']

    def __str__(self):
        return f"{self.title} - {self.due_date}"


class DealMemo(models.Model):
    """Investment memo draft generated by AI and edited by GP."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(PEProject, on_delete=models.CASCADE, related_name='memos')
    
    # Content stored as JSON for structured sections
    content = models.JSONField(default=dict, help_text="Sections: executive_summary, company_overview, market_analysis, competitive_position, financial_analysis, risk_assessment, investment_recommendation, deal_terms")
    
    status = models.CharField(max_length=20, choices=[
        ('DRAFT', 'Draft'),
        ('FINAL', 'Final')
    ], default='DRAFT')
    
    version = models.PositiveIntegerField(default=1)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_memos')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_deal_memos'
        ordering = ['-version', '-created_at']

    def __str__(self):
        return f"Memo v{self.version} for {self.project.legal_name}"


class PortfolioKPIReport(models.Model):
    """Monthly performance metrics submitted by portfolio companies."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(PEProject, on_delete=models.CASCADE, related_name='kpi_reports')
    
    reporting_period = models.DateField(help_text="Month of the report (usually first day of month)")
    
    # Financial KPIs
    revenue = models.DecimalField(max_digits=20, decimal_places=2)
    ebitda = models.DecimalField(max_digits=20, decimal_places=2)
    cash_burn = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    
    # Operational KPIs
    headcount = models.PositiveIntegerField(default=0)
    
    status = models.CharField(max_length=20, choices=[
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted'),
        ('REVIEWED', 'Reviewed')
    ], default='DRAFT')
    
    submitted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    
    gp_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_portfolio_kpi_reports'
        ordering = ['-reporting_period']
        unique_together = [('project', 'reporting_period')]

    def __str__(self):
        return f"KPI Report {self.reporting_period} - {self.project.legal_name}"







