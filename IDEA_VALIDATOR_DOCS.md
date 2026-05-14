# IDEA VALIDATOR – COMPLETE DOCUMENTATION

────────────────────────────────────────────────────────
**FINLOGIC CAPITAL LIMITED**
*Where Vision Meets Wisdom*
────────────────────────────────────────────────────────

## 1. Overview

### What is the Idea Validator?
The **Idea Validator** is a cornerstone feature of the Finlogic Capital platform. It is a proprietary, AI-driven diagnostic engine designed to evaluate the viability, scalability, and institutional readiness of business ideas within the context of the Nepali market. 

### Who is it for?
- **Entrepreneurs**: To stress-test their concepts before approaching investors.
- **Investors**: To perform a rapid first-pass evaluation of a deal.
- **Business Strategists**: Anyone with a serious business concept who wants an institutional-grade critique.

### Key Differentiators
- **Quota-Based Free Usage**: Every registered user receives a set number of "Validation Credits."
- **AI-Powered Analysis**: Uses advanced reasoning models (Gemini Flash & DeepSeek) to provide nuanced, high-fidelity reports.
- **Internal Red-Team Reports**: Beyond the user-facing report, Finlogic can trigger "Adversarial" reviews for deeper internal scrutiny.
- **Social Sharing**: Built-in functionality to share results with professional Finlogic branding to build credibility.

### Mission & Philosophy
The Validator is built upon Finlogic’s core investment philosophy: identifying "Unconventional Vision" and backing it with "Strategic Wisdom." While it uses the internal five-pillar framework to structure its analysis, the interface is designed to be accessible, moving users from raw ideas to institutional-grade logic.

---

## 2. User Journey

### 2.1 Accessing the Validator
- **Authentication**: Usage is strictly limited to registered Finlogic users. Anonymous or guest usage is not supported to maintain data integrity and quota security.
- **Landing Page**: Located at `/validate`, the landing page provides a high-level overview of the process and displays the user's **Current Quota Status**.
- **Credit Check**: A user cannot start a new validation session if their remaining credits are zero.

### 2.2 Completing the Form
- **Structure**: The form consists of 5 steps, with 5 questions per step (25 questions total).
- **Format**: Questions are presented in a bilingual format (**Nepali followed by English**). Each question is a Multiple Choice Question (MCQ) with an "Other" option to capture unique inputs.
- **Nepal-Specific Hints**: Every question includes a "Hint" featuring real-world Nepal-specific examples (e.g., agricultural scenarios in Dhading or tourism in Pokhara) to provide context.
- **Auto-Save & Resume**: The platform automatically saves progress after each step. Users can leave the page and return later to resume from where they left off.

### 2.3 Submission and AI Analysis
- **Final Review**: Users can review their answers before committing.
- **Credit Deduction**: Upon clicking "Finalize Submission," one validation credit is deducted from the user's quota.
- **Processing State**: The user is redirected to a "Processing" screen. In the background, an asynchronous Celery worker triggers the AI reasoning chain. The UI polls the server for status updates.

### 2.4 Viewing the Report
- **Notifications**: Users receive both an email and an in-app notification once the report is generated.
- **The Report Page**: Accessible at `/validate/report/{id}`, the report is divided into several professional modules:
  - **The Architect’s Verdict**: A high-level summary (VIABLE, PIVOT REQUIRED, or DEAD ON ARRIVAL).
  - **Market & Competitive Landscape**: Analysis of local competition and market depth.
  - **Strategic Validation (SWOT)**: Strengths, Weaknesses, Opportunities, and Threats tailored to the Nepal context.
  - **Financial Feasibility**: Assessment of the business model's revenue potential.
  - **Scale Timeline**: A projected roadmap for growth.
  - **Founder’s Blueprint**: Advice on team building and skill gaps.
- **Disclaimer**: Every report includes a mandatory disclaimer stating that the analysis is for educational purposes and does not constitute financial advice.

### 2.5 Social Sharing
- **Branded Share Cards**: Users can generate a "Shareable Card"—a high-fidelity image containing the Finlogic logo, the validation verdict, and a unique QR/Link to the public report.
- **Public Links**: A public-facing version of the report is available for sharing with potential partners or team members.

### 2.6 Quota Top-Up
- **Zero Quota**: When a user runs out of credits, the system displays a "Credits Exhausted" message.
- **Purchase Flow**: Users are directed to contact the Finlogic support team via WhatsApp or Email for manual top-ups.
- **Admin Adjustment**: Once payment is confirmed, a Super-Admin manually adjusts the user's quota via the administration panel, which is logged for audit purposes.

---

## 3. The 25-Question Form (Verbatim Reference)

### Step 1
1. **समस्या (Problem)**: तपाईंको व्यवसायले कस्तो समस्या समाधान गर्छ? 
   - *Hint*: Nepal example: 'Farmers near Dhading lose 30% of vegetables before reaching Kathmandu...'
2. **पीडित (Affected)**: यो समस्याबाट कसलाई सबैभन्दा बढी असर गर्छ? 
   - *Hint*: Nepal example: 'Small hotel owners in Pokhara who cannot manage online bookings.'
3. **वर्तमान समाधान (Current Solution)**: अहिले मानिसहरूले यो समस्या कसरी सामना गर्छन्? 
   - *Hint*: Nepal example: 'Currently farmers sell to middlemen at low prices...'
4. **तपाईंको समाधान (Your Solution)**: तपाईंको व्यवसायले यो समस्यालाई कसरी समाधान गर्छ? 
   - *Hint*: Nepal example: 'We build a mobile app connecting farmers directly with consumers.'
5. **फरक (Difference)**: तपाईंको समाधान अरूभन्दा कसरी फरक छ? 
   - *Hint*: Nepal example: 'Other apps only work for large urban farmers. Ours works offline too.'

### Step 2
6. **ग्राहक (Customers)**: तपाईंको उत्पादन वा सेवा कसले किन्छ?
7. **बजार आकार (Market Size)**: नेपालमा कति सम्भावित ग्राहक छन्?
8. **मूल्य (Pricing)**: तपाईंले आफ्नो उत्पादन/सेवाको मूल्य कति राख्ने सोच्नुभएको छ?
9. **लगानी आवश्यकता (Investment Need)**: व्यवसाय सुरु गर्न कति पैसा चाहिन्छ र क्यों?
10. **पहिलो वर्ष लक्ष्य (Year 1 Target)**: पहिलो वर्षमा कति आम्दानी लक्ष्य छ?

### Step 3
11. **टोली (Team)**: मुख्य व्यक्तिहरू को को हुनुहुन्छ?
12. **अनुभव (Experience)**: यो व्यवसाय गर्नका लागि तपाईंसँग के अनुभव छ?
13. **सीपको कमी (Skill Gaps)**: टोलीमा कुन सीपको कमी छ?
14. **प्रेरणा (Motivation)**: तपाईं यो व्यवसाय गर्न किन प्रेरित हुनुभयो?
15. **कानुनी अवस्था (Legal Status)**: व्यवसायको कानुनी अवस्था के हो?

### Step 4
16. **ग्राहक परीक्षण (Customer Testing)**: के तपाईंले ग्राहकहरूसँग परीक्षण गरिसक्नुभएको छ?
17. **हालको आम्दानी (Current Revenue)**: के अहिले पैसा कमाइरहेको छ?
18. **प्रमाण (Evidence)**: यो काम गर्छ भन्ने कुनै प्रमाण छ?
19. **तुलना (Comparison)**: नेपाल वा विश्वमा यस्तो सफल व्यवसाय छ?
20. **जोखिम (Risk)**: सबैभन्दा ठूलो जोखिम के हो? (इमानदारीपूर्वक)

### Step 5
21. **साझेदार (Partners)**: कुन साझेदार वा आपूर्तिकर्ता चाहिन्छन्?
22. **प्रतिस्पर्धी (Competitors)**: तपाईंका प्रतिस्पर्धी को को हन्?
23. **विशेष पहुँच (Special Access)**: तपाईंसँग कुनै विशेष सम्पर्क वा पहुँच छ जुन अरूसँग छैन?
24. **तीन वर्षे लक्ष्य (3 Year Goal)**: लगानी पछि ३ वर्षमा कहाँ पुग्ने लक्ष्य छ?
25. **फिनलॉजिक उपयुक्तता (Finlogic Fit)**: Finlogic Capital ले तपाईंमा लगानी गर्नु किन सही हुनेछ?

---

## 4. AI Analysis

### The Polished Report Engine
The validator uses a sophisticated asynchronous pipeline. When a user submits their form, the data is fed into a **Venture Architect AI Persona**. This persona is programmed to think like a top-tier management consultant blended with a seasoned private equity investor.

- **Reasoning Model**: The engine uses high-parameter models (Gemini Flash) to synthesize the 25 responses into a cohesive strategy.
- **Evaluation Areas**: It looks for logical consistency between the problem and solution, market realism, team-product fit, and operational feasibility within the Nepal regulatory environment.
- **Educational Intent**: The primary goal is to help the user refine their thinking. The report highlights "blind spots" that the user might have missed.
- **The Red-Team (Internal)**: Finlogic Super-Admins can trigger a secondary "Adversarial" analysis. This uses a "Ruthless Adversary" persona (powered by DeepSeek R1) designed to find reasons *not* to invest. This report is strictly confidential and used for Finlogic’s internal deal filtering.

> [!IMPORTANT]
> **Disclaimer**: The Idea Validator report is generated by Artificial Intelligence. It is intended for educational and strategic guidance only. It does not constitute financial, legal, or investment advice. Finlogic Capital Limited accepts no liability for decisions made based on this analysis.

---

## 5. Super-Admin Controls

Super-Admins manage the validator through the dedicated portal at `/superadmin/validations`.

- **Comprehensive Dashboard**: View all validation sessions across the entire platform.
- **Filtering**: Search by User ID, Verdict (Viable, Pivot, DOA), Status, or Date range.
- **Full Response View**: Admins can see the raw MCQ selections and free-text entries for every question.
- **Adversarial Request**: On the session detail page, Admins can click "Generate Red-Team Report" to trigger the internal-only adversarial analysis.
- **Quota Management**: 
  - Admins can view a user's remaining validation credits.
  - They can manually "Adjust Quota" (add or subtract credits).
  - Every adjustment requires a mandatory **Reason Note**, which is saved in an immutable `QuotaAdjustmentLog`.

---

## 6. Technical Reference

### 6.1 API Endpoints

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/idea-validator/sessions/` | JWT | Starts a new validation session. |
| `GET` | `/api/idea-validator/sessions/questions/` | JWT | Fetches the full bilingual question bank. |
| `POST` | `/api/idea-validator/sessions/{id}/save-step/` | JWT | Saves responses for a specific step (1-5). |
| `POST` | `/api/idea-validator/sessions/{id}/submit/` | JWT | Deducts quota and triggers the AI task. |
| `GET` | `/api/idea-validator/sessions/{id}/poll_status/` | JWT | Returns current status (draft, submitted, processing, completed). |
| `GET` | `/api/idea-validator/sessions/{id}/polished-report/` | JWT | Returns the final user-facing AI report. |
| `GET` | `/api/idea-validator/sessions/` | JWT | Lists the current user's historical validations. |
| `POST` | `/api/idea-validator/quota/adjust-user-quota/` | Super-Admin | Manually adjusts credits for a specific user. |
| `POST` | `/api/idea-validator/sessions/{id}/generate-red-team/` | Super-Admin | Triggers the internal adversarial AI task. |
| `GET` | `/api/idea-validator/sessions/{id}/share/` | Public | Public endpoint for branded share data. |

### 6.2 Authentication & Permissions
The system utilizes **JWT (JSON Web Token)** authentication. 
- **Ownership**: A user can only access `sessions` they created.
- **Super-Admin**: Users with the `super_admin` role can bypass ownership checks to view all reports and trigger adversarial analysis.

### 6.3 Data Models
- **IdeaValidationSession**: The primary record tracking status, progress, and the final reports.
- **ValidationAnswer**: Stores individual question responses linked to a session.
- **Question / Option**: Database models defining the form structure (bilingual text, hints, order).
- **IdeaValidatorQuota**: Tracks `remaining_validations` per user.
- **QuotaAdjustmentLog**: An audit trail of every manual quota change.

### 6.4 AI & Asynchronous Tasks
The system uses **Celery with Redis** to handle AI calls. This ensures the web server remains responsive during the 30-60 seconds required for the AI to "think."
- **Primary Model**: `gemini-flash-latest`.
- **Reasoning/Red-Team**: `deepseek-reasoner`.

---

## 7. FAQ

**Q: Who can use the validator?**  
A: Any registered user on the Finlogic platform, regardless of their role.

**Q: Is there a cost?**  
A: Every user gets a limited number of free credits upon registration. Additional credits can be purchased manually.

**Q: What happens if I run out of quota?**  
A: You will see a message to contact support. We manually top up accounts after payment or for high-potential partners.

**Q: How accurate is the AI analysis?**  
A: It is highly accurate at identifying structural weaknesses in a business model, but it cannot predict market shocks or human factors.

**Q: My report says “Pivot Required” – what does that mean?**  
A: It means the AI found a significant flaw (e.g., the market is too small or the pricing is unrealistic). It usually provides suggestions on what to change.

---

## 8. Support & Contact

If you have issues with your validation or wish to purchase more credits:

- **Email**: support@finlogiccapital.com
- **WhatsApp**: +977-9851437351
- **Contact Page**: [finlogiccapital.com/contact](https://www.finlogiccapital.com/contact)

*Expected response time for quota adjustments: Under 4 hours during business days.*
