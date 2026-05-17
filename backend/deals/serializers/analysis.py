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

from .fund import UserMiniSerializer


class ExtractedFinancialsSerializer(serializers.ModelSerializer):
    verified_by_detail = UserMiniSerializer(source='verified_by', read_only=True)
    
    class Meta:
        model = ExtractedFinancials
        fields = '__all__'
        read_only_fields = ('id', 'project', 'created_at', 'updated_at', 'verified_by', 'verified_at')


class QoEReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = QoEReport
        fields = '__all__'
        read_only_fields = ('id', 'created_at')


class CommercialAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommercialAnalysis
        fields = '__all__'
        read_only_fields = ('id', 'created_at')


class OperationalAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = OperationalAnalysis
        fields = '__all__'
        read_only_fields = ('id', 'created_at')


class RedFlagPatternSerializer(serializers.ModelSerializer):
    class Meta:
        model = RedFlagPattern
        fields = '__all__'


class RedFlagFindingSerializer(serializers.ModelSerializer):
    pattern_detail = RedFlagPatternSerializer(source='pattern', read_only=True)
    document_name = serializers.CharField(source='document.filename', read_only=True)
    reviewed_by_detail = UserMiniSerializer(source='reviewed_by', read_only=True)
    
    class Meta:
        model = RedFlagFinding
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'reviewed_by', 'reviewed_at')


class ComplianceGateSerializer(serializers.ModelSerializer):
    cleared_by_detail = UserMiniSerializer(source='cleared_by', read_only=True)
    class Meta:
        model = ComplianceGate
        fields = '__all__'


class CriterionScoreSerializer(serializers.ModelSerializer):
    overridden_by_detail = UserMiniSerializer(source='overridden_by', read_only=True)
    class Meta:
        model = CriterionScore
        fields = '__all__'


class ScoringRunSerializer(serializers.ModelSerializer):
    criteria_scores = CriterionScoreSerializer(many=True, read_only=True)
    compliance_gates = ComplianceGateSerializer(many=True, read_only=True)
    triggered_by_detail = UserMiniSerializer(source='triggered_by', read_only=True)
    
    class Meta:
        model = ScoringRun
        fields = '__all__'


class DCFAssumptionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DCFAssumptions
        fields = '__all__'


class LBOAssumptionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = LBOAssumptions
        fields = '__all__'


class ValuationModelSerializer(serializers.ModelSerializer):
    dcf_detail = DCFAssumptionsSerializer(read_only=True)
    lbo_detail = LBOAssumptionsSerializer(read_only=True)
    created_by_detail = UserMiniSerializer(source='created_by', read_only=True)
    
    class Meta:
        model = ValuationModel
        fields = '__all__'


class WaterfallModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = WaterfallModel
        fields = '__all__'


class WaterfallRunSerializer(serializers.ModelSerializer):
    investment_name = serializers.CharField(source='investment.project.legal_name', read_only=True)
    fund_name = serializers.CharField(source='investment.fund.name', read_only=True)
    
    class Meta:
        model = WaterfallRun
        fields = '__all__'


# ---------------------------------------------------------------------------
# 11. Valuation & Exit Planning Serializers
# ---------------------------------------------------------------------------


class ValuationRecordSerializer(serializers.ModelSerializer):
    valuer_name = serializers.ReadOnlyField(source='valuer.get_full_name')
    valuation_change_pct = serializers.ReadOnlyField()
    moic_implied = serializers.ReadOnlyField()
    methodology_display = serializers.CharField(source='get_methodology_display', read_only=True)
    investment_name = serializers.CharField(source='investment.project.legal_name', read_only=True)
    project_id = serializers.CharField(source='investment.project.id', read_only=True)
    fair_value = serializers.DecimalField(source='fair_value_npr', max_digits=20, decimal_places=2, read_only=True)

    class Meta:
        model = ValuationRecord
        fields = (
            'id', 'investment', 'investment_name', 'project_id', 'valuation_date', 
            'fair_value', 'fair_value_npr',
            'methodology', 'methodology_display', 'discount_rate_pct',
            'exit_multiple_used', 'assumptions', 'previous_valuation_npr',
            'valuer', 'valuer_name', 'is_audited', 'auditor_name', 'notes',
            'valuation_change_pct', 'moic_implied', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'valuer', 'previous_valuation_npr', 'created_at', 'updated_at')



class ExitScenarioSerializer(serializers.ModelSerializer):
    created_by_name = serializers.ReadOnlyField(source='created_by.get_full_name')
    exit_type_display = serializers.CharField(source='get_exit_type_display', read_only=True)
    investment_name = serializers.CharField(source='investment.project.legal_name', read_only=True)
    project_id = serializers.CharField(source='investment.project.id', read_only=True)

    class Meta:
        model = ExitScenario
        fields = (
            'id', 'investment', 'investment_name', 'project_id', 'scenario_name', 
            'exit_type', 'exit_type_display', 'target_exit_date', 
            'estimated_exit_value_npr', 'estimated_exit_multiple',
            'is_approved_by_ic', 'ic_approval_date', 'notes',
            'ipo_is_eligible', 'ipo_eligibility_notes',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_by', 'ic_approval_date', 'created_at', 'updated_at', 'ipo_is_eligible', 'ipo_eligibility_notes')

    def validate_probability_pct(self, value):
        if not (0 <= value <= 100):
            raise serializers.ValidationError("Probability must be between 0 and 100.")
        return value



class IPOEligibilitySerializer(serializers.Serializer):
    is_eligible = serializers.BooleanField()
    criteria = serializers.ListField(child=serializers.DictField())
    overall_requirements = serializers.CharField()
    missing_requirements = serializers.ListField(child=serializers.CharField())
    regulatory_basis = serializers.CharField()






# ---------------------------------------------------------------------------
# Term Sheet & SPA Draft Serializers
# ---------------------------------------------------------------------------

