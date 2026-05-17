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

class RegulatoryChecklist(models.Model):
    """Nepal-specific compliance checklist for PE deals."""
    project = models.OneToOneField('PEProject', on_delete=models.CASCADE, related_name='regulatory_checklist')
    
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
    last_reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_checklists'
    )
    last_reviewed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_regulatory_checklists'

    def __str__(self):
        return f"Compliance for {self.project.legal_name}"




class FilingTypeConfig(models.Model):
    """Configuration for statutory filing requirements."""
    name = models.CharField(max_length=100)
    filing_type = models.CharField(max_length=50, unique=True)
    regulatory_basis = models.CharField(max_length=255)
    default_days_offset = models.IntegerField(help_text="Days after period_end_date that filing is due")
    penalty_description = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.name} ({self.filing_type})"

    class Meta:
        db_table = 'pe_filing_type_config'



class SEBONFilingDeadline(models.Model):
    """Tracks mandatory filing deadlines with SEBON for PE funds."""
    
    class FilingType(models.TextChoices):
        ANNUAL_REPORT = 'ANNUAL_REPORT', 'Annual Report'
        QUARTERLY_REPORT = 'QUARTERLY_REPORT', 'Quarterly Report'
        AGM_REPORT = 'AGM_REPORT', 'AGM Report'
        MATERIAL_EVENT = 'MATERIAL_EVENT', 'Material Event'
        AML_STR = 'AML_STR', 'AML STR'
        TAX_FILING = 'TAX_FILING', 'Tax Filing'
        FUND_AMENDMENT = 'FUND_AMENDMENT', 'Fund Amendment'
        OTHER = 'OTHER', 'Other'

    title = models.CharField(max_length=200)
    filing_type = models.CharField(
        max_length=50, 
        choices=FilingType.choices, 
        default=FilingType.OTHER
    )
    fund = models.ForeignKey(
        'Fund', on_delete=models.CASCADE, related_name='filing_deadlines', null=True, blank=True
    )
    due_date = models.DateField()
    regulatory_basis = models.CharField(max_length=255, blank=True)
    reminder_days_before = models.JSONField(
        default=list, help_text="List of days before deadline to send alerts (e.g. [30, 14, 7, 1])"
    )
    penalty_note = models.TextField(blank=True)
    
    status = models.CharField(max_length=20, choices=[
        ('PENDING', 'Pending'),
        ('SUBMITTED', 'Submitted'),
        ('OVERDUE', 'Overdue')
    ], default='PENDING')
    
    submitted_at = models.DateTimeField(null=True, blank=True)
    submitted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    document = models.ForeignKey('FundDocument', on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pe_sebon_filing_deadlines'
        ordering = ['due_date']

    def __str__(self):
        return f"{self.title} - {self.due_date}"



class ConflictOfInterest(models.Model):
    """Register of personal and professional conflicts of interest."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    declarant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='coi_declarations')
    declaration_date = models.DateField(default=timezone.now)
    declaration_period = models.CharField(max_length=100, help_text='e.g. FY 2081/82')
    nature_of_conflict = models.TextField()
    mitigation_measures = models.TextField()
    is_submitted = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_conflicts_of_interest'
        ordering = ['-declaration_date']

    def __str__(self):
        return f"COI: {self.declarant.email} - {self.declaration_period}"



class PortfolioKPIReport(models.Model):
    """Monthly performance metrics submitted by portfolio companies."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey('PEProject', on_delete=models.CASCADE, related_name='kpi_reports')
    
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


# ---------------------------------------------------------------------------
# Waterfall
# ---------------------------------------------------------------------------

