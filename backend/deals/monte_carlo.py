import numpy as np
from decimal import Decimal
from .models import PEInvestment
import logging

logger = logging.getLogger(__name__)

def run_monte_carlo(investment_id, num_simulations=10000, custom_assumptions=None):
    """
    Run Monte Carlo simulation to estimate exit MOIC and IRR.
    
    Assumptions:
    - Exit Multiple: Normal distribution
    - Revenue Growth: Normal distribution
    """
    try:
        investment = PEInvestment.objects.get(id=investment_id)
    except PEInvestment.DoesNotExist:
        return {"error": "Investment not found"}

    # Base values from investment/valuation model
    # For now, we use defaults if not specified
    base_multiple = Decimal(custom_assumptions.get('exit_multiple_mean', 3.0)) if custom_assumptions else Decimal(3.0)
    multiple_std = float(custom_assumptions.get('exit_multiple_std', 0.5)) if custom_assumptions else 0.5
    
    base_growth = float(custom_assumptions.get('growth_mean', 0.20)) if custom_assumptions else 0.20
    growth_std = float(custom_assumptions.get('growth_std', 0.10)) if custom_assumptions else 0.10
    
    investment_amount = float(investment.investment_amount_npr)
    years_held = float(investment.years_held) if investment.years_held > 0 else 5.0
    
    # 1. Simulate Exit Multiples
    multiples = np.random.normal(float(base_multiple), multiple_std, num_simulations)
    multiples = np.maximum(multiples, 0.1) # Floor at 0.1x
    
    # 2. Simulate Revenue Growth (Compounded)
    # Final Revenue = Initial Revenue * (1 + growth)^years
    # Since we are modeling the "impact" on exit value, we can model it as a multiplier on the base exit value
    # Let's assume the base_multiple is applied to a "base case" exit revenue.
    # The growth simulation will vary that exit value.
    growth_factors = np.random.normal(base_growth, growth_std, num_simulations)
    # Compounded growth impact relative to base case (assuming base case is 0% alpha over expected growth)
    # But let's simplify: the base_multiple already assumes some growth.
    # We simulate "Growth Variance" as a multiplier on the final value.
    # Value Multiplier = (1 + simulated_growth)^years / (1 + base_growth)^years
    value_multipliers = (1 + growth_factors)**years_held / (1 + base_growth)**years_held
    
    # 3. Calculate Outcomes
    # Exit Value = Base Investment * (Simulated Multiple) * (Growth Variance)
    # This is a bit abstract, but serves the purpose of showing distribution.
    exit_values = investment_amount * multiples * value_multipliers
    
    moics = exit_values / investment_amount
    # IRR = (Exit Value / Investment)^(1/years) - 1
    # Handle edge cases where exit value <= 0
    irrs = np.power(np.maximum(moics, 0.001), 1/years_held) - 1
    
    # 4. Calculate Statistics
    percentiles = [5, 25, 50, 75, 95]
    results_moic = np.percentile(moics, percentiles)
    results_irr = np.percentile(irrs, percentiles)
    
    prob_loss = float(np.mean(moics < 1.0))
    expected_moic = float(np.mean(moics))
    expected_irr = float(np.mean(irrs))
    
    # Histogram data (for Recharts)
    counts, bin_edges = np.histogram(moics, bins=30, range=(0, 10))
    histogram_data = [
        {"bin": round(float(bin_edges[i]), 2), "count": int(counts[i])}
        for i in range(len(counts))
    ]

    return {
        "investment_id": str(investment_id),
        "num_simulations": num_simulations,
        "statistics": {
            "expected_moic": round(expected_moic, 2),
            "expected_irr": round(expected_irr * 100, 2),
            "prob_loss": round(prob_loss * 100, 2),
            "moic_percentiles": {
                f"p{p}": round(float(results_moic[i]), 2) for i, p in enumerate(percentiles)
            },
            "irr_percentiles": {
                f"p{p}": round(float(results_irr[i]) * 100, 2) for i, p in enumerate(percentiles)
            }
        },
        "histogram": histogram_data
    }
