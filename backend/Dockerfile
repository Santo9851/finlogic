# ── Stage 1: dependency install ──────────────────────────────────────────────
FROM python:3.12-slim AS deps

WORKDIR /app

# OS-level deps needed to compile psycopg2-binary + grpcio
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

WORKDIR /app

# Only the minimal runtime C libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from the deps stage
COPY --from=deps /usr/local/lib/python3.12 /usr/local/lib/python3.12
COPY --from=deps /usr/local/bin /usr/local/bin

# Copy application source
COPY . .

# Collect static files (uses STATIC_ROOT defined in settings)
ENV DJANGO_SETTINGS_MODULE=finlogic_api.settings \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN python manage.py collectstatic --noinput

EXPOSE 8000

# Gunicorn: 4 workers, bind to all interfaces
CMD ["gunicorn", "finlogic_api.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "4", \
     "--timeout", "120"]
