"""
deals/models/market_intel.py
Market Intelligence models – Sector Research Reports.

Provides an AI-driven report generation pipeline:
  GP uploads data  →  file parsed  →  AI generates report  →  GP reviews/edits  →  publish
"""
import uuid
from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class SectorChoices(models.TextChoices):
    """All 13 Finlogic Capital sectors for the Nepal PE market."""
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
    REAL_ESTATE = 'Real Estate', 'Real Estate'
    FINTECH = 'Fintech', 'Fintech'
    OTHER = 'Other', 'Other'


class SectorReport(models.Model):
    """
    AI-generated sector research report for a specific quarter.

    Lifecycle:
        1. GP uploads a data file (CSV / PDF / image) via the create endpoint.
        2. File is parsed and structured data stored in `extracted_data`.
        3. A Celery task calls the AI model to generate the full markdown report.
        4. GP reviews the DRAFT, edits content/summary, then sets status=PUBLISHED.
        5. Published reports are visible on the public Wisdom Hub.
    """

    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        PUBLISHED = 'PUBLISHED', 'Published'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    sector = models.CharField(
        max_length=50,
        choices=SectorChoices.choices,
        help_text="One of the 13 Finlogic sectors.",
    )
    report_date = models.DateField(
        help_text="First day of the quarter, e.g. 2026-01-01 for Q1 2026.",
    )
    title = models.CharField(
        max_length=255,
        blank=True,
        help_text="Auto-generated as '[Sector] Q[quarter] [year] Report'.",
    )
    content = models.TextField(
        blank=True,
        help_text="Full AI-generated markdown/HTML report body.",
    )
    summary = models.TextField(
        blank=True,
        help_text="Executive summary (3-line digest).",
    )
    source_file = models.FileField(
        upload_to='sector_reports/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(
            allowed_extensions=['csv', 'pdf', 'png', 'jpg', 'jpeg']
        )],
        help_text="Uploaded data file (CSV, PDF, or image).",
    )
    extracted_data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Structured data extracted from the uploaded file.",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )
    generated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sector_reports',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_sector_reports'
        ordering = ['-report_date', '-created_at']
        indexes = [
            models.Index(fields=['sector'], name='idx_sector_report_sector'),
            models.Index(fields=['status'], name='idx_sector_report_status'),
            models.Index(fields=['report_date'], name='idx_sector_report_date'),
        ]
        unique_together = [('sector', 'report_date')]

    def __str__(self):
        return self.title or f"{self.sector} Report ({self.report_date})"

    def save(self, *args, **kwargs):
        # Auto-generate title if blank
        if not self.title and self.report_date and self.sector:
            quarter = (self.report_date.month - 1) // 3 + 1
            year = self.report_date.year
            sector_label = dict(SectorChoices.choices).get(self.sector, self.sector)
            self.title = f"{sector_label} Q{quarter} {year} Report"
        super().save(*args, **kwargs)

    @property
    def quarter_label(self):
        """Returns e.g. 'Q1 2026'."""
        if self.report_date:
            q = (self.report_date.month - 1) // 3 + 1
            return f"Q{q} {self.report_date.year}"
        return ""


class ComparableCompany(models.Model):
    """
    NEPSE comparable company data for peer benchmarking.

    Populated via:
      1. File upload (CSV / PDF / image) → preview → confirm upsert
      2. Manual entry via the GP portal
      3. AI extraction from financial documents

    Upsert key: `ticker` (if present) or `name + sector` combination.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    name = models.CharField(
        max_length=255,
        help_text="Company name (e.g. 'Nabil Bank Limited').",
    )
    ticker = models.CharField(
        max_length=20,
        blank=True,
        help_text="NEPSE ticker symbol (e.g. 'NABIL').",
    )
    sector = models.CharField(
        max_length=50,
        choices=SectorChoices.choices,
        blank=True,
        help_text="NEPSE sector classification.",
    )
    exchange = models.CharField(
        max_length=20,
        default='NEPSE',
        help_text="Stock exchange (default: NEPSE).",
    )

    # Valuation multiples
    market_cap = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True,
        help_text="Market capitalisation in NPR.",
    )
    ev_ebitda = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Enterprise Value / EBITDA multiple.",
    )
    pe_ratio = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Price / Earnings ratio.",
    )
    pb_ratio = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Price / Book Value ratio.",
    )
    ev_revenue = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Enterprise Value / Revenue multiple.",
    )

    last_updated = models.DateField(
        auto_now=True,
        help_text="Date of last data update.",
    )
    is_verified = models.BooleanField(
        default=False,
        help_text="Whether this data has been verified by a GP.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_comparable_companies'
        ordering = ['sector', 'name']
        indexes = [
            models.Index(fields=['ticker'], name='idx_comp_ticker'),
            models.Index(fields=['sector'], name='idx_comp_sector'),
        ]

    def __str__(self):
        ticker_str = f" ({self.ticker})" if self.ticker else ""
        return f"{self.name}{ticker_str}"


class RegulatoryUpdate(models.Model):
    """
    Tracks regulatory circulars and notifications for GP and Public feed.
    """
    class SourceChoices(models.TextChoices):
        SEBON = 'SEBON', 'SEBON'
        NRB = 'NRB', 'NRB'
        IRD = 'IRD', 'IRD'
        OTHER = 'OTHER', 'Other'

    class StatusChoices(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        PUBLISHED = 'PUBLISHED', 'Published'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=500)
    source_name = models.CharField(max_length=50, choices=SourceChoices.choices)
    source_url = models.URLField(blank=True, null=True, help_text="Link to original announcement if available")
    published_date = models.DateField()
    
    original_file = models.FileField(
        upload_to='regulatory_updates/', 
        blank=True, 
        null=True,
        help_text="Uploaded PDF, DOCX, or Image"
    )
    raw_text = models.TextField(blank=True)
    summary = models.TextField(
        blank=True, 
        help_text="AI-generated 3-bullet summary"
    )
    status = models.CharField(
        max_length=20, 
        choices=StatusChoices.choices, 
        default=StatusChoices.DRAFT
    )
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="regulatory_updates"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_regulatory_updates'
        ordering = ['-published_date', '-created_at']

    def __str__(self):
        return f"[{self.source_name}] {self.title} ({self.published_date})"
