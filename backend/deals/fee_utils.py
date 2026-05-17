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

def get_aligned_period_end(start_date, months):
    """
    Determine the next calendar-aligned period end date based on the start date and frequency (in months).
    Monthly (1), Quarterly (3), Semi-annually (6), Annually (12).
    """
    import datetime
    from calendar import monthrange
    
    if months == 1:
        # Monthly: last day of current month
        last_day = monthrange(start_date.year, start_date.month)[1]
        return datetime.date(start_date.year, start_date.month, last_day)
        
    elif months == 3:
        # Quarterly
        if start_date.month in [1, 2, 3]:
            return datetime.date(start_date.year, 3, 31)
        elif start_date.month in [4, 5, 6]:
            return datetime.date(start_date.year, 6, 30)
        elif start_date.month in [7, 8, 9]:
            return datetime.date(start_date.year, 9, 30)
        else:
            return datetime.date(start_date.year, 12, 31)
            
    elif months == 6:
        # Semi-annually
        if start_date.month <= 6:
            return datetime.date(start_date.year, 6, 30)
        else:
            return datetime.date(start_date.year, 12, 31)
            
    elif months == 12:
        # Annually
        return datetime.date(start_date.year, 12, 31)
        
    else:
        # Fallback to standard days-based interval if custom
        period_days = months * 30
        return start_date + datetime.timedelta(days=period_days) - datetime.timedelta(days=1)

def generate_accruals_for_fund(fund, as_of_date=None):
    """
    Idempotent generator for periodic management fee accruals.
    Accepts fund object or ID.
    Supports aligned periods and automatic proration for LPs who join mid-period.
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
            # End of period based on frequency (aligned to calendar intervals)
            months = fund.management_fee_frequency_months or 3
            end_date = get_aligned_period_end(start_date, months)
            
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

