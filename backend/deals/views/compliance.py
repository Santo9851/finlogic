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

from .helpers import get_deal_for_user

from deals.serializers import DistributionSerializer


class GPRegulatoryChecklistView(generics.RetrieveUpdateAPIView):
    """
    GET /api/deals/projects/<uuid:pk>/regulatory-checklist/
    PATCH /api/deals/projects/<uuid:pk>/regulatory-checklist/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    serializer_class = RegulatoryChecklistSerializer

    def get_object(self):
        project = get_deal_for_user(self.request, pk=self.kwargs['pk'])
        obj, _ = RegulatoryChecklist.objects.get_or_create(project=project)
        return obj



class GPSEBONFilingDeadlineListView(generics.ListAPIView):
    """
    GET /api/compliance/sebon-deadlines/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    serializer_class = SEBONFilingDeadlineSerializer
    queryset = SEBONFilingDeadline.objects.all()



class PortfolioKPIReportListView(generics.ListCreateAPIView):
    """
    GET /api/portfolio/kpi-reports/ (GP review)
    POST /api/portfolio/<project_uuid>/kpi-reports/ (Submitter)
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PortfolioKPIReportSerializer

    def get_queryset(self):
        user = self.request.user
        if any(role in ('admin', 'super_admin') for role in user.role_list):
            return PortfolioKPIReport.objects.all()
        # Portfolio Co logic: only reports for projects where they are invited/associated
        return PortfolioKPIReport.objects.filter(project__entrepreneur_user=user)

    def perform_create(self, serializer):
        project_id = self.kwargs.get('pk')
        project = get_deal_for_user(self.request, pk=project_id)
        serializer.save(
            project=project,
            submitted_by=self.request.user,
            submitted_at=timezone.now(),
            status='SUBMITTED'
        )


# ---------------------------------------------------------------------------
# GP Shareholder / Investor Portal Views
# ---------------------------------------------------------------------------




class PortfolioKPIReportDetailView(generics.RetrieveUpdateAPIView):
    """
    PATCH /api/portfolio/kpi-reports/<id>/ (GP review)
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    serializer_class = PortfolioKPIReportSerializer
    queryset = PortfolioKPIReport.objects.all()

# ---------------------------------------------------------------------------
# Waterfall & Distributions
# ---------------------------------------------------------------------------
from deals.waterfall import calculate_distribution
from deals.models import WaterfallRun, Distribution
from deals.serializers import WaterfallRunSerializer, DistributionSerializer

