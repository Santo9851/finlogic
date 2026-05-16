import logging
import uuid
from datetime import date, timedelta
from decimal import Decimal
from django.db import transaction
from .models import Fund, LPFundCommitment, ManagementFeeAccrual

logger = logging.getLogger(__name__)

def get_effective_fee_config(lp_commitment, calculation_date):
    """
    Determine effective fee rate and basis for the LP on a given date.
    Priority:
    1. LP Side Letter (Override) if within date range.
    2. Fund Post-Investment settings if past investment period end.
    3. Fund standard settings.
    """
    fund = lp_commitment.fund
    
    # 1. LP Override (Side Letter)
    if lp_commitment.fee_start_date_override and lp_commitment.fee_end_date_override:
        if lp_commitment.fee_start_date_override <= calculation_date <= lp_commitment.fee_end_date_override:
            if lp_commitment.management_fee_override_pct is not None:
                rate = lp_commitment.management_fee_override_pct
                basis = lp_commitment.management_fee_override_basis or fund.management_fee_basis
                return Decimal(str(rate)), basis

    # 2. Fund Post-Investment
    if fund.investment_period_end_date and calculation_date > fund.investment_period_end_date:
        rate = fund.post_investment_management_fee_pct if fund.post_investment_management_fee_pct is not None else fund.management_fee_pct
        basis = fund.post_investment_management_fee_basis or fund.management_fee_basis
        return Decimal(str(rate)), basis

    # 3. Standard Fund Defaults
    return Decimal(str(fund.management_fee_pct)), fund.management_fee_basis

def calculate_fee_for_period(lp_commitment, start_date, end_date):
    """
    Calculates the management fee for a specific date range.
    Uses the configuration active at the mid-point of the period.
    """
    # Use midpoint for configuration check
    midpoint = start_date + (end_date - start_date) / 2
    fee_pct, basis = get_effective_fee_config(lp_commitment, midpoint)
    
    if basis == LPFundCommitment.ManagementFeeBasis.COMMITTED:
        basis_amount = lp_commitment.committed_amount_npr
    else:
        # INVESTED basis - use called_amount_npr as simplified proxy
        basis_amount = lp_commitment.called_amount_npr
        
    days_in_period = (end_date - start_date).days + 1
    
    # Fee = (Basis * Rate/100 * Days / 365)
    fee = (Decimal(str(basis_amount)) * (fee_pct / Decimal('100')) / Decimal('365')) * Decimal(str(days_in_period))
    
    return fee.quantize(Decimal('0.01')), basis_amount, float(fee_pct)

def generate_accruals_for_fund(fund, as_of_date=None):
    """
    Idempotent generator for periodic management fee accruals.
    Accepts fund object or ID.
    """
    if as_of_date is None:
        as_of_date = date.today()
        
    if isinstance(fund, (str, bytes, type(uuid.uuid4()))):
        try:
            fund = Fund.objects.get(pk=fund)
        except Fund.DoesNotExist:
            logger.error(f"Fund {fund} not found for accrual generation.")
            return 0

    commitments = fund.lp_commitments.all()
    created_count = 0
    
    for comm in commitments:
        # 1. Determine Start Date
        latest_accrual = comm.fee_accruals.order_by('-period_end_date').first()
        if latest_accrual:
            start_date = latest_accrual.period_end_date + timedelta(days=1)
        else:
            # First accrual ever
            # Use commitment date or fund creation date (approx)
            start_date = max(
                comm.commitment_date,
                comm.fee_start_date_override or date(2020, 1, 1) # Sensible fallback
            )
            
        # 2. Loop through periods until we hit as_of_date
        while start_date < as_of_date:
            # End of period based on frequency
            months = fund.management_fee_frequency_months or 3
            # Simple approximation: 30 days per month
            period_days = months * 30
            end_date = start_date + timedelta(days=period_days) - timedelta(days=1)
            
            # Don't accrue into the future
            if end_date > as_of_date:
                break
                
            with transaction.atomic():
                fee_amount, basis_amount, pct_used = calculate_fee_for_period(comm, start_date, end_date)
                
                # Check if already exists to be safe
                if not ManagementFeeAccrual.objects.filter(
                    fund=fund,
                    lp_commitment=comm,
                    period_start_date=start_date,
                    period_end_date=end_date
                ).exists():
                    ManagementFeeAccrual.objects.create(
                        fund=fund,
                        lp_commitment=comm,
                        period_start_date=start_date,
                        period_end_date=end_date,
                        accrual_date=date.today(),
                        fee_basis_amount=basis_amount,
                        fee_pct_used=pct_used,
                        fee_amount=fee_amount,
                        is_called=False
                    )
                    created_count += 1
                    
            start_date = end_date + timedelta(days=1)
            
    return created_count
