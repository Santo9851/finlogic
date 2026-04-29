# 🛠️ Finlogic Capital: User Role & Dashboard Setup Guide

This guide explains how to properly configure users and populate their respective dashboards with data.

---

## 1. Entrepreneur (Startup Founders)
**Role Key:** `entrepreneur`

### **Setup Process:**
1.  **User Creation:** The user signs up via the portal.
2.  **Project Submission:** The entrepreneur fills out the "Submit Project" form.
3.  **Admin Review:**
    *   Go to **Projects** in the Admin Panel.
    *   Change the **Status** (e.g., from `SUBMITTED` to `UNDER_REVIEW`).
    *   Assign a **Project Score** if you want them to see AI/Manual evaluation metrics.

### **What they see:**
*   A progress tracker for their application.
*   A "Diligence Room" where they can see documents they've uploaded and feedback from your team.

---

## 2. Investor (Limited Partners)
**Role Key:** `investor`

### **Setup Process:**
1.  **User Role:** Ensure the user has the `investor` role and `is_approved` is checked.
2.  **LP Profile:** 
    *   Go to **LP Profiles** -> Create New.
    *   Link it to the User.
3.  **Fund Commitment:**
    *   Go to **Investor Commitments**.
    *   Select the **Fund** and the **Investor**.
    *   Enter the **Committed Amount** and **Paid-in Capital**.
4.  **Documents:**
    *   Go to **Fund Documents**.
    *   Upload a file and set the **Doc Type** (e.g., `CAPITAL_CALL`).
    *   **Crucial:** Link the document to the specific **Fund** or **Investor** and check **Is Published**.

### **What they see:**
*   Financial cards showing: *Total Committed*, *Paid-in Capital*, *Remaining to Call*.
*   A list of their funds and related portfolio companies.
*   A secure document vault for notices.

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

## 4. Admin / Staff
**Role Key:** `admin` or `super_admin`

### **Setup Process:**
1.  **User Role:** Assign `admin` or `super_admin`.
2.  **Staff Status:** Ensure **Is Staff** is checked in the Django User model to allow access to `/admin`.

### **What they see:**
*   The **Insights/Management Dashboard**.
*   Quick links to review new projects and approve role requests.
