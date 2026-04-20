# Finlogic Capital

Finlogic Capital is a comprehensive financial technology platform designed to streamline deal management, investor tracking, and financial analytics. Built with a modern tech stack, it features a robust Django REST API backend and a dynamic Next.js frontend.

## 🚀 Features

- **Deal Management**: Track and manage financial deals through their lifecycle.
- **Investor Portal**: Secure access for investors to view portfolios and updates.
- **AI-Powered Analytics**: Integration with Google Gemini for intelligent financial insights.
- **Dynamic Dashboards**: Real-time data visualization using Recharts and Framer Motion.
- **Secure Authentication**: JWT-based authentication for the API and NextAuth.js for the frontend.
- **Cloud Storage**: Integrated with Backblaze B2 for secure document and media storage.
- **Automated Emailing**: Transactional emails powered by Brevo (formerly Sendinblue).

## 🛠️ Tech Stack

### Backend
- **Framework**: [Django](https://www.djangoproject.com/) & [Django REST Framework](https://www.django-rest-framework.org/)
- **Database**: PostgreSQL
- **Caching/Task Queue**: Redis & Celery
- **AI Integration**: Google Generative AI (Gemini)
- **Storage**: Backblaze B2 (via Boto3)
- **Email**: Brevo (via Django Anymail)

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Charts**: Recharts

## 📁 Project Structure

```text
finlogic/
├── backend/            # Django API project
│   ├── core/           # Core settings and configurations
│   ├── deals/          # Deal management app
│   ├── finlogic_api/   # Main project entry point
│   ├── manage.py       # Django CLI
│   └── requirements.txt
├── frontend/           # Next.js web application
│   ├── src/            # Source code
│   ├── public/         # Static assets
│   ├── package.json    # Dependencies and scripts
│   └── next.config.mjs
├── docker-compose.yml  # Container orchestration
└── SERVER_SETUP.md     # Deployment guide
```

## ⚙️ Getting Started

### Prerequisites
- Python 3.10+
- Node.js 20+
- PostgreSQL
- Redis

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables in a `.env` file (refer to `.env.example`).
5. Run migrations:
   ```bash
   python manage.py migrate
   ```
6. Start the development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in a `.env.local` file.
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🚢 Deployment

For detailed deployment instructions on a VPS (like Vultr), please refer to the [SERVER_SETUP.md](./SERVER_SETUP.md) file.

## 📄 License

This project is proprietary and confidential. All rights reserved.
