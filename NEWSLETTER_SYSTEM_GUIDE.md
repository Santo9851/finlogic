# Capital Lines: Newsletter Management System Guide

Welcome to the **Capital Lines** newsletter system documentation. This guide covers both the strategic workflow for administrators and the technical architecture for developers.

---

## 1. System Overview
**Capital Lines** is an institutional-grade newsletter system built to deliver high-fidelity strategic dispatches to Finlogic Capital’s exclusive network of founders, investors, and international partners.

### Key Features:
- **Segmented Subscriptions**: Target different audiences (Founders, LPs, Partners) with tailored content.
- **Branded Dispatches**: Responsive, table-based HTML templates matching the Finlogic brand aesthetic.
- **Advanced Admin**: Integrated Django admin with engagement tracking, issue previews, and bulk sending.
- **Archive & Discovery**: A public Next.js archive page using ISR for performance and SEO.
- **Engagement Analytics**: Real-time tracking of opens, clicks, and unsubscriptions.

---

## 2. Non-Technical Workflow (Administrator Guide)

### A. Managing Subscribers
1. **Acquisition**: Users can subscribe via the website footer. They must select a **Segment** (Founder, Investor, etc.).
2. **Segmentation**: In the Admin panel, you can filter subscribers by segment to send targeted updates.
3. **Status Tracking**: Subscribers are marked as `Active`, `Unsubscribed`, or `Bounced`. The system automatically handles unsubscriptions via secure tokens.

### B. Creating and Sending an Issue
1. **Drafting**: Navigate to **Newsletter > Issues** in the Admin panel.
2. **Sections**: An issue consists of 6 core sections:
   - *The Signal*: Current market observations.
   - *The Thesis*: Deep-dive analysis.
   - *Founders Circle*: Content specifically for entrepreneurs.
   - *LP Perspective*: Strategic notes for investors.
   - *The Data*: Quantitative insights.
   - *One Question*: A closing thought-provoking query.
3. **Previewing**: Use the **"Preview HTML"** link in the admin list to see how the email will look before sending.
4. **The Sending Workflow**:
   - **Dry Run**: Always check the "Dry Run" checkbox first. This will simulate the send and show you exactly how many people would receive it without actually sending any emails.
   - **Send**: Uncheck "Dry Run" and use the **"Send Issue to Subscribers"** action. The system will dispatch emails via Brevo.

### C. Monitoring Performance
- **Open Rate**: Visible directly in the Issue list. A "Heat" indicator (Red/Amber/Green) shows engagement levels.
- **Engagement Log**: The **Send Events** table logs every open and click, providing a detailed audit trail of user interest.

---

## 3. Technical Architecture (Developer Guide)

### A. Backend (Django)
- **App**: `newsletter`
- **Email Engine**: Uses `django-anymail` with the **Brevo (Sendinblue)** backend.
- **Tracking**:
  - **Open Tracking**: Injects a transparent 1x1 GIF (`/newsletter/track/open/<token>/`).
  - **Click Tracking**: Handled by Brevo, with events sent back via webhooks.
- **Webhooks**: Endpoint at `/api/newsletter/webhook/brevo/` processes real-time events (delivery, clicks, bounces).

### B. Frontend (Next.js)
- **Archive Page**: `app/newsletter/page.jsx` fetches data using `fetch` with `revalidate: 300`.
- **Issue Page**: `app/newsletter/[slug]/page.jsx` uses dynamic routing and `generateStaticParams` for pre-rendering.
- **Branding**: Implemented using Tailwind CSS with theme-aware tokens (`bg-background`, `bg-card`, etc.) supporting both **Light** and **Dark** modes.

### C. API Endpoints
- `POST /api/newsletter/subscribe/`: Public subscription endpoint.
- `GET /api/newsletter/api/archive/`: Public list of sent issues.
- `GET /api/newsletter/api/<slug>/`: Detailed content for a specific issue.
- `GET /api/newsletter/unsubscribe/<token>/`: Secure, one-click unsubscription.

---

## 4. Configuration & Setup

### Environment Variables (.env)
```bash
# Brevo Integration
BREVO_API_KEY=your_api_key
BREVO_WEBHOOK_KEY=your_secret_webhook_token

# Newsletter Settings
NEWSLETTER_FROM_EMAIL=capitallines@finlogiccapital.com
NEWSLETTER_FROM_NAME="Capital Lines · Finlogic Capital"
NEWSLETTER_BASE_URL=https://finlogiccapital.com
```

### Webhook Configuration
In the Brevo Dashboard, configure a new webhook:
- **URL**: `https://finlogiccapital.com/api/newsletter/webhook/brevo/`
- **Events**: Select `Delivered`, `Opened`, `Clicked`, `Unsubscribed`, `Hard Bounce`.
- **Authentication**: Select **Token** and provide the value matching `BREVO_WEBHOOK_KEY`.

---

## 5. Maintenance & Troubleshooting
- **Celery**: For high-volume sends (e.g., >1000 subscribers), ensure the Celery worker is running to handle email dispatching asynchronously.
- **CSS Inlining**: The email templates use the `premailer` pattern (integrated in `template.py`) to ensure styles are rendered correctly across all email clients (Outlook, Gmail, Apple Mail).
- **Security**: All unsubscription tokens are unique UUIDs, preventing "enumeration attacks" where someone could guess emails to unsubscribe.

---
*Created by Antigravity AI for Finlogic Capital Limited.*
