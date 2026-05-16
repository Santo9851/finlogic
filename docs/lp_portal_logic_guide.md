# Institutional LP Management & Equalization Guide

> **Finlogic Capital — Institutional Grade LP Infrastructure**
> This document provides a comprehensive overview of the Limited Partner (LP) portal logic, the equalization catch-up system, interest calculation, redistribution workflows, and the capital netting engine.

---

## Table of Contents

1. [Non-Technical Overview](#1-non-technical-overview)
2. [The Equalization Workflow (Step by Step)](#2-the-equalization-workflow)
3. [Redistribution: Refund vs. Capital Netting](#3-redistribution-refund-vs-capital-netting)
4. [LP Portal: What the Investor Sees](#4-lp-portal-what-the-investor-sees)
5. [Technical Architecture](#5-technical-architecture)
6. [API Reference](#6-api-reference)
7. [Data Models](#7-data-models)
8. [Edge Cases & Nuances](#8-edge-cases--nuances)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Non-Technical Overview

### What is Equalization?

When a new LP joins a fund after it has already deployed capital into projects, the new LP must "catch up." This ensures:
- **Fair Ownership**: The new LP holds their correct pro-rata share of existing investments.
- **Fair Burden**: Early LPs are not permanently over-exposed to risk they were only supposed to share.

### Who Performs Equalization?

Only **Superadmins** can trigger the equalization protocol. This is an administrative action, not something LPs or GPs do themselves.

### Where is it Located?

**Superadmin Portal → User Management → [Select an LP User] → Scroll to "Institutional LP Portfolio" → Click "Issue Manual Capital Call"**

---

## 2. The Equalization Workflow

### Step-by-Step Process

```
┌─────────────────────────────────────────────────────────────┐
│  SUPERADMIN: Navigate to User Management                     │
│  → Select a user with the "investor" role                    │
│  → Scroll to "Institutional LP Portfolio" section            │
│  → Click "Issue Manual Capital Call"                         │
└────────────────────┬────────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  MODAL: Equalization Interest (%)                            │
│  → Set optional interest rate (e.g. 8%) charged for late     │
│    entry into the fund pool                                  │
└────────────────────┬────────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  CATCH-UP CALCULATOR: System automatically identifies gaps   │
│  → Lists all projects funded before this LP joined           │
│  → Calculates the exact NPR amount owed per project          │
│  → Click a suggestion to auto-fill the form                  │
└────────────────────┬────────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  REVIEW & CONFIGURE:                                         │
│  → Drawdown Amount (auto-filled or manual override)          │
│  → Calculated Interest (auto-computed, read-only)            │
│  → Maturity Date (default: 14 days from today)               │
│  → Notes (auto-generated or manual justification)            │
│                                                              │
│  ☐ Auto-Redistribute to Early LPs                           │
│    → Choose: [Capital Netting] or [Cash Refund]              │
└────────────────────┬────────────────────────────────────────┘
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  EXECUTE: Click "Issue Individual Call"                       │
│  → Creates CapitalCall record (type: EQUALIZATION)           │
│  → If redistribute enabled:                                  │
│     • CREDIT mode: Adds credits to early LP balances         │
│     • REFUND mode: Creates Distribution records              │
│  → LP sees pending call on their dashboard                   │
└─────────────────────────────────────────────────────────────┘
```

### The Equalization Formula

```
Equalization Share = (LP Commitment / Total Fund Commitment) × Total Deal Drawdown
```

- **LP Commitment**: The new LP's pledged amount to the fund.
- **Total Fund Commitment**: Sum of all LP commitments in the fund.
- **Total Deal Drawdown**: The sum of all capital calls already issued for a specific project.

### Interest Calculation

```
Interest = Principal Amount × (Interest Rate / 100)
Total Call = Principal + Interest
```

The interest rate is set manually by the Superadmin in the modal. Common institutional rates are 6–10% annualized, but the system supports any rate. The interest compensates early LPs for the "time value of money" — they fronted capital that the new LP is only paying now.

---

## 3. Redistribution: Refund vs. Capital Netting

When the Superadmin checks **"Auto-Redistribute to Early LPs,"** they must choose a mode:

### Mode A: Capital Netting (Default — Recommended)

- **What happens**: The system adds a **credit balance** (`credit_balance_npr`) to each early LP's fund commitment record.
- **Effect on next call**: When the GP issues the next fund-wide capital call, the system automatically **subtracts** each LP's credit from their share. The LP pays less cash.
- **LP visibility**: The LP sees a prominent green banner on their dashboard: *"Capital Credit Available — From equalization rebalancing — automatically deducted from your next capital call."*
- **Why it's better**: No bank fees, no wire transfers, no reconciliation headaches. The early LPs simply pay less next time.

### Mode B: Cash Refund

- **What happens**: The system creates `Distribution` records of type `EQUALIZATION_REFUND` for each early LP.
- **Effect**: The GP must manually wire the refund amounts to early LPs.
- **LP visibility**: The LP sees the refund in their Distribution history.

### Comparison Table

| Feature | Capital Netting | Cash Refund |
|---------|----------------|-------------|
| Bank Fees | None | Wire fees apply |
| Speed | Instant (next call) | Requires manual processing |
| LP Experience | "Discount" on next call | Cash deposit received |
| GP Effort | Fully automated | Manual reconciliation |
| Best For | Ongoing funds with future calls | Mature funds nearing close |

---

## 4. LP Portal: What the Investor Sees

### If Capital Netting (CREDIT mode) was used:

**Dashboard shows a green notification strip:**
```
┌──────────────────────────────────────────────────────────────┐
│ 💰 Capital Credit Available                                   │
│ From equalization rebalancing — automatically deducted        │
│ from your next capital call                                   │
│                                                    रू 5,40,000│
│                                   Net-off Applied on Next Call│
└──────────────────────────────────────────────────────────────┘
```

### When the next capital call arrives:

The LP's call amount is **automatically reduced** by their credit balance. The capital call note shows:
```
"(Net of 540000.0 credits applied)"
```

### If Cash Refund (REFUND mode) was used:

The LP sees the distribution in their transaction history:
```
Distribution: Fund Alpha — रू 5,40,000
Type: Equalization Refund
```

---

## 5. Technical Architecture

### Role Mapping
- **Backend Role**: `investor` (stored in `core.User.roles` as a comma-separated string)
- **Frontend Check**: `user.role_list.includes('investor')`
- **Backend Permission Guard**: `IsSuperAdminRole` for all equalization operations
- **LP Permission Guard**: `IsLPRole` for dashboard access

### Component Map

```
Backend:
├── deals/models.py
│   ├── LPFundCommitment.credit_balance_npr  (new field)
│   ├── CapitalCall.CallType.EQUALIZATION     (new choice)
│   └── Distribution.DistributionType.EQUALIZATION_REFUND (new choice)
│
├── deals/views.py
│   ├── LPCatchUpCalculationView   → GET: Calculates suggestions
│   ├── LPCatchUpExecutionView     → POST: Executes the protocol
│   ├── GPCapitalCallBatchView     → POST: Now applies credit netting
│   └── LPDashboardView           → GET: Now returns credit_balance
│
└── deals/urls.py
    ├── /deals/lp-profiles/<int:lp_id>/calculate-catch-up/
    └── /deals/lp-profiles/<int:lp_id>/execute-catch-up/

Frontend:
├── components/admin/IndividualCapitalCallModal.jsx
│   ├── Interest Rate input
│   ├── Catch-up Calculator suggestions
│   ├── Auto-Redistribute checkbox
│   └── CREDIT vs REFUND mode toggle
│
├── app/(superadmin)/superadmin/users/[id]/page.js
│   └── "Institutional LP Portfolio" section (role-gated)
│
└── app/(lp)/lp/dashboard/page.jsx
    └── "Capital Credit Available" notification strip
```

---

## 6. API Reference

### Calculate Catch-up Suggestions
```
GET /api/deals/lp-profiles/{lp_id}/calculate-catch-up/
Permission: IsSuperAdminRole

Response: [
  {
    "fund_id": "uuid",
    "fund_name": "Finlogic Fund I",
    "project_id": "uuid",
    "project_name": "ABC Corp",
    "lp_commitment_id": "uuid",
    "total_deal_call": 10000000.00,
    "suggested_amount": 2500000.00,
    "is_catch_up": true
  }
]
```

### Execute Equalization Protocol
```
POST /api/deals/lp-profiles/{lp_id}/execute-catch-up/
Permission: IsSuperAdminRole

Request Body:
{
  "project": "uuid",
  "lp_commitment": "uuid",
  "fund": "uuid",
  "amount_npr": "2500000.00",
  "interest_npr": "200000.00",
  "due_date": "2026-06-01",
  "auto_redistribute": true,
  "redistribute_mode": "CREDIT",   // or "REFUND"
  "notes": "Equalization catch-up for project: ABC Corp."
}

Response:
{
  "status": "SUCCESS",
  "capital_call_id": "uuid",
  "redistributed": true,
  "mode": "CREDIT"
}
```

### LP Dashboard (includes credit balance)
```
GET /api/deals/lp/dashboard/
Permission: IsLPRole

Response includes:
{
  ...
  "total_credit_balance_npr": 540000.00,
  ...
}
```

---

## 7. Data Models

### LPFundCommitment (Updated)
| Field | Type | Description |
|-------|------|-------------|
| `committed_amount_npr` | Decimal | Total capital pledged |
| `called_amount_npr` | Decimal | Total capital already called |
| `credit_balance_npr` | Decimal | **NEW** — Excess capital credits from equalization |
| `commitment_date` | Date | When the LP joined the fund |

### CapitalCall.CallType (Updated)
| Value | Label |
|-------|-------|
| `INVESTMENT` | Capital Investment |
| `MANAGEMENT_FEE` | Management Fee |
| `FUND_EXPENSE` | Fund Expense |
| `EQUALIZATION` | **NEW** — Equalization Catch-up |
| `OTHER` | Other |

### Distribution.DistributionType (Updated)
| Value | Label |
|-------|-------|
| `RETURN_OF_CAPITAL` | Return of Capital |
| `PREFERRED_RETURN` | Preferred Return |
| `CARRIED_INTEREST` | Carried Interest |
| `EQUALIZATION_REFUND` | **NEW** — Equalization Refund |
| `DIVIDEND` | Dividend |

---

## 8. Edge Cases & Nuances

### Dynamic Fund Size
If the total fund commitment changes (e.g., a secondary close brings new LPs), the denominator in the catch-up formula automatically updates because it queries `fund.lp_commitments` live.

### Multiple Funds
If an LP is committed to multiple funds, the calculator aggregates gaps across all of them in a single view.

### Credit Exceeds Next Call
If an LP's credit balance exceeds the next capital call amount, the system only deducts the call amount and retains the remaining credit for future calls.

### Zero Credit After Netting
Once credits are fully consumed, the green notification strip disappears from the LP dashboard automatically.

### Audit Trail
Every manual call generates records in the `CapitalCall` table with `call_type='EQUALIZATION'`. If redistribution is enabled, corresponding `Distribution` records (type `EQUALIZATION_REFUND`) or credit balance updates are created atomically within a database transaction.

### Decimal Precision
All monetary calculations use Python's `Decimal` type with 15-digit precision to prevent floating-point rounding errors in multi-crore NPR transactions.

---

## 9. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Institutional LP Portfolio" section not visible | User doesn't have `investor` role | Add `investor` to the user's comma-separated roles |
| 404 on calculate-catch-up API | LP Profile doesn't exist for the user | Create an `LPProfile` record and link it to the user |
| No suggestions in the calculator | LP has already received calls for all projects | This is expected — no equalization gaps exist |
| Credit balance not showing on LP dashboard | Credit was applied via REFUND mode, not CREDIT | Only CREDIT mode populates `credit_balance_npr` |
| Interest field shows 0 | Interest rate was left at 0% | Enter a rate before clicking "Apply Suggested" |
