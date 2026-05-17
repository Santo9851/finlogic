"""
deals/serializers.py
DRF serializers for all PE Deals models.
"""
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import serializers

from deals.models import (
    Fund,
    PEProject,
    PEProjectDocument,
    LPProfile,
    LPKYCDocument,
    EntrepreneurKYBDocument,
    GovernanceProposal,
    ProposalVote,
    IRDocument,
    GPInvestorMeeting,
    GPInvestorMeetingRequest,
    GPShareholder,
    LPFundCommitment,
    validate_ocr_number,
    PEInvestment,
    CapitalCall,
    Distribution,
    PEFormTemplate,
    PEProjectFormResponse,
    ImmutableAuditEvent,
    FundDocument,
    LPDocumentAccess,
    ExtractedFinancials,
    QoEReport,
    CommercialAnalysis,
    OperationalAnalysis,
    RedFlagPattern,
    RedFlagFinding,
    ScoringRun,
    CriterionScore,
    ComplianceGate,
    ValuationModel,
    DCFAssumptions,
    LBOAssumptions,
    RegulatoryChecklist,
    SEBONFilingDeadline,
    DealMemo,
    PortfolioKPIReport,
    WaterfallModel,
    WaterfallRun,
    ValuationRecord,
    ExitScenario,
    FilingTypeConfig,
    ConflictOfInterest,
    TermSheet,
    SPADraft,
    LPSupportRequest,
    ManagementFeeAccrual,
)








User = get_user_model()


# ---------------------------------------------------------------------------
# Minimal User serializer (read-only)
# ---------------------------------------------------------------------------


class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'roles')
        read_only_fields = fields


# ---------------------------------------------------------------------------
# Component Serializers (Required for nested relations)
# ---------------------------------------------------------------------------


class ImmutableAuditEventSerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(source='actor.email', read_only=True)
    event_type_display = serializers.CharField(
        source='get_event_type_display', read_only=True
    )

    class Meta:
        model = ImmutableAuditEvent
        fields = (
            'id', 'event_type', 'event_type_display', 'actor', 'actor_email',
            'object_id', 'object_repr', 'content_type_label',
            'payload', 'ip_address', 'created_at',
        )
        read_only_fields = fields


# ---------------------------------------------------------------------------
# Fund
# ---------------------------------------------------------------------------


class FundSerializer(serializers.ModelSerializer):
    uncalled_capital_npr = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True
    )
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    management_fee_basis_display = serializers.CharField(source='get_management_fee_basis_display', read_only=True)
    performance = serializers.SerializerMethodField()

    def get_performance(self, obj):
        from deals.views import _calculate_fund_performance_metrics
        return _calculate_fund_performance_metrics(obj)

    class Meta:
        model = Fund
        fields = (
            'id', 'name', 'legal_name', 'vintage_year',
            'target_size_npr', 'committed_capital_npr', 'uncalled_capital_npr',
            'status', 'status_display',
            'preferred_return_pct', 'management_fee_pct', 'management_fee_basis',
            'management_fee_basis_display', 'management_fee_frequency_months',
            'investment_period_end_date', 'post_investment_management_fee_pct',
            'post_investment_management_fee_basis', 'carry_pct',
            'performance',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


# ---------------------------------------------------------------------------
# PEProject
# ---------------------------------------------------------------------------


class LPProfileSerializer(serializers.ModelSerializer):
    user_detail = UserMiniSerializer(source='user', read_only=True)

    class Meta:
        model = LPProfile
        fields = (
            'id', 'user', 'user_detail',
            'full_name', 'organization', 'country', 'accredited_status',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
        extra_kwargs = {'user': {'write_only': True}}



class LPKYCDocumentSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = LPKYCDocument
        fields = (
            'id', 'lp_profile', 'file', 'document_type', 'status',
            'status_display', 'rejection_reason', 'uploaded_at', 'updated_at'
        )
        read_only_fields = ('id', 'status', 'rejection_reason', 'uploaded_at', 'updated_at', 'lp_profile')



class EntrepreneurKYBDocumentSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = EntrepreneurKYBDocument
        fields = (
            'id', 'user', 'file', 'document_type', 'status',
            'status_display', 'rejection_reason', 'uploaded_at', 'updated_at'
        )
        read_only_fields = ('id', 'status', 'rejection_reason', 'uploaded_at', 'updated_at', 'user')


# ---------------------------------------------------------------------------
# GP Governance & IR
# ---------------------------------------------------------------------------


class LPFundCommitmentSerializer(serializers.ModelSerializer):
    lp_profile_detail = LPProfileSerializer(source='lp_profile', read_only=True)
    fund_detail = FundSerializer(source='fund', read_only=True)
    uncalled_amount_npr = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True
    )
    management_fee_override_basis_display = serializers.CharField(source='get_management_fee_override_basis_display', read_only=True)

    class Meta:
        model = LPFundCommitment
        fields = (
            'id', 'lp_profile', 'lp_profile_detail',
            'fund', 'fund_detail',
            'committed_amount_npr', 'called_amount_npr', 'uncalled_amount_npr',
            'commitment_date',
            'management_fee_override_pct', 'management_fee_override_basis',
            'management_fee_override_basis_display', 'fee_start_date_override',
            'fee_end_date_override',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
        extra_kwargs = {
            'lp_profile': {'write_only': True},
            'fund': {'write_only': True},
        }


# ---------------------------------------------------------------------------
# PEInvestment
# ---------------------------------------------------------------------------


class PEInvestmentSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.legal_name', read_only=True)
    fund_name = serializers.CharField(source='fund.name', read_only=True)
    moic = serializers.FloatField(read_only=True)
    exit_type_display = serializers.CharField(
        source='get_exit_type_display', read_only=True
    )

    class Meta:
        model = PEInvestment
        fields = (
            'id', 'project', 'project_name', 'fund', 'fund_name',
            'investment_date', 'investment_amount_npr', 'ownership_pct',
            'valuation_at_entry_npr',
            'exit_date', 'exit_value_npr', 'exit_type', 'exit_type_display', 'moic',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'moic', 'created_at', 'updated_at')
        extra_kwargs = {
            'project': {'write_only': True},
            'fund': {'write_only': True},
        }


# ---------------------------------------------------------------------------
# CapitalCall
# ---------------------------------------------------------------------------


class CapitalCallSerializer(serializers.ModelSerializer):
    linked_accrual_ids = serializers.PrimaryKeyRelatedField(
        source='linked_accruals', many=True, read_only=True
    )
    fund_name = serializers.CharField(source='fund.name', read_only=True)
    project_name = serializers.CharField(source='project.legal_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    call_type_display = serializers.CharField(source='get_call_type_display', read_only=True)
    lp_commitment_name = serializers.CharField(source='lp_commitment.lp_profile.full_name', read_only=True)
    lp_profile_detail = serializers.SerializerMethodField()

    class Meta:
        model = CapitalCall
        fields = (
            'id', 'fund', 'fund_name', 'project', 'project_name', 'lp_commitment',
            'lp_commitment_name', 'lp_profile_detail',
            'call_date', 'due_date', 'amount_npr', 
            'status', 'status_display',
            'call_type', 'call_type_display',
            'notice_sent_at', 'received_at', 'payment_proof', 'notes',
            'linked_accrual_ids', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_lp_profile_detail(self, obj):
        if obj.lp_commitment and obj.lp_commitment.lp_profile:
             profile = obj.lp_commitment.lp_profile
             return {
                 'id': str(profile.id),
                 'full_name': profile.full_name,
                 'organization': profile.organization
             }
        return None


# ---------------------------------------------------------------------------
# Distribution
# ---------------------------------------------------------------------------


class DistributionSerializer(serializers.ModelSerializer):
    fund_name = serializers.CharField(source='fund.name', read_only=True)
    distribution_type_display = serializers.CharField(
        source='get_distribution_type_display', read_only=True
    )

    class Meta:
        model = Distribution
        fields = (
            'id', 'fund', 'fund_name', 'lp_commitment',
            'distribution_date', 'amount_npr',
            'distribution_type', 'distribution_type_display',
            'notes', 'created_at',
        )
        read_only_fields = ('id', 'created_at')


# ---------------------------------------------------------------------------
# PEFormTemplate
# ---------------------------------------------------------------------------


class LPDashboardFundSerializer(serializers.ModelSerializer):
    """Fund data enriched with the LP's commitment summary."""
    my_commitment = serializers.SerializerMethodField()
    approved_deals_count = serializers.SerializerMethodField()
    total_documents_count = serializers.SerializerMethodField()
    pending_action_count = serializers.SerializerMethodField()

    class Meta:
        model = Fund
        fields = (
            'id', 'name', 'vintage_year', 'status',
            'target_size_npr', 'committed_capital_npr',
            'preferred_return_pct', 'management_fee_pct', 'carry_pct',
            'my_commitment', 'approved_deals_count',
            'total_documents_count', 'pending_action_count',
        )

    def get_my_commitment(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        try:
            lp = request.user.lp_profile
            commitment = lp.fund_commitments.get(fund=obj)
            return LPFundCommitmentSerializer(commitment).data
        except Exception:
            return None

    def get_approved_deals_count(self, obj):
        return obj.pe_projects.filter(
            status__in=[PEProject.Status.LOI_ISSUED, PEProject.Status.CONTRACT_SIGNED, PEProject.Status.CAPITAL_CALLED, PEProject.Status.CLOSED]
        ).count()

    def get_total_documents_count(self, obj):
        return obj.documents.filter(is_published=True).count()

    def get_pending_action_count(self, obj):
        request = self.context.get('request')
        if not request or not hasattr(request.user, 'lp_profile'):
            return 0
        
        # Docs that require ack but aren't in LPDocumentAccess with acknowledged_at
        lp_profile = request.user.lp_profile
        docs_requiring_ack = obj.documents.filter(is_published=True, requires_acknowledgment=True)
        
        acknowledged_ids = LPDocumentAccess.objects.filter(
            lp_profile=lp_profile,
            document__in=docs_requiring_ack,
            acknowledged_at__isnull=False
        ).values_list('document_id', flat=True)
        
        return docs_requiring_ack.exclude(id__in=acknowledged_ids).count()


class ManagementFeeAccrualSerializer(serializers.ModelSerializer):
    class Meta:
        model = ManagementFeeAccrual
        fields = '__all__'


# ---------------------------------------------------------------------------
# GP Investor Dashboard
# ---------------------------------------------------------------------------


class GPInvestorDashboardSerializer(serializers.Serializer):
    """Read-only summary for GP Investor portal."""
    total_committed_npr = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_called_npr = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_distributed_npr = serializers.DecimalField(max_digits=15, decimal_places=2)
    investments = PEInvestmentSerializer(many=True, read_only=True)
    funds = FundSerializer(many=True, read_only=True)


# ---------------------------------------------------------------------------
# Fund Document Management
# ---------------------------------------------------------------------------


class LPPortfolioSerializer(serializers.ModelSerializer):
    """Anonymized project data for LP portfolio view."""
    anonymized_name = serializers.SerializerMethodField()
    sector_display = serializers.CharField(source='get_sector_display', read_only=True)
    
    class Meta:
        model = PEProject
        fields = (
            'id', 'anonymized_name', 'sector', 'sector_display',
            'status', 'investment_range_min_npr', 'investment_range_max_npr'
        )

    def get_anonymized_name(self, obj):
        # SEBON-compliant anonymization
        return f"{obj.get_sector_display()} Project {str(obj.id)[:4].upper()}"


# ---------------------------------------------------------------------------
# 14. AI Financials & QoE
# ---------------------------------------------------------------------------


class LPSupportRequestSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    lp_name = serializers.CharField(source='lp_profile.full_name', read_only=True)

    class Meta:
        model = LPSupportRequest
        fields = (
            'id', 'lp_profile', 'lp_name', 'subject', 'message',
            'status', 'status_display', 'admin_notes', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'lp_profile', 'status', 'admin_notes', 'created_at', 'updated_at')
