"""
deals/views.py
DRF API views for the PE Deals app.

URL namespace: api/deals/  (GP & public)
              api/entrepreneur/  (Entrepreneur portal)
              api/lp/            (LP portal)
              api/gp-investor/   (GP Investor portal)
"""
import logging
import mimetypes
from datetime import date, timedelta
from decimal import Decimal
from django.db import transaction

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import models
from django.http import FileResponse
from django.urls import reverse
from django.db.models import Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.mail import send_mail
from django.utils.decorators import method_decorator
from django.views.decorators.clickjacking import xframe_options_exempt
from rest_framework import generics, permissions, status, viewsets, parsers
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action

from deals.b2_utils import generate_presigned_upload_url, generate_presigned_download_url
from deals.models import (
    Fund,
    FundDocument,
    CapitalCall,
    Distribution,
    ImmutableAuditEvent,
    LPDocumentAccess,
    LPFundCommitment,
    LPProfile,
    LPKYCDocument,
    PEFormTemplate,
    PEInvestment,
    PEProject,
    PEProjectDocument,
    PEProjectFormResponse,
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
    EntrepreneurKYBDocument,
    GovernanceProposal,
    ProposalVote,
    ManagementFeeAccrual,
    IRDocument,
    GPShareholder,
    WaterfallModel,
    WaterfallRun,
    ValuationRecord,
    ExitScenario,
    ExtractedFinancials,
    QoEReport,
    TermSheet,
    SPADraft,
    LPSupportRequest,
)






from deals.permissions import (
    IsEntrepreneurRole,
    IsGPInvestorRole,
    IsGPStaff,
    IsLPRole,
    IsDealAccessible,
    IsSuperAdminRole,
)
from deals.signals import _log_audit_event
from deals.serializers import (
    DocumentUploadRequestSerializer,
    FundDocumentSerializer,
    FundSerializer,
    GPInviteSerializer,
    GPInvestorDashboardSerializer,
    ImmutableAuditEventSerializer,
    LPDashboardFundSerializer,
    LPFundCommitmentSerializer,
    LPPortfolioSerializer,
    LPProfileSerializer,
    LPKYCDocumentSerializer,
    PEFormTemplateSerializer,
    PEInvestmentSerializer,
    PEProjectDetailSerializer,
    PEProjectDocumentSerializer,
    PEProjectFormResponseSerializer,
    PEProjectListSerializer,
    PEProjectStatusUpdateSerializer,
    ExtractedFinancialsSerializer,
    QoEReportSerializer,
    CommercialAnalysisSerializer,
    OperationalAnalysisSerializer,
    RedFlagFindingSerializer,
    ScoringRunSerializer,
    CriterionScoreSerializer,
    ComplianceGateSerializer,
    ValuationModelSerializer,
    DCFAssumptionsSerializer,
    LBOAssumptionsSerializer,
    RegulatoryChecklistSerializer,
    SEBONFilingDeadlineSerializer,
    DealMemoSerializer,
    PortfolioKPIReportSerializer,
    WaterfallModelSerializer,
    WaterfallRunSerializer,
    ValuationRecordSerializer,
    ExitScenarioSerializer,
    IPOEligibilitySerializer,
    EntrepreneurKYBDocumentSerializer,
    IRDocumentSerializer,
    GovernanceProposalSerializer,
    ProposalVoteSerializer,
    TermSheetSerializer,
    SPADraftSerializer,
    CapitalCallSerializer,
    LPSupportRequestSerializer,
)

from deals.valuation import calculate_dcf, calculate_lbo
from deals.ipo_eligibility import check_ipo_eligibility


from deals.tasks import (

    extract_financials_from_document, 
    run_qoe_analysis,
    run_commercial_analysis,
    run_operational_analysis,
    run_nepal_compliance_check,
    generate_memo_draft,
    run_finlo_scoring,
    scan_legal_document,
    run_full_analysis
)


# ---------------------------------------------------------------------------
# LP Performance Helpers
# ---------------------------------------------------------------------------

from deals.models import GPInvestorMeeting, GPInvestorMeetingRequest
from deals.serializers import GPInvestorMeetingRequestSerializer, GPInvestorMeetingSerializer


class GPInvestorIRListView(generics.ListAPIView):
    """
    GET /api/gp-investor/ir-documents/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPInvestorRole]
    serializer_class = IRDocumentSerializer

    def get_queryset(self):
        return IRDocument.objects.filter(is_published=True).order_by('-uploaded_at')



class GPInvestorGovernanceListView(generics.ListAPIView):
    """
    GET /api/gp-investor/governance/proposals/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPInvestorRole]
    serializer_class = GovernanceProposalSerializer

    def get_queryset(self):
        return GovernanceProposal.objects.filter(
            status__in=['ACTIVE', 'CLOSED']
        ).order_by('-created_at')



class GPInvestorVoteView(APIView):
    """
    POST /api/gp-investor/governance/vote/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPInvestorRole]

    def post(self, request):
        proposal_id = request.data.get('proposal_id')
        choice = request.data.get('choice')
        
        proposal = get_object_or_404(GovernanceProposal, pk=proposal_id)
        if proposal.status != 'ACTIVE':
            return Response({"detail": "Voting is not active for this proposal"}, status=400)
            
        shareholder = getattr(request.user, 'gp_shareholding', None)
        if not shareholder:
            return Response({"detail": "You must be a GP Shareholder to vote"}, status=403)
        
        # Check if already voted
        if ProposalVote.objects.filter(proposal=proposal, shareholder=shareholder).exists():
            return Response({"detail": "You have already cast your vote for this proposal"}, status=400)
            
        ProposalVote.objects.create(
            proposal=proposal,
            shareholder=shareholder,
            choice=choice,
            shares_at_voting=shareholder.shares_held
        )
        
        return Response({"status": "Vote recorded"}, status=201)


# ---------------------------------------------------------------------------
# GP Admin / Staff Views for Shareholder Relations
# ---------------------------------------------------------------------------


class GPInvestorMeetingsView(APIView):
    """
    GET /api/deals/gp-investor/meetings/
    Returns list of webinars/briefings for GP Investors.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPInvestorRole]

    def get(self, request):
        from deals.models import GPInvestorMeeting
        from deals.serializers import GPInvestorMeetingSerializer
        
        meetings = GPInvestorMeeting.objects.filter(is_published=True).order_by('-scheduled_at')
        serializer = GPInvestorMeetingSerializer(meetings, many=True)
        return Response(serializer.data)


class GPInvestorMeetingRequestView(APIView):
    """
    POST /api/deals/gp-investor/meetings/request/
    Submit a request for a private consultation.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPInvestorRole]

    def post(self, request):
        from deals.models import GPInvestorMeetingRequest
        from deals.serializers import GPInvestorMeetingRequestSerializer
        
        serializer = GPInvestorMeetingRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class GPIRDocumentViewSet(viewsets.ModelViewSet):
    """
    Admin CRUD for IR Documents
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    serializer_class = IRDocumentSerializer
    queryset = IRDocument.objects.all()

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)



class GPGovernanceProposalViewSet(viewsets.ModelViewSet):
    """
    Admin CRUD for Governance Proposals
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    serializer_class = GovernanceProposalSerializer
    queryset = GovernanceProposal.objects.all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


# ---------------------------------------------------------------------------
# Entrepreneur Portal KYB Views
# ---------------------------------------------------------------------------

