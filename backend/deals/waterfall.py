import decimal
from django.utils import timezone
from decimal import Decimal
from .models import PEInvestment, Fund, LPFundCommitment, WaterfallRun, WaterfallModel

def calculate_distribution(investment_id, exit_proceeds, fund_id=None):
    investment = PEInvestment.objects.select_related('fund').get(id=investment_id)
    fund = investment.fund if not fund_id else Fund.objects.get(id=fund_id)
    
    exit_proceeds = Decimal(str(exit_proceeds))
    
    # Calculate years held
    # Just a simple days / 365 calculation
    exit_date = timezone.now().date()
    days_held = (exit_date - investment.investment_date).days
    years_held = max(days_held / 365.25, 0)
    
    # 1. Return of Capital
    invested_capital = investment.investment_amount_npr
    roc = min(invested_capital, exit_proceeds)
    remaining_proceeds = exit_proceeds - roc
    
    # 2. Preferred Return (Hurdle)
    hurdle_rate = Decimal(str(fund.preferred_return_pct)) / Decimal(100)
    preferred_return = invested_capital * hurdle_rate * Decimal(str(years_held))
    
    paid_pref = min(preferred_return, remaining_proceeds)
    remaining_proceeds -= paid_pref
    
    # 3. GP Catch-up
    # GP gets 100% of the next distributions until they receive 'carry_pct' of all profits distributed so far.
    # Total profits distributed to LPs so far = paid_pref
    # Target GP catchup = paid_pref * (carry_pct / (1 - carry_pct))
    carry_pct = Decimal(str(fund.carry_pct)) / Decimal(100)
    
    catchup_target = paid_pref * (carry_pct / (Decimal(1) - carry_pct)) if carry_pct < 1 else Decimal(0)
    gp_catchup = min(catchup_target, remaining_proceeds)
    remaining_proceeds -= gp_catchup
    
    # 4. Carry Split (80/20 or similar)
    # Remaining proceeds split according to carry_pct (GP) and (1 - carry_pct) (LP)
    gp_carry_split = remaining_proceeds * carry_pct
    lp_carry_split = remaining_proceeds * (Decimal(1) - carry_pct)
    
    # Totals
    total_lp_proceeds = roc + paid_pref + lp_carry_split
    total_gp_proceeds = gp_catchup + gp_carry_split
    
    # Per LP Breakdown based on LPFundCommitment
    lps = LPFundCommitment.objects.filter(fund=fund)
    total_called = sum(lp.called_amount_npr for lp in lps)
    
    lp_breakdown = []
    if total_called > 0:
        for lp in lps:
            share = lp.called_amount_npr / total_called
            lp_breakdown.append({
                'lp_id': str(lp.lp_profile.id),
                'lp_name': lp.lp_profile.full_name,
                'share_pct': float(share) * 100,
                'proceeds': float(total_lp_proceeds * share)
            })
            
    outputs = {
        'steps': {
            'return_of_capital': float(roc),
            'preferred_return': float(paid_pref),
            'gp_catchup': float(gp_catchup),
            'lp_carry_split': float(lp_carry_split),
            'gp_carry_split': float(gp_carry_split)
        },
        'totals': {
            'lp_total': float(total_lp_proceeds),
            'gp_total': float(total_gp_proceeds),
            'exit_proceeds': float(exit_proceeds)
        },
        'lp_breakdown': lp_breakdown,
        'assumptions': {
            'hurdle_rate_pct': float(fund.preferred_return_pct),
            'carry_pct': float(fund.carry_pct),
            'years_held': float(years_held)
        }
    }
    
    # Save the WaterfallRun
    run = WaterfallRun.objects.create(
        investment=investment,
        exit_proceeds=exit_proceeds,
        exit_date=exit_date,
        years_held=years_held,
        outputs=outputs
    )
    
    return outputs, run
