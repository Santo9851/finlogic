# Finlogic Capital — Unified Deal Flow

> **Single Source of Truth** for the end-to-end PE deal lifecycle.
> Last updated: 2026-05-09

---

## Overview

Every deal flows through **10 statuses** in a linear pipeline. Each status has a clear owner, entry gate, and exit action. The system enforces separation of duties: **GP Staff** handles deal work, **Superadmin** handles closing and capital calls, **AI (Gemini)** handles analysis and document drafting.

```
PENDING_SUBMISSION → SUBMITTED → SCREENING → IC_REVIEW → TERM_SHEET
    → LOI_ISSUED → CONTRACT_SIGNED → CAPITAL_CALLED → CLOSED
                                                        ↘ DECLINED (at any point)
```

### Status Definitions

| Status | Display Name | Owner | Description |
|---|---|---|---|
| `PENDING_SUBMISSION` | Pending Submission | Entrepreneur | Invitation sent, form not yet completed |
| `SUBMITTED` | Submitted | GP Staff | Entrepreneur finished submission, awaiting GP review |
| `SCREENING` | Screening | GP Staff | Active AI analysis, scoring, and compliance gate clearing |
| `IC_REVIEW` | IC Review | GP Staff | AI valuation models generated, IC memo drafted and signed |
| `TERM_SHEET` | Term Sheet | GP Staff | AI-drafted terms under negotiation with entrepreneur |
| `LOI_ISSUED` | LOI Issued | GP Staff + Entrepreneur | Formal LOI sent; entrepreneur signs and uploads |
| `CONTRACT_SIGNED` | Contract Signed | GP Staff | SPA/SHA executed, regulatory approvals obtained |
| `CAPITAL_CALLED` | Capital Called | Superadmin | LP drawdown notices issued, awaiting payment |
| `CLOSED` | Closed | Superadmin | Capital received, `PEInvestment` record created |
| `DECLINED` | Declined | GP Staff | Deal rejected (can happen from SUBMITTED, SCREENING, or IC_REVIEW) |

### Role Permissions

| Role | Can Do |
|---|---|
| **GP Staff** (`admin`) | Create deals, invite entrepreneurs, run AI analysis, score, generate memos/valuations/terms, issue LOI, advance status up to `CONTRACT_SIGNED`, upload signed SPA |
| **Superadmin** (`super_admin`) | Everything GP Staff can do + manage collaborators, **Issue Capital Calls** (gates Phase 7), **Request Revision** (reverts SPA status), finalize investments (CLOSED), manage compliance |
| **Entrepreneur** (`entrepreneur`) | Fill submission form, upload documents, view deal status, download and upload signed LOI |
| **LP Investor** (`investor`) | View deals at `LOI_ISSUED` or later, view capital call notices, view portfolio performance |

---

## Phase 1: Sourcing & Entrepreneur Onboarding

**Statuses:** `PENDING_SUBMISSION` → `SUBMITTED`

### 1.1 GP Sends Invitation
- **Actor:** GP Staff
- **Frontend:** `/gp/deals` → "Invite Entrepreneur" button
- **Backend:** `GPCreateInviteView` (POST `/api/deals/invite/`)
- **Model:** `PEProject` created with `status=PENDING_SUBMISSION`, `submission_type=ENTREPRENEUR_INVITED`
- **Side Effect:** `signals.py` → generates `invitation_token`, sends email via Brevo with submission link
- **Audit:** `ImmutableAuditEvent` type `PROJECT_STATUS_CHANGED`

### 1.2 Entrepreneur Fills Multi-Step Form
- **Actor:** Entrepreneur (token-auth or JWT-auth)
- **Frontend:** `/entrepreneur/invite/{token}` or `/entrepreneur/submissions/{id}/`
- **Backend:** `EntrepreneurSubmitStepView` / `EntrepreneurAuthSubmitStepView` (POST)
- **Models:** `PEProjectFormResponse` (one per step), `PEFormTemplate` (JSON schema)
- **Tracking:** `PEProject.form_step_completed` tracks progress index
- **Validation:** Required fields enforced per step, file uploads validated against confirmed documents

### 1.3 Document Upload
- **Actor:** Entrepreneur
- **Backend:** `EntrepreneurAuthUploadLocalView` (POST, multipart) or `EntrepreneurGetUploadURLView` (B2 presigned)
- **Model:** `PEProjectDocument` with `is_confirmed=True` on local upload
- **Limit:** 3MB per file
- **Categories:** FINANCIAL, LEGAL, COMMERCIAL, OTHER

### 1.4 Final Submission
- **Actor:** Entrepreneur
- **Backend:** `EntrepreneurFinalizeView` / `EntrepreneurAuthFinalizeView` (POST)
- **Validation:** All required fields across all steps must be complete; file upload fields must reference confirmed documents
- **Outcome:** Status → `SUBMITTED`, `submitted_at` timestamp set
- **Side Effect:** `_notify_gp_submission()` emails all GP Staff
- **Audit:** `PROJECT_STATUS_CHANGED`

---

## Phase 2: Screening & AI Analysis

**Status:** `SUBMITTED` → `SCREENING`

### 2.1 The Screening Gate
- **Actor:** GP Staff
- **Action:** Manually move status to `SCREENING` via `GPProjectDetailView` (PATCH)
- **Significance:** Unlocks all AI analysis tabs and buttons in the frontend
- **Side Effect:** `signals.py` triggers `move_project_documents_to_b2` Celery task

### 2.2 AI Analysis Pipeline

All AI tasks use **Gemini** (`gemini-flash-latest`) via `AIModelClient`. Tasks are triggered individually or as a chain via `GPFullAnalysisView`.

| Analysis | Trigger View | Celery Task | Output Model | AI Model |
|---|---|---|---|---|
| **Financial Extraction** | `GPProjectExtractFinancialsView` | `extract_financials_from_document` | `ExtractedFinancials` | Gemini |
| **QoE Analysis** | `GPProjectQoEAnalysisView` | `run_qoe_analysis` | `QoEReport` | Gemini |
| **Commercial Analysis** | `GPProjectCommercialAnalysisView` | `run_commercial_analysis` | `CommercialAnalysis` | Gemini |
| **Operational Analysis** | `GPProjectOperationalAnalysisView` | `run_operational_analysis` | `OperationalAnalysis` | Gemini |
| **Legal Scan** | `GPLegalScannerView` | `scan_legal_document` | `RedFlagFinding` | Gemini |
| **Full Pipeline** | `GPFullAnalysisView` | `run_full_analysis` (chain) | All of the above | Gemini |

**GP Overrides:**
- Extracted financials: `GPExtractedFinancialsVerifyView` (PATCH) — GP verifies and optionally corrects AI output
- Red flags: `GPRedFlagReviewView` (PATCH) — GP marks findings as reviewed
- QoE report: `GPProjectQoEUpdateView` (PATCH) — GP edits report sections

### 2.3 FINLO Scoring
- **Trigger:** `GPTriggerScoringView` (POST) → Celery `run_finlo_scoring`
- **Output:** `ScoringRun` (parent) + `CriterionScore` (per-pillar scores)
- **Compliance Gates:** 5 gates auto-created per scoring run:
  - `FITTA` — FITTA Approval
  - `AML_KYC` — AML/KYC Clearance
  - `FINANCIAL_AUDIT` — Financial Audit Verification
  - `LEGAL_STRUCTURE` — Legal Structure Validity
  - `SEBON_MAPPING` — SEBON Mapping & Compliance
- **GP Actions:**
  - Override criterion scores: `GPCriterionOverrideView` (PATCH) with `gp_score` + `gp_notes` → audit logged
  - Clear compliance gates: `GPClearComplianceGateView` (POST) with notes + supporting documents
  - Reset compliance gates: `GPResetComplianceGateView` (POST)

### 2.4 Exit Gate from SCREENING → IC_REVIEW

**Prerequisites (all must be true):**
1. Scoring run exists with a `total_deal_score`
2. ALL 5 compliance gates are `CLEARED`
3. ALL critical red flags (`severity='CRITICAL'`) are `is_reviewed_by_gp=True`

GP Staff advances status to `IC_REVIEW` via `GPProjectDetailView` (PATCH).

---

## Phase 3: IC Review — AI Valuation + IC Memo + Signed Approval

**Status:** `IC_REVIEW`

This phase has 3 sequential sub-steps. The deal stays in `IC_REVIEW` throughout.

### 3.1 AI-Generated Valuation Models

- **Actor:** GP Staff clicks "Generate AI Valuation"
- **Backend:** `POST /api/deals/projects/{id}/generate-ai-valuation/` → Celery task
- **AI Model:** Gemini (`gemini-flash-latest`)
- **Context sent to AI:** ExtractedFinancials, QoE findings, commercial analysis, sector, deal type
- **AI Output:** Structured JSON with DCF and LBO assumptions:
  - DCF: `current_revenue`, `revenue_growth_rate`, `ebitda_margin`, `tax_rate`, `wacc`, `terminal_growth_rate`, `net_debt`
  - LBO: `entry_ebitda`, `entry_multiple`, `exit_multiple`, `debt_financing`, `exit_year`
- **System Action:** Runs `calculate_dcf()` and `calculate_lbo()` with AI assumptions, saves `ValuationModel` records
- **GP Override:** Each assumption field can be overridden individually with a remark. Every override logs an `ImmutableAuditEvent` with type `VALUATION_OVERRIDE`:
  ```json
  {"field": "wacc", "old_value": 0.12, "new_value": 0.15, "remark": "Higher country risk for Nepal", "model_type": "DCF"}
  ```
- **Recalculation:** System re-runs DCF/LBO with updated assumptions after each override

### 3.2 IC Memo Generation

- **Actor:** GP Staff clicks "Generate Memo"
- **Backend:** `GPGenerateMemoView` (POST) → Celery `generate_memo_draft`
- **AI Model:** Gemini (`gemini-flash-latest`)
- **Model:** `DealMemo` with `status=DRAFT`
- **Content:** AI synthesizes all analysis into structured sections: executive_summary, company_overview, market_analysis, competitive_position, financial_analysis (includes DCF/LBO results), risk_assessment, investment_recommendation, deal_terms
- **GP Edit:** `GPMemoDetailView` (PATCH) — GP refines any section
- **Finalize:** `GPMemoFinalizeView` (POST) → generates PDF (stored locally), sets `DealMemo.status='FINAL'`

### 3.3 Signed IC Approval Upload

- **Actor:** GP Staff downloads finalized memo PDF, presents to Investment Committee, gets physical/digital signature
- **Backend:** `POST /api/deals/projects/{id}/upload-signed-ic-memo/` (multipart upload)
- **Validation:** A `DealMemo` with `status='FINAL'` must exist
- **Model:** Creates `PEProjectDocument` with `category='IC_SIGNED'`, sets `DealMemo.status='IC_SIGNED'`
- **Audit:** `ImmutableAuditEvent` type `IC_MEMO_SIGNED`

### 3.4 Exit Gate from IC_REVIEW → TERM_SHEET

**Prerequisites:**
1. At least one `ValuationModel` (DCF or LBO) exists
2. `DealMemo.status == 'IC_SIGNED'` (signed IC approval uploaded)

GP Staff advances status to `TERM_SHEET`.

---

## Phase 4: Term Sheet — AI-Drafted Terms + Negotiation

**Status:** `TERM_SHEET`

### 4.1 AI-Generated Term Sheet

- **Actor:** GP Staff clicks "Generate Term Sheet"
- **Backend:** `POST /api/deals/projects/{id}/generate-term-sheet/` → Celery task
- **AI Model:** Gemini (`gemini-flash-latest`)
- **Context sent to AI:** Valuation models (DCF equity value, LBO IRR/MOIC), ic memo,scoring results, deal type, sector, fund economics
- **AI Output:** Structured JSON with key commercial terms:
  - `investment_amount_npr`, `pre_money_valuation_npr`, `ownership_pct`
  - `board_seats`, `observer_rights`
  - `exclusivity_days`, `vesting_schedule`
  - `exit_strategy_summary`
- **Model:** `TermSheet` (new model — stores AI draft + GP overrides as JSON)
- **GP Override:** Each term field can be overridden with a remark → `ImmutableAuditEvent` type `TERM_OVERRIDE`

### 4.2 Negotiation (Manual)

GP and entrepreneur negotiate terms offline (calls, meetings, markups). GP updates term sheet fields as agreed. All changes are audit-logged.

### 4.3 Exit Gate from TERM_SHEET → LOI_ISSUED

**Prerequisites:**
1. `TermSheet` exists with all required fields populated (investment_amount, valuation, ownership_pct)

GP Staff issues LOI via `InvestmentWizard` (see Phase 5).

---

## Phase 5: LOI Issuance + Entrepreneur Signing

**Status:** `LOI_ISSUED`

### 5.1 GP Issues LOI

- **Actor:** GP Staff clicks "Close Deal" button (visible only at `TERM_SHEET` or later)
- **Frontend:** `InvestmentWizard` — 3-step modal:
  1. Investment Terms (pre-filled from `TermSheet`)
  2. LOI Detail customization (Operational Provisions & Strategic Nuances)
  3. Confirmation & Issue
- **Backend:** `IssueLOIView` (POST `/api/deals/projects/{id}/issue-loi/`)
- **Action:** Generates LOI PDF (stored locally in `media/pe_projects/documents/`), creates `PEProjectDocument` with `category='LOI'`, updates status → `LOI_ISSUED`
- **Side Effect:** Notification email sent to entrepreneur
- **Audit:** `ImmutableAuditEvent` type `LOI_ISSUED`

### 5.2 Entrepreneur Uploads Signed LOI

- **Actor:** Entrepreneur logs into dashboard
- **Frontend:** Entrepreneur Dashboard shows "Pending Action: Sign and upload LOI" card
- **Action:** Download LOI PDF → sign → upload signed copy
- **Backend:** `POST /api/entrepreneur/submissions/{id}/upload-signed-loi/` (multipart)
- **Model:** Creates `PEProjectDocument` with `category='LOI_SIGNED'`
- **Side Effect:** Email notification sent to all GP Staff: "Signed LOI received from {entrepreneur}"
- **Audit:** `ImmutableAuditEvent` type `LOI_SIGNED_BY_ENTREPRENEUR`

### 5.3 LP Visibility Begins Here

Once a deal reaches `LOI_ISSUED`, it becomes visible to LP investors in:
- `LPFundDetailView` — shows deal summary card
- LP Dashboard — deal appears in fund's approved deals list

**LPs see:** Company name, sector, deal type, investment range, FINLO score (aggregate only).
**LPs do NOT see:** Detailed financials, red flags, scoring breakdown, memo content.

### 5.4 Exit Gate from LOI_ISSUED → CONTRACT_SIGNED

**Prerequisites:**
1. Signed LOI uploaded by entrepreneur (`PEProjectDocument` with `category='LOI_SIGNED'` exists)

GP Staff advances status to `CONTRACT_SIGNED`.

---

## Phase 6: Contract Signing & Regulatory Clearance

**Status:** `CONTRACT_SIGNED`

### 6.1 AI-Drafted SPA

- **Actor:** GP Staff clicks "Generate SPA Draft"
- **Backend:** `POST /api/deals/projects/{id}/generate-spa-draft/` → Celery task
- **AI Model:** Gemini (`gemini-flash-latest`)
- **Context:** Term sheet terms, regulatory checklist status, company details, fund details
- **AI Output:** Structured SPA sections as JSON (recitals, definitions, purchase_price, representations, conditions_precedent, covenants, indemnification, governing_law)
- **Model:** `SPADraft` (new model — stores AI draft + GP overrides)
- **GP Override:** Section-by-section override with remarks → `ImmutableAuditEvent` type `SPA_OVERRIDE`
- **Note:** The AI draft is a starting point for external counsel, not a final legal document

### 6.2 Legal Execution (Manual)

- External counsel reviews and finalizes SPA + SHA
- Both parties sign contracts
- GP uploads executed documents to Data Room

### 6.3 Regulatory Clearance (Hard Gate)

The `RegulatoryChecklist` model tracks Nepal-specific approvals. These are enforced as **hard gates** before capital call creation (same UI/UX pattern as compliance gates in scoring):

| Check | Model Field | Required If |
|---|---|---|
| FITTA Approval | `fitta_approval_required` / `fitta_approval_obtained` | Foreign investment involved |
| NRB Approval | `nrb_approval_required` / `nrb_approval_obtained` | Foreign exchange involved |
| SEBON Compliance | `sebon_reporting_compliant` | Always (default: True) |
| Industry License | `industry_specific_license_required` / `industry_specific_license_obtained` | Sector-specific |

- **Backend:** `GPRegulatoryChecklistView` (GET/PATCH)
- **Enforcement:** Capital call creation (next phase) validates all required approvals are obtained
- **Audit:** `ImmutableAuditEvent` type `COMPLIANCE_REVIEW`

### 6.4 Superadmin Review & Revision Protocol
Once the signed SPA is uploaded, the deal stays in `CONTRACT_SIGNED`. The **Superadmin** performs a "four-eyes" check:
- **Approval:** Superadmin clicks "Issue Capital Call" → Advances to `CAPITAL_CALLED` (Phase 7).
- **Revision Requested:** Superadmin clicks "Request Revision" (with reason).
  - **Effect:** Latest `SPADraft` status resets to `DRAFT`.
  - **Notification:** GP Staff receives automated email with feedback.
  - **Action:** GP Staff addresses feedback, re-finalizes, and re-uploads signed copy.

### 6.5 Exit Gate from CONTRACT_SIGNED → CAPITAL_CALLED (Hard Gate)

**Prerequisites:**
1. SPA document uploaded to Data Room (`category='SPA'`)
2. `RegulatoryChecklist`: all required approvals obtained
3. Fund has sufficient uncalled capital
4. **Actor:** Superadmin role REQUIRED. Status transition is blocked for GP Staff.

---

## Phase 7: Capital Call

**Status:** `CAPITAL_CALLED`

### 7.1 Institutional Drawdown Execution
- **Actor:** Superadmin only (`super_admin` role)
- **Frontend:** Superadmin Deals page → "Issue Call" button (visible only at `CONTRACT_SIGNED`)
- **Backend:** `POST /api/deals/projects/{id}/create-capital-calls/`
- **Validation:**
  1. Deal is `CONTRACT_SIGNED` with uploaded SPA.
  2. All regulatory checklist gates passed.
  3. Fund uncalled capital >= investment amount.
- **Pro-rata calculation:**
  ```
  LP call amount = (LP committed / Total fund committed) × Deal investment amount
  ```
- **Terminal Action:** Creates `CapitalCall` records for LPs.
- **Status Change:** Deal moves to `CAPITAL_CALLED`.
- **Locking:** Once in `CAPITAL_CALLED`, status changes are restricted to ensure audit compliance. GP Staff cannot drag card out of this column.
- **Side Effect:** Automated professional email notices sent to all committed LPs.

### 7.2 LP Payment Tracking

- **Actor:** Superadmin marks payments as received
- **Backend:** `PATCH /api/deals/capital-calls/{id}/` with `status='RECEIVED'`
- **Action:** Updates `LPFundCommitment.called_amount_npr` += call amount
- **LP Dashboard:** Shows pending calls with amount, due date, deal name, payment status
- **Default:** If LP doesn't pay by due date, Superadmin can mark as `DEFAULTED` (manual handling)
- **Audit:** `ImmutableAuditEvent` type `CAPITAL_RECEIVED`

### 7.3 Exit Gate from CAPITAL_CALLED → CLOSED

**Prerequisites:**
1. ALL capital calls for this deal have `status='RECEIVED'`
2. Superadmin role required

---

## Phase 8: Investment Closing

**Status:** `CLOSED`

### 8.1 Superadmin Finalizes Investment

- **Actor:** Superadmin only
- **Frontend:** Superadmin Deals page → `InvestmentFinalizer` modal
- **Backend:** `SuperadminFinalizeInvestmentView` (POST `/api/deals/projects/{id}/finalize-investment/`)
- **Validation:**
  1. Deal is `CAPITAL_CALLED`
  2. ALL capital calls are `RECEIVED`
  3. User has `super_admin` role
  4. Required fields: `fund_id`, `investment_amount_npr`, `ownership_pct`
- **Action:**
  1. Creates `PEInvestment` record (links `PEProject` to `Fund`)
  2. Links capital calls to the investment
  3. Sets `DealMemo.status = 'FINAL'` if not already
  4. Status → `CLOSED`
- **Audit:** `ImmutableAuditEvent` type `INVESTMENT_CLOSED`

---

## Phase 9: Portfolio Monitoring & Exit

**Status:** `CLOSED` (ongoing)

### 9.1 Quarterly Valuations
- **ViewSet:** `ValuationRecordViewSet`
- **Model:** `ValuationRecord` — tracks periodic fair value adjustments
- **Metrics:** Implied MoIC, Valuation Change %

### 9.2 Exit Scenario Planning
- **ViewSet:** `ExitScenarioViewSet`
- **Model:** `ExitScenario` — models trade sale, IPO, secondary, write-off
- **IPO Eligibility:** Nepal SEBON criteria check (paid-up capital, profitability years, net worth per share)

### 9.3 Risk Simulation
- **View:** `MonteCarloSimulationView`
- **Logic:** 10,000 simulations via NumPy based on `ExitScenario` assumptions

### 9.4 Waterfall Distribution
- **View:** `WaterfallCalculateView`
- **Model:** `WaterfallModel` (fund-level config) + `WaterfallRun` (per-exit execution)
- **Logic:** LP Return → Hurdle → Catch-up → Carried Interest split

### 9.5 Portfolio KPI Reporting
- **Model:** `PortfolioKPIReport` — monthly metrics submitted by portfolio companies
- **Metrics:** Revenue, EBITDA, Cash Burn, Headcount

---

## AI Model Routing

All AI tasks use the Gemini model family via `AIModelClient`. The `TASK_ROUTING` dictionary in `ai_client.py` maps each task to a model:

| Task Type | Model | Purpose |
|---|---|---|
| `financial_extraction` | `gemini-flash-latest` | Parse financial documents into structured P&L/BS data |
| `qoe_analysis` | `gemini-flash-latest` | Quality of Earnings analysis |
| `commercial_analysis` | `gemini-flash-latest` | Market and competitive analysis |
| `operational_analysis` | `gemini-flash-latest` | Management and operational risk assessment |
| `legal_scan` | `gemini-flash-latest` | Red flag identification in legal documents |
| `scoring` | `gemini-flash-latest` | FINLO 5-pillar scoring |
| `memo_draft` | `gemini-flash-latest` | Investment committee memo generation |
| `valuation_generation` | `gemini-flash-latest` | DCF/LBO assumption generation |
| `term_sheet_draft` | `gemini-flash-latest` | Commercial term sheet drafting |
| `spa_draft` | `gemini-flash-latest` | Share Purchase Agreement initial draft |

Budget guard: `AIBudgetGuard` tracks monthly spend with a $25/month circuit breaker.

---

## Audit Trail

Every significant action creates an `ImmutableAuditEvent`. The model enforces immutability at the `save()` level — existing records cannot be modified.

| Event Type | Triggered By |
|---|---|
| `PROJECT_STATUS_CHANGED` | Any status transition |
| `VALUATION_OVERRIDE` | GP overrides AI valuation assumption |
| `TERM_OVERRIDE` | GP overrides AI term sheet field |
| `SPA_OVERRIDE` | GP overrides AI SPA section |
| `IC_MEMO_SIGNED` | Signed IC memo uploaded |
| `LOI_ISSUED` | LOI generated and sent |
| `LOI_SIGNED_BY_ENTREPRENEUR` | Entrepreneur uploads signed LOI |
| `CAPITAL_CALLED` | Capital call notices issued |
| `CAPITAL_RECEIVED` | LP payment confirmed |
| `INVESTMENT_CLOSED` | Superadmin finalizes investment |
| `SCORING_OVERRIDE` | GP overrides criterion score |
| `COMPLIANCE_CLEARED` | Compliance gate cleared |
| `COMPLIANCE_RESET` | Compliance gate reset |
| `MEMO_FINALIZED` | IC memo finalized to PDF |

---

## Technical Summary

| Phase | Status | Primary View | Key Model | AI Task |
|---|---|---|---|---|
| Sourcing | `PENDING_SUBMISSION` → `SUBMITTED` | `EntrepreneurFinalizeView` | `PEProject` | — |
| Screening | `SCREENING` | `GPFullAnalysisView` | `ExtractedFinancials`, `ScoringRun` | Gemini (all analysis) |
| IC Review | `IC_REVIEW` | `GPGenerateMemoView` | `ValuationModel`, `DealMemo` | Gemini (valuation + memo) |
| Term Sheet | `TERM_SHEET` | Term Sheet ViewSet | `TermSheet` | Gemini (term draft) |
| LOI | `LOI_ISSUED` | `IssueLOIView` | `PEProjectDocument` | — |
| Contract | `CONTRACT_SIGNED` | SPA Draft View | `SPADraft`, `RegulatoryChecklist` | Gemini (SPA draft) |
| Capital Call | `CAPITAL_CALLED` | Capital Call ViewSet | `CapitalCall` | — |
| Closing | `CLOSED` | `SuperadminFinalizeInvestmentView` | `PEInvestment` | — |
| Monitoring | `CLOSED` (ongoing) | `WaterfallCalculateView` | `WaterfallRun`, `ValuationRecord` | NumPy (Monte Carlo) |
