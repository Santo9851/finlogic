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

from .b2_utils import generate_presigned_upload_url, generate_presigned_download_url
from .models import (
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






from .permissions import (
    IsEntrepreneurRole,
    IsGPInvestorRole,
    IsGPStaff,
    IsLPRole,
    IsDealAccessible,
    IsSuperAdminRole,
)
from .signals import _log_audit_event
from .serializers import (
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

from .valuation import calculate_dcf, calculate_lbo
from .ipo_eligibility import check_ipo_eligibility


from .tasks import (

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

def _calculate_xirr(cashflows, guess=0.1):
    """Simple bisection method for XIRR calculation."""
    if not cashflows or len(cashflows) < 2:
        return 0.0
    
    # Need at least one positive and one negative flow
    has_pos = any(c[1] > 0 for c in cashflows)
    has_neg = any(c[1] < 0 for c in cashflows)
    if not (has_pos and has_neg):
        return 0.0

    def npv(rate, cf):
        total = 0
        d0 = min(c[0] for c in cf)
        for d, a in cf:
            years = (d - d0).days / 365.25
            total += a / ((1 + rate) ** years)
        return total

    # Bisection
    low = -0.99
    high = 2.0
    for _ in range(50):
        mid = (low + high) / 2
        v = npv(mid, cashflows)
        if v > 0:
            low = mid
        else:
            high = mid
        if abs(v) < 0.001:
            break
    return mid

def _calculate_fund_performance_metrics(fund):
    """
    Computes TVPI, DPI, RVPI, and Gross/Net IRR for a Fund (aggregate).
    """
    from datetime import date
    from django.db.models import Sum
    
    # 1. Aggregate Paid-In Capital (All LPs)
    paid_in = CapitalCall.objects.filter(
        fund=fund,
        status__in=['VERIFIED', 'RECEIVED']
    ).aggregate(Sum('amount_npr'))['amount_npr__sum'] or 0
    paid_in = float(paid_in)

    # 2. Total Distributed (All LPs)
    total_dist = Distribution.objects.filter(
        fund=fund
    ).aggregate(Sum('amount_npr'))['amount_npr__sum'] or 0
    total_dist = float(total_dist)

    # 3. Fair Market Value of active investments
    investments = PEInvestment.objects.filter(fund=fund, exit_date__isnull=True)
    fund_fmv = 0
    fund_cost = 0
    for inv in investments:
        latest_val = ValuationRecord.objects.filter(investment=inv).order_by('-valuation_date').first()
        fund_fmv += float(latest_val.fair_value_npr if latest_val else inv.investment_amount_npr)
        fund_cost += float(inv.investment_amount_npr)
    
    # 4. Fund-level Fees
    total_fees = float(CapitalCall.objects.filter(
        fund=fund, 
        status__in=['VERIFIED', 'RECEIVED'], 
        call_type__in=['MANAGEMENT_FEE', 'FUND_EXPENSE', 'OTHER']
    ).aggregate(Sum('amount_npr'))['amount_npr__sum'] or 0)

    # 5. Fund Cash Position
    fund_cash = paid_in - total_dist - fund_cost - total_fees
    
    # 6. Residual Value
    gross_rv = fund_fmv + fund_cash
    
    # 7. Carry Deduction (Estimated)
    profit = gross_rv + total_dist - paid_in
    estimated_carry = 0
    if profit > 0:
        estimated_carry = profit * (fund.carry_pct / 100.0)
    
    net_rv = gross_rv - estimated_carry

    # 8. Multipliers
    if paid_in > 0:
        dpi = total_dist / paid_in
        rvpi = net_rv / paid_in
        tvpi = dpi + rvpi
    else:
        dpi = rvpi = tvpi = 0.0

    # 9. XIRR (Net)
    cf = []
    calls = CapitalCall.objects.filter(fund=fund, status__in=['VERIFIED', 'RECEIVED'])
    for c in calls:
        cf.append((c.received_at.date() if c.received_at else c.call_date, -float(c.amount_npr)))
    
    dists = Distribution.objects.filter(fund=fund)
    for d in dists:
        cf.append((d.distribution_date, float(d.amount_npr)))
    
    if net_rv > 0:
        cf.append((date.today(), net_rv))
        
    irr = _calculate_xirr(cf)

    return {
        'tvpi': round(tvpi, 2),
        'dpi': round(dpi, 2),
        'rvpi': round(rvpi, 2),
        'irr': round(irr * 100, 1),
        'total_rv': round(net_rv, 2),
        'gross_rv': round(gross_rv, 2),
        'estimated_carry': round(estimated_carry, 2),
        'total_mgmt_fees': round(total_fees, 2),
        'total_invested': round(fund_cost, 2),
        'total_paid_in': round(paid_in, 2)
    }

def _calculate_lp_performance_metrics(lp_profile):
    """
    Computes TVPI, DPI, RVPI, and Net IRR for an LP.
    Safety: returns 0.0 for all if no data is found.
    """
    from datetime import date
    from django.db.models import Sum
    
    commitments = lp_profile.fund_commitments.all()
    if not commitments:
        return {'tvpi': 0.0, 'dpi': 0.0, 'rvpi': 0.0, 'irr': 0.0}

    # 1. Paid-In Capital
    paid_in = CapitalCall.objects.filter(
        lp_commitment__in=commitments,
        status__in=['VERIFIED', 'RECEIVED']
    ).aggregate(Sum('amount_npr'))['amount_npr__sum'] or 0
    paid_in = float(paid_in)

    # 2. Total Distributed
    total_dist = Distribution.objects.filter(
        lp_commitment__in=commitments
    ).aggregate(Sum('amount_npr'))['amount_npr__sum'] or 0
    total_dist = float(total_dist)

    net_total_rv = 0
    total_gross_rv = 0
    total_estimated_carry = 0
    total_mgmt_fees = 0

    for comm in commitments:
        fund = comm.fund
        fund_total_committed = LPFundCommitment.objects.filter(fund=fund).aggregate(Sum('committed_amount_npr'))['committed_amount_npr__sum'] or 1
        lp_share = float(comm.committed_amount_npr) / float(fund_total_committed)
        
        # FMV and Cost for this fund commitment
        fund_fmv = 0
        fund_cost = 0
        investments = PEInvestment.objects.filter(fund=fund, exit_date__isnull=True)
        for inv in investments:
            latest_val = ValuationRecord.objects.filter(investment=inv).order_by('-valuation_date').first()
            fund_fmv += float(latest_val.fair_value_npr if latest_val else inv.investment_amount_npr)
            fund_cost += float(inv.investment_amount_npr)
        
        lp_share_fmv = fund_fmv * lp_share
        lp_share_cost = fund_cost * lp_share
        
        # Fund-specific Paid-in & Dist
        lp_fund_paid_in = float(CapitalCall.objects.filter(lp_commitment=comm, status__in=['VERIFIED', 'RECEIVED']).aggregate(Sum('amount_npr'))['amount_npr__sum'] or 0)
        lp_fund_dist = float(Distribution.objects.filter(lp_commitment=comm).aggregate(Sum('amount_npr'))['amount_npr__sum'] or 0)
        
        # Management Fees & Expenses (Captured from non-investment call types)
        lp_fund_fees = float(CapitalCall.objects.filter(
            lp_commitment=comm, 
            status__in=['VERIFIED', 'RECEIVED'], 
            call_type__in=['MANAGEMENT_FEE', 'FUND_EXPENSE', 'OTHER']
        ).aggregate(Sum('amount_npr'))['amount_npr__sum'] or 0)
        total_mgmt_fees += lp_fund_fees

        # Uninvested Cash attributed to this LP
        # Cash = Paid-in - Distributed - Invested Cost - Fees
        # We allow this to be negative to represent the LP's liability for investments 
        # made by the fund but not yet funded by this specific LP.
        lp_fund_cash = lp_fund_paid_in - lp_fund_dist - lp_share_cost - lp_fund_fees
        
        # Gross Residual Value includes both current FMV of investments and unspent cash
        lp_fund_rv_gross = lp_share_fmv + lp_fund_cash
        total_gross_rv += lp_fund_rv_gross
        
        # Carry Logic (Calculated on Net Profit including realized/unrealized value)
        lp_fund_profit = lp_fund_rv_gross + lp_fund_dist - lp_fund_paid_in
        if lp_fund_profit > 0:
            carry_deduction = lp_fund_profit * (fund.carry_pct / 100.0)
            lp_fund_rv_net = lp_fund_rv_gross - carry_deduction
            total_estimated_carry += carry_deduction
        else:
            lp_fund_rv_net = lp_fund_rv_gross
            
        net_total_rv += lp_fund_rv_net

    # 5. Multipliers (Net)
    if paid_in > 0:
        dpi = total_dist / paid_in
        rvpi = net_total_rv / paid_in
        tvpi = dpi + rvpi
    else:
        dpi = rvpi = tvpi = 0.0

    results = {
        'tvpi': tvpi,
        'dpi': dpi,
        'rvpi': rvpi,
        'net_total_rv': net_total_rv,
        'total_mgmt_fees': total_mgmt_fees,
        'total_estimated_carry': total_estimated_carry
    }

    # 6. XIRR Cash Flows (Net)
    cf = []
    calls = CapitalCall.objects.filter(lp_commitment__in=commitments, status__in=['VERIFIED', 'RECEIVED'])
    for c in calls:
        cf.append((c.received_at.date() if c.received_at else c.call_date, -float(c.amount_npr)))
    
    dists = Distribution.objects.filter(lp_commitment__in=commitments)
    for d in dists:
        cf.append((d.distribution_date, float(d.amount_npr)))
    
    if net_total_rv > 0:
        cf.append((date.today(), net_total_rv))
        
    irr = _calculate_xirr(cf)

    return {
        'tvpi': round(tvpi, 2),
        'dpi': round(dpi, 2),
        'rvpi': round(rvpi, 2),
        'irr': round(irr * 100, 1),
        'total_rv': round(net_total_rv, 2),
        'gross_rv': round(total_gross_rv, 2),
        'estimated_carry': round(total_estimated_carry, 2),
        'total_mgmt_fees': round(total_mgmt_fees, 2)
    }

def _get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip





from .signals import _log_audit_event

User = get_user_model()
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def get_deal_for_user(request, **kwargs):
    project = get_object_or_404(PEProject, **kwargs)
    if request.user.has_role('super_admin'):
        return project
    if project.created_by == request.user:
        return project
    if project.entrepreneur_user == request.user:
        return project
    if hasattr(project, 'collaborators') and project.collaborators.filter(id=request.user.id).exists():
        return project
    raise PermissionDenied("You do not have permission to access the details of this deal.")

def _get_client_ip(request):
    x_fwd = request.META.get('HTTP_X_FORWARDED_FOR')
    return x_fwd.split(',')[0].strip() if x_fwd else request.META.get('REMOTE_ADDR')


def _get_or_create_entrepreneur(email: str) -> tuple[User, bool]:
    """
    Return (user, created). If user doesn't exist, create with entrepreneur role.
    A random unusable password is set; they must use invite flow to set password.
    """
    try:
        user = User.objects.get(email=email)
        # Ensure entrepreneur role is present
        role_list = user.role_list
        if 'entrepreneur' not in role_list:
            role_list.append('entrepreneur')
            user.roles = ','.join(role_list)
            user.save(update_fields=['roles'])
        return user, False
    except User.DoesNotExist:
        username = email.split('@')[0]
        base = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f'{base}{counter}'
            counter += 1
        user = User.objects.create_user(
            username=username,
            email=email,
            roles='entrepreneur',
            is_active=True,
        )
        user.set_unusable_password()
        user.save()
        return user, True


# ---------------------------------------------------------------------------
# 1. GP – Create Entrepreneur Invitation
# ---------------------------------------------------------------------------

class GPCreateInviteView(APIView):
    """
    POST /api/deals/projects/invite/
    GP creates a PEProject and sends an invitation to an entrepreneur.
    Permission: IsGPStaff
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request):
        logger.info(f"Invite request received: {request.data}")
        serializer = GPInviteSerializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Invite validation failed: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        data = serializer.validated_data

        fund: Fund = data['fund_id']  # already the Fund instance (validated)
        entrepreneur_email: str = data['entrepreneur_email']

        # Get or create entrepreneur user
        entrepreneur, _created = _get_or_create_entrepreneur(entrepreneur_email)

        # Get or create the PE project based on registration number
        project, created = PEProject.objects.get_or_create(
            ocr_registration_number=data['ocr_registration_number'],
            defaults={
                'fund': fund,
                'legal_name': data['legal_name'],
                'deal_type': data['deal_type'],
                'sector': data.get('sector', PEProject.Sector.OTHER),
                'investment_range_min_npr': data.get('investment_range_min_npr'),
                'investment_range_max_npr': data.get('investment_range_max_npr'),
                # Start in PENDING_SUBMISSION — flips to SUBMITTED only when
                # the entrepreneur completes and finalizes the form.
                'status': PEProject.Status.PENDING_SUBMISSION,
                'submission_type': PEProject.SubmissionType.ENTREPRENEUR_INVITED,
                'entrepreneur_user': entrepreneur,
                'created_by': request.user,
            }
        )

        if not created:
            # Update fields if it already exists to ensure it's now an invited project
            project.entrepreneur_user = entrepreneur
            project.submission_type = PEProject.SubmissionType.ENTREPRENEUR_INVITED
            # We might also want to update the fund or other details if they changed
            project.fund = fund
            project.legal_name = data['legal_name']
            project.deal_type = data['deal_type']
            project.save()
        
        # Signal handles token generation + email sending

        return Response(
            PEProjectDetailSerializer(project).data,
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# GP Fund Document Management
# ---------------------------------------------------------------------------

class GPFundDocumentView(generics.ListCreateAPIView):
    """
    GP management of documents for a specific fund.
    POST /api/deals/funds/<fund_id>/documents/
    GET /api/deals/funds/<fund_id>/documents/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    serializer_class = FundDocumentSerializer

    def get_queryset(self):
        fund_id = self.kwargs.get('fund_id')
        return FundDocument.objects.filter(fund_id=fund_id)

    def perform_create(self, serializer):
        fund = get_object_or_404(Fund, pk=self.kwargs.get('fund_id'))
        doc = serializer.save(fund=fund, uploaded_by=self.request.user)
        
        _log_audit_event(
            ImmutableAuditEvent.EventType.DOCUMENT_UPLOADED,
            doc,
            actor=self.request.user,
            payload={'fund': str(fund.pk), 'type': doc.document_type}
        )


class GPFundGetUploadURLView(APIView):
    """
    POST /api/deals/funds/{fund_id}/get-upload-url/
    Permission: IsGPStaff
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, fund_id):
        get_object_or_404(Fund, pk=fund_id)
        serializer = DocumentUploadRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        try:
            # We use a 'funds' prefix in B2 for organization
            presign = generate_presigned_upload_url(
                project_id=f"funds/{fund_id}",
                filename=d['filename'],
                content_type=d.get('content_type'),
            )
            return Response({
                'url': presign['url'],
                'file_key': presign['file_key'],
                'content_type': presign['content_type'],
            })
        except Exception as exc:
            return Response({'detail': str(exc)}, status=502)


class GPFundDocumentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Update/Delete specific fund document.
    PATCH /api/deals/funds/documents/<doc_id>/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    serializer_class = FundDocumentSerializer
    queryset = FundDocument.objects.all()
    lookup_url_kwarg = 'doc_id'

    def perform_update(self, serializer):
        is_publishing = 'is_published' in self.request.data and self.request.data['is_published']
        if is_publishing:
            serializer.save(publish_date=timezone.now())
        else:
            serializer.save()


# ---------------------------------------------------------------------------
# LP Portal - Documents & Portfolio
# ---------------------------------------------------------------------------

class LPDocumentListView(generics.ListAPIView):
    """
    List published documents for all funds the LP is committed to.
    GET /api/lp/documents/
    """
    permission_classes = [permissions.IsAuthenticated, IsLPRole]
    serializer_class = FundDocumentSerializer

    def get_queryset(self):
        try:
            lp_profile = self.request.user.lp_profile
        except AttributeError:
            return FundDocument.objects.none()
        except LPProfile.DoesNotExist:
            return FundDocument.objects.none()
            
        fund_ids = lp_profile.fund_commitments.values_list('fund_id', flat=True)
        return FundDocument.objects.filter(
            fund_id__in=fund_ids,
            is_published=True
        ).order_by('-publish_date')


class LPDocumentDownloadView(APIView):
    """
    Generate pre-signed download URL for a fund document.
    GET /api/lp/documents/<doc_id>/download/
    """
    permission_classes = [permissions.IsAuthenticated, IsLPRole]

    def get(self, request, doc_id):
        lp_profile = request.user.lp_profile
        doc = get_object_or_404(FundDocument, pk=doc_id, is_published=True)
        
        # Verify access: LP must be committed to this fund
        if not lp_profile.fund_commitments.filter(fund=doc.fund).exists():
            raise PermissionDenied("You do not have access to this fund's documents.")

        # Log access
        LPDocumentAccess.objects.update_or_create(
            lp_profile=lp_profile,
            document=doc,
            defaults={'ip_address': _get_client_ip(request)}
        )

        url = generate_presigned_download_url(file_key=doc.file_key, filename=doc.file_name)
        return Response({'url': url})


class LPDocumentAcknowledgeView(APIView):
    """
    Acknowledge receipt/reading of a document.
    POST /api/lp/documents/<doc_id>/acknowledge/
    """
    permission_classes = [permissions.IsAuthenticated, IsLPRole]

    def post(self, request, doc_id):
        lp_profile = request.user.lp_profile
        doc = get_object_or_404(FundDocument, pk=doc_id, is_published=True)
        
        access, _ = LPDocumentAccess.objects.get_or_create(
            lp_profile=lp_profile,
            document=doc
        )
        access.acknowledged_at = timezone.now()
        access.ip_address = _get_client_ip(request)
        access.save()

        return Response({'status': 'acknowledged'})


class LPPortfolioView(APIView):
    """
    Return anonymized list of deals in the LP's funds.
    GET /api/lp/portfolio/
    """
    permission_classes = [permissions.IsAuthenticated, IsLPRole]

    def get(self, request):
        try:
            lp_profile = request.user.lp_profile
        except LPProfile.DoesNotExist:
             return Response({'detail': 'LP profile not found.'}, status=404)

        fund_ids = lp_profile.fund_commitments.values_list('fund_id', flat=True)
        
        # We want to show projects that have at least reached LOI status
        projects = PEProject.objects.filter(
            fund_id__in=fund_ids,
            status__in=[PEProject.Status.LOI_ISSUED, PEProject.Status.CONTRACT_SIGNED, PEProject.Status.CAPITAL_CALLED, PEProject.Status.CLOSED]
        ).distinct()

        # Enriched serialization with investment data
        project_list = []
        for p in projects:
            p_data = LPPortfolioSerializer(p).data
            
            # Find investments for this project within the LP's funds
            invs = PEInvestment.objects.filter(project=p, fund_id__in=fund_ids)
            total_invested = invs.aggregate(Sum('investment_amount_npr'))['investment_amount_npr__sum'] or 0
            
            # Latest valuation
            latest_fv = 0
            for inv in invs:
                val = ValuationRecord.objects.filter(investment=inv).order_by('-valuation_date').first()
                latest_fv += float(val.fair_value_npr if val else inv.investment_amount_npr)
            
            p_data.update({
                'total_invested_npr': float(total_invested),
                'current_fv_npr': float(latest_fv),
                'moic': float(latest_fv / total_invested) if total_invested > 0 else 1.0,
                'has_investment': invs.exists()
            })
            project_list.append(p_data)

        # Real metrics calculation
        performance = _calculate_lp_performance_metrics(lp_profile)
        
        stats = {
            'total_investments': projects.count(),
            'sectors': {}, # Aggregate by sector for chart
            'performance': performance
        }
        
        for p in projects:
            stats['sectors'][p.sector] = stats['sectors'].get(p.sector, 0) + 1

        return Response({
            'projects': project_list,
            'stats': stats
        })


class DocumentDownloadURLView(APIView):
    """
    GET /api/deals/documents/download-url/?key=...
    Permission: IsGPStaff or Entrepreneur (if they own it)
    """
    def get(self, request):
        file_key = request.query_params.get('key')
        if not file_key:
            return Response({'detail': 'Missing key'}, status=400)
        
        # Security check: ensure user has access to this project
        try:
            # Look up the document to see if it's local or B2
            doc = PEProjectDocument.objects.filter(file_key=file_key).first()
            if doc and doc.local_file:
                # Return the local serve URL instead of the raw media URL
                return Response({'url': request.build_absolute_uri(reverse('deals:document-serve', args=[doc.id]))})
            
            # Fallback to B2 presigned URL
            url = generate_presigned_download_url(file_key)
            return Response({'url': url})
        except Exception as exc:
            return Response({'detail': str(exc)}, status=500)


@method_decorator(xframe_options_exempt, name='dispatch')
class DocumentServeView(APIView):
    """
    GET /api/deals/documents/{id}/serve/
    Streams a local document. Handles PDF/Images inline and Office files as attachments.
    """
    permission_classes = [permissions.IsAuthenticated] # Adjust to IsGPStaff if needed

    def get(self, request, pk):
        from .permissions import IsGPStaff, IsDealAccessible
        doc = get_object_or_404(PEProjectDocument, pk=pk)
        
        # Security: check if user has access to the parent project
        project = doc.project
        if not (request.user.has_role('super_admin') or 
                project.created_by == request.user or 
                project.collaborators.filter(id=request.user.id).exists()):
             return Response({'detail': 'Access denied to this document.'}, status=403)

        # Determine MIME type
        mime_type = doc.mime_type
        if not mime_type and doc.local_file:
            mime_type, _ = mimetypes.guess_type(doc.local_file.path)
        mime_type = mime_type or 'application/octet-stream'

        # Hybrid Logic: PDF/Images inline, others (Office) as attachment
        inline_types = ['application/pdf', 'text/plain']
        is_inline = mime_type.startswith('image/') or mime_type in inline_types

        try:
            return FileResponse(
                doc.local_file.open('rb'),
                content_type=mime_type,
                as_attachment=not is_inline,
                filename=doc.filename
            )
        except Exception as e:
            return Response({'detail': str(e)}, status=404)


class DocumentDeleteView(APIView):
    """
    DELETE /api/deals/documents/{id}/
    Permission: IsGPStaff
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def delete(self, request, pk):
        from .b2_utils import delete_b2_object
        doc = get_object_or_404(PEProjectDocument, pk=pk)
        try:
            delete_b2_object(doc.file_key)
        except Exception:
            pass # Continue to delete record even if B2 delete fails (or log error)
        
        doc.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# 2. Entrepreneur – Access via Invitation Token (public)
# ---------------------------------------------------------------------------

class EntrepreneurInviteDetailView(APIView):
    """
    GET /api/deals/projects/invite/{token}/
    Returns project info + current step form schema.
    No authentication required (token is the credential).
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        project = get_object_or_404(
            PEProject,
            invitation_token=token,
        )
        if not project.is_invitation_valid:
            return Response(
                {'detail': 'This invitation link has expired or is invalid.'},
                status=status.HTTP_410_GONE,
            )

        # Fetch the active form template
        template = PEFormTemplate.objects.filter(
            form_type=PEFormTemplate.FormType.DEAL_SUBMISSION,
            is_active=True,
        ).order_by('-version').first()

        next_step = None
        if template:
            steps = template.steps
            completed_index = project.form_step_completed
            if completed_index < len(steps):
                next_step = steps[completed_index]

        return Response({
            'project': PEProjectDetailSerializer(project).data,
            'template': PEFormTemplateSerializer(template).data if template else None,
            'next_step': next_step,
        })


# ---------------------------------------------------------------------------
# 3. Entrepreneur – Submit Form Step (token auth)
# ---------------------------------------------------------------------------

class EntrepreneurSubmitStepView(APIView):
    """
    POST /api/deals/projects/invite/{token}/step/{step_name}/
    Saves form response for the given step and advances form_step_completed.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, token, step_name):
        project = get_object_or_404(PEProject, invitation_token=token)
        if not project.is_invitation_valid:
            return Response(
                {'detail': 'Invitation expired.'},
                status=status.HTTP_410_GONE,
            )

        template = PEFormTemplate.objects.filter(
            form_type=PEFormTemplate.FormType.DEAL_SUBMISSION,
            is_active=True,
        ).order_by('-version').first()

        if not template:
            return Response(
                {'detail': 'No active form template found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Identify the step
        step_def = next(
            (s for s in template.steps if s.get('step_name') == step_name),
            None,
        )
        if not step_def:
            return Response(
                {'detail': f"Step '{step_name}' not found in template."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        step_index = step_def['step_index']

        required_fields = [f for f in step_def.get('fields', []) if f.get('required', False)]
        missing_required = []

        for field in required_fields:
            field_name = field.get('name')
            field_type = field.get('type')
            value = request.data.get(field_name)

            if field_type == 'file_upload':
                if not value or (isinstance(value, str) and not value.strip()):
                    missing_required.append(field.get('label', field_name))
            elif field_type in ('checkbox', 'bool'):
                if not value:
                    missing_required.append(field.get('label', field_name))
            elif value is None or (isinstance(value, str) and not value.strip()):
                missing_required.append(field.get('label', field_name))

        step_advancement_blocked = False
        if missing_required and project.form_step_completed <= step_index:
            step_advancement_blocked = True

        response_obj, _ = PEProjectFormResponse.objects.update_or_create(
            project=project,
            step_index=step_index,
            defaults={
                'step_name': step_name,
                'template': template,
                'response_data': request.data,
            },
        )

        can_advance = not step_advancement_blocked
        if can_advance and project.form_step_completed < step_index:
            project.form_step_completed = step_index
            project.save(update_fields=['form_step_completed'])

        _log_audit_event(
            ImmutableAuditEvent.EventType.FORM_STEP_SAVED,
            project,
            actor=project.entrepreneur_user,
            payload={'step_name': step_name, 'step_index': step_index},
            request=request,
        )

        return Response({
            'status': 'saved',
            'step_completed': project.form_step_completed,
            'can_advance': can_advance,
            'missing_required': missing_required if step_advancement_blocked else []
        })


# ---------------------------------------------------------------------------
# 4. Entrepreneur – Document Upload (token auth)
# ---------------------------------------------------------------------------

class EntrepreneurGetUploadURLView(APIView):
    """
    POST /api/deals/projects/invite/{token}/get-upload-url/
    Returns a pre-signed B2 upload URL and creates a pending document record.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, token):
        project = get_object_or_404(PEProject, invitation_token=token)
        if not project.is_invitation_valid:
            return Response(
                {'detail': 'Invitation expired.'},
                status=status.HTTP_410_GONE,
            )

        serializer = DocumentUploadRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        try:
            presign = generate_presigned_upload_url(
                project_id=str(project.pk),
                filename=d['filename'],
                content_type=d.get('content_type'),
            )
        except Exception as exc:
            logger.error("B2 presign failed: %s", exc)
            return Response(
                {'detail': 'Could not generate upload URL.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # Create a pending document record
        doc = PEProjectDocument.objects.create(
            project=project,
            file_key=presign['file_key'],
            filename=d['filename'],
            file_size=d['file_size'],
            mime_type=d.get('content_type', 'application/octet-stream'),
            category=d['category'],
            uploaded_by=project.entrepreneur_user,
            is_confirmed=False,
        )

        return Response({
            'url': presign['url'],
            'file_key': presign['file_key'],
            'document_id': doc.id,
            'content_type': presign['content_type'],
        }, status=status.HTTP_201_CREATED)


class EntrepreneurInviteUploadLocalView(APIView):
    """
    POST /api/deals/projects/invite/{token}/upload-local/
    Direct multipart upload to local storage for public invite flow.
    """
    permission_classes = [permissions.AllowAny]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request, token):
        project = get_object_or_404(PEProject, invitation_token=token)
        if not project.is_invitation_valid:
            return Response({'detail': 'Invitation expired.'}, status=status.HTTP_410_GONE)
            
        file_obj = request.FILES.get('file')
        category = request.data.get('document_type', 'OTHER')

        if not file_obj:
            return Response({'detail': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if file_obj.size > 3 * 1024 * 1024:
            return Response({'detail': 'File size exceeds 3MB limit.'}, status=status.HTTP_400_BAD_REQUEST)

        doc = PEProjectDocument.objects.create(
            project=project,
            category=category,
            filename=file_obj.name,
            file_key=f"local/{project.id}/{file_obj.name}",
            mime_type=file_obj.content_type,
            file_size=file_obj.size,
            local_file=file_obj,
            uploaded_by=project.entrepreneur_user,
            is_confirmed=True,
        )

        return Response({
            'document_id': doc.id,
            'filename': doc.filename,
            'url': doc.local_file.url
        }, status=status.HTTP_201_CREATED)


class DocumentConfirmView(APIView):
    """
    POST /api/deals/projects/.../documents/{id}/confirm/
    Marks a document as successfully uploaded.
    """
    def post(self, request, *args, **kwargs):
        doc_id = kwargs.get('doc_id')
        token = kwargs.get('token')
        project_id = kwargs.get('project_id')

        if token:
            project = get_object_or_404(PEProject, invitation_token=token)
            doc = get_object_or_404(PEProjectDocument, pk=doc_id, project=project)
        else:
            project = get_deal_for_user(request, pk=project_id)
            # Permission check: Either GP Staff or the project's entrepreneur
            is_gp = any(r in ('admin', 'super_admin') for r in request.user.role_list)
            is_owner = (project.entrepreneur_user == request.user)
            
            if not (is_gp or is_owner):
                 raise PermissionDenied()
            
            doc = get_object_or_404(PEProjectDocument, pk=doc_id, project=project)

        doc.is_confirmed = True
        doc.save(update_fields=['is_confirmed'])

        _log_audit_event(
            ImmutableAuditEvent.EventType.DOCUMENT_UPLOADED,
            doc,
            actor=request.user if request.user.is_authenticated else project.entrepreneur_user,
            payload={
                'filename': doc.filename,
                'category': doc.category,
                'file_key': doc.file_key,
            },
            request=request,
        )

        return Response({'status': 'confirmed'}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# 5. Entrepreneur – Finalize / Submit
# ---------------------------------------------------------------------------

class EntrepreneurFinalizeView(APIView):
    """
    POST /api/deals/projects/invite/{token}/submit/
    Sets submitted_at, status=SUBMITTED, notifies GP.
    Validates all required fields before allowing final submission.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, token):
        project = get_object_or_404(PEProject, invitation_token=token)
        if not project.is_invitation_valid:
            return Response(
                {'detail': 'Invitation expired.'},
                status=status.HTTP_410_GONE,
            )
        if project.submitted_at:
            return Response(
                {'detail': 'This project has already been submitted.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        template = PEFormTemplate.objects.filter(
            form_type=PEFormTemplate.FormType.DEAL_SUBMISSION,
            is_active=True,
        ).order_by('-version').first()

        if not template:
            return Response({'detail': 'No active form template found.'}, status=404)

        saved_responses = {
            r.step_index: r.response_data
            for r in PEProjectFormResponse.objects.filter(project=project)
        }

        all_missing = []

        for step in template.steps:
            step_index = step.get('step_index')
            step_data = saved_responses.get(step_index, {})

            for field in step.get('fields', []):
                if not field.get('required', False):
                    continue

                field_name = field.get('name')
                field_type = field.get('type')
                field_label = field.get('label', field_name)
                value = step_data.get(field_name)

                is_missing = False
                if field_type == 'file_upload':
                    if not value or (isinstance(value, str) and not value.strip()):
                        is_missing = True
                elif field_type in ('checkbox', 'bool'):
                    if not value:
                        is_missing = True
                elif value is None or (isinstance(value, str) and not value.strip()):
                    is_missing = True

                if is_missing:
                    all_missing.append({
                        'step': step.get('title'),
                        'step_index': step_index,
                        'field': field_name,
                        'label': field_label,
                        'type': field_type
                    })

        if all_missing:
            return Response({
                'detail': 'Please complete all required fields before finalizing.',
                'missing_required': all_missing,
            }, status=400)

        project.submitted_at = timezone.now()
        project.status = PEProject.Status.SUBMITTED
        project.save(update_fields=['submitted_at', 'status', 'updated_at'])

        try:
            _notify_gp_submission(project)
        except Exception as exc:
            logger.warning("GP notification failed: %s", exc)

        return Response(
            {'detail': 'Project submitted successfully.', 'submitted_at': project.submitted_at},
            status=status.HTTP_200_OK,
        )


def _notify_gp_submission(project: PEProject):
    """Send email to all admin/super_admin users when a project is submitted."""
    from django.core.mail import send_mail

    gp_emails = list(
        User.objects.filter(
            is_active=True,
            roles__in=['admin', 'super_admin'],
        ).values_list('email', flat=True)
    )
    # roles is comma-separated, so filter differently
    all_admins = User.objects.filter(is_active=True)
    gp_emails = [
        u.email for u in all_admins
        if any(r in ('admin', 'super_admin') for r in u.role_list)
    ]

    if gp_emails:
        send_mail(
            subject=f'[Finlogic PE] New deal submitted: {project.legal_name}',
            message=(
                f'The deal "{project.legal_name}" has been submitted by '
                f'{project.entrepreneur_user.email if project.entrepreneur_user else "an entrepreneur"}.\n\n'
                f'Review it in the admin: {getattr(settings, "FRONTEND_BASE_URL", "")}/gp/deals/{project.pk}/'
            ),
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@finlogiccapital.com'),
            recipient_list=gp_emails,
            fail_silently=True,
        )


# ---------------------------------------------------------------------------
# 6. Entrepreneur Dashboard
# ---------------------------------------------------------------------------

class EntrepreneurSubmissionsListView(generics.ListAPIView):
    """
    GET /api/entrepreneur/submissions/
    Lists PEProjects where entrepreneur_user == request.user.
    Permission: IsEntrepreneurRole
    """
    serializer_class = PEProjectListSerializer
    permission_classes = [permissions.IsAuthenticated, IsEntrepreneurRole]

    def get_queryset(self):
        return PEProject.objects.filter(
            entrepreneur_user=self.request.user
        ).select_related('fund')


class EntrepreneurSubmissionDetailView(generics.RetrieveAPIView):
    """
    GET /api/entrepreneur/submissions/{id}/
    Detail with form responses and document progress.
    Permission: IsEntrepreneurRole (own projects only)
    """
    serializer_class = PEProjectDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsEntrepreneurRole]

    def get_queryset(self):
        return PEProject.objects.filter(
            entrepreneur_user=self.request.user
        ).select_related('fund', 'entrepreneur_user', 'created_by')

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        project_data = self.get_serializer(instance).data

        # Attach active template first (needed for field type lookup below)
        template = PEFormTemplate.objects.filter(
            form_type=PEFormTemplate.FormType.DEAL_SUBMISSION,
            is_active=True,
        ).order_by('-version').first()
        project_data['active_template'] = PEFormTemplateSerializer(template).data if template else None

        # Load raw DB form responses
        responses = PEProjectFormResponse.objects.filter(project=instance).order_by('step_index')
        form_responses_data = list(PEProjectFormResponseSerializer(responses, many=True).data)

        # ── Step 1: Scrub stale doc IDs ─────────────────────────────────────
        # Build the set of doc IDs that actually exist and are confirmed on this
        # project. Any file_upload field value that isn't in this set is stale
        # (e.g. from a deleted/overwritten upload) and must be cleared so the
        # FileUploader shows "idle" instead of a false "Upload Complete".
        confirmed_doc_ids_str = set(
            str(doc_id) for doc_id in
            PEProjectDocument.objects
            .filter(project=instance, is_confirmed=True)
            .values_list('id', flat=True)
        )

        if template:
            # Build field_name → type lookup across ALL steps
            field_type_map = {}
            for step in template.steps:
                for field in step.get('fields', []):
                    field_type_map[field['name']] = field.get('type')

            for resp in form_responses_data:
                cleaned = {}
                for key, val in resp.get('response_data', {}).items():
                    if field_type_map.get(key) == 'file_upload':
                        # Only keep the value if the document truly exists & confirmed
                        if val and str(val).strip() in confirmed_doc_ids_str:
                            cleaned[key] = val
                        # Stale ID → omit the key (field treated as empty)
                    else:
                        cleaned[key] = val
                resp['response_data'] = cleaned

        project_data['form_responses'] = form_responses_data

        # ── Step 2: Recalculate form_step_completed ──────────────────────────
        # The DB value may be inflated from before stricter validation was added.
        # We recompute based on cleaned response_data and update the DB if wrong.
        if template:
            cleaned_by_index = {r['step_index']: r['response_data'] for r in form_responses_data}
            effective_completed = 0

            for step in sorted(template.steps, key=lambda s: s.get('step_index', 0)):
                step_index = step.get('step_index', 0)
                
                # If there's no response record for this step, it means the user hasn't
                # explicitly completed it yet (even if all its fields are optional).
                if step_index not in cleaned_by_index:
                    break
                    
                step_data = cleaned_by_index.get(step_index, {})
                step_ok = True

                for field in step.get('fields', []):
                    if not field.get('required', False):
                        continue
                    field_name = field.get('name')
                    field_type = field.get('type')
                    value = step_data.get(field_name)

                    if field_type == 'file_upload':
                        if not value or str(value).strip() not in confirmed_doc_ids_str:
                            step_ok = False
                            break
                    elif field_type in ('checkbox', 'bool'):
                        if not value:
                            step_ok = False
                            break
                    elif value is None or (isinstance(value, str) and not value.strip()):
                        step_ok = False
                        break

                if step_ok:
                    effective_completed = step_index
                else:
                    # Stop at the first incomplete step
                    break

            # Persist the correction if the DB is out of sync
            if instance.form_step_completed != effective_completed:
                PEProject.objects.filter(pk=instance.pk).update(
                    form_step_completed=effective_completed
                )
                project_data['form_step_completed'] = effective_completed

        # ── Step 3: Auto-populate empty document fields ──────────────────────
        # Only fills fields that have NO DB-saved value, using only confirmed docs.
        # This gives a helpful pre-fill for brand-new sessions without faking state.
        if template:
            doc_step = next((s for s in template.steps if s.get('step_name') == 'documents'), None)
            if doc_step:
                idx = doc_step['step_index']
                resp_list = project_data['form_responses']
                existing_resp = next((r for r in resp_list if r['step_index'] == idx), None)

                db_saved_data = (existing_resp['response_data'] if existing_resp else {})
                suggested_data = db_saved_data.copy()
                all_confirmed_docs = instance.documents.filter(is_confirmed=True)

                changed = False
                for field in doc_step.get('fields', []):
                    f_name = field['name']
                    if not db_saved_data.get(f_name):
                        cat = field.get('category')
                        search_cats = [cat]
                        if cat == 'FINANCIAL': search_cats.append('FINANCIALS')
                        elif cat == 'FINANCIALS': search_cats.append('FINANCIAL')

                        match = all_confirmed_docs.filter(
                            category__in=search_cats
                        ).order_by('-uploaded_at').first()
                        if match:
                            suggested_data[f_name] = str(match.id)
                            changed = True

                if changed:
                    if existing_resp:
                        existing_resp['response_data'] = suggested_data
                    else:
                        resp_list.append({
                            'step_index': idx,
                            'step_name': 'documents',
                            'response_data': suggested_data
                        })

        return Response(project_data)



# ---------------------------------------------------------------------------
# 7. GP Endpoints
# ---------------------------------------------------------------------------

class GPProjectListView(generics.ListCreateAPIView):
    """
    GET /api/deals/projects/  - List deals
    POST /api/deals/projects/ - Create a manual deal
    Permission: IsGPStaff
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PEProjectDetailSerializer
        return PEProjectListSerializer

    def get_queryset(self):
        qs = PEProject.objects.select_related(
            'fund', 'entrepreneur_user', 'created_by'
        ).order_by('-created_at')

        # Filters
        params = self.request.query_params
        if status_filter := params.get('status'):
            if ',' in status_filter:
                qs = qs.filter(status__in=status_filter.split(','))
            else:
                qs = qs.filter(status=status_filter)
        if fund_id := params.get('fund_id'):
            qs = qs.filter(fund_id=fund_id)
        if deal_type := params.get('deal_type'):
            qs = qs.filter(deal_type=deal_type)
        if sector := params.get('sector'):
            qs = qs.filter(sector=sector)
        if search := params.get('search'):
            qs = qs.filter(legal_name__icontains=search)
        return qs

    def perform_create(self, serializer):
        # When GP creates manually, we set submission_type to MANUAL_GP
        serializer.save(
            created_by=self.request.user,
            submission_type=PEProject.SubmissionType.MANUAL_GP
        )


class GPProjectDetailView(generics.RetrieveUpdateAPIView):
    """
    GET /api/deals/projects/{id}/
    PATCH /api/deals/projects/{id}/
    Full project detail / Update workflow fields.
    Permission: IsGPStaff, IsDealAccessible
    """
    serializer_class = PEProjectDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsGPStaff, IsDealAccessible]
    queryset = PEProject.objects.select_related('fund', 'entrepreneur_user', 'created_by')

    def perform_update(self, serializer):
        old_status = self.get_object().status
        instance = serializer.save()
        if old_status != instance.status:
            _log_audit_event(
                ImmutableAuditEvent.EventType.PROJECT_STATUS_CHANGED,
                instance,
                actor=self.request.user,
                payload={'old_status': old_status, 'new_status': instance.status},
                request=self.request,
            )


class GPProjectUpdateView(generics.UpdateAPIView):
    """
    PATCH /api/deals/projects/{id}/
    Update status and other workflow fields.
    Permission: IsGPStaff, IsDealAccessible
    """
    serializer_class = PEProjectDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsGPStaff, IsDealAccessible]
    queryset = PEProject.objects.all()
    http_method_names = ['patch']

    def perform_update(self, serializer):
        old_status = self.get_object().status
        instance = serializer.save()
        if old_status != instance.status:
            _log_audit_event(
                ImmutableAuditEvent.EventType.PROJECT_STATUS_CHANGED,
                instance,
                actor=self.request.user,
                payload={'old_status': old_status, 'new_status': instance.status},
                request=self.request,
            )


class GPProjectDocumentsView(generics.ListAPIView):
    """
    GET /api/deals/projects/{id}/documents/
    Permission: IsGPStaff
    """
    serializer_class = PEProjectDocumentSerializer
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get_queryset(self):
        project = get_deal_for_user(self.request, pk=self.kwargs['pk'])
        return PEProjectDocument.objects.filter(project=project).order_by('-uploaded_at')


class GPProjectFormResponsesView(generics.ListAPIView):
    """
    GET /api/deals/projects/{id}/form-responses/
    Permission: IsGPStaff
    """
    serializer_class = PEProjectFormResponseSerializer
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get_queryset(self):
        project = get_deal_for_user(self.request, pk=self.kwargs['pk'])
        return PEProjectFormResponse.objects.filter(project=project).order_by('step_index')


class GPGetUploadURLView(APIView):
    """
    POST /api/deals/projects/{pk}/get-upload-url/
    Permission: IsGPStaff
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, project_id):
        project = get_deal_for_user(request, pk=project_id)
        serializer = DocumentUploadRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        try:
            presign = generate_presigned_upload_url(
                project_id=str(project.pk),
                filename=d['filename'],
                content_type=d.get('content_type'),
            )
        except Exception as exc:
            return Response({'detail': str(exc)}, status=502)

        doc = PEProjectDocument.objects.create(
            project=project,
            file_key=presign['file_key'],
            filename=d['filename'],
            file_size=d['file_size'],
            mime_type=d.get('content_type', 'application/octet-stream'),
            category=d['category'],
            uploaded_by=request.user,
            is_confirmed=False,
        )

        return Response({
            'url': presign['url'],
            'file_key': presign['file_key'],
            'document_id': doc.id,
            'content_type': presign['content_type'],
        })


# ---------------------------------------------------------------------------
# 8. LP Endpoints
# ---------------------------------------------------------------------------

class LPDashboardView(APIView):
    """
    GET /api/lp/dashboard/
    Multi-fund summary for the logged-in LP.
    Permission: IsLPRole
    """
    permission_classes = [permissions.IsAuthenticated, IsLPRole]

    def get(self, request):
        try:
            lp_profile = request.user.lp_profile
        except LPProfile.DoesNotExist:
            return Response(
                {'detail': 'LP profile not found. Please contact support.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        commitments = LPFundCommitment.objects.filter(
            lp_profile=lp_profile
        ).select_related('fund')
        funds = [c.fund for c in commitments]

        # Financial Aggregates
        # Sum both CALLED and RECEIVED capital calls for the "Capital Called" metric
        total_called = CapitalCall.objects.filter(
            lp_commitment__in=commitments,
            status__in=['CALLED', 'PAID', 'VERIFIED', 'RECEIVED']
        ).aggregate(models.Sum('amount_npr'))['amount_npr__sum'] or 0

        # Only sum RECEIVED for performance ratios (actual paid-in capital)
        paid_in_capital = CapitalCall.objects.filter(
            lp_commitment__in=commitments,
            status__in=['VERIFIED', 'RECEIVED']
        ).aggregate(models.Sum('amount_npr'))['amount_npr__sum'] or 0

        total_distributed = Distribution.objects.filter(
            lp_commitment__in=commitments
        ).aggregate(models.Sum('amount_npr'))['amount_npr__sum'] or 0

        # Get 3 most recent documents across all these funds
        recent_docs = FundDocument.objects.filter(
            fund_id__in=[f.id for f in funds],
            is_published=True
        ).order_by('-publish_date')[:3]

        # Recent transactions for activity feed
        recent_calls = CapitalCall.objects.filter(lp_commitment__in=commitments).order_by('-call_date')[:5]
        recent_dist = Distribution.objects.filter(lp_commitment__in=commitments).order_by('-distribution_date')[:5]
        
        activity = []
        for c in recent_calls:
            activity.append({
                'type': 'CAPITAL_CALL',
                'title': f"Capital Call: {c.fund.name}",
                'amount': float(c.amount_npr),
                'date': str(c.call_date),
                'status': c.status
            })
        for d in recent_dist:
            activity.append({
                'type': 'DISTRIBUTION',
                'title': f"Distribution: {d.fund.name}",
                'amount': float(d.amount_npr),
                'date': str(d.distribution_date),
                'status': 'COMPLETED'
            })
        activity.sort(key=lambda x: x['date'], reverse=True)

        # Calculate real metrics using helper
        performance = _calculate_lp_performance_metrics(lp_profile)

        # Enrichment for Management Fees Accruals
        accrued_unpaid_db = ManagementFeeAccrual.objects.filter(
            lp_commitment__in=commitments,
            is_called=False
        ).aggregate(models.Sum('fee_amount'))['fee_amount__sum'] or 0

        # Calculate live accrual since last recorded period
        total_live_accrual = 0
        from .fee_utils import calculate_fee_for_period
        today = date.today()
        for comm in commitments:
            last_accrual = ManagementFeeAccrual.objects.filter(lp_commitment=comm).order_by('-period_end_date').first()
            if last_accrual:
                start_date = last_accrual.period_end_date + timedelta(days=1)
            else:
                # Fallback if no accrual exists yet
                start_date = max(
                    comm.commitment_date,
                    comm.fee_start_date_override or date(2020, 1, 1)
                )
            
            if start_date < today:
                try:
                    live_fee, _, _ = calculate_fee_for_period(comm, start_date, today)
                    total_live_accrual += float(live_fee)
                except Exception as e:
                    logger.error(f"Error calculating live fee for {comm.id}: {str(e)}")
        
        total_accrued_unpaid = float(accrued_unpaid_db) + total_live_accrual

        # Nepali Fiscal Year (Shrawan to Ashad) - approx. 16 July to 15 July
        now = timezone.now()
        if now.month > 7 or (now.month == 7 and now.day >= 16):
            fy_start = date(now.year, 7, 16)
        else:
            fy_start = date(now.year - 1, 7, 16)
            
        paid_ytd = CapitalCall.objects.filter(
            lp_commitment__in=commitments,
            call_type=CapitalCall.CallType.MANAGEMENT_FEE,
            status=CapitalCall.Status.RECEIVED,
            call_date__gte=fy_start
        ).aggregate(models.Sum('amount_npr'))['amount_npr__sum'] or 0

        return Response({
            'lp_profile': LPProfileSerializer(lp_profile).data,
            'funds': LPDashboardFundSerializer(
                funds, many=True, context={'request': request}
            ).data,
            'recent_documents': FundDocumentSerializer(recent_docs, many=True, context={'request': request}).data,
            'activity_feed': activity[:5],
            'total_committed_npr': float(sum(c.committed_amount_npr for c in commitments)),
            'total_called_npr': float(total_called),
            'total_paid_in_npr': float(paid_in_capital),
            'total_distributed_npr': float(total_distributed),
            'total_value_npr': float(total_distributed) + float(performance.get('total_rv', total_called - total_distributed)),
            'nav_npr': float(performance.get('total_rv', total_called - total_distributed)),
            'total_mgmt_fees_npr': float(performance.get('total_mgmt_fees', 0)),
            'estimated_carry_npr': float(performance.get('estimated_carry', 0)),
            'management_fees': {
                'total_accrued_unpaid_npr': float(total_accrued_unpaid),
                'total_paid_ytd_npr': float(paid_ytd),
                'total_paid_ltd_npr': float(performance.get('total_mgmt_fees', 0)),
            },
            'performance': performance,
            'total_credit_balance_npr': float(sum(c.credit_balance_npr for c in commitments)),
            'pending_calls': CapitalCallSerializer(
            CapitalCall.objects.filter(lp_commitment__in=commitments, status__in=['CALLED', 'PAID', 'VERIFIED']).select_related('fund'),
                many=True
            ).data,
        })


class LPFundDetailView(APIView):
    """
    GET /api/lp/fund/{fund_id}/
    Fund detail with approved/closed deals visible to LPs.
    Permission: IsLPRole
    """
    permission_classes = [permissions.IsAuthenticated, IsLPRole]

    def get(self, request, fund_id):
        fund = get_object_or_404(Fund, pk=fund_id)

        # Only approved / closed deals visible to LP
        deals = PEProject.objects.filter(
            fund=fund,
            status__in=[PEProject.Status.LOI_ISSUED, PEProject.Status.CONTRACT_SIGNED, PEProject.Status.CAPITAL_CALLED, PEProject.Status.CLOSED],
        )

        return Response({
            'fund': FundSerializer(fund).data,
            'approved_deals': PEProjectListSerializer(deals, many=True).data,
        })



class LPSupportRequestView(APIView):
    """
    POST /api/deals/lp/support-request/
    Allows LP to submit a support ticket.
    """
    permission_classes = [permissions.IsAuthenticated, IsLPRole]

    def post(self, request):
        try:
            lp_profile = request.user.lp_profile
        except LPProfile.DoesNotExist:
            return Response({'detail': 'LP profile not found.'}, status=404)

        serializer = LPSupportRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(lp_profile=lp_profile)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        """List requests from this LP."""
        try:
            lp_profile = request.user.lp_profile
        except LPProfile.DoesNotExist:
            return Response({'detail': 'LP profile not found.'}, status=404)
        
        requests = LPSupportRequest.objects.filter(lp_profile=lp_profile)
        serializer = LPSupportRequestSerializer(requests, many=True)
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# 9. GP Investor Endpoints
# ---------------------------------------------------------------------------

class GPInvestorDashboardView(APIView):
    """
    GET /api/gp-investor/dashboard/
    Shareholding, fund performance, IR data.
    Permission: IsGPInvestorRole
    """
    permission_classes = [permissions.IsAuthenticated, IsGPInvestorRole]

    def get(self, request):
        # 1. Get Shareholder Profile
        try:
            shareholder = request.user.gp_shareholding
        except GPShareholder.DoesNotExist:
            shareholder = None

        # 2. Get Dividend History
        dividends = []
        total_dividends = 0
        if shareholder:
            dividend_objs = shareholder.dividends.all()
            total_dividends = float(sum(d.amount_npr for d in dividend_objs))
            dividends = [{
                'amount_npr': float(d.amount_npr),
                'payment_date': str(d.payment_date),
                'fiscal_year': d.fiscal_year,
                'status': d.status
            } for d in dividend_objs]

        # 3. Aggregate Firm-wide Metrics (AUM)
        funds = Fund.objects.all().order_by('-vintage_year')
        from django.db.models import Sum
        commitments = LPFundCommitment.objects.aggregate(Sum('committed_amount_npr'))['committed_amount_npr__sum'] or 0

        # 4. Active Proposals Count
        active_proposals_count = GovernanceProposal.objects.filter(status='ACTIVE').count()

        # 5. Latest IR Announcements
        latest_announcements = IRDocumentSerializer(
            IRDocument.objects.filter(is_published=True).order_by('-uploaded_at')[:3],
            many=True
        ).data
        
        # 6. Fetch Internal Documents (GP Shareholder Reports / Board Minutes)
        internal_docs = FundDocument.objects.filter(
            document_type__in=['SHAREHOLDER_REPORT', 'BOARD_MINUTES'],
            is_published=True
        ).order_by('-publish_date')

        return Response({
            'shareholder': {
                'shares_held': float(shareholder.shares_held) if shareholder else 0,
                'ownership_percentage': float(shareholder.ownership_percentage) if shareholder else 0,
                'vesting_status': shareholder.vesting_status if shareholder else 'N/A',
                'total_dividends_npr': total_dividends,
                'dividend_history': dividends[:5]
            } if shareholder else None,
            'total_committed_npr': float(commitments),
            'active_proposals_count': active_proposals_count,
            'latest_announcements': latest_announcements,
            'funds': LPDashboardFundSerializer(funds, many=True, context={'request': request}).data,
            'internal_documents': FundDocumentSerializer(internal_docs, many=True, context={'request': request}).data,
        })


# ---------------------------------------------------------------------------
# Utility: Fund CRUD (GP-only)
# ---------------------------------------------------------------------------

class FundListCreateView(generics.ListCreateAPIView):
    """GET /api/deals/funds/  POST /api/deals/funds/"""
    serializer_class = FundSerializer
    queryset = Fund.objects.all()

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsGPStaff()]


class FundDetailView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/deals/funds/{id}/"""
    serializer_class = FundSerializer
    queryset = Fund.objects.all()

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsGPStaff()]


# ---------------------------------------------------------------------------
# Utility: LP Profile management (GP or self)
# ---------------------------------------------------------------------------

class LPProfileListCreateView(generics.ListCreateAPIView):
    serializer_class = LPProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    queryset = LPProfile.objects.select_related('user')


class LPProfileDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = LPProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    queryset = LPProfile.objects.all()


class LPProfileSelfView(generics.RetrieveUpdateAPIView):
    """
    GET /api/lp/profile/
    Returns the authenticated user's LP profile.
    Fixes "Member Since" N/A issue.
    """
    serializer_class = LPProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsLPRole]

    def get_object(self):
        try:
            return self.request.user.lp_profile
        except LPProfile.DoesNotExist:
            from django.http import Http404
            raise Http404("LP Profile not found")


class LPKYCUploadView(generics.CreateAPIView):
    """
    POST /api/lp/kyc/upload/
    Handles local multipart/form-data upload of KYC documents.
    Restricts to PDF/Images via model-level validation.
    """
    serializer_class = LPKYCDocumentSerializer
    permission_classes = [permissions.IsAuthenticated, IsLPRole]

    def perform_create(self, serializer):
        lp_profile = get_object_or_404(LPProfile, user=self.request.user)
        serializer.save(lp_profile=lp_profile)


# ---------------------------------------------------------------------------
# Utility: Form Template management (GP-only)
# ---------------------------------------------------------------------------

class PEFormTemplateListView(generics.ListCreateAPIView):
    """GET/POST /api/deals/form-templates/"""
    serializer_class = PEFormTemplateSerializer
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    queryset = PEFormTemplate.objects.all()


class PEFormTemplateDetailView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/deals/form-templates/{id}/"""
    serializer_class = PEFormTemplateSerializer
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    queryset = PEFormTemplate.objects.all()


# ---------------------------------------------------------------------------
# Authenticated Entrepreneur Form Submission (using Project ID instead of Token)
# ---------------------------------------------------------------------------

class EntrepreneurAuthSubmitStepView(APIView):
    """
    POST /api/entrepreneur/submissions/{project_id}/step/{step_name}/
    Saves form response for an authenticated entrepreneur.
    """
    permission_classes = [permissions.IsAuthenticated, IsEntrepreneurRole]

    def post(self, request, project_id, step_name):
        from django.utils import timezone
        project = get_deal_for_user(self.request, pk=project_id, entrepreneur_user=request.user)
        
        template = PEFormTemplate.objects.filter(
            form_type=PEFormTemplate.FormType.DEAL_SUBMISSION,
            is_active=True,
        ).order_by('-version').first()

        if not template:
            return Response({'detail': 'No active form template found.'}, status=404)

        step_def = next((s for s in template.steps if s.get('step_name') == step_name), None)
        if not step_def:
            return Response({'detail': f"Step '{step_name}' not found."}, status=400)

        required_fields = [f for f in step_def.get('fields', []) if f.get('required', False)]
        missing_required = []

        for field in required_fields:
            field_name = field.get('name')
            field_type = field.get('type')
            value = request.data.get(field_name)

            if field_type == 'file_upload':
                # Verify the document actually exists in the DB and is confirmed.
                # A non-empty string that doesn't match a real document is treated
                # as missing — this prevents stale IDs from bypassing validation.
                doc_valid = False
                if value and isinstance(value, str) and value.strip():
                    doc_valid = PEProjectDocument.objects.filter(
                        pk=value.strip(),
                        project=project,
                        is_confirmed=True,
                    ).exists()
                if not doc_valid:
                    missing_required.append(field.get('label', field_name))
            elif field_type in ('checkbox', 'bool'):
                if not value:
                    missing_required.append(field.get('label', field_name))
            elif value is None or (isinstance(value, str) and not value.strip()):
                missing_required.append(field.get('label', field_name))

        # Always block advancement when required fields are missing.
        step_advancement_blocked = bool(missing_required)

        response_obj, _ = PEProjectFormResponse.objects.update_or_create(
            project=project,
            step_index=step_def['step_index'],
            defaults={
                'step_name': step_name,
                'template': template,
                'response_data': request.data,
            }
        )

        can_advance = not step_advancement_blocked
        if can_advance and project.form_step_completed < step_def['step_index']:
            project.form_step_completed = step_def['step_index']
            project.save(update_fields=['form_step_completed'])
        elif step_advancement_blocked and project.form_step_completed >= step_def['step_index']:
            # Step was previously marked complete but now fails validation (e.g. stale doc IDs).
            # Roll back form_step_completed so the user cannot skip to later steps.
            project.form_step_completed = step_def['step_index'] - 1
            project.save(update_fields=['form_step_completed'])

        return Response({
            'status': 'saved',
            'step_completed': project.form_step_completed,
            'can_advance': can_advance,
            'missing_required': missing_required,
        })


class EntrepreneurAuthFinalizeView(APIView):
    """
    POST /api/entrepreneur/submissions/{project_id}/finalize/
    Finalizes the submission for an authenticated entrepreneur.
    Validates all required fields across all steps before allowing final submission.
    """
    permission_classes = [permissions.IsAuthenticated, IsEntrepreneurRole]

    def post(self, request, project_id):
        from django.utils import timezone
        project = get_deal_for_user(self.request, pk=project_id, entrepreneur_user=request.user)

        template = PEFormTemplate.objects.filter(
            form_type=PEFormTemplate.FormType.DEAL_SUBMISSION,
            is_active=True,
        ).order_by('-version').first()

        if not template:
            return Response({'detail': 'No active form template found.'}, status=404)

        saved_responses = {
            r.step_index: r.response_data
            for r in PEProjectFormResponse.objects.filter(project=project)
        }

        # Pre-fetch all confirmed document IDs for this project to avoid N+1 queries.
        confirmed_doc_ids = set(
            PEProjectDocument.objects
            .filter(project=project, is_confirmed=True)
            .values_list('id', flat=True)
        )
        # Convert UUIDs to strings for easy comparison with response_data values.
        confirmed_doc_ids_str = {str(doc_id) for doc_id in confirmed_doc_ids}

        all_missing = []

        for step in template.steps:
            step_index = step.get('step_index')
            step_data = saved_responses.get(step_index, {})

            for field in step.get('fields', []):
                if not field.get('required', False):
                    continue

                field_name = field.get('name')
                field_type = field.get('type')
                field_label = field.get('label', field_name)
                value = step_data.get(field_name)

                is_missing = False
                if field_type == 'file_upload':
                    # A field is only valid if the doc ID resolves to a real,
                    # confirmed document on this project. Stale / orphaned IDs
                    # from prior sessions are treated as missing.
                    if not value or str(value).strip() not in confirmed_doc_ids_str:
                        is_missing = True
                elif field_type in ('checkbox', 'bool'):
                    if not value:
                        is_missing = True
                elif value is None or (isinstance(value, str) and not value.strip()):
                    is_missing = True

                if is_missing:
                    all_missing.append({
                        'step': step.get('title'),
                        'step_index': step_index,
                        'field': field_name,
                        'label': field_label,
                        'type': field_type
                    })

        if all_missing:
            return Response({
                'detail': 'Please complete all required fields before finalizing.',
                'missing_required': all_missing,
            }, status=400)

        project.status = PEProject.Status.SUBMITTED
        project.submitted_at = timezone.now()
        project.save(update_fields=['status', 'submitted_at'])
        return Response({'status': 'finalized'})


class EntrepreneurAuthGetUploadURLView(APIView):
    """
    GET /api/entrepreneur/submissions/{project_id}/get-upload-url/?category=...&filename=...
    Get B2 presigned URL for an authenticated entrepreneur.
    """
    permission_classes = [permissions.IsAuthenticated, IsEntrepreneurRole]

    def post(self, request, project_id):
        from deals.b2_utils import generate_presigned_upload_url
        project = get_deal_for_user(self.request, pk=project_id, entrepreneur_user=request.user)
        
        serializer = DocumentUploadRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        try:
            presign = generate_presigned_upload_url(
                project_id=str(project.pk),
                filename=d['filename'],
                content_type=d.get('content_type'),
            )
        except Exception as exc:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Upload URL Generation Error: {exc}", exc_info=True)
            return Response({'detail': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        
        doc = PEProjectDocument.objects.create(
            project=project,
            category=d['category'],
            filename=d['filename'],
            file_key=presign['file_key'],
            mime_type=presign['content_type'],
            file_size=d.get('file_size', 0),
            uploaded_by=request.user,
            is_confirmed=False,
        )

        return Response({
            'url': presign['url'],
            'file_key': presign['file_key'],
            'document_id': doc.id,
            'content_type': presign['content_type'],
        })


class EntrepreneurAuthUploadLocalView(APIView):
    """
    POST /api/entrepreneur/submissions/{project_id}/upload-local/
    Direct multipart upload to local storage.
    Used for initial entrepreneur submissions to avoid B2/CORS issues.
    """
    permission_classes = [permissions.IsAuthenticated, IsEntrepreneurRole]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request, project_id):
        project = get_deal_for_user(self.request, pk=project_id, entrepreneur_user=request.user)
        file_obj = request.FILES.get('file')
        category = request.data.get('document_type', 'OTHER')

        if not file_obj:
            return Response({'detail': 'No file uploaded.'}, status=400)
        
        # 3MB Size Limit
        if file_obj.size > 3 * 1024 * 1024:
            return Response({'detail': 'File size exceeds the 3MB limit.'}, status=400)

        doc = PEProjectDocument.objects.create(
            project=project,
            category=category,
            filename=file_obj.name,
            file_key=f"local/{project.id}/{file_obj.name}",
            mime_type=file_obj.content_type,
            file_size=file_obj.size,
            local_file=file_obj,
            uploaded_by=request.user,
            is_confirmed=True, # Locally uploaded is immediately confirmed
        )

        return Response({
            'document_id': doc.id,
            'filename': doc.filename,
            'url': doc.local_file.url
        }, status=201)


# ---------------------------------------------------------------------------
# 15. AI Financials & QoE Endpoints
# ---------------------------------------------------------------------------

class GPProjectExtractFinancialsView(APIView):
    """
    POST /api/deals/projects/<uuid>/extract-financials/
    Triggers AI extraction for a specific document.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, pk):
        document_id = request.data.get('document_id')
        if not document_id:
            raise ValidationError("document_id is required.")
        
        # Trigger Celery Task
        task = extract_financials_from_document.delay(document_id)
        
        return Response({
            "status": "Task triggered",
            "task_id": task.id
        }, status=status.HTTP_202_ACCEPTED)


class GPProjectExtractedFinancialsView(generics.ListCreateAPIView):
    """
    GET /api/deals/projects/<uuid>/extracted-financials/
    POST /api/deals/projects/<uuid>/extracted-financials/ (Manual Entry)
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    serializer_class = ExtractedFinancialsSerializer

    def get_queryset(self):
        return ExtractedFinancials.objects.filter(project_id=self.kwargs['pk'])

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs['pk'])


class GPProjectQoEAnalysisView(APIView):
    """
    GET /api/deals/projects/<uuid>/qoe-analysis/
    Returns latest report or triggers a new one if requested.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        
        # Check if they want to trigger a new analysis
        if request.query_params.get('trigger') == 'true':
            task = run_qoe_analysis.delay(str(project.pk))
            return Response({"status": "Analysis triggered", "task_id": task.id}, status=status.HTTP_202_ACCEPTED)

        report = project.qoe_reports.first()
        if not report:
            return Response({"detail": "No QoE report found for this project."}, status=status.HTTP_404_NOT_FOUND)
            
        return Response(QoEReportSerializer(report).data)

class GPProjectQoEUpdateView(generics.RetrieveUpdateAPIView):
    """
    PATCH /api/deals/projects/<uuid>/qoe-analysis/<id>/
    Manual edit of the QoE report by GP.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    serializer_class = QoEReportSerializer
    lookup_url_kwarg = 'report_id'

    def get_queryset(self):
        return QoEReport.objects.filter(project_id=self.kwargs['pk'])

    def perform_update(self, serializer):
        instance = serializer.save()
        _log_audit_event(
            event_type='QOE_REPORT_EDITED',
            actor=self.request.user,
            obj=instance,
            payload=self.request.data,
            request=self.request
        )


class GPExtractedFinancialsUpdateView(generics.RetrieveUpdateDestroyAPIView):
    """
    PATCH /api/deals/projects/<uuid>/extracted-financials/<id>/
    DELETE /api/deals/projects/<uuid>/extracted-financials/<id>/
    GP manually overrides or deletes the extracted financial data.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    serializer_class = ExtractedFinancialsSerializer
    lookup_url_kwarg = 'fin_id'

    def get_queryset(self):
        return ExtractedFinancials.objects.filter(project_id=self.kwargs['pk'])

    def perform_update(self, serializer):
        instance = serializer.save()
        _log_audit_event(
            event_type='FINANCIAL_OVERRIDE',
            actor=self.request.user,
            obj=instance,
            payload=self.request.data,
            request=self.request
        )


class GPExtractedFinancialsVerifyView(APIView):
    """
    PATCH /api/deals/projects/<uuid>/extracted-financials/<id>/verify/
    GP verifies (and optionally updates) the extracted financial data.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def patch(self, request, pk, fin_id):
        financial = get_object_or_404(ExtractedFinancials, pk=fin_id, project_id=pk)
        
        # If data is provided, update before verifying
        if request.data:
            serializer = ExtractedFinancialsSerializer(financial, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            financial = serializer.save()

        financial.is_verified_by_gp = True
        financial.verified_by = request.user
        financial.verified_at = timezone.now()
        financial.save()
        
        return Response(ExtractedFinancialsSerializer(financial).data)


class GPProjectCommercialAnalysisView(APIView):
    """
    POST /api/deals/projects/<uuid>/run-commercial-analysis/
    GET /api/deals/projects/<uuid>/commercial-analysis/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        task = run_commercial_analysis.delay(str(project.pk))
        return Response({"status": "Commercial analysis triggered", "task_id": task.id}, status=status.HTTP_202_ACCEPTED)

    def get(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        analysis = project.commercial_analyses.first()
        if not analysis:
            return Response({"detail": "No commercial analysis found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(CommercialAnalysisSerializer(analysis).data)

    def patch(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        analysis = project.commercial_analyses.first()
        if not analysis:
            return Response({"detail": "No commercial analysis found to update."}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = CommercialAnalysisSerializer(analysis, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GPProjectOperationalAnalysisView(APIView):
    """
    POST /api/deals/projects/<uuid>/run-operational-analysis/
    GET /api/deals/projects/<uuid>/operational-analysis/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        manual_context = request.data.get('manual_context', '')
        task = run_operational_analysis.delay(str(project.pk), manual_context=manual_context)
        return Response({"status": "Operational analysis triggered", "task_id": task.id}, status=status.HTTP_202_ACCEPTED)

    def get(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        analysis = project.operational_analyses.first()
        if not analysis:
            return Response({"detail": "No operational analysis found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(OperationalAnalysisSerializer(analysis).data)

    def patch(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        analysis = project.operational_analyses.first()
        if not analysis:
            return Response({"detail": "No operational analysis found to update."}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = OperationalAnalysisSerializer(analysis, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GPLegalScannerView(APIView):
    """
    POST /api/deals/projects/<uuid>/documents/<id>/scan-legal/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, pk, doc_id):
        get_deal_for_user(self.request, pk=pk)
        doc = get_object_or_404(PEProjectDocument, pk=doc_id, project_id=pk)
        
        task = scan_legal_document.delay(str(doc.id))
        return Response({"status": "Legal scan triggered", "task_id": task.id}, status=status.HTTP_202_ACCEPTED)


class GPProjectRedFlagsView(generics.ListAPIView):
    """
    GET /api/deals/projects/<uuid>/red-flags/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    serializer_class = RedFlagFindingSerializer

    def get_queryset(self):
        return RedFlagFinding.objects.filter(project_id=self.kwargs['pk'])


class GPRedFlagReviewView(APIView):
    """
    PATCH /api/deals/red-flags/<id>/review/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def patch(self, request, pk):
        finding = get_object_or_404(RedFlagFinding, pk=pk)
        finding.is_reviewed_by_gp = True
        finding.reviewed_by = request.user
        finding.reviewed_at = timezone.now()
        finding.save()
        return Response(RedFlagFindingSerializer(finding).data)


class GPTriggerScoringView(APIView):
    """
    POST /api/deals/projects/<uuid:project_id>/trigger-scoring/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        task = run_finlo_scoring.delay(str(project.id), request.user.id)
        return Response({"status": "FINLO scoring triggered", "task_id": task.id}, status=status.HTTP_202_ACCEPTED)


class GPProjectLatestScoringView(APIView):
    """
    GET /api/deals/projects/<uuid:project_id>/scoring/latest/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        run = project.scoring_runs.first()
        if not run:
            return Response({"detail": "No scoring run found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(ScoringRunSerializer(run).data)


class GPCriterionOverrideView(APIView):
    """
    PATCH /api/deals/projects/<uuid:project_id>/scoring/criteria/<uuid:score_id>/override/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def patch(self, request, pk, score_id):
        score = get_object_or_404(CriterionScore, pk=score_id, scoring_run__project_id=pk)
        old_val = score.gp_score or score.ai_score
        new_val = request.data.get('gp_score')
        notes = request.data.get('gp_notes', '')

        if new_val is None:
            return Response({"detail": "gp_score is required"}, status=status.HTTP_400_BAD_REQUEST)

        score.gp_score = new_val
        score.gp_notes = notes
        score.overridden_by = request.user
        score.overridden_at = timezone.now()
        score.save()

        # Log Audit Event
        _log_audit_event(
            event_type='SCORING_OVERRIDE',
            actor=request.user,
            obj=score,
            payload={
                "criterion": score.criterion_id,
                "old_value": old_val,
                "new_value": new_val,
                "notes": notes
            },
            request=request
        )

class GPProjectUploadLocalView(APIView):
    """
    POST /api/deals/projects/{project_id}/upload-local/
    Direct multipart upload to local storage for GP staff.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        file_obj = request.FILES.get('file')
        category = request.data.get('document_type', 'OTHER')

        if not file_obj:
            return Response({'detail': 'No file uploaded.'}, status=400)
        
        # 3MB Size Limit
        if file_obj.size > 3 * 1024 * 1024:
            return Response({'detail': 'File size exceeds the 3MB limit.'}, status=400)

        doc = PEProjectDocument.objects.create(
            project=project,
            category=category,
            filename=file_obj.name,
            file_key=f"local/gp/{project.id}/{file_obj.name}",
            mime_type=file_obj.content_type,
            file_size=file_obj.size,
            local_file=file_obj,
            uploaded_by=request.user,
            is_confirmed=True,
        )

        return Response({
            'document_id': doc.id,
            'filename': doc.filename,
            'category': doc.category,
            'url': doc.url
        }, status=status.HTTP_201_CREATED)


class GPClearComplianceGateView(APIView):
    """
    POST /api/deals/projects/<uuid:project_id>/scoring/gates/<str:gate_id>/clear/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, pk, gate_id):
        run = ScoringRun.objects.filter(project_id=pk).first()
        if not run:
            return Response({"detail": "No scoring run found"}, status=status.HTTP_404_NOT_FOUND)
        
        gate = get_object_or_404(ComplianceGate, scoring_run=run, gate_id=gate_id)
        gate.status = 'CLEARED'
        gate.cleared_by = request.user
        gate.cleared_at = timezone.now()
        gate.notes = request.data.get('notes', '')
        gate.save()

        # Handle documents if provided
        doc_ids = request.data.get('document_ids', [])
        single_doc = request.data.get('document_id')
        if single_doc:
            doc_ids.append(single_doc)
            
        if doc_ids:
            gate.documents.set(doc_ids)

        _log_audit_event(
            event_type='COMPLIANCE_CLEARED',
            actor=request.user,
            obj=gate,
            payload={"gate": gate_id},
            request=request
        )

        return Response(ComplianceGateSerializer(gate).data)


class GPResetComplianceGateView(APIView):
    """
    POST /api/deals/projects/<uuid:project_id>/scoring/gates/<str:gate_id>/reset/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, pk, gate_id):
        run = ScoringRun.objects.filter(project_id=pk).first()
        if not run:
            return Response({"detail": "No scoring run found"}, status=status.HTTP_404_NOT_FOUND)
        
        gate = get_object_or_404(ComplianceGate, scoring_run=run, gate_id=gate_id)
        gate.status = 'PENDING'
        gate.cleared_by = None
        gate.cleared_at = None
        gate.notes = ""
        gate.documents.clear()
        gate.save()

        _log_audit_event(
            event_type='COMPLIANCE_RESET',
            actor=request.user,
            obj=gate,
            payload={"gate": gate_id},
            request=request
        )

        return Response(ComplianceGateSerializer(gate).data)



class GPDCFValuationView(APIView):
    """
    POST /api/deals/projects/<uuid:pk>/valuation/dcf/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        assumptions = request.data.get('assumptions', {})
        
        # Calculate
        outputs = calculate_dcf(assumptions)
        
        # Save
        val = ValuationModel.objects.create(
            project=project,
            model_type='DCF',
            assumptions=assumptions,
            outputs=outputs,
            created_by=request.user
        )
        
        # Save structured assumptions
        DCFAssumptions.objects.create(
            valuation=val,
            projection_years=assumptions.get('projection_years', 5),
            revenue_growth_rate=assumptions.get('revenue_growth_rate', 0),
            ebitda_margin=assumptions.get('ebitda_margin', 0),
            tax_rate=assumptions.get('tax_rate', 0.25),
            wacc=assumptions.get('wacc', 0.1),
            terminal_growth_rate=assumptions.get('terminal_growth_rate', 0.03)
        )
        
        return Response(ValuationModelSerializer(val).data, status=status.HTTP_201_CREATED)


class GPLBOValuationView(APIView):
    """
    POST /api/deals/projects/<uuid:pk>/valuation/lbo/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        assumptions = request.data.get('assumptions', {})
        
        # Calculate
        outputs = calculate_lbo(assumptions)
        
        # Save
        val = ValuationModel.objects.create(
            project=project,
            model_type='LBO',
            assumptions=assumptions,
            outputs=outputs,
            created_by=request.user
        )
        
        # Save structured assumptions
        LBOAssumptions.objects.create(
            valuation=val,
            entry_ebitda=assumptions.get('entry_ebitda', 0),
            purchase_multiple=assumptions.get('entry_multiple', 0),
            debt_financing=assumptions.get('debt_financing', []),
            exit_year=assumptions.get('exit_year', 5),
            exit_multiple=assumptions.get('exit_multiple', 0)
        )
        
        return Response(ValuationModelSerializer(val).data, status=status.HTTP_201_CREATED)


class GPValuationDetailView(generics.RetrieveAPIView):
    """
    GET /api/deals/projects/<uuid:pk>/valuation/<uuid:model_id>/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    serializer_class = ValuationModelSerializer
    lookup_url_kwarg = 'model_id'

    def get_queryset(self):
        return ValuationModel.objects.filter(project_id=self.kwargs['pk'])


class GPValuationSensitivityView(APIView):
    """
    POST /api/deals/projects/<uuid:pk>/valuation/<uuid:model_id>/sensitivity/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, pk, model_id):
        val_model = get_object_or_404(ValuationModel, pk=model_id, project_id=pk)
        
        # Sensitivity inputs: e.g. wacc_range, terminal_growth_range for DCF
        # Or entry_multiple_range, exit_multiple_range for LBO
        sensitivity_config = request.data # { "x_axis": "wacc", "y_axis": "terminal_growth", "x_range": [...], "y_range": [...] }
        
        results = []
        base_assumptions = val_model.assumptions.copy()
        
        x_field = sensitivity_config.get('x_axis')
        y_field = sensitivity_config.get('y_axis')
        x_range = sensitivity_config.get('x_range', [])
        y_range = sensitivity_config.get('y_range', [])
        
        for y_val in y_range:
            row = []
            for x_val in x_range:
                temp_assumptions = base_assumptions.copy()
                temp_assumptions[x_field] = x_val
                temp_assumptions[y_field] = y_val
                
                if val_model.model_type == 'DCF':
                    out = calculate_dcf(temp_assumptions)
                    row.append(out['equity_value'])
                else:
                    out = calculate_lbo(temp_assumptions)
                    row.append(out['irr'])
            results.append({"y_val": y_val, "row": row})
            
        return Response({
            "x_axis": x_field,
            "y_axis": y_field,
            "x_range": x_range,
            "y_range": y_range,
            "results": results
        })


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


class GPGenerateMemoView(APIView):
    """
    POST /api/deals/projects/<uuid:pk>/generate-memo/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        
        # Force immediate processing state
        progress = project.analysis_progress or {}
        progress['Memo'] = 'processing'
        project.analysis_progress = progress
        project.save()
        
        from .tasks import generate_memo_draft
        generate_memo_draft.delay(project.id)
        return Response({"status": "AI memo generation triggered"}, status=status.HTTP_202_ACCEPTED)


class GPMemoDetailView(generics.RetrieveUpdateAPIView):
    """
    GET /api/deals/projects/<uuid:pk>/memos/latest/
    PATCH /api/deals/projects/<uuid:pk>/memos/<uuid:memo_id>/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    serializer_class = DealMemoSerializer

    def get_object(self):
        project = get_deal_for_user(self.request, pk=self.kwargs['pk'])
        if 'memo_id' in self.kwargs:
            return get_object_or_404(DealMemo, pk=self.kwargs['memo_id'], project=project)
        return project.memos.order_by('-version', '-created_at').first()


class GPMemoFinalizeView(APIView):
    """
    POST /api/deals/projects/<uuid:pk>/memos/<uuid:memo_id>/finalize/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, pk, memo_id):
        from .pdf_utils import render_pdf
        from django.utils import timezone
        
        project = get_deal_for_user(request, pk=pk)
        memo = get_object_or_404(DealMemo, pk=memo_id, project=project)
        
        ic_notes = request.data.get('ic_notes', '')
        
        # 1. Update Memo
        memo.status = 'FINAL'
        memo.ic_notes = ic_notes
        memo.save()
        
        # 2. Generate PDF
        context = {
            'project': project,
            'memo': memo,
            'ic_notes': ic_notes,
            'date': timezone.now().date(),
            'gp_name': request.user.get_full_name() or request.user.email,
            'investment_amount': request.data.get('investment_amount', '')
        }
        
        try:
            pdf_bytes = render_pdf('deals/ic_memo_template.html', context)
        except Exception as e:
            return Response({"detail": f"PDF Generation failed: {str(e)}"}, status=500)
            
        # 3. Create Document (Local Storage)
        file_name = f"IC_Memo_{project.legal_name.replace(' ', '_')}_v{memo.version}.pdf"
        
        from django.core.files.base import ContentFile
        
        try:
            doc = PEProjectDocument.objects.create(
                project=project,
                filename=file_name,
                file_size=len(pdf_bytes),
                mime_type='application/pdf',
                category='LEGAL',
                uploaded_by=request.user,
                local_file=ContentFile(pdf_bytes, name=file_name),
                is_confirmed=True
            )
            
            # Note: Project status stays in IC_REVIEW. Signed IC memo upload advances to TERM_SHEET.
            
            # 5. Log Audit Event
            ImmutableAuditEvent.objects.create(
                event_type='MEMO_FINALIZED',
                actor=request.user,
                object_id=project.id,
                object_repr=str(project),
                content_type_label='deals.PEProject',
                payload={'memo_id': str(memo.id), 'document_id': str(doc.id)}
            )
            
            return Response({
                "status": "Memo finalized and IC approved",
                "document_id": str(doc.id)
            })
            
        except Exception as e:
            return Response({"detail": f"Local save failed: {str(e)}"}, status=500)


class GPFullAnalysisView(APIView):
    """
    POST /api/deals/projects/<uuid:pk>/run-full-analysis/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        run_full_analysis.delay(project.id, user_id=request.user.id)
        return Response({"status": "Full AI analysis pipeline triggered"}, status=status.HTTP_202_ACCEPTED)



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
        from .models import GPInvestorMeeting
        from .serializers import GPInvestorMeetingSerializer
        
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
        from .models import GPInvestorMeetingRequest
        from .serializers import GPInvestorMeetingRequestSerializer
        
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

class EntrepreneurKYBUploadView(APIView):
    """
    POST /api/entrepreneur/kyc/upload/
    Handle direct multipart/form-data KYB uploads.
    """
    permission_classes = [permissions.IsAuthenticated, IsEntrepreneurRole]

    def post(self, request):
        if 'file' not in request.FILES:
            return Response({"detail": "No file uploaded"}, status=400)
            
        doc_type = request.data.get('document_type', 'Other')
        
        doc = EntrepreneurKYBDocument.objects.create(
            user=request.user,
            file=request.FILES['file'],
            document_type=doc_type,
            status='PENDING'
        )
        
        return Response(EntrepreneurKYBDocumentSerializer(doc).data, status=201)


class EntrepreneurKYBListView(generics.ListAPIView):
    """
    GET /api/entrepreneur/kyc/
    """
    permission_classes = [permissions.IsAuthenticated, IsEntrepreneurRole]
    serializer_class = EntrepreneurKYBDocumentSerializer

    def get_queryset(self):
        return EntrepreneurKYBDocument.objects.filter(user=self.request.user).order_by('-uploaded_at')


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
from .waterfall import calculate_distribution
from .models import WaterfallRun, Distribution
from .serializers import WaterfallRunSerializer, DistributionSerializer

class WaterfallCalculateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request):
        investment_id = request.data.get('investment_id')
        exit_proceeds = request.data.get('exit_proceeds')
        fund_id = request.data.get('fund_id')
        
        if not investment_id or not exit_proceeds:
            return Response({'detail': 'investment_id and exit_proceeds are required.'}, status=400)
            
        try:
            outputs, run = calculate_distribution(investment_id, exit_proceeds, fund_id)
            
            # Log Audit Event
            _log_audit_event(
                event_type='WATERFALL_CALCULATED',
                actor=request.user,
                obj=run,
                payload={
                    "investment_id": str(investment_id),
                    "exit_proceeds": float(exit_proceeds),
                    "irr": outputs.get('irr')
                },
                request=request
            )
            
            return Response(WaterfallRunSerializer(run).data, status=200)
        except Exception as e:
            return Response({'detail': str(e)}, status=400)


class WaterfallHistoryView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    serializer_class = WaterfallRunSerializer

    def get_queryset(self):
        qs = WaterfallRun.objects.all().order_by('-created_at')
        fund_id = self.request.query_params.get('fund_id')
        if fund_id:
            qs = qs.filter(investment__fund_id=fund_id)
        return qs


class DistributionCreateView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    queryset = Distribution.objects.all()
    serializer_class = DistributionSerializer
    
    def perform_create(self, serializer):
        dist = serializer.save()
        ImmutableAuditEvent.objects.create(
            event_type=ImmutableAuditEvent.EventType.DISTRIBUTION_MADE,
            actor=self.request.user,
            object_id=dist.id,
            object_repr=str(dist),
            content_type_label='deals.Distribution',
            payload={'amount': float(dist.amount_npr)}
        )


class LPDistributionListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsLPRole]
    serializer_class = DistributionSerializer
    
    def get_queryset(self):
        user = self.request.user
        if not hasattr(user, 'lp_profile'):
            return Distribution.objects.none()
        try:
            lp_profile = user.lp_profile
        except LPProfile.DoesNotExist:
            return Distribution.objects.none()
            
        return Distribution.objects.filter(lp_commitment__lp_profile=lp_profile).order_by('-distribution_date')

# ---------------------------------------------------------------------------
# LP Statements
# ---------------------------------------------------------------------------
from .tasks import generate_lp_statements
from .b2_utils import generate_presigned_download_url

class LPStatementGenerateView(APIView):
    """
    POST /api/deals/lp/generate-statement/
    Queue statement generation task.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request):
        fund_id = request.data.get('fund_id')
        quarter = request.data.get('quarter')
        year = request.data.get('year')
        lp_profile_id = request.data.get('lp_profile_id')
        
        if not all([fund_id, quarter, year]):
            return Response({'detail': 'fund_id, quarter, and year are required.'}, status=400)
            
        task = generate_lp_statements.delay(
            fund_id=fund_id,
            quarter=quarter,
            year=year,
            lpprofile_id=lp_profile_id,
            gp_user_id=request.user.id
        )
        
        return Response({
            'task_id': task.id,
            'message': 'Statement generation started'
        }, status=status.HTTP_202_ACCEPTED)


class LPStatementListView(generics.ListAPIView):
    """
    GET /api/deals/lp/me/statements/
    List capital account statements for current LP.
    """
    permission_classes = [permissions.IsAuthenticated, IsLPRole]
    serializer_class = FundDocumentSerializer

    def get_queryset(self):
        user = self.request.user
        if not hasattr(user, 'lp_profile'):
            return FundDocument.objects.none()
            
        lp_profile = user.lp_profile
        fund_ids = lp_profile.fund_commitments.values_list('fund_id', flat=True)
        
        qs = FundDocument.objects.filter(
            fund_id__in=fund_ids,
            document_type=FundDocument.DocType.CAPITAL_ACCOUNT,
            is_published=True
        ).order_by('-publish_date')
        
        fund_id = self.request.query_params.get('fund_id')
        if fund_id:
            qs = qs.filter(fund_id=fund_id)
            
        return qs


class LPStatementDownloadView(APIView):
    """
    GET /api/deals/lp/me/statements/<uuid:doc_id>/download/
    Verify access and return pre-signed B2 download URL.
    """
    permission_classes = [permissions.IsAuthenticated, IsLPRole]

    def get(self, request, doc_id):
        user = self.request.user
        if not hasattr(user, 'lp_profile'):
            raise PermissionDenied()
            
        lp_profile = user.lp_profile
        doc = get_object_or_404(FundDocument, pk=doc_id, document_type=FundDocument.DocType.CAPITAL_ACCOUNT)
        
        # Verify LP is committed to this fund
        if not lp_profile.fund_commitments.filter(fund=doc.fund).exists():
            raise PermissionDenied("You do not have access to this document.")
            
        # Log access in LPDocumentAccess
        from .models import LPDocumentAccess
        from .views import _get_client_ip
        
        LPDocumentAccess.objects.update_or_create(
            lp_profile=lp_profile,
            document=doc,
            defaults={'ip_address': _get_client_ip(request)}
        )
        
        # Audit log
        _log_audit_event(
            ImmutableAuditEvent.EventType.DOCUMENT_DOWNLOADED,
            doc,
            actor=user,
            payload={'type': 'CAPITAL_ACCOUNT'}
        )
        
        url = generate_presigned_download_url(doc.file_key, filename=doc.file_name)
        return Response({'url': url})


class GPFundLPsView(generics.ListAPIView):
    """
    GET /api/deals/funds/<uuid:fund_id>/lps/
    List LPs committed to a specific fund.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    serializer_class = LPProfileSerializer

    def get_queryset(self):
        fund_id = self.kwargs.get('fund_id')
        return LPProfile.objects.filter(fund_commitments__fund_id=fund_id).distinct()


from .monte_carlo import run_monte_carlo

class MonteCarloSimulationView(APIView):
    """
    POST /api/deals/portfolio/monte-carlo/
    Runs a Monte Carlo simulation for a specific investment.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request):
        investment_id = request.data.get('investment_id')
        num_simulations = request.data.get('num_simulations', 10000)
        custom_assumptions = request.data.get('assumptions', {})
        
        if not investment_id:
            return Response({"error": "investment_id is required"}, status=400)
            
        results = run_monte_carlo(
            investment_id=investment_id,
            num_simulations=int(num_simulations),
            custom_assumptions=custom_assumptions
        )
        
        if "error" in results:
            return Response(results, status=404)
            
        # Log Audit Event
        _log_audit_event(
            event_type='MONTE_CARLO_RUN',
            actor=request.user,
            payload={
                "investment_id": str(investment_id),
                "simulations": num_simulations,
                "median_irr": results.get('median_irr')
            },
            request=request
        )
            
        return Response(results)


class PEInvestmentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    List all active PE investments (Fund -> Project links).
    """
    queryset = PEInvestment.objects.all()
    serializer_class = PEInvestmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get_queryset(self):
        fund_id = self.request.query_params.get('fund_id')
        if fund_id:
            return self.queryset.filter(fund_id=fund_id)
        return self.queryset


class ImmutableAuditEventViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GP staff view of relevant audit events.
    Filters: 
    1. Events where the user is the actor.
    2. Events related to projects where the user is creator or collaborator.
    """
    queryset = ImmutableAuditEvent.objects.all()
    serializer_class = ImmutableAuditEventSerializer
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get_queryset(self):
        user = self.request.user
        if user.has_role('super_admin'):
            return self.queryset.all()
            
        # Get projects user can access
        project_ids = PEProject.objects.filter(
            models.Q(created_by=user) | models.Q(collaborators=user)
        ).values_list('id', flat=True)
        
        # Filter events
        return self.queryset.filter(
            models.Q(actor=user) | 
            (models.Q(content_type_label__contains='PEProject') & models.Q(object_id__in=project_ids))
        ).distinct()

# ---------------------------------------------------------------------------
# 16. Valuation & Exit Views
# ---------------------------------------------------------------------------

class ValuationRecordViewSet(viewsets.ModelViewSet):
    """
    CRUD for investment valuations.
    GP staff only. Investors see restricted info via a separate endpoint/serializer.
    """
    queryset = ValuationRecord.objects.all()
    serializer_class = ValuationRecordSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        inv_id = self.kwargs.get('investment_id')
        if inv_id:
            qs = qs.filter(investment_id=inv_id)
        return qs

    def get_permissions(self):
        if self.action == 'destroy':
            return [permissions.IsAuthenticated(), IsGPStaff()]
        return [permissions.IsAuthenticated(), IsGPStaff()]

    def perform_create(self, serializer):
        investment_id = self.kwargs.get('investment_id') or self.request.data.get('investment')
        investment = get_object_or_404(PEInvestment, id=investment_id)
        
        # Auto-populate previous valuation
        prev = ValuationRecord.objects.filter(investment=investment).order_by('-valuation_date').first()
        prev_val = prev.fair_value_npr if prev else None
        
        val_record = serializer.save(
            valuer=self.request.user,
            previous_valuation_npr=prev_val
        )
        
        _log_audit_event(
            event_type='VALUATION_CREATED',
            obj=val_record,
            actor=self.request.user,
            payload={
                "investment_id": str(investment.id),
                "valuation_id": str(val_record.id),
                "fair_value": str(val_record.fair_value_npr)
            }
        )

    def perform_update(self, serializer):
        val_record = serializer.save()
        _log_audit_event(
            event_type='VALUATION_UPDATED',
            obj=val_record,
            actor=self.request.user,
            payload={"valuation_id": str(val_record.id)}
        )

    def perform_destroy(self, instance):
        if not self.request.user.has_role('super_admin'):
            raise PermissionDenied("Only super admins can delete valuations.")
        
        _log_audit_event(
            event_type='VALUATION_DELETED',
            obj=instance,
            actor=self.request.user,
            payload={"valuation_id": str(instance.id), "fair_value": str(instance.fair_value_npr)}
        )
        instance.delete()


class ExitScenarioViewSet(viewsets.ModelViewSet):
    queryset = ExitScenario.objects.all()
    serializer_class = ExitScenarioSerializer
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get_queryset(self):
        qs = super().get_queryset()
        inv_id = self.kwargs.get('investment_id')
        if inv_id:
            qs = qs.filter(investment_id=inv_id)
        return qs

    def perform_create(self, serializer):
        investment_id = self.kwargs.get('investment_id') or self.request.data.get('investment')
        investment = get_object_or_404(PEInvestment, id=investment_id)
        
        # Handle base case uniqueness
        is_base = self.request.data.get('is_base_case', False)
        if is_base:
            ExitScenario.objects.filter(investment=investment, is_base_case=True).update(is_base_case=False)
            
        scenario = serializer.save(created_by=self.request.user)
        
        # IPO Eligibility check
        if scenario.exit_type == 'IPO':
            report = check_ipo_eligibility(investment.project, investment)
            scenario.ipo_is_eligible = report['is_eligible']
            scenario.ipo_eligibility_notes = report['overall_requirements']
            scenario.save()
            
        _log_audit_event(
            event_type='EXIT_SCENARIO_CREATED',
            obj=scenario,
            actor=self.request.user,
            payload={"scenario_id": str(scenario.id), "name": scenario.name}
        )

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        if not request.user.has_role('super_admin'):
            raise PermissionDenied("Only super admins can approve exit scenarios.")
        
        scenario = self.get_object()
        scenario.is_approved_by_ic = True
        scenario.save()
        
        _log_audit_event(
            event_type='EXIT_SCENARIO_APPROVED',
            obj=scenario,
            actor=request.user,
            payload={"scenario_id": str(scenario.id)}
        )
        return Response({"status": "approved"})


class IPOEligibilityView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get(self, request, investment_id):
        investment = get_object_or_404(PEInvestment, id=investment_id)
        report = check_ipo_eligibility(investment.project, investment)
        
        _log_audit_event(
            event_type='IPO_ELIGIBILITY_CHECKED',
            obj=investment,
            actor=request.user,
            payload={"investment_id": str(investment_id)}
        )
        return Response(report)


class ExitSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get(self, request):
        fund_id = request.query_params.get('fund_id')
        scenarios = ExitScenario.objects.filter(is_base_case=True)
        if fund_id:
            scenarios = scenarios.filter(investment__fund_id=fund_id)
            
        total_exit_value = scenarios.aggregate(Sum('expected_exit_value_npr'))['expected_exit_value_npr__sum'] or 0
        
        # Aggregations
        exit_types = scenarios.values('exit_type').annotate(count=models.Count('id'), total_value=Sum('expected_exit_value_npr'))
        
        return Response({
            "total_projected_exit_value_npr": total_exit_value,
            "scenario_count": scenarios.count(),
            "exit_type_distribution": list(exit_types)
        })


# ---------------------------------------------------------------------------
# Phase 2: AI Valuation, IC Signed Upload, Term Sheet, SPA Draft Views
# ---------------------------------------------------------------------------

class GPGenerateAIValuationView(APIView):
    """
    POST /api/deals/projects/<uuid:pk>/generate-ai-valuation/
    Triggers Gemini-powered DCF/LBO assumption generation.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)

        if project.status not in [PEProject.Status.IC_REVIEW, PEProject.Status.TERM_SHEET]:
            return Response({"detail": "AI valuation is only available during IC_REVIEW or TERM_SHEET stage."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Set progress to processing immediately to avoid race condition in polling
        progress = project.analysis_progress or {}
        progress['Valuation'] = 'processing'
        project.analysis_progress = progress
        project.save()

        from .tasks import generate_ai_valuation
        generate_ai_valuation.delay(str(project.id), str(request.user.id))

        return Response({"status": "AI valuation generation started."})


class GPValuationOverrideView(APIView):
    """
    PATCH /api/deals/projects/<uuid:pk>/valuations/<uuid:val_id>/override/
    Override a specific field in a valuation model. Logged to immutable audit.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def patch(self, request, pk, val_id):
        project = get_deal_for_user(self.request, pk=pk)
        val = get_object_or_404(ValuationModel, pk=val_id, project=project)

        field_path = request.data.get('field')  # e.g., "assumptions.wacc" or "outputs.equity_value"
        new_value = request.data.get('value')
        remarks = request.data.get('remarks', '')

        if not field_path or new_value is None:
            return Response({"detail": "'field' and 'value' are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Split field path into target dict and key
        parts = field_path.split('.')
        if len(parts) != 2 or parts[0] not in ('assumptions', 'outputs'):
            return Response({"detail": "Field path must be 'assumptions.<key>' or 'outputs.<key>'."}, status=status.HTTP_400_BAD_REQUEST)

        target_dict_name, key = parts
        target_dict = val.assumptions if target_dict_name == 'assumptions' else val.outputs
        old_value = target_dict.get(key)

        target_dict[key] = new_value
        if target_dict_name == 'assumptions':
            val.assumptions = target_dict
        else:
            val.outputs = target_dict
        val.save()

        # Audit log
        ImmutableAuditEvent.objects.create(
            event_type='VALUATION_OVERRIDE',
            actor=request.user,
            object_id=project.id,
            object_repr=str(project),
            content_type_label='deals.ValuationModel',
            payload={
                'valuation_id': str(val.id),
                'model_type': val.model_type,
                'field': field_path,
                'old_value': old_value,
                'new_value': new_value,
                'remarks': remarks,
            }
        )

        return Response({"status": "Override applied", "field": field_path, "old": old_value, "new": new_value})


class GPUploadSignedICMemoView(APIView):
    """
    POST /api/deals/projects/<uuid:pk>/upload-signed-ic-memo/
    Upload a physically signed IC memo document. Advances deal to TERM_SHEET.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request, pk):
        project = get_deal_for_user(request, pk=pk)

        # Allow upload in IC_REVIEW (standard) or TERM_SHEET (re-upload)
        allowed_statuses = [PEProject.Status.IC_REVIEW, PEProject.Status.TERM_SHEET]
        if project.status not in allowed_statuses:
            return Response({
                "detail": f"Project must be in IC_REVIEW to upload signed IC memo. Current status: {project.status}"
            }, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES.get('file')
        if not file:
            return Response({"detail": "No file provided in 'file' field."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Verify a finalized memo exists
        memo = project.memos.filter(status__in=['FINAL', 'IC_SIGNED']).first()
        if not memo:
            return Response({"detail": "A finalized IC memo draft must exist before uploading a signed copy."}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Save document locally
        doc = PEProjectDocument.objects.create(
            project=project,
            filename=file.name,
            file_key=f"local/gp/{project.id}/signed_{file.name}",
            category='IC_SIGNED',
            local_file=file,
            mime_type=file.content_type,
            file_size=file.size,
            uploaded_by=request.user,
            is_confirmed=True
        )

        # 3. Update memo status
        memo.status = 'IC_SIGNED'
        memo.save()

        # 4. Advance project to TERM_SHEET
        project.status = PEProject.Status.TERM_SHEET
        project.save()

        # 5. Audit
        ImmutableAuditEvent.objects.create(
            event_type='IC_MEMO_SIGNED',
            actor=request.user,
            object_id=project.id,
            object_repr=str(project),
            content_type_label='deals.PEProject',
            payload={
                'document_id': str(doc.id),
                'memo_id': str(memo.id),
                'filename': file.name,
            }
        )

        return Response({
            "status": "Signed IC memo uploaded. Deal advanced to TERM_SHEET.",
            "document_id": str(doc.id),
        })


class GPTermSheetListView(APIView):
    """
    GET  /api/deals/projects/<uuid:pk>/term-sheets/        - List all term sheets
    POST /api/deals/projects/<uuid:pk>/term-sheets/        - Trigger AI generation
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        term_sheets = project.term_sheets.all().order_by('-version', '-created_at')
        return Response(TermSheetSerializer(term_sheets, many=True).data)

    def post(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        if project.status not in [PEProject.Status.IC_REVIEW, PEProject.Status.TERM_SHEET]:
            return Response({"detail": "Term sheet generation requires IC_REVIEW or TERM_SHEET status."}, status=status.HTTP_400_BAD_REQUEST)

        # Set progress to processing immediately to avoid race condition in polling
        progress = project.analysis_progress or {}
        progress['Term Sheet'] = 'processing'
        project.analysis_progress = progress
        project.save(update_fields=['analysis_progress'])

        from .tasks import generate_ai_term_sheet
        generate_ai_term_sheet.delay(str(project.id), str(request.user.id))
        return Response({"status": "AI term sheet generation started."})


class GPTermSheetDetailView(APIView):
    """
    GET   /api/deals/projects/<uuid:pk>/term-sheets/<uuid:ts_id>/
    PATCH /api/deals/projects/<uuid:pk>/term-sheets/<uuid:ts_id>/   - Override fields
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get(self, request, pk, ts_id):
        project = get_deal_for_user(self.request, pk=pk)
        ts = get_object_or_404(TermSheet, pk=ts_id, project=project)
        return Response(TermSheetSerializer(ts).data)

    def patch(self, request, pk, ts_id):
        project = get_deal_for_user(self.request, pk=pk)
        ts = get_object_or_404(TermSheet, pk=ts_id, project=project)

        # Allow overriding individual terms
        overrides = request.data.get('terms', {})
        remarks = request.data.get('remarks', '')
        new_status = request.data.get('status')

        if overrides:
            old_terms = dict(ts.terms)
            ts.terms.update(overrides)
            ts.save()

            # Audit each override
            for key, new_val in overrides.items():
                ImmutableAuditEvent.objects.create(
                    event_type='TERM_OVERRIDE',
                    actor=request.user,
                    object_id=project.id,
                    object_repr=str(project),
                    content_type_label='deals.TermSheet',
                    payload={
                        'term_sheet_id': str(ts.id),
                        'field': key,
                        'old_value': old_terms.get(key),
                        'new_value': new_val,
                        'remarks': remarks,
                    }
                )

        if new_status and new_status in dict(TermSheet._meta.get_field('status').choices):
            ts.status = new_status
            ts.save()

        return Response(TermSheetSerializer(ts).data)


class GPSPADraftListView(APIView):
    """
    GET  /api/deals/projects/<uuid:pk>/spa-drafts/         - List all SPA drafts
    POST /api/deals/projects/<uuid:pk>/spa-drafts/         - Trigger AI generation
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        spa_drafts = project.spa_drafts.all().order_by('-version', '-created_at')
        return Response(SPADraftSerializer(spa_drafts, many=True).data)

    def post(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        if project.status not in [PEProject.Status.TERM_SHEET, PEProject.Status.LOI_ISSUED, PEProject.Status.CONTRACT_SIGNED]:
            return Response({"detail": "SPA draft generation requires TERM_SHEET, LOI_ISSUED or CONTRACT_SIGNED status."}, status=status.HTTP_400_BAD_REQUEST)

        # Set progress to processing immediately
        progress = project.analysis_progress or {}
        progress['SPA Draft'] = 'processing'
        project.analysis_progress = progress
        project.save(update_fields=['analysis_progress'])

        from .tasks import generate_ai_spa_draft
        generate_ai_spa_draft.delay(str(project.id), str(request.user.id))
        return Response({"status": "AI SPA draft generation started."})


class GPSPADraftDetailView(APIView):
    """
    GET   /api/deals/projects/<uuid:pk>/spa-drafts/<uuid:spa_id>/
    PATCH /api/deals/projects/<uuid:pk>/spa-drafts/<uuid:spa_id>/
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get(self, request, pk, spa_id):
        project = get_deal_for_user(self.request, pk=pk)
        spa = get_object_or_404(SPADraft, pk=spa_id, project=project)
        return Response(SPADraftSerializer(spa).data)

    def patch(self, request, pk, spa_id):
        project = get_deal_for_user(self.request, pk=pk)
        spa = get_object_or_404(SPADraft, pk=spa_id, project=project)

        section_key = request.data.get('section_key')
        new_content = request.data.get('new_content')
        remarks = request.data.get('remarks', '')
        new_status = request.data.get('status')

        if section_key and new_content is not None:
            old_content = spa.sections.get(section_key, '')
            spa.sections[section_key] = new_content
            spa.save()

            # Audit log
            ImmutableAuditEvent.objects.create(
                event_type='SPA_CLAUSE_OVERRIDE',
                actor=request.user,
                object_id=project.id,
                object_repr=str(project),
                content_type_label='deals.SPADraft',
                payload={
                    'spa_draft_id': str(spa.id),
                    'section': section_key,
                    'old_value': old_content,
                    'new_value': new_content,
                    'remarks': remarks,
                }
            )

        if new_status:
            spa.status = new_status
            spa.save()

        return Response(SPADraftSerializer(spa).data)


class GPUploadSignedSPAView(APIView):
    """
    POST /api/deals/projects/<uuid:pk>/spa-drafts/<uuid:spa_id>/upload-signed/
    Upload the signed physical SPA. Advances status to CONTRACT_SIGNED.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request, pk, spa_id):
        project = get_deal_for_user(request, pk=pk)
        spa = get_object_or_404(SPADraft, pk=spa_id, project=project)
        
        if spa.status != 'FINAL':
            return Response({"detail": "SPA must be in FINAL status before uploading signed copy."}, status=400)
            
        file_obj = request.FILES.get('signed_spa')
        if not file_obj:
            return Response({"detail": "No file uploaded."}, status=400)
            
        # 1. Archive the document
        import uuid
        doc_name = f"SIGNED_SPA_{project.legal_name.replace(' ', '_')}_{uuid.uuid4().hex[:6]}.pdf"
        doc = PEProjectDocument.objects.create(
            project=project,
            filename=doc_name,
            file_size=file_obj.size,
            mime_type=file_obj.content_type,
            category='SPA',
            uploaded_by=request.user,
            local_file=file_obj,
            is_confirmed=True
        )
        
        # 2. Advance Project Status to CONTRACT_SIGNED
        # (Drawdown/CAPITAL_CALLED is now a manual action for Superadmins)
        project.status = PEProject.Status.CONTRACT_SIGNED
        project.save(update_fields=['status'])
        
        # 3. Audit
        ImmutableAuditEvent.objects.create(
            event_type='SPA_EXECUTED',
            actor=request.user,
            object_id=project.id,
            object_repr=str(project),
            content_type_label='deals.PEProject',
            payload={
                'spa_draft_id': str(spa.id),
                'document_id': str(doc.id),
                'new_status': 'CONTRACT_SIGNED'
            }
        )

        # 4. Notify Superadmin
        try:
            from django.core.mail import send_mail
            from django.contrib.auth import get_user_model
            SuperAdmins = get_user_model().objects.filter(roles__contains='super_admin')
            admin_emails = [a.email for a in SuperAdmins if a.email]
            if admin_emails:
                send_mail(
                    subject=f"Action Required: Signed SPA Uploaded - {project.legal_name}",
                    message=f"GP Staff ({request.user.get_full_name()}) has uploaded the signed SPA for {project.legal_name}.\n\nPlease review the documents and issue the Capital Call to proceed with drawdown.",
                    from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@finlogiccapital.com'),
                    recipient_list=admin_emails,
                    fail_silently=True
                )
        except Exception as e:
            logger.warning(f"Failed to notify superadmin of SPA upload: {e}")
        
        return Response({
            "status": "Signed SPA uploaded successfully. Project is in CONTRACT_SIGNED. Superadmin has been notified for final review and drawdown.",
            "document_id": str(doc.id)
        })


class GPDownloadSPAPDFView(APIView):
    """
    GET /api/deals/projects/<uuid:pk>/spa-drafts/<uuid:spa_id>/download/
    Generates and returns a high-fidelity PDF of the SPA draft.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def get(self, request, pk, spa_id):
        from .pdf_utils import render_pdf
        from django.utils import timezone
        from django.http import HttpResponse

        project = get_deal_for_user(request, pk=pk)
        spa = get_object_or_404(SPADraft, pk=spa_id, project=project)

        labels = {
            'recitals': 'Recitals',
            'definitions': 'Definitions',
            'purchase_price': 'Purchase Price & Payment',
            'representations': 'Representations & Warranties',
            'conditions_precedent': 'Conditions Precedent',
            'covenants': 'Covenants',
            'indemnification': 'Indemnification',
            'governing_law': 'Governing Law & Dispute Resolution',
            'closing_conditions': 'Closing Conditions',
            'termination': 'Termination Provisions',
            'schedules': 'Schedules & Annexures',
        }

        # Context for template - use a list of objects to avoid needing custom filters
        section_list = []
        for key, label in labels.items():
            section_list.append({
                'label': label,
                'content': spa.sections.get(key, '')
            })

        context = {
            'project': project,
            'spa': spa,
            'sections': section_list,
            'date': timezone.now().date(),
        }


        try:
            pdf_bytes = render_pdf('deals/spa_pdf_template.html', context)
        except Exception as e:
            return Response({"detail": f"PDF Generation failed: {str(e)}"}, status=500)

        filename = f"SPA_{project.legal_name.replace(' ', '_')}_v{spa.version}.pdf"
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response



# ---------------------------------------------------------------------------
# Phase 3: LOI Entrepreneur Flow & Capital Calls
# ---------------------------------------------------------------------------

class EntrepreneurUploadSignedLOIView(APIView):
    """
    POST /api/entrepreneur/submissions/{id}/upload-signed-loi/
    Entrepreneur uploads the signed LOI to move the deal forward.
    """
    permission_classes = [permissions.IsAuthenticated, IsEntrepreneurRole]

    def post(self, request, pk):
        project = get_object_or_404(PEProject, pk=pk, entrepreneur_user=request.user)
        
        if project.status != PEProject.Status.LOI_ISSUED:
            return Response({"detail": "Project must be in LOI_ISSUED status to upload signed LOI."}, status=400)
            
        file = request.FILES.get('file')
        if not file:
            return Response({"detail": "No file provided."}, status=400)
            
        # 1. Create document
        doc = PEProjectDocument.objects.create(
            project=project,
            filename=file.name,
            category='LOI_SIGNED',
            local_file=file,
            mime_type=file.content_type,
            file_size=file.size,
            uploaded_by=request.user,
            is_confirmed=True
        )
        
        # 2. Log Audit
        ImmutableAuditEvent.objects.create(
            event_type='LOI_SIGNED_BY_ENTREPRENEUR',
            actor=request.user,
            object_id=project.id,
            object_repr=str(project),
            content_type_label='deals.PEProject',
            payload={
                'document_id': str(doc.id),
                'filename': file.name,
            }
        )
        
        return Response({
            "status": "Signed LOI uploaded successfully. GP staff notified.",
            "document_id": str(doc.id)
        })


class GPCapitalCallBatchView(APIView):
    """
    POST /api/deals/projects/{id}/create-capital-calls/
    Creates pro-rata capital calls for all LPs in the fund for this deal.
    """
    permission_classes = [permissions.IsAuthenticated, IsSuperAdminRole]

    def post(self, request, pk):
        project = get_deal_for_user(self.request, pk=pk)
        
        if project.status != PEProject.Status.CONTRACT_SIGNED:
             return Response({"detail": "Deal must be in CONTRACT_SIGNED status to issue capital calls."}, status=400)
             
        fund = project.fund
        if not fund:
             return Response({"detail": "No fund associated with this project."}, status=400)
             
        amount = request.data.get('total_amount_npr')
        due_date = request.data.get('due_date')
        
        if not amount or not due_date:
            return Response({"detail": "total_amount_npr and due_date are required."}, status=400)
            
        from decimal import Decimal
        amount_dec = Decimal(str(amount))
            
        total_committed = fund.lp_commitments.aggregate(total=Sum('committed_amount_npr'))['total'] or Decimal('0')
        if total_committed == 0:
            return Response({"detail": "Fund has no LP commitments."}, status=400)
            
        # 1. Fund Sufficiency Verification
        total_called_to_date = fund.lp_commitments.aggregate(total=Sum('called_amount_npr'))['total'] or Decimal('0')
        uncalled_capital = total_committed - total_called_to_date
        
        if amount_dec > uncalled_capital:
            return Response({
                "detail": "Insufficient Uncalled Capital: The requested amount exceeds the fund's available capital pool.",
                "available": float(uncalled_capital),
                "requested": float(amount_dec)
            }, status=400)
            
        # Create calls
        calls = []
        call_type = request.data.get('call_type', CapitalCall.CallType.INVESTMENT)
        apply_credits = request.data.get('apply_credits', True) # Default to True for institutional grade
        
        for comm in fund.lp_commitments.all():
            # Allocation = (LP Commitment / Total Fund Commitment) * Total Drawdown
            lp_share = (comm.committed_amount_npr / total_committed) * amount_dec
            
            credit_used = Decimal('0')
            if apply_credits and comm.credit_balance_npr > 0:
                credit_used = min(lp_share, comm.credit_balance_npr)
                lp_share -= credit_used
                comm.credit_balance_npr -= credit_used
                comm.save()

            call = CapitalCall.objects.create(
                fund=fund,
                project=project,
                lp_commitment=comm,
                call_date=timezone.now().date(),
                due_date=due_date,
                amount_npr=lp_share,
                call_type=call_type,
                status=CapitalCall.Status.CALLED,
                notes=request.data.get('notes', '') + (f" (Net of {float(credit_used)} credits applied)" if credit_used > 0 else "")
            )
            calls.append(call)
            
        # Advance project status only if it's an investment call
        if call_type == CapitalCall.CallType.INVESTMENT:
            project.status = PEProject.Status.CAPITAL_CALLED
            project.save()
        
        # Audit
        ImmutableAuditEvent.objects.create(
            event_type='CAPITAL_CALLED',
            actor=request.user,
            object_id=project.id,
            object_repr=str(project),
            content_type_label='deals.PEProject',
            payload={
                'total_amount': float(amount),
                'due_date': str(due_date),
                'call_count': len(calls)
            }
        )

        # Trigger background emails
        try:
            from .tasks import batch_send_capital_call_emails
            batch_send_capital_call_emails.delay([str(c.id) for c in calls])
        except Exception as e:
            logger.warning(f"Failed to trigger capital call emails task: {e}")

        return Response({
            "status": f"Successfully issued {len(calls)} capital calls. Emails queued.",
            "total_amount_npr": amount,
            "project_status": project.status
        })


class GPFundCapitalCallBatchView(APIView):
    """
    POST /api/deals/funds/{id}/create-capital-calls/
    Creates pro-rata capital calls for all LPs in the fund (fund-level, e.g. Mgmt Fees).
    """
    permission_classes = [permissions.IsAuthenticated, IsSuperAdminRole]

    def post(self, request, pk):
        fund = get_object_or_404(Fund, pk=pk)
        
        amount = request.data.get('total_amount_npr')
        due_date = request.data.get('due_date')
        call_type = request.data.get('call_type', CapitalCall.CallType.MANAGEMENT_FEE)
        
        if not amount or not due_date:
            return Response({"detail": "total_amount_npr and due_date are required."}, status=400)
            
        from decimal import Decimal
        amount_dec = Decimal(str(amount))
            
        total_committed = fund.lp_commitments.aggregate(total=Sum('committed_amount_npr'))['total'] or Decimal('0')
        if total_committed == 0:
            return Response({"detail": "Fund has no LP commitments."}, status=400)
            
        # 1. Fund Sufficiency Verification
        total_called_to_date = fund.lp_commitments.aggregate(total=Sum('called_amount_npr'))['total'] or Decimal('0')
        uncalled_capital = total_committed - total_called_to_date
        
        if amount_dec > uncalled_capital:
            return Response({
                "detail": "Insufficient Uncalled Capital: The requested amount exceeds the fund's available capital pool.",
                "available": float(uncalled_capital),
                "requested": float(amount_dec)
            }, status=400)
            
        # Create calls
        calls = []
        for comm in fund.lp_commitments.all():
            # Allocation = (LP Commitment / Total Fund Commitment) * Total Drawdown
            lp_share = (comm.committed_amount_npr / total_committed) * amount_dec
            call = CapitalCall.objects.create(
                fund=fund,
                project=None, # Fund-level call
                lp_commitment=comm,
                call_date=timezone.now().date(),
                due_date=due_date,
                amount_npr=lp_share,
                call_type=call_type,
                status=CapitalCall.Status.CALLED,
                notes=request.data.get('notes', '')
            )
            calls.append(call)
            
        # Audit
        ImmutableAuditEvent.objects.create(
            event_type='FUND_CAPITAL_CALLED',
            actor=request.user,
            object_id=fund.id,
            object_repr=str(fund),
            content_type_label='deals.Fund',
            payload={
                'total_amount': float(amount),
                'due_date': str(due_date),
                'call_type': call_type,
                'call_count': len(calls)
            }
        )

        # Trigger background emails
        try:
            from .tasks import batch_send_capital_call_emails
            batch_send_capital_call_emails.delay([str(c.id) for c in calls])
        except Exception as e:
            logger.warning(f"Failed to trigger capital call emails task: {e}")

        return Response({"status": "Fund-level capital calls issued", "count": len(calls)})


class CapitalCallViewSet(viewsets.ModelViewSet):
    """
    CRUD for individual capital calls.
    Enforces audit logging on receipt and allows LP payment notifications.
    """
    queryset = CapitalCall.objects.select_related('fund', 'project', 'lp_commitment__lp_profile').all()
    serializer_class = CapitalCallSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        
        # LPs only see their own calls
        if hasattr(user, 'role') and user.role == 'lp':
            qs = qs.filter(lp_commitment__lp_profile__user=user)
        # GP staff can filter by fund/project
        else:
            fund_id = self.request.query_params.get('fund_id')
            project_id = self.request.query_params.get('project_id')
            if fund_id:
                qs = qs.filter(fund_id=fund_id)
            if project_id:
                qs = qs.filter(project_id=project_id)
        return qs

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def notify_payment(self, request, pk=None):
        """
        LP endpoint to submit proof of payment.
        """
        call = self.get_object()
        # Verify ownership
        if call.lp_commitment.lp_profile.user != request.user:
            return Response({"detail": "Permission denied."}, status=403)
            
        proof = request.FILES.get('payment_proof')
        if not proof:
            return Response({"detail": "Payment proof file is required."}, status=400)
            
        call.status = CapitalCall.Status.PAID
        call.payment_proof = proof
        call.notes = f"{call.notes}\nPayment notification submitted by LP on {timezone.now()}"
        call.save()
        
        # Log audit
        ImmutableAuditEvent.objects.create(
            event_type='CAPITAL_PAID_NOTIFIED',
            actor=request.user,
            object_id=call.project.id if call.project else call.fund.id,
            object_repr=str(call),
            content_type_label='deals.CapitalCall',
            payload={'call_id': str(call.id)}
        )
        
        return Response({"status": "Payment notification submitted"})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsGPStaff])
    def gp_upload_payment(self, request, pk=None):
        """
        GP Staff endpoint to upload proof of payment on behalf of an LP (for non-tech savvy LPs).
        """
        call = self.get_object()
        proof = request.FILES.get('payment_proof')
        if not proof:
            return Response({"detail": "Payment proof file is required."}, status=400)
            
        call.status = CapitalCall.Status.PAID
        call.payment_proof = proof
        call.notes = f"{call.notes}\nPayment proof uploaded by GP Staff ({request.user}) on behalf of LP on {timezone.now()}"
        call.save()
        
        # Log audit
        ImmutableAuditEvent.objects.create(
            event_type='CAPITAL_PAID_NOTIFIED',
            actor=request.user,
            object_id=call.project.id if call.project else call.fund.id,
            object_repr=str(call),
            content_type_label='deals.CapitalCall',
            payload={'call_id': str(call.id), 'on_behalf_of': call.lp_commitment.lp_profile.full_name}
        )
        return Response({"status": "Payment proof uploaded on behalf of LP"})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsGPStaff])
    def verify_receipt(self, request, pk=None):
        """
        GP Staff endpoint to verify that funds hit the bank.
        Moves status from PAID to VERIFIED.
        """
        call = self.get_object()
        if call.status != CapitalCall.Status.PAID:
            return Response({"detail": "Only calls in 'PAID' status can be verified by GP Staff."}, status=400)
            
        call.status = CapitalCall.Status.VERIFIED
        call.notes = f"{call.notes}\nVerified by GP Staff {request.user} on {timezone.now()}"
        call.save()
        return Response({"status": "Capital call verified by GP Staff. Awaiting Superadmin approval."})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsSuperAdminRole])
    def mark_received(self, request, pk=None):
        """
        Superadmin endpoint for final approval of capital receipt.
        Requires that GP Staff has already verified the receipt (status=VERIFIED).
        """
        call = self.get_object()
        user = request.user
        
        if call.status != CapitalCall.Status.VERIFIED:
            return Response(
                {"detail": "Capital call must be 'VERIFIED' by GP Staff before Superadmin can approve it."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        call.status = CapitalCall.Status.RECEIVED
        call.received_at = timezone.now()
        call.notes = f"{call.notes}\nFinal approval by Superadmin {user} on {call.received_at}"
        call.save()
        
        # Update commitment
        if call.lp_commitment:
            comm = call.lp_commitment
            comm.called_amount_npr += call.amount_npr
            comm.save()
            
        # --- Send Confirmation Email to LP ---
        try:
            lp_user = call.lp_commitment.lp_profile.user
            subject = f"Capital Receipt Confirmation: {call.fund.name}"
            
            html_content = f"""
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #100226; color: #ffffff; padding: 40px; border-radius: 12px; border-top: 4px solid #F59F01;">
                <h2 style="color: #F59F01; margin-top: 0;">Capital Receipt Confirmed</h2>
                <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0;">Dear {lp_user.first_name},</p>
                <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0;">This is to formally confirm that we have successfully received your capital contribution for <strong>{call.fund.name}</strong>.</p>
                
                <div style="background-color: rgba(245, 159, 1, 0.1); border-left: 3px solid #F59F01; padding: 20px; margin: 25px 0;">
                    <p style="margin: 0; font-size: 18px; color: #ffffff;"><strong>Amount Received:</strong><br>NPR {float(call.amount_npr):,.2f}</p>
                    <p style="margin: 8px 0 0 0; font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Transaction Ref: {call.id}</p>
                </div>
                
                <p style="font-size: 16px; line-height: 1.6; color: #e2e8f0;">Thank you for your partnership. Your updated paid-in capital balance is now reflected in your LP dashboard.</p>
                
                <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;">
                <p style="font-size: 11px; color: #94a3b8; margin: 0;">&copy; Finlogic Capital Limited. All rights reserved.</p>
            </div>
            """
            
            send_mail(
                subject=subject,
                message=f"Capital Receipt Confirmed: NPR {float(call.amount_npr):,.2f}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[lp_user.email],
                html_message=html_content,
                fail_silently=True,
            )
        except Exception as e:
            print(f"Failed to send capital confirmation email: {e}")
            
        # Log audit
        ImmutableAuditEvent.objects.create(
            event_type='CAPITAL_RECEIVED',
            actor=user,
            object_id=call.project.id if call.project else call.fund.id,
            object_repr=str(call),
            content_type_label='deals.CapitalCall',
            payload={
                'call_id': str(call.id),
                'amount': float(call.amount_npr),
                'lp_name': call.lp_commitment.lp_profile.full_name if call.lp_commitment else 'Unknown'
            }
        )
        
        return Response({"status": "Capital call approved and marked as received"})

class DrawdownFundFeesView(APIView):
    """
    POST /api/deals/funds/<uuid:fund_id>/drawdown-fees/
    Draw down accrued management fees into capital calls for a whole fund.
    """
    permission_classes = [permissions.IsAuthenticated, IsGPStaff]

    def post(self, request, fund_id):
        fund = get_object_or_404(Fund, pk=fund_id)
        
        # Get all uncalled accruals for this fund
        uncalled_accruals = ManagementFeeAccrual.objects.filter(
            fund=fund,
            is_called=False
        ).select_related('lp_commitment', 'lp_commitment__lp_profile')
        
        if not uncalled_accruals.exists():
            return Response({"detail": "No uncalled accruals found for this fund."}, status=status.HTTP_400_BAD_REQUEST)

        # Group by commitment
        commitment_totals = {}
        for accrual in uncalled_accruals:
            comm_id = str(accrual.lp_commitment_id)
            if comm_id not in commitment_totals:
                commitment_totals[comm_id] = {
                    'commitment': accrual.lp_commitment,
                    'amount': Decimal('0'),
                    'accruals': []
                }
            commitment_totals[comm_id]['amount'] += accrual.fee_amount
            commitment_totals[comm_id]['accruals'].append(accrual)
            
        created_calls = []
        today = date.today()
        due_date = request.data.get('due_date', (today + timedelta(days=15)).isoformat())
        notes = request.data.get('notes', f"Management fee drawdown as of {today}")

        with transaction.atomic():
            for comm_id, data in commitment_totals.items():
                comm = data['commitment']
                amount = data['amount']
                
                # Validation: Cannot call more than remaining committed capital
                if amount > comm.uncalled_amount_npr:
                    raise ValidationError(
                        f"Insufficient uncalled capital for {comm.lp_profile.full_name}. "
                        f"Required: NPR {amount:,.2f}, Available: NPR {comm.uncalled_amount_npr:,.2f}"
                    )
                
                # Create Capital Call
                call = CapitalCall.objects.create(
                    fund=fund,
                    lp_commitment=comm,
                    call_date=today,
                    due_date=due_date,
                    amount_npr=amount,
                    call_type=CapitalCall.CallType.MANAGEMENT_FEE,
                    status=CapitalCall.Status.CALLED,
                    notes=notes
                )
                
                # Link accruals
                for accrual in data['accruals']:
                    accrual.capital_call = call
                    accrual.is_called = True
                    accrual.save()
                    
                created_calls.append(call)
                
                # Audit log
                ImmutableAuditEvent.objects.create(
                    event_type='FUND_MANAGEMENT',
                    actor=request.user,
                    object_id=call.id,
                    object_repr=str(call),
                    content_type_label='deals.CapitalCall',
                    payload={
                        'description': f"Management fee drawdown of NPR {amount:,.2f} issued for {comm.lp_profile.full_name}",
                        'fund_id': str(fund.id),
                        'lp_profile_id': str(comm.lp_profile_id),
                        'accrual_ids': [str(a.id) for a in data['accruals']]
                    }
                )

        return Response(CapitalCallSerializer(created_calls, many=True).data, status=status.HTTP_201_CREATED)


class LPCatchUpCalculationView(APIView):
    """
    GET /api/deals/lp-profiles/{id}/calculate-catch-up/
    Returns suggested capital call amounts for an LP who joined late.
    Analyzes all deals in the fund(s) they are committed to and identifies gaps.
    """
    permission_classes = [permissions.IsAuthenticated, IsSuperAdminRole]

    def get(self, request, lp_id):
        lp_profile = get_object_or_404(LPProfile, pk=lp_id)
        results = []
        
        # 1. Iterate through all fund commitments for this LP
        for comm in lp_profile.fund_commitments.all():
            fund = comm.fund
            
            # 2. Find all projects associated with this fund that have had capital calls
            projects_with_calls = PEProject.objects.filter(
                capital_calls__fund=fund
            ).distinct()
            
            for project in projects_with_calls:
                # 3. Check if this specific LP already has a capital call for this project
                has_call = CapitalCall.objects.filter(
                    lp_commitment=comm,
                    project=project
                ).exists()
                
                if not has_call:
                    # 4. Calculate total amount called from other LPs for this project
                    total_deal_drawdown = CapitalCall.objects.filter(
                        fund=fund,
                        project=project
                    ).aggregate(total=Sum('amount_npr'))['total'] or Decimal('0')
                    
                    # 5. Calculate the current total commitment to the fund to get the denominator
                    total_fund_commitment = fund.lp_commitments.aggregate(total=Sum('committed_amount_npr'))['total'] or Decimal('1')
                    
                    # 6. Suggested Equalization Share
                    suggested_amount = (comm.committed_amount_npr / total_fund_commitment) * total_deal_drawdown
                    
                    results.append({
                        'fund_id': str(fund.id),
                        'fund_name': fund.name,
                        'project_id': str(project.id),
                        'project_name': project.legal_name,
                        'lp_commitment_id': str(comm.id),
                        'total_deal_call': float(total_deal_drawdown),
                        'suggested_amount': float(suggested_amount),
                        'is_catch_up': True
                    })
                    
        return Response(results)


class LPCatchUpExecutionView(APIView):
    """
    POST /api/deals/lp-profiles/{lp_id}/execute-catch-up/
    Executes the equalization protocol:
    1. Creates CapitalCall for the late LP (Principal + Interest).
    2. (Optional) Creates Distributions for early LPs as refunds.
    """
    permission_classes = [permissions.IsAuthenticated, IsSuperAdminRole]

    @transaction.atomic
    def post(self, request, lp_id):
        lp_profile = get_object_or_404(LPProfile, pk=lp_id)
        project_id = request.data.get('project')
        lp_commitment_id = request.data.get('lp_commitment')
        fund_id = request.data.get('fund')
        
        amount = Decimal(str(request.data.get('amount_npr', 0)))
        interest_amount = Decimal(str(request.data.get('interest_npr', 0)))
        due_date = request.data.get('due_date')
        auto_redistribute = request.data.get('auto_redistribute', False)
        redistribute_mode = request.data.get('redistribute_mode', 'REFUND') # 'REFUND' or 'CREDIT'
        notes = request.data.get('notes', '')

        project = get_object_or_404(PEProject, pk=project_id)
        comm = get_object_or_404(LPFundCommitment, pk=lp_commitment_id)
        fund = get_object_or_404(Fund, pk=fund_id)
        
        # 1. Create the Catch-up Call for the Late LP
        total_call_amount = amount + interest_amount
        catch_up_call = CapitalCall.objects.create(
            fund=fund,
            project=project,
            lp_commitment=comm,
            amount_npr=total_call_amount,
            due_date=due_date,
            call_type=CapitalCall.CallType.EQUALIZATION,
            status=CapitalCall.Status.CALLED,
            notes=notes
        )

        # 2. Redistribution Logic
        if auto_redistribute:
            # Find early LPs who previously paid for this project in this fund
            early_calls = CapitalCall.objects.filter(
                fund=fund,
                project=project
            ).exclude(lp_commitment=comm)
            
            total_early_principal = early_calls.aggregate(total=Sum('amount_npr'))['total'] or Decimal('1')
            
            for early_call in early_calls:
                # Pro-rata share of the catch-up being received
                share_of_refund = (early_call.amount_npr / total_early_principal) * total_call_amount
                
                if redistribute_mode == 'CREDIT':
                    # Netting Engine: Add to credit balance
                    early_comm = early_call.lp_commitment
                    early_comm.credit_balance_npr += share_of_refund
                    early_comm.save()
                else:
                    # Traditional Redistribution: Create Distribution record
                    Distribution.objects.create(
                        fund=fund,
                        project=project,
                        lp_commitment=early_call.lp_commitment,
                        amount_npr=share_of_refund,
                        distribution_type=Distribution.DistributionType.EQUALIZATION_REFUND,
                        distribution_date=timezone.now().date(),
                        notes=f"Equalization refund from late LP ({lp_profile.user.email}) for {project.legal_name}"
                    )

        return Response({
            "status": "SUCCESS",
            "capital_call_id": str(catch_up_call.id),
            "redistributed": auto_redistribute,
            "mode": redistribute_mode
        })

