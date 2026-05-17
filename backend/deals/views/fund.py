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

from .helpers import _get_client_ip, get_deal_for_user

from deals.serializers import DistributionSerializer
from deals.tasks import batch_send_capital_call_emails, generate_lp_statements

logger = logging.getLogger(__name__)

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
        from deals.fee_utils import calculate_fee_for_period
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
from deals.tasks import generate_lp_statements
from deals.b2_utils import generate_presigned_download_url


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
        from deals.models import LPDocumentAccess
        from deals.views import _get_client_ip
        
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


from deals.monte_carlo import run_monte_carlo


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
            from deals.tasks import batch_send_capital_call_emails
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
            from deals.tasks import batch_send_capital_call_emails
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

