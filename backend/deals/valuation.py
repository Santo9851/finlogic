
def calculate_dcf(assumptions):
    """
    Calculates DCF valuation based on provided assumptions.
    assumptions: {
        "current_revenue": float,
        "revenue_growth_rate": float,
        "ebitda_margin": float,
        "tax_rate": float,
        "projection_years": int,
        "wacc": float,
        "terminal_growth_rate": float,
        "net_debt": float
    }
    """
    rev = assumptions['current_revenue']
    growth = assumptions['revenue_growth_rate']
    margin = assumptions['ebitda_margin']
    tax = assumptions['tax_rate']
    years = assumptions['projection_years']
    wacc = assumptions['wacc']
    t_growth = assumptions['terminal_growth_rate']
    net_debt = assumptions.get('net_debt', 0)

    projections = []
    total_pv_fcf = 0
    
    current_rev = rev
    for y in range(1, years + 1):
        current_rev *= (1 + growth)
        ebitda = current_rev * margin
        ebiat = ebitda * (1 - tax) # Simplified EBIAT
        # Simplified FCF = EBIAT (assuming capex = depreciation for simplicity)
        fcf = ebiat
        pv_fcf = fcf / ((1 + wacc) ** y)
        
        projections.append({
            "year": y,
            "revenue": round(current_rev, 2),
            "ebitda": round(ebitda, 2),
            "fcf": round(fcf, 2),
            "pv_fcf": round(pv_fcf, 2)
        })
        total_pv_fcf += pv_fcf

    # Terminal Value (Gordon Growth Method)
    last_fcf = projections[-1]['fcf']
    terminal_value = (last_fcf * (1 + t_growth)) / (wacc - t_growth)
    pv_terminal_value = terminal_value / ((1 + wacc) ** years)
    
    enterprise_value = total_pv_fcf + pv_terminal_value
    equity_value = enterprise_value - net_debt
    
    return {
        "projections": projections,
        "total_pv_fcf": round(total_pv_fcf, 2),
        "terminal_value": round(terminal_value, 2),
        "pv_terminal_value": round(pv_terminal_value, 2),
        "enterprise_value": round(enterprise_value, 2),
        "equity_value": round(equity_value, 2)
    }

def calculate_lbo(assumptions):
    """
    Calculates LBO returns based on provided assumptions.
    assumptions: {
        "entry_revenue": float,
        "entry_ebitda": float,
        "entry_multiple": float,
        "exit_multiple": float,
        "exit_year": int,
        "revenue_growth": float,
        "ebitda_margin": float,
        "debt_financing": [{"name": "Senior Debt", "amount": 1000, "rate": 0.08}],
        "tax_rate": float
    }
    """
    entry_ebitda = assumptions['entry_ebitda']
    entry_multiple = assumptions['entry_multiple']
    exit_multiple = assumptions['exit_multiple']
    exit_year = assumptions['exit_year']
    rev_growth = assumptions['revenue_growth']
    margin = assumptions['ebitda_margin']
    debt_list = assumptions['debt_financing']
    tax_rate = assumptions['tax_rate']
    
    # 1. Entry
    entry_ev = entry_ebitda * entry_multiple
    total_debt = sum([d['amount'] for d in debt_list])
    entry_equity = entry_ev - total_debt
    
    # 2. Operations & Debt Paydown
    current_rev = assumptions['entry_revenue']
    cumulative_fcf = 0
    projections = []
    
    for y in range(1, exit_year + 1):
        current_rev *= (1 + rev_growth)
        ebitda = current_rev * margin
        # Simplified: FCF = EBITDA - Interest - Tax
        # Calculate interest on remaining debt (simplification: constant debt or simple paydown)
        interest = 0
        for d in debt_list:
            interest += d['amount'] * d['rate']
            
        taxable_income = ebitda - interest
        tax = max(0, taxable_income * tax_rate)
        fcf = ebitda - interest - tax
        
        # Pay down debt with FCF
        fcf_for_paydown = fcf
        for d in debt_list:
            payment = min(d['amount'], fcf_for_paydown)
            d['amount'] -= payment
            fcf_for_paydown -= payment
            
        projections.append({
            "year": y,
            "ebitda": round(ebitda, 2),
            "fcf": round(fcf, 2),
            "remaining_debt": round(sum([d['amount'] for d in debt_list]), 2)
        })

    # 3. Exit
    final_ebitda = projections[-1]['ebitda']
    exit_ev = final_ebitda * exit_multiple
    final_debt = sum([d['amount'] for d in debt_list])
    exit_equity = exit_ev - final_debt
    
    # 4. Returns
    moic = exit_equity / entry_equity
    irr = (moic ** (1 / exit_year)) - 1
    
    return {
        "entry_ev": round(entry_ev, 2),
        "entry_equity": round(entry_equity, 2),
        "projections": projections,
        "exit_ev": round(exit_ev, 2),
        "exit_equity": round(exit_equity, 2),
        "moic": round(moic, 2),
        "irr": round(irr, 2)
    }
