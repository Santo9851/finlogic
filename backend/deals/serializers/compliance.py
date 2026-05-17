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


class RegulatoryChecklistSerializer(serializers.ModelSerializer):
    last_reviewed_by_detail = UserMiniSerializer(source='last_reviewed_by', read_only=True)
    
    class Meta:
        model = RegulatoryChecklist
        fields = '__all__'



class FilingTypeConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = FilingTypeConfig
        fields = '__all__'



class SEBONFilingDeadlineSerializer(serializers.ModelSerializer):
    submitted_by_detail = UserMiniSerializer(source='submitted_by', read_only=True)
    rag_status = serializers.SerializerMethodField()
    fund_name = serializers.CharField(source='fund.name', read_only=True)
    
    class Meta:
        model = SEBONFilingDeadline
        fields = '__all__'

    def get_rag_status(self, obj):
        from django.utils import timezone
        import datetime
        
        if obj.status == 'SUBMITTED':
            return 'grey'
        
        if obj.status == 'OVERDUE':
            return 'red'
            
        # PENDING
        today = timezone.now().date()
        diff = (obj.due_date - today).days
        if diff <= 14:
            return 'amber'
        return 'green'



class ConflictOfInterestSerializer(serializers.ModelSerializer):
    declarant_detail = UserMiniSerializer(source='declarant', read_only=True)
    
    class Meta:
        model = ConflictOfInterest
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'submitted_at')


class PortfolioKPIReportSerializer(serializers.ModelSerializer):
    submitted_by_detail = UserMiniSerializer(source='submitted_by', read_only=True)
    project_legal_name = serializers.CharField(source='project.legal_name', read_only=True)
    
    class Meta:
        model = PortfolioKPIReport
        fields = '__all__'

