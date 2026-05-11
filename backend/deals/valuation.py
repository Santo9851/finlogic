def calculate_dcf(assumptions):
    """
    Calculates DCF valuation based on provided assumptions.
    """
    rev = float(assumptions['current_revenue'])
    growth = float(assumptions['revenue_growth_rate'])
    margin = float(assumptions['ebitda_margin'])
    tax = float(assumptions['tax_rate'])
    years = int(assumptions['projection_years'])
    wacc = float(assumptions['wacc'])
    t_growth = float(assumptions['terminal_growth_rate'])
    net_debt = float(assumptions.get('net_debt', 0))

    projections = []
    total_pv_fcf = 0
    
    current_rev = rev
    for y in range(1, years + 1):
        current_rev *= (1 + growth)
        ebitda = current_rev * margin
        ebiat = ebitda * (1 - tax) 
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

    # Terminal Value
    last_fcf = projections[-1]['fcf']
    terminal_value = (last_fcf * (1 + t_growth)) / (wacc - t_growth)
    pv_terminal_value = terminal_value / ((1 + wacc) ** years)
    
    enterprise_value = total_pv_fcf + pv_terminal_value
    equity_value = enterprise_value - net_debt
    
    # CAGR
    revenue_cagr = ((projections[-1]['revenue'] / rev) ** (1 / years)) - 1 if years > 0 else 0
    
    return {
        "projections": projections,
        "total_pv_fcf": round(total_pv_fcf, 2),
        "terminal_value": round(terminal_value, 2),
        "pv_terminal_value": round(pv_terminal_value, 2),
        "enterprise_value": round(enterprise_value, 2),
        "equity_value": round(equity_value, 2),
        "revenue_cagr": round(revenue_cagr, 4)
    }

def calculate_lbo(assumptions):
    """
    Calculates LBO returns based on provided assumptions.
    """
    entry_revenue = float(assumptions['entry_revenue'])
    entry_ebitda = float(assumptions['entry_ebitda'])
    entry_multiple = float(assumptions['entry_multiple'])
    exit_multiple = float(assumptions['exit_multiple'])
    exit_year = int(assumptions['exit_year'])
    rev_growth = float(assumptions['revenue_growth'])
    margin = float(assumptions['ebitda_margin'])
    debt_list = assumptions.get('debt_financing', [])
    tax_rate = float(assumptions['tax_rate'])
    buyout_pct = float(assumptions.get('buyout_percentage', 100)) / 100.0
    
    # 1. Entry
    entry_ev = entry_ebitda * entry_multiple
    total_debt = sum([float(d['amount']) for d in debt_list])
    total_entry_equity = entry_ev - total_debt
    # GP only pays for their percentage stake of the equity
    gp_entry_equity = total_entry_equity * buyout_pct
    
    # 2. Operations & Debt Paydown
    current_rev = entry_revenue
    projections = []
    
    # Track remaining debt for interest calculation
    remaining_debts = [float(d['amount']) for d in debt_list]
    
    for y in range(1, exit_year + 1):
        current_rev *= (1 + rev_growth)
        ebitda = current_rev * margin
        
        # Calculate interest
        interest = 0
        for i, d in enumerate(debt_list):
            interest += remaining_debts[i] * float(d['rate'])
            
        taxable_income = ebitda - interest
        tax = max(0, taxable_income * tax_rate)
        fcf = ebitda - interest - tax
        
        # Pay down debt
        fcf_for_paydown = fcf
        for i, d in enumerate(debt_list):
            payment = min(remaining_debts[i], fcf_for_paydown)
            remaining_debts[i] -= payment
            fcf_for_paydown -= payment
            
        projections.append({
            "year": y,
            "revenue": round(current_rev, 2),
            "ebitda": round(ebitda, 2),
            "fcf": round(fcf, 2),
            "remaining_debt": round(sum(remaining_debts), 2)
        })

    # 3. Exit
    final_ebitda = projections[-1]['ebitda']
    exit_ev = final_ebitda * exit_multiple
    final_debt = sum(remaining_debts)
    total_exit_equity = exit_ev - final_debt
    # GP only receives their percentage stake of the equity
    gp_exit_equity = total_exit_equity * buyout_pct
    
    # 4. Returns
    moic = gp_exit_equity / gp_entry_equity if gp_entry_equity > 0 else 0
    irr = (moic ** (1 / exit_year)) - 1 if moic > 0 and exit_year > 0 else -1
    
    # CAGR
    revenue_cagr = ((projections[-1]['revenue'] / entry_revenue) ** (1 / exit_year)) - 1 if exit_year > 0 else 0
    
    return {
        "entry_ev": round(entry_ev, 2),
        "gp_entry_equity": round(gp_entry_equity, 2),
        "projections": projections,
        "exit_ev": round(exit_ev, 2),
        "gp_exit_equity": round(gp_exit_equity, 2),
        "moic": round(moic, 2),
        "irr": round(irr, 4),
        "revenue_cagr": round(revenue_cagr, 4)
    }
