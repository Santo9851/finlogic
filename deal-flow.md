# Finlogic Capital — End-to-End Deal Flow Guide

This document outlines the complete lifecycle of a Private Equity deal within the Finlogic platform, from initial sourcing to exit and distribution. Use this as a step-by-step guide for testing and operational workflow.

---

## Phase 1: Deal Sourcing & Entrepreneur Onboarding

**Objective:** Initiate a new deal and collect initial company data.

1.  **GP: Send Invite** (Frontend GP Dashboard)
    *   Navigate to **Deals** -> **Pipeline**.
    *   Click **Invite Entrepreneur**.
    *   Enter basic details (Legal Name, Sector, Entrepreneur Email).
    *   *Action:* System generates a unique `invitation_token` and sends an email.
2.  **Entrepreneur: Submission** (Entrepreneur Portal)
    *   Entrepreneur receives email and clicks the link.
    *   Fills out the multi-step form (Company Profile, Team, Market, Financial Highlights).
    *   *Action:* Data is saved as `PEProjectFormResponse` records.
3.  **Entrepreneur: Document Upload** (Entrepreneur Portal)
    *   Upload mandatory documents: Certificate of Incorporation, Tax Clearances, and most importantly, **Audited Financial Statements (PDF)**.
    *   *Target:* Upload to the **Data Room** section of the submission.

---

## Phase 2: Due Diligence & AI-Powered Analysis

**Objective:** Extract insights from raw data and evaluate deal quality.

1.  **GP: Financial Extraction** (Frontend GP Dashboard -> Deal Detail -> Financials Tab)
    *   Locate the uploaded Audited Financials in the Data Room.
    *   Click **Trigger AI Extraction**.
    *   *Automatic:* Celery worker parses the PDF, maps P&L and Balance Sheet items to the `ExtractedFinancials` model.
2.  **GP: Data Verification** (Frontend GP Dashboard -> Financials Tab)
    *   Review the extracted numbers.
    *   **Manual Task:** Verify "Net Profit After Tax" and "Total Assets" against the PDF. Click **Verify Data**.
3.  **GP: Multi-Vector Analysis** (Frontend GP Dashboard -> Deal Detail -> Header)
    *   Click **Run Full Analysis**.
    *   *Automatic:* AI engine runs four sub-tasks:
        *   **Quality of Earnings (QoE):** Analyzes margins, revenue concentration, and EBITDA adjustments.
        *   **Commercial Analysis:** Evaluates market size and competitive moat.
        *   **Operational Analysis:** Reviews supply chain and team structure.
        *   **Legal/Compliance:** Scans documents for red flags using `GPLegalScannerView`.
4.  **GP: Red Flag Review** (Frontend GP Dashboard -> Red Flags Tab)
    *   Review findings identified by AI.
    *   **Manual Task:** Mark red flags as "Resolved", "Mitigated", or "Critical".

---

## Phase 3: Deal Scoring & Internal Approval

**Objective:** Standardize deal evaluation and prepare for the Investment Committee (IC).

1.  **GP: Finlo Scoring** (Frontend GP Dashboard -> Scoring Tab)
    *   Click **Calculate Score**.
    *   *Automatic:* System weights factors across Financials, Team, and Market to produce a score (0-100).
2.  **GP: Investment Memo** (Frontend GP Dashboard -> Memo Tab)
    *   Click **Generate AI Draft**.
    *   *Automatic:* System compiles all previous analysis into a structured Investment Memo.
    *   **Manual Task:** Edit the memo sections for specific investment thesis points. Click **Finalize Memo**.
3.  **GP: LP Approval** (Frontend GP Dashboard -> Header)
    *   Click **Approve for LP**.
    *   *Action:* Project status changes to `GP_APPROVED`. It now becomes visible to LPs (if published).

---

## Phase 4: Investment Execution (Closing the Deal)

**Objective:** Finalize the legal transfer and record the investment.

1.  **GP: Close Investment** (Django Admin Area)
    *   Go to **Deals** -> **PE Investments**.
    *   Click **Add PE Investment**.
    *   Select the **Project** and the **Fund**.
    *   Enter **Investment Amount**, **Ownership %**, and **Entry Valuation**.
    *   **Manual Task:** This is the bridge between a "Project" (Lead) and an "Investment" (Portfolio Asset).

---

## Phase 5: Portfolio Monitoring & Valuations

**Objective:** Track the performance of the closed investment.

1.  **GP: Valuation Tracking** (Frontend GP Dashboard -> Deal Detail -> Valuations Tab)
    *   Regularly (Quarterly/Annually) click **Add New Valuation**.
    *   Enter the Fair Value (NPR) and Methodology (e.g., DCF).
    *   *Automatic:* The system calculates **Implied MoIC** and **Valuation Change %**.
    *   *Visual:* The **ValuationLineChart** updates automatically.
2.  **GP: Modelling** (Frontend GP Dashboard -> Modelling Tab)
    *   Run **DCF** or **LBO** simulations to predict future returns based on current operational data.
    *   *Automatic:* Calculates Enterprise Value and IRR.

---

## Phase 6: Exit Planning & Risk Simulation

**Objective:** Plan for the harvest phase and evaluate risks.

1.  **GP: Risk Analysis** (Frontend GP Dashboard -> Monte Carlo Tab)
    *   Configure exit multiple and growth rate assumptions (Mean/StdDev).
    *   Click **Run Risk Simulation**.
    *   *Automatic:* Runs 10,000 simulations using NumPy. Calculates **Probability of Loss** and **Expected MOIC**.
2.  **GP: Exit Scenarios** (Frontend GP Dashboard -> Exit Planning Tab)
    *   Create multiple scenarios: "Trade Sale (Base)", "IPO (Upside)", "Liquidation (Downside)".
    *   Click **Check IPO Eligibility**.
    *   *Automatic:* `IPOEligibilityEngine` checks SEBON rules for NEPSE listing.
3.  **GP: IC Approval for Exit** (Frontend GP Dashboard -> Exit Planning Tab)
    *   **Manual Task:** Super-Admin clicks **Approve** on the target exit scenario.

---

## Phase 7: Harvest & LP Distribution

**Objective:** Liquidate the asset and distribute proceeds to LPs.

1.  **GP: Record Exit** (Django Admin Area)
    *   Update the **PE Investment** record with `Exit Date`, `Exit Value`, and `Exit Type`.
2.  **GP: Waterfall Calculation** (Frontend GP Dashboard -> Pipeline -> Waterfall)
    *   Enter the total Exit Proceeds.
    *   *Automatic:* System calculates the split:
        *   1. Return of Capital (to LPs)
        *   2. Hurdle / Preferred Return (to LPs)
        *   3. GP Catch-up (to GP)
        *   4. Carried Interest (split GP/LP)
3.  **GP: Distribution** (Django Admin Area)
    *   Create **Distribution** records for each LP.
4.  **LP: Statements** (LP Portal)
    *   *Automatic:* The system generates a PDF **Capital Account Statement** with diagonal watermarks and secure B2 links.
    *   LP views distributions and updated Portfolio MOIC.

---

## Summary of Automatic vs. Manual Actions

| Category | Automatic / AI Task | Manual / GP Task |
| :--- | :--- | :--- |
| **Onboarding** | Token generation, Email delivery | Invite creation, Form filling (Entrepreneur) |
| **Financials** | PDF Extraction, P&L Mapping | Verification, Variance analysis |
| **Analysis** | QoE, Market analysis, Legal scan | Red flag resolution, Qualitative review |
| **Scoring** | Quantitative score calculation | Metric overrides, Gate clearing |
| **Monitoring** | MoIC calc, Chart rendering | Valuation entry, Scenario naming |
| **Risk** | 10k Monte Carlo simulations | Assumption setting (Mean/StdDev) |
| **Exit** | IPO Eligibility check, Waterfall split | Closing the deal, Distribution execution |
