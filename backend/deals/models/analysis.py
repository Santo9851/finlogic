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
    project = models.ForeignKey('PEProject', on_delete=models.SET_NULL, null=True, blank=True, related_name='ai_logs')
    document = models.ForeignKey('PEProjectDocument', on_delete=models.SET_NULL, null=True, blank=True, related_name='ai_logs')

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
    project = models.ForeignKey('PEProject', on_delete=models.CASCADE, related_name='financials')
    source_document = models.ForeignKey('PEProjectDocument', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Financial periods (BS = Bikram Sambat for Nepal context)
    fiscal_year_bs = models.CharField(max_length=10, help_text="e.g. 2080/81")
    
    # Core P&L / BS items (NPR)
    revenue_npr = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    ebitda_npr = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    net_profit_npr = models.DecimalField(max_digits=15, decimal_places=2, default=0, help_text="Profit After Tax")
    total_assets_npr = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_debt_npr = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Deprecated fields (keep for migration compatibility)
    revenue = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    ebitda = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    pat = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
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
    verified_fields = models.JSONField(default=dict, blank=True)
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
    project = models.ForeignKey('PEProject', on_delete=models.CASCADE, related_name='qoe_reports')
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
    project = models.ForeignKey('PEProject', on_delete=models.CASCADE, related_name='commercial_analyses')
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
    project = models.ForeignKey('PEProject', on_delete=models.CASCADE, related_name='operational_analyses')
    technology_stack = models.JSONField(default=dict, blank=True)
    key_person_risk_score = models.IntegerField(default=0, help_text="1 to 10 scale")
    supply_chain_risks = models.JSONField(default=list, blank=True)
    operational_red_flags = models.JSONField(default=list, blank=True)
    thesis_markdown = models.TextField(null=True, blank=True)
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
    project = models.ForeignKey('PEProject', on_delete=models.CASCADE, related_name='red_flags')
    document = models.ForeignKey('PEProjectDocument', on_delete=models.CASCADE, related_name='red_flag_findings')
    pattern = models.ForeignKey('RedFlagPattern', on_delete=models.SET_NULL, null=True, blank=True)
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
    project = models.ForeignKey('PEProject', on_delete=models.CASCADE, related_name='scoring_runs')
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
    scoring_run = models.ForeignKey('ScoringRun', on_delete=models.CASCADE, related_name='criteria_scores')
    
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
    scoring_run = models.ForeignKey('ScoringRun', on_delete=models.CASCADE, related_name='compliance_gates')
    
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
    documents = models.ManyToManyField('PEProjectDocument', blank=True, related_name='compliance_gates')

    class Meta:
        db_table = 'pe_compliance_gates'
        unique_together = ('scoring_run', 'gate_id')

    def __str__(self):
        return f"{self.gate_id}: {self.status}"



class ValuationModel(models.Model):
    """Container for DCF and LBO financial models."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey('PEProject', on_delete=models.CASCADE, related_name='valuations')
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
    valuation = models.OneToOneField('ValuationModel', on_delete=models.CASCADE, related_name='dcf_detail')
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
    valuation = models.OneToOneField('ValuationModel', on_delete=models.CASCADE, related_name='lbo_detail')
    entry_ebitda = models.DecimalField(max_digits=20, decimal_places=2)
    purchase_multiple = models.FloatField()
    debt_financing = models.JSONField(help_text="List of debt tranches with rates/tenures")
    exit_year = models.IntegerField(default=5)
    exit_multiple = models.FloatField()

    class Meta:
        db_table = 'pe_valuation_lbo_assumptions'



class WaterfallModel(models.Model):
    """Configuration for a fund waterfall calculation."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    fund = models.ForeignKey('Fund', on_delete=models.CASCADE, related_name='waterfall_models')
    name = models.CharField(max_length=200)
    assumptions = models.JSONField(
        default=dict,
        help_text="hurdle_rate, carry_pct, catchup_pct, etc."
    )
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'pe_waterfall_models'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.name} - {self.fund.name}"



class WaterfallRun(models.Model):
    """A specific execution of a waterfall calculation on an exit."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    waterfall_model = models.ForeignKey('WaterfallModel', on_delete=models.CASCADE, related_name='runs', null=True, blank=True)
    investment = models.ForeignKey('PEInvestment', on_delete=models.CASCADE, related_name='waterfall_runs')
    exit_proceeds = models.DecimalField(max_digits=20, decimal_places=2)
    exit_date = models.DateField(null=True, blank=True)
    years_held = models.FloatField(null=True, blank=True)
    outputs = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'pe_waterfall_runs'
        ordering = ['-created_at']

    def __str__(self):
        return f"Waterfall Run on {self.investment} - NPR {self.exit_proceeds}"


# ---------------------------------------------------------------------------
# 11. ValuationRecord
# ---------------------------------------------------------------------------


class ValuationRecord(models.Model):
    """Tracking periodic fair value adjustments for an investment."""

    class Methodology(models.TextChoices):
        DCF = 'DCF', 'Discounted Cash Flow'
        MARKET = 'MARKET', 'Market Comparables'
        COST = 'COST', 'Cost / Book Value'
        RECENT_TRANSACTION = 'RECENT_TRANSACTION', 'Recent Transaction'
        OTHER = 'OTHER', 'Other'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    investment = models.ForeignKey('PEInvestment', on_delete=models.CASCADE, related_name='valuations'
    )
    valuation_date = models.DateField()
    fair_value_npr = models.DecimalField(max_digits=20, decimal_places=2)
    methodology = models.CharField(
        max_length=20, choices=Methodology.choices, default=Methodology.MARKET
    )
    discount_rate_pct = models.FloatField(null=True, blank=True)
    exit_multiple_used = models.FloatField(null=True, blank=True)
    assumptions = models.JSONField(default=dict, blank=True)
    previous_valuation_npr = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True
    )
    valuer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='valuations'
    )
    is_audited = models.BooleanField(default=False)
    auditor_name = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pe_valuation_records'
        ordering = ['-valuation_date']
        unique_together = [('investment', 'valuation_date')]

    def __str__(self):
        return f"{self.investment.project.legal_name} - {self.valuation_date} (NPR {self.fair_value_npr:,})"

    @property
    def valuation_change_pct(self):
        if self.previous_valuation_npr and self.previous_valuation_npr > 0:
            return (float(self.fair_value_npr - self.previous_valuation_npr) / float(self.previous_valuation_npr)) * 100
        return None

    @property
    def moic_implied(self):
        if self.investment.investment_amount_npr > 0:
            return float(self.fair_value_npr) / float(self.investment.investment_amount_npr)
        return None


# ---------------------------------------------------------------------------
# 12. ExitScenario
# ---------------------------------------------------------------------------


class ExitScenario(models.Model):
    """Potential exit strategies and outcomes for an investment."""

    class ExitType(models.TextChoices):
        TRADE_SALE = 'TRADE_SALE', 'Trade Sale / Strategic Acquisition'
        IPO = 'IPO', 'Initial Public Offering (NEPSE)'
        SECONDARY = 'SECONDARY', 'Secondary Sale to Financial Sponsor'
        WRITE_OFF = 'WRITE_OFF', 'Write-Off / Liquidation'
        DIVIDEND_RECAP = 'DIVIDEND_RECAP', 'Dividend Recapitalisation'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    investment = models.ForeignKey('PEInvestment', on_delete=models.CASCADE, related_name='exit_scenarios'
    )
    name = models.CharField(max_length=200)
    exit_type = models.CharField(max_length=20, choices=ExitType.choices)
    target_year = models.IntegerField()  # BS year
    target_date = models.DateField(null=True, blank=True)
    expected_exit_value_npr = models.DecimalField(max_digits=20, decimal_places=2)
    exit_multiple = models.FloatField()
    expected_irr_pct = models.FloatField(null=True, blank=True)
    probability_pct = models.FloatField(default=50.0)
    is_base_case = models.BooleanField(default=False)
    is_approved_by_ic = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='exit_scenarios'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # IPO-specific fields
    ipo_paid_up_capital_npr = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    ipo_years_profitable = models.IntegerField(null=True, blank=True)
    ipo_net_worth_per_share_npr = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    ipo_face_value_per_share_npr = models.DecimalField(max_digits=10, decimal_places=2, default=100)
    ipo_credit_rating = models.CharField(max_length=20, null=True, blank=True)
    ipo_is_eligible = models.BooleanField(null=True, blank=True)
    ipo_eligibility_notes = models.TextField(blank=True)

    class Meta:
        db_table = 'pe_exit_scenarios'
        ordering = ['target_year', '-expected_exit_value_npr']
        constraints = [
            models.UniqueConstraint(
                fields=['investment'],
                condition=Q(is_base_case=True),
                name='unique_base_case_per_investment'
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.get_exit_type_display()}) - {self.target_year}"







# ---------------------------------------------------------------------------
# 13. TermSheet
# ---------------------------------------------------------------------------

