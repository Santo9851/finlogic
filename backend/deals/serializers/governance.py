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


class IRDocumentSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)

    class Meta:
        model = IRDocument
        fields = (
            'id', 'title', 'file', 'category', 'category_display',
            'is_published', 'uploaded_by', 'uploaded_by_name',
            'uploaded_at', 'updated_at'
        )
        read_only_fields = ('id', 'uploaded_by', 'uploaded_at', 'updated_at')



class ProposalVoteSerializer(serializers.ModelSerializer):
    shareholder_name = serializers.CharField(source='shareholder.user.get_full_name', read_only=True)

    class Meta:
        model = ProposalVote
        fields = ('id', 'proposal', 'shareholder', 'shareholder_name', 'choice', 'shares_at_voting', 'voted_at')
        read_only_fields = ('id', 'shares_at_voting', 'voted_at')



class GovernanceProposalSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    vote_stats = serializers.SerializerMethodField()

    class Meta:
        model = GovernanceProposal
        fields = (
            'id', 'title', 'description', 'status', 'status_display',
            'expiry_date', 'created_by', 'created_at', 'updated_at',
            'vote_stats'
        )
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')

    def get_vote_stats(self, obj):
        from django.db.models import Sum
        votes = obj.votes.all()
        total_shares = votes.aggregate(Sum('shares_at_voting'))['shares_at_voting__sum'] or 0
        
        choices = {}
        for c in ProposalVote.Choice.values:
            weight = votes.filter(choice=c).aggregate(Sum('shares_at_voting'))['shares_at_voting__sum'] or 0
            choices[c] = {
                'weight': float(weight),
                'percent': float((weight / total_shares * 100)) if total_shares > 0 else 0
            }
            
        return {
            'total_votes': votes.count(),
            'total_weight': float(total_shares),
            'choices': choices
        }


# ---------------------------------------------------------------------------
# LPFundCommitment
# ---------------------------------------------------------------------------


class GPInvestorMeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = GPInvestorMeeting
        fields = '__all__'



class GPInvestorMeetingRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = GPInvestorMeetingRequest
        fields = '__all__'
        read_only_fields = ('id', 'user', 'status', 'created_at', 'updated_at')


# ---------------------------------------------------------------------------
# 15. LPSupportRequest
# ---------------------------------------------------------------------------

