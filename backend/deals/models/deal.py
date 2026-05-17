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
        PENDING_SUBMISSION = 'PENDING_SUBMISSION', 'Pending Submission'
        SUBMITTED = 'SUBMITTED', 'Submitted'
        SCREENING = 'SCREENING', 'Screening'
        IC_REVIEW = 'IC_REVIEW', 'IC Review'
        TERM_SHEET = 'TERM_SHEET', 'Term Sheet'
        LOI_ISSUED = 'LOI_ISSUED', 'LOI Issued'
        CONTRACT_SIGNED = 'CONTRACT_SIGNED', 'Contract Signed'
        CAPITAL_CALLED = 'CAPITAL_CALLED', 'Capital Called'
        CLOSED = 'CLOSED', 'Closed'
        DECLINED = 'DECLINED', 'Declined'

    class SubmissionType(models.TextChoices):
        MANUAL_GP = 'MANUAL_GP', 'Manual (GP Created)'
        ENTREPRENEUR_INVITED = 'ENTREPRENEUR_INVITED', 'Entrepreneur Invited'

    # Primary key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Fund association
    fund = models.ForeignKey('Fund', on_delete=models.PROTECT, related_name='pe_projects'
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
        max_length=30, choices=Status.choices, default=Status.PENDING_SUBMISSION
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
    collaborators = models.ManyToManyField(
        User,
        related_name='collaborating_pe_projects',
        blank=True,
        help_text="Other GP users who are authorized to work on this deal.",
    )
    
    # Roadmap improvements
    analysis_progress = models.JSONField(default=dict, blank=True)
    
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
    def business_description(self) -> str:
        """ Fetches business description from form responses (step 2). """
        try:
            resp = self.form_responses.filter(step_name='deal_overview').first()
            if resp and 'business_description' in resp.response_data:
                return resp.response_data['business_description']
        except:
            pass
        return "N/A"

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
        FINANCIALS = 'FINANCIALS', 'Financial Statements'
        LEGAL = 'LEGAL', 'Legal Documents'
        COMMERCIAL = 'COMMERCIAL', 'Commercial'
        INCORPORATION = 'INCORPORATION', 'Incorporation'
        TAX_CLEARANCE = 'TAX_CLEARANCE', 'Tax Clearance'
        KYC = 'KYC', 'KYC Documents'
        PITCH_DECK = 'PITCH_DECK', 'Pitch Deck'
        BUSINESS_PLAN = 'BUSINESS_PLAN', 'Business Plan'
        CONTRACTS = 'CONTRACTS', 'Legal Contracts'
        LOAN_DOCS = 'LOAN_DOCS', 'Loan & Offer Letters'
        LOI = 'LOI', 'Letter of Intent'
        LOI_SIGNED = 'LOI_SIGNED', 'Signed LOI'
        IC_SIGNED = 'IC_SIGNED', 'Signed IC Memo'
        SIGNED_CONTRACT = 'SIGNED_CONTRACT', 'Signed Contract'
        OPERATIONAL_AUDIT = 'OPERATIONAL_AUDIT', 'Operational Audit'
        TECH_STACK = 'TECH_STACK', 'Technology Stack Info'
        ORG_CHART = 'ORG_CHART', 'Organization Chart'
        COMPLIANCE = 'COMPLIANCE', 'Compliance Evidence'
        SPA_DRAFT = 'SPA_DRAFT', 'SPA Draft'
        OTHER = 'OTHER', 'Other'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey('PEProject', on_delete=models.CASCADE, related_name='documents'
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
    local_file = models.FileField(
        upload_to='pe_projects/documents/%Y/%m/%d/',
        null=True,
        blank=True,
        help_text="Stored locally before being moved to B2"
    )
    is_confirmed = models.BooleanField(
        default=False,
        help_text="True if confirmed on B2 or local storage",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    @property
    def url(self):
        """Returns the local URL or B2 presigned URL."""
        if self.local_file:
            return self.local_file.url
        from deals.b2_utils import generate_presigned_download_url
        return generate_presigned_download_url(self.file_key, self.filename)

    class Meta:
        db_table = 'pe_project_documents'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f'{self.filename} ({self.get_category_display()}) – {self.project.legal_name}'


# ---------------------------------------------------------------------------
# 4. LPProfile
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
    project = models.ForeignKey('PEProject',
        on_delete=models.CASCADE,
        related_name='form_responses',
    )
    template = models.ForeignKey('PEFormTemplate',
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
        CAPITAL_ACCOUNT = 'CAPITAL_ACCOUNT', 'Capital Account Statement'
        OTHER = 'OTHER', 'Other Fund Document'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    fund = models.ForeignKey('Fund', on_delete=models.CASCADE, related_name='documents')
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
    document = models.ForeignKey('FundDocument', on_delete=models.CASCADE, related_name='access_logs')
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


class DealMemo(models.Model):
    """Investment memo draft generated by AI and edited by GP."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey('PEProject', on_delete=models.CASCADE, related_name='memos')
    
    # Content stored as JSON for structured sections
    content = models.JSONField(default=dict, help_text="Sections: executive_summary, company_overview, market_analysis, competitive_position, financial_analysis, risk_assessment, investment_recommendation, deal_terms")
    
    status = models.CharField(max_length=20, choices=[
        ('DRAFT', 'Draft'),
        ('FINAL', 'Final'),
        ('IC_SIGNED', 'IC Signed')
    ], default='DRAFT')
    
    version = models.PositiveIntegerField(default=1)
    
    ic_notes = models.TextField(blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_memos')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_deal_memos'
        ordering = ['-version', '-created_at']

    def __str__(self):
        return f"Memo v{self.version} for {self.project.legal_name}"



class TermSheet(models.Model):
    """AI-generated term sheet with GP override capability."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey('PEProject', on_delete=models.CASCADE, related_name='term_sheets')
    
    # Key financial terms (AI-generated, GP-overridable)
    terms = models.JSONField(
        default=dict,
        help_text="investment_amount_npr, pre_money_valuation_npr, ownership_pct, "
                  "board_seats, observer_rights, exclusivity_days, vesting_schedule, "
                  "exit_strategy_summary"
    )
    
    # Track what AI originally generated vs GP overrides
    ai_generated_terms = models.JSONField(default=dict, blank=True)
    
    version = models.PositiveIntegerField(default=1)
    
    status = models.CharField(max_length=20, choices=[
        ('DRAFT', 'Draft'),
        ('NEGOTIATING', 'Under Negotiation'),
        ('AGREED', 'Terms Agreed'),
    ], default='DRAFT')
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_term_sheets'
        ordering = ['-version', '-created_at']

    def __str__(self):
        return f"Term Sheet v{self.version} for {self.project.legal_name}"


# ---------------------------------------------------------------------------
# 14. SPADraft
# ---------------------------------------------------------------------------


class SPADraft(models.Model):
    """AI-generated Share Purchase Agreement draft with GP override capability."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey('PEProject', on_delete=models.CASCADE, related_name='spa_drafts')
    
    # SPA sections stored as structured JSON
    sections = models.JSONField(
        default=dict,
        help_text="recitals, definitions, purchase_price, representations, "
                  "conditions_precedent, covenants, indemnification, governing_law"
    )
    
    # Track AI original vs GP overrides
    ai_generated_sections = models.JSONField(default=dict, blank=True)
    
    version = models.PositiveIntegerField(default=1)
    
    status = models.CharField(max_length=20, choices=[
        ('DRAFT', 'Draft'),
        ('REVIEW', 'Under Legal Review'),
        ('FINAL', 'Final'),
    ], default='DRAFT')
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_spa_drafts'
        ordering = ['-version', '-created_at']

    def __str__(self):
        return f"SPA Draft v{self.version} for {self.project.legal_name}"
# ---------------------------------------------------------------------------
# 15. LPSupportRequest
# ---------------------------------------------------------------------------

