# 🛠️ Finlogic Capital: User Role & Dashboard Setup Guide

This guide explains how to properly configure users and populate their respective dashboards with data. Updated to reflect the **10-status unified deal flow** as of May 2026.

---

## 1. Entrepreneur (Startup Founders)
**Role Key:** `entrepreneur`

### **Setup Process:**
1.  **Invitation:** A GP Staff member creates a new project and generates an invitation link for the entrepreneur.
2.  **Project Submission:** The entrepreneur fills out the multi-step submission form (company details, financials, documents) using the invite link or their authenticated dashboard.
3.  **AI Screening:** Once submitted, the system automatically runs AI-powered analysis (extraction, QoE, commercial, operational, legal scan, FINLO scoring, compliance gates).

### **What they see:**
*   A progress tracker for their application showing the current deal status.
*   A "Diligence Room" where they can see documents they've uploaded and view feedback.
*   **LOI Signing (at `LOI_ISSUED`):** A card to download the issued LOI, sign it, and upload the signed copy back to the platform.

### **Key Statuses Visible to Entrepreneur:**
| Status | Entrepreneur Action |
|---|---|
| `PENDING_SUBMISSION` | Complete the submission form |
| `SUBMITTED` | Wait for GP review |
| `SCREENING` → `IC_REVIEW` → `TERM_SHEET` | Application under review (no direct action) |
| `LOI_ISSUED` | **Upload signed LOI** |
| `CONTRACT_SIGNED` → `CLOSED` | Deal is progressing toward closing |

---

## 2. Investor / Limited Partner (LP)
**Role Key:** `investor`

### **Setup Process:**
1.  **User Role:** Ensure the user has the `investor` role and `is_approved` is checked.
2.  **LP Profile:**
    *   Go to **LP Profiles** → Create New.
    *   Link it to the User. Set `full_name`, `organization`, `investor_type`.
3.  **Fund Commitment:**
    *   Go to **LP Fund Commitments**.
    *   Select the **Fund** and the **LP Profile**.
    *   Enter the **Committed Amount (NPR)**, **Paid-in Capital**, and **Called Amount**.
4.  **Documents:**
    *   Go to **Fund Documents**.
    *   Upload a file and set the **Doc Type** (e.g., `CAPITAL_CALL`, `QUARTERLY_REPORT`).
    *   **Crucial:** Link the document to the specific **Fund**, check **Is Published**, and set **Requires Acknowledgment** if the LP must confirm receipt.

### **What they see:**
*   **Metric cards:** Total Committed, Capital Called, Distributions, Current NAV.
*   **Performance ratios:** TVPI, DPI, RVPI, Net IRR.
*   **Portfolio companies:** Approved deals (visible from `LOI_ISSUED` onward — company name visible only after `CLOSED`).
*   **Pending Capital Calls:** Alert cards showing drawdown amount, due date, and fund name when the Superadmin issues capital calls.
*   **Document Vault:** Fund reports, capital call notices, and legal documents requiring acknowledgment.
*   **Activity Feed:** Timeline of capital calls and distributions.

### **LP Visibility Rules:**
> LPs can only see deals that have reached `LOI_ISSUED` or later. They see limited info (sector, score range, deal type) until `CLOSED`, at which point the full company name is revealed.

---

## 3. GP Investor (Company Shareholders)
**Role Key:** `gp_investor`

### **Setup Process:**
1.  **User Role:** Assign `gp_investor` and ensure `is_approved` is checked.
2.  **Shareholder Record:**
    *   Go to **GP Shareholders**.
    *   Link to the User.
    *   Input **Shares Held**, **Vesting Start Date**, and **Vesting Months**.
3.  **Dividends:**
    *   Go to **GP Dividends**.
    *   Create a record for the shareholder, enter the **Amount**, and set status to `PAID`.
4.  **Governance & IR:**
    *   **Documents:** Upload via **IR Documents** or **Fund Documents** (set type to `GP_QUARTERLY_REPORT`).
    *   **Voting:** Create a **Governance Proposal** and set status to `ACTIVE`.

### **What they see:**
*   Ownership overview (Shares, Vesting %).
*   Dividend payment history.
*   Shareholder relations documents (Board minutes, Audited reports).
*   Active votes and governance updates.

---

## 4. GP Staff (Deal Team)
**Role Key:** `gp_staff`

### **Setup Process:**
1.  **User Role:** Assign `gp_staff`. Ensure **Is Staff** is checked.
2.  **Fund Assignment:** GP Staff can view and manage deals across all funds they have access to.

### **What they see & do:**
*   **Deal Pipeline:** Full list of projects across all statuses with AI analysis results, scoring, red flags, and compliance gates.
*   **IC Review Stage:**
    *   Generate AI Valuations (DCF/LBO) using Gemini with field-by-field override capability.
    *   Generate and finalize IC Memos (AI-drafted, downloadable PDF).
    *   Upload the signed IC Memo after committee approval.
*   **Term Sheet Stage:** Generate AI-drafted term sheets, override fields with audit trail.
*   **LOI Issuance:** Generate and issue LOI documents to entrepreneurs (stored locally).
*   **Compliance Management:** Review and clear compliance gates (FITTA, AML/KYC, SEBON).

### **Deal Flow (GP Staff actions):**
```
SUBMITTED → SCREENING (auto) → IC_REVIEW (manual advance)
→ TERM_SHEET (after signed IC memo) → LOI_ISSUED (generate LOI)
→ CONTRACT_SIGNED (after entrepreneur signs LOI + SPA execution)
```

---

## 5. Super Admin
**Role Key:** `super_admin`

### **Setup Process:**
1.  **User Role:** Assign `super_admin`. Ensure **Is Staff** and **Is Superuser** are checked.

### **What they see & do:**
*   **Dashboard:** Platform-wide metrics, user counts, fund performance.
*   **User Management:** Create, approve, and assign roles to all user types.
*   **Fund Management:** Create and manage funds, set fund parameters (carry, preferred return, vintage year).
*   **Deal Management:** View all deals with lifecycle controls:
    *   **Issue Capital Call** (at `CONTRACT_SIGNED`): Creates pro-rata capital calls for all LPs in the fund.
    *   **Finalize Investment** (at `CAPITAL_CALLED`): Closes the deal after all LP payments are received.
*   **Capital Calls Dashboard:** Track all capital calls across funds, mark payments as received, monitor defaults.
*   **Prompt Library:** Manage AI system and user prompts for all analysis tasks.
*   **Audit Logs:** View the immutable audit trail of all platform actions.
*   **Compliance:** Regulatory checklists, SEBON filing deadlines.
*   **Analytics:** Fund performance, deal flow metrics, portfolio analytics.

### **Super Admin Capital Call Flow:**
```
CONTRACT_SIGNED → Issue Capital Call (pro-rata across LPs)
→ CAPITAL_CALLED → Mark LP payments as RECEIVED
→ Finalize Investment → CLOSED (PEInvestment record created)
```

> **Important:** Finalization requires ALL capital calls to be `RECEIVED` and all regulatory checklist items to be cleared (FITTA, NRB if applicable).

---

## Quick Reference: The 10-Status Deal Lifecycle

```
PENDING_SUBMISSION → SUBMITTED → SCREENING → IC_REVIEW
→ TERM_SHEET → LOI_ISSUED → CONTRACT_SIGNED
→ CAPITAL_CALLED → CLOSED

(DECLINED can occur from SUBMITTED, SCREENING, or IC_REVIEW)
```

For the full technical specification including API endpoints, audit events, and AI task routing, see **`deal-flow.md`**.
