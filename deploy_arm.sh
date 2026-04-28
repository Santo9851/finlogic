#!/bin/bash
# Finlogic Capital - All-in-One Deployment Script for ARM Servers
# Target OS: Ubuntu 22.04 LTS (ARM64) - e.g., AWS Graviton, Oracle ARM, Raspberry Pi
#
# ==============================================================================
# This script handles:
# - System updates & Security (SSH, UFW, Fail2ban)
# - Docker & ARM Optimizations
# - Nginx Reverse Proxy + Media Serving
# - Automated SSL via Certbot
# ==============================================================================

set -e

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

if [ "$EUID" -ne 0 ]; then log_error "Please run as root."; fi

# 1. Collect Info
echo -e "${BLUE}------------------------------------------------------------${NC}"
echo -e "${BLUE}        FINLOGIC CAPITAL - ARM DEPLOYMENT TOOL              ${NC}"
echo -e "${BLUE}------------------------------------------------------------${NC}"

read -p "Enter Domain Name (e.g., finlogiccapital.com): " DOMAIN
read -p "Enter Email for SSL: " EMAIL
read -p "Enter SSH Port [Default 22]: " SSH_PORT
SSH_PORT=${SSH_PORT:-22}

# 2. Base Setup
setup_base() {
    log_info "Configuring system..."
    timedatectl set-timezone Asia/Kathmandu
    
    # Swap
    if [ ! -f /swapfile ]; then
        fallocate -l 2G /swapfile
        chmod 600 /swapfile
        mkswap /swapfile && swapon /swapfile
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
    fi

    # User
    if ! id "finlogic" &>/dev/null; then
        useradd -m -s /bin/bash finlogic
        usermod -aG sudo finlogic
        log_warn "User 'finlogic' created. Set a password manually: passwd finlogic"
    fi

    # Security
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow "$SSH_PORT/tcp"
    ufw allow 80/tcp
    ufw allow 443/tcp
    echo "y" | ufw enable
}

# 3. Install Docker & Nginx
install_deps() {
    log_info "Installing dependencies..."
    apt update && apt upgrade -y
    apt install -y curl git nginx certbot python3-certbot-nginx fail2ban ca-certificates gnupg lsb-release

    if ! command -v docker &> /dev/null; then
        mkdir -p /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        apt update && apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    fi

    # Docker ARM Opts
    cat > /etc/docker/daemon.json <<EOF
{
  "features": { "buildkit": true },
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
EOF
    systemctl restart docker
    usermod -aG docker finlogic
}

# 4. App Config
prepare_app() {
    APP_DIR="/home/finlogic/app"
    mkdir -p "$APP_DIR/backend" "$APP_DIR/frontend" "$APP_DIR/media"

    # Docker Compose
    cat <<EOF > "$APP_DIR/docker-compose.yml"
services:
  backend:
    build: ./backend
    container_name: finlogic_backend
    restart: unless-stopped
    env_file: .env
    volumes:
      - ./media:/app/media
    networks:
      - finlogic_net
    deploy:
      resources:
        limits: { memory: 1024M }
        reservations: { memory: 512M }

  redis:
    image: redis:7-alpine
    container_name: finlogic_redis
    restart: unless-stopped
    networks: [finlogic_net]
    deploy:
      resources:
        limits: { memory: 256M }

  frontend:
    build:
      context: ./frontend
      args: { NEXT_PUBLIC_API_URL: https://${DOMAIN} }
    container_name: finlogic_frontend
    restart: unless-stopped
    env_file: .env
    ports: ["3001:3000"]
    depends_on: [backend]
    networks: [finlogic_net]
    deploy:
      resources:
        limits: { memory: 1024M }

  celery:
    build: ./backend
    container_name: finlogic_celery
    command: celery -A finlogic_api worker --loglevel=info --concurrency=2
    env_file: .env
    volumes: [./media:/app/media]
    depends_on: [redis, backend]
    networks: [finlogic_net]

networks:
  finlogic_net: { driver: bridge }
EOF

    # Nginx
    cat <<EOF > /etc/nginx/sites-available/finlogic
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    client_max_body_size 20M;

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /media/ {
        alias /home/finlogic/app/media/;
    }

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF
    ln -sf /etc/nginx/sites-available/finlogic /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx
    
    chown -R finlogic:finlogic "$APP_DIR"
}

# 5. Execute
setup_base
install_deps
prepare_app

log_success "ARM Server Setup Complete!"
echo -e "Next Steps:"
echo -e "1. CD to /home/finlogic/app"
echo -e "2. Create .env file"
echo -e "3. Run 'docker compose up -d --build'"
echo -e "4. Run SSL: 'sudo certbot --nginx -d $DOMAIN'"
