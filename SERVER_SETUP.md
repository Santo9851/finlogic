# Finlogic Capital - Server Setup & Deployment Guide

This document provides a comprehensive guide to setting up a Vultr VPS (Ubuntu 22.04) for the Finlogic Capital application (Django backend + Next.js frontend).

## 🛡️ Part 1: Server Setup Script

Run this script as the **root** user on a fresh Ubuntu 22.04 server. It handles system updates, security hardening, and environment installation.

```bash
#!/bin/bash
# Finlogic VPS Setup Script - Ubuntu 22.04
set -e

echo "🚀 Starting Finlogic Server Setup..."

# 1. Update and Set Timezone
apt update && apt upgrade -y
timedatectl set-timezone Asia/Kathmandu

# 2. Create Swap (2GB)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

# 3. Create 'finlogic' User
USER_NAME="finlogic"
useradd -m -s /bin/bash $USER_NAME
usermod -aG sudo $USER_NAME
mkdir -p /home/$USER_NAME/.ssh
cp /root/.ssh/authorized_keys /home/$USER_NAME/.ssh/
chown -R $USER_NAME:$USER_NAME /home/$USER_NAME/.ssh
chmod 700 /home/$USER_NAME/.ssh
chmod 600 /home/$USER_NAME/.ssh/authorized_keys

# 4. Install Node.js (v20) & Dependencies
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs python3-pip python3-venv nginx redis-server git fail2ban unattended-upgrades certbot python3-certbot-nginx

# 5. Harden SSH (Change Port to 2222)
SSH_CONF="/etc/ssh/sshd_config"
sed -i 's/#Port 22/Port 2222/' $SSH_CONF
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' $SSH_CONF
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' $SSH_CONF

# 6. Configure UFW & Fail2Ban
ufw default deny incoming
ufw default allow outgoing
ufw allow 2222/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable
systemctl enable fail2ban && systemctl start fail2ban

# 7. Enable Redis (Local Cache/Celery)
systemctl start redis-server && systemctl enable redis-server

# 8. Install PM2 globally
npm install -g pm2

echo "🎉 Setup Complete. Reconnect using: ssh -p 2222 finlogic@$(hostname -I | awk '{print $1}')"
```

---

## 📋 Part 2: Deployment Checklist

After running the setup script and reconnecting as the `finlogic` user, follow these steps to deploy the application.

### 1. Backend Deployment (Django)
```bash
# Clone and Setup
git clone https://github.com/your-repo/finlogic.git ~/app
cd ~/app/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Environment Configuration
nano .env
# Add the following:
# DATABASE_URL=postgres://user:pass@external-host:5432/dbname
# REDIS_URL=redis://localhost:6379/0
# SECRET_KEY=your_secret_key
# BREVO_API_KEY=your_brevo_key
# B2_KEY_ID=your_b2_id
# B2_APPLICATION_KEY=your_b2_key
# B2_BUCKET_NAME=your_bucket_name

# Prepare Database & Assets
python manage.py migrate
python manage.py collectstatic --noinput

# Test Gunicorn (Manual check)
gunicorn --bind 0.0.0.0:8000 finlogic_api.wsgi
```

### 2. Frontend Deployment (Next.js)
```bash
cd ~/app/frontend
npm install
npm run build

# Start with PM2 for background process management
pm2 start npm --name "finlogic-frontend" -- start -- -p 3000
pm2 save
```

### 3. Nginx Reverse Proxy Configuration
Create a configuration file: `sudo nano /etc/nginx/sites-available/finlogic`

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API (Django)
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Static Files (Django)
    location /static/ {
        alias /home/finlogic/app/backend/staticfiles/;
    }
}
```

Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/finlogic /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

### 4. SSL Encryption (Certbot)
```bash
sudo certbot --nginx -d yourdomain.com
```

---

## 🛠️ Ongoing Maintenance
- **Check Logs**: `pm2 logs` (Frontend) or `journalctl -u nginx` (System)
- **Update Code**: `git pull` followed by `npm run build` or `python manage.py migrate`
- **Restart Services**: `pm2 restart all` or `sudo systemctl restart nginx`
