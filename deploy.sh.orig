#!/bin/bash

# ==============================================================================
# Finlogic Capital - All-in-One Deployment Script
# Target OS: Ubuntu 22.04 LTS
# ==============================================================================
#
# HOW TO USE:
# 1. Upload this script to your fresh Ubuntu server (e.g., via scp or copy-paste).
# 2. Make it executable: chmod +x deploy.sh
# 3. Run as root: sudo ./deploy.sh
#
# This script will:
# - Harden your server (SSH, UFW, fail2ban)
# - Install Docker, Nginx, Certbot
# - Set up the Finlogic application environment
# - Configure SSL via Let's Encrypt
# ==============================================================================

set -e # Exit on error

# --- Colors for output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Helper Functions ---
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# 1. Check if running as root
if [ "$EUID" -ne 0 ]; then
    log_error "Please run as root or using sudo."
fi

# 2. Collect Information Interactively
echo -e "${BLUE}------------------------------------------------------------${NC}"
echo -e "${BLUE}        FINLOGIC CAPITAL - SERVER DEPLOYMENT TOOL           ${NC}"
echo -e "${BLUE}------------------------------------------------------------${NC}"

read -p "Enter Domain Name (e.g., finlogiccapital.com): " DOMAIN
if [[ -z "$DOMAIN" ]]; then log_error "Domain name is required."; fi

read -p "Enter Email for SSL Notifications: " EMAIL
if [[ -z "$EMAIL" ]]; then log_error "Email is required."; fi

read -p "Enter Custom SSH Port [Default 22]: " SSH_PORT
SSH_PORT=${SSH_PORT:-22}

log_warn "PLEASE ENSURE DNS A-RECORD FOR $DOMAIN AND www.$DOMAIN POINTS TO THIS SERVER IP."
read -p "Continue? (y/n): " CONFIRM
if [[ "$CONFIRM" != "y" ]]; then exit 0; fi

# Generate random password for finlogic user
FINLOGIC_PASSWORD=$(openssl rand -base64 16)

# 3. Server Hardening & Base Setup
setup_base() {
    log_info "Setting timezone to Asia/Kathmandu..."
    timedatectl set-timezone Asia/Kathmandu

    log_info "Configuring Swap (2GB) if needed..."
    TOTAL_RAM=$(free -m | awk '/^Mem:/{print $2}')
    if [ "$TOTAL_RAM" -le 2048 ]; then
        if [ ! -f /swapfile ]; then
            fallocate -l 2G /swapfile
            chmod 600 /swapfile
            mkswap /swapfile
            swapon /swapfile
            echo '/swapfile none swap sw 0 0' >> /etc/fstab
            log_success "Swap created."
        else
            log_info "Swap file already exists."
        fi
    fi

    log_info "Creating user 'finlogic'..."
    if ! id "finlogic" &>/dev/null; then
        useradd -m -s /bin/bash finlogic
        echo "finlogic:$FINLOGIC_PASSWORD" | chpasswd
        usermod -aG sudo finlogic
        log_success "User 'finlogic' created."
    else
        log_info "User 'finlogic' already exists."
    fi

    log_info "Hardening SSH..."
    # Backup SSH config
    cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
    
    # Update SSH Port
    sed -i "s/^#Port 22/Port $SSH_PORT/" /etc/ssh/sshd_config
    sed -i "s/^Port 22/Port $SSH_PORT/" /etc/ssh/sshd_config
    
    # Disable root login
    sed -i "s/^PermitRootLogin.*/PermitRootLogin no/" /etc/ssh/sshd_config
    
    # Disable password auth (Warning: ensure you have SSH keys set up for finlogic!)
    # We will keep it enabled for now so the user can login with the generated password, 
    # but we recommend switching to keys later.
    # sed -i "s/^PasswordAuthentication.*/PasswordAuthentication no/" /etc/ssh/sshd_config

    log_info "Configuring UFW..."
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow "$SSH_PORT/tcp"
    ufw allow 80/tcp
    ufw allow 443/tcp
    echo "y" | ufw enable

    log_info "Installing Fail2ban..."
    apt update && apt install -y fail2ban
    systemctl enable fail2ban
    systemctl start fail2ban
}

# 4. Install Required Packages
install_packages() {
    log_info "Updating apt packages..."
    apt update && apt upgrade -y
    apt install -y curl git nginx certbot python3-certbot-nginx ufw fail2ban ca-certificates gnupg lsb-release

    log_info "Installing Docker..."
    if ! command -v docker &> /dev/null; then
        mkdir -p /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
          $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        apt update
        apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
        log_success "Docker installed."
    fi

    usermod -aG docker finlogic
}

# 5. Prepare Application Environment
prepare_app() {
    APP_DIR="/home/finlogic/app"
    log_info "Creating application directory at $APP_DIR..."
    mkdir -p "$APP_DIR/backend" "$APP_DIR/frontend"

    # Embedded Dockerfiles and Docker Compose
    log_info "Generating configuration files..."

    cat <<EOF > "$APP_DIR/docker-compose.yml"
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: finlogic_backend
    restart: unless-stopped
    env_file: .env
    environment:
      - DJANGO_SETTINGS_MODULE=finlogic_api.settings
    ports:
      - "8001:8000"
    networks:
      - finlogic_net
    depends_on:
      - redis
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health/', timeout=5)"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s

  redis:
    image: redis:7-alpine
    container_name: finlogic_redis
    restart: unless-stopped
    networks:
      - finlogic_net

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: https://${DOMAIN}
    container_name: finlogic_frontend
    restart: unless-stopped
    env_file: .env
    environment:
      - NODE_ENV=production
      - PORT=3000
    ports:
      - "3001:3000"
    depends_on:
      - backend
      - redis
    networks:
      - finlogic_net

  celery_worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: finlogic_celery
    restart: unless-stopped
    command: celery -A finlogic_api worker --loglevel=info --concurrency=4
    env_file: .env
    environment:
      - DJANGO_SETTINGS_MODULE=finlogic_api.settings
    depends_on:
      - redis
      - backend
    networks:
      - finlogic_net

networks:
  finlogic_net:
    driver: bridge
EOF

    cat <<'EOF' > "$APP_DIR/backend/Dockerfile"
FROM python:3.12-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 && rm -rf /var/lib/apt/lists/*
COPY --from=deps /usr/local/lib/python3.12 /usr/local/lib/python3.12
COPY --from=deps /usr/local/bin /usr/local/bin
COPY . .
ENV DJANGO_SETTINGS_MODULE=finlogic_api.settings \
    PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
RUN python manage.py collectstatic --noinput
EXPOSE 8000
CMD ["gunicorn", "finlogic_api.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "120"]
EOF

    cat <<'EOF' > "$APP_DIR/frontend/Dockerfile"
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
EOF

    # Create .env.example
    cat <<EOF > "$APP_DIR/.env.example"
# Django Settings
SECRET_KEY=$(openssl rand -hex 32)
DEBUG=False
ALLOWED_HOSTS=${DOMAIN},www.${DOMAIN},localhost,127.0.0.1

# Database (Remote PostgreSQL)
DATABASE_URL=postgres://user:password@host:5432/dbname

# Redis
REDIS_URL=redis://redis:6379/0

# Next.js
NEXT_PUBLIC_API_URL=https://${DOMAIN}
EOF

    chown -R finlogic:finlogic "$APP_DIR"
    
    log_warn "!!! ACTION REQUIRED !!!"
    echo "The application structure is ready at $APP_DIR."
    echo "Please configure your .env file now."
    echo "You can do this by running: cp $APP_DIR/.env.example $APP_DIR/.env && nano $APP_DIR/.env"
    
    read -p "Have you configured the .env file and uploaded your source code? (y/n): " ENV_CONFIRM
    if [[ "$ENV_CONFIRM" != "y" ]]; then
        log_info "Deployment paused. Run the script again once code and .env are ready."
        exit 0
    fi
}

# 6. Build and Start Docker Containers
deploy_app() {
    APP_DIR="/home/finlogic/app"
    cd "$APP_DIR"

    log_info "Building and starting containers..."
    docker compose up -d --build

    log_info "Waiting for backend to be healthy..."
    MAX_RETRIES=30
    COUNT=0
    until curl -s http://localhost:8001/api/health/ > /dev/null || [ $COUNT -eq $MAX_RETRIES ]; do
        sleep 2
        ((COUNT++))
        echo -n "."
    done
    echo ""

    if [ $COUNT -eq $MAX_RETRIES ]; then
        log_error "Backend failed to start in time. Check logs: docker compose logs backend"
    fi

    log_info "Running migrations..."
    docker compose exec backend python manage.py migrate

    log_info "Collecting static files..."
    docker compose exec backend python manage.py collectstatic --noinput

    read -p "Would you like to create a Django superuser now? (y/n): " SUPERUSER
    if [[ "$SUPERUSER" == "y" ]]; then
        docker compose exec backend python manage.py createsuperuser
    fi
}

# 7. Configure Nginx and SSL
setup_nginx() {
    log_info "Configuring Nginx..."
    CONF_FILE="/etc/nginx/sites-available/finlogic"
    
    cat <<EOF > "$CONF_FILE"
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    location /api/ {
        proxy_pass http://localhost:8001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /admin/ {
        proxy_pass http://localhost:8001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /static/ {
        alias /home/finlogic/app/backend/staticfiles/;
    }

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

    ln -sf "$CONF_FILE" "/etc/nginx/sites-enabled/"
    rm -f /etc/nginx/sites-enabled/default
    
    nginx -t && systemctl reload nginx

    log_info "Obtaining SSL certificate via Certbot..."
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "$EMAIL"

    log_info "Setting up auto-renewal..."
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
}

# --- Execution ---
setup_base
install_packages
prepare_app
deploy_app
setup_nginx

# 8. Final Output
echo -e "${GREEN}------------------------------------------------------------${NC}"
echo -e "${GREEN}          DEPLOYMENT COMPLETE - FINLOGIC CAPITAL            ${NC}"
echo -e "${GREEN}------------------------------------------------------------${NC}"
echo -e "Domain: https://$DOMAIN"
echo -e "User: finlogic"
echo -e "Password: $FINLOGIC_PASSWORD"
echo -e "SSH Port: $SSH_PORT"
echo -e ""
echo -e "${YELLOW}Maintenance Commands:${NC}"
echo -e "View Logs:      docker compose logs -f"
echo -e "Restart App:    docker compose restart"
echo -e "Update App:     git pull && docker compose up -d --build"
echo -e "Nginx Status:   systemctl status nginx"
echo -e "------------------------------------------------------------"
log_success "Please save the password above and secure your server!"
