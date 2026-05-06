# Finlogic Capital — Deep Technical Deal Flow Guide

This document provides a comprehensive technical map of the Deal Flow lifecycle, including specific Views, Models, and Serializers involved in every state transition.

---

## Phase 1: Sourcing & Entrepreneur Onboarding
**Objective:** Initiate a new deal and collect initial company data.

### 1. GP: Send Invitation
- **Frontend Action:** Click "Invite Entrepreneur" in Pipeline.
- **Backend View:** `GPCreateInviteView` (POST)
- **Model:** `PEProject` (Status: `PENDING_SUBMISSION`)
- **Serializer:** `PEProjectListSerializer`
- **Side Effect:** `signals.py` generates `invitation_token` and sends email via Brevo.

### 2. Entrepreneur: Step-by-Step Submission
- **Frontend Action:** Fills multi-step form at `/entrepreneur/invite/{token}`.
- **Backend View:** `EntrepreneurSubmitStepView` (POST)
- **Model:** `PEProjectFormResponse`
- **Serializer:** `PEProjectFormResponseSerializer`
- **Tracking:** `PEProject.form_step_completed` tracks progress index.

### 3. Entrepreneur: Data Room Upload
- **Frontend Action:** Uploads documents in "Documents" step.
- **Backend View:** `EntrepreneurGetUploadURLView` -> `DocumentConfirmView`.
- **Model:** `PEProjectDocument`
- **Storage:** Local Media or Backblaze B2.
- **Status:** `is_confirmed = True` on metadata creation.

### 4. Final Submission
- **Frontend Action:** Click "Submit Project".
- **Backend View:** `EntrepreneurFinalizeView`
- **Logic:** Validates all required fields from `PEFormTemplate` steps.
- **Outcome:** Status -> `SUBMITTED`. Audit Log: `PROJECT_SUBMITTED`.

---

## Phase 2: Due Diligence & AI Analysis
**Objective:** Move from raw data to actionable investment insights.

### 1. The Screening Gate (CRITICAL)
- **Action:** GP must manually move status to `SCREENING`.
- **Backend View:** `GPProjectUpdateView` (PATCH)
- **Significance:** Unlocks AI extraction and scanning buttons in the UI.

### 2. Financial AI Extraction
- **Backend View:** `GPProjectExtractFinancialsView` (POST)
- **Task:** `tasks.extract_financials_from_document` (Celery)
- **AI Logic:** `AIModelClient` parses PDF -> `ExtractedFinancials` model.
- **Model:** `ExtractedFinancials` (Stores 3 years of P&L/BS data).

### 3. Legal/Red-Flag Scanning
- **Backend View:** `GPLegalScannerView` (POST)
- **Trigger:** Only for `LEGAL` documents or filenames containing "Contract".
- **Model:** `RedFlagFinding` (Links specific findings to a document).

### 4. Full Analysis Chain
- **Backend View:** `GPFullAnalysisView`
- **Tasks:** `chain(run_qoe_analysis, run_commercial_analysis, run_operational_analysis)`
- **Models:** `QoEReport`, `CommercialAnalysis`, `OperationalAnalysis`.

---

## Phase 3: Scoring & LP Approval
**Objective:** Standardize deal quality and prepare for capital calls.

### 1. Quantitative Scoring
- **Backend View:** `GPTriggerScoringView`
- **Model:** `ScoringRun` (Parent), `CriterionScore` (Line items).
- **Compliance:** `ComplianceGate` records manual clearing of KYC/KYB blocks.

### 2. Investment Memo
- **Backend View:** `GPGenerateMemoView`
- **Model:** `DealMemo`
- **Action:** Status -> `GP_APPROVED`. Audit Log: `PROJECT_STATUS_CHANGED`.

---

## Phase 4: Investment Execution & Closing
**Objective:** Bridge the gap between a "Lead" and a "Portfolio Asset".

### 1. Closing the Deal
- **Current Method:** Manual entry in Django Admin.
- **Model:** `PEInvestment` (Links `PEProject` to a `Fund`).
- **Data Points:** Entry Valuation, Ownership %, Invested Amount.

### 2. Capital Calls
- **Model:** `CapitalCall`
- **Logic:** Calculates LP-wise commitment split based on `LPFundCommitment`.

---

## Phase 5: Monitoring & Exit Planning
**Objective:** Track Fair Value and simulate future harvest scenarios.

### 1. Quarterly Valuations
- **Viewset:** `ValuationRecordViewSet`
- **Logic:** Computes **Implied MoIC** and **Valuation Change %** in real-time.

### 2. Risk Simulation (Monte Carlo)
- **Backend View:** `MonteCarloSimulationView`
- **Logic:** Runs 10k simulations via NumPy based on `ExitScenario` assumptions.

### 3. Exit Execution (The Waterfall)
- **Backend View:** `WaterfallCalculateView`
- **Logic:** Computes split between LP Return, Hurdle, Catch-up, and Carry.
- **Model:** `WaterfallRun`.

---

## Technical Summary Table
| Phase | Critical View | Primary Model | AI Engine |
| :--- | :--- | :--- | :--- |
| **Sourcing** | `EntrepreneurFinalizeView` | `PEProject` | N/A |
| **DD** | `GPFullAnalysisView` | `ExtractedFinancials` | DeepSeek R1 / Gemini |
| **Scoring** | `GPTriggerScoringView` | `ScoringRun` | GPT-4o (Weighting) |
| **Closing** | `PEInvestmentAdmin` | `PEInvestment` | N/A |
| **Exit** | `WaterfallCalculateView` | `WaterfallRun` | NumPy (Deterministic) |
