# 🚀 Finlogic Capital - ARM Deployment Guide (SSH Only)

This guide is specifically designed for deploying the Finlogic platform to an **ARM-based server** (AWS Graviton, Oracle ARM, etc.) using only an **SSH terminal**.

---

## 🛠️ Step 1: Transfer the Deployment Script

Since you have SSH access, the easiest way to start is to copy the `deploy_arm.sh` script to your server.

**From your local machine (Windows PowerShell):**
```powershell
# Replace <ip> with your server IP and <port> if it's not 22
scp -P 22 .\deploy_arm.sh your_user@your_server_ip:~/
```

---

## 🏗️ Step 2: Initialize the Server

Log into your server and run the script. This will install Docker, Nginx, and harden the server security.

**On the server:**
```bash
# Make the script executable
chmod +x deploy_arm.sh

# Run the setup (Follow the interactive prompts for domain/email)
sudo ./deploy_arm.sh
```

---

## 📂 Step 3: Transfer your Application Code

You have two options to get your code onto the server:

### Option A: Via Git (Recommended)
If your code is in a private GitHub/GitLab repo:
```bash
cd /home/finlogic/app
# Clear the placeholders created by the script
rm -rf backend frontend docker-compose.yml

# Clone your repo into the current directory
git clone https://github.com/your-username/finlogic.git .
```

### Option B: Via SCP (If no Git repo)
**From your local machine:**
```powershell
scp -P 22 -r .\backend .\frontend .\docker-compose.yml your_user@your_server_ip:/home/finlogic/app/
```

---

## 🔐 Step 4: Configure Environment Variables

The application requires a `.env` file to function.

**On the server:**
```bash
cd /home/finlogic/app
cp .env-example .env
nano .env
```

**Fill in the following critical values:**
- `DATABASE_URL`: Your PostgreSQL connection string.
- `SECRET_KEY`: A long random string.
- `ALLOWED_HOSTS`: Your domain name.
- `NEXT_PUBLIC_API_URL`: `https://yourdomain.com`

---

## 🚢 Step 5: Launch the Application

Now, use Docker Compose to build and start all services.

**On the server:**
```bash
cd /home/finlogic/app

# Build and start in detached mode
docker compose up -d --build

# Run migrations (mandatory for the new image upload feature)
docker compose exec backend python manage.py migrate

# Create your admin account
docker compose exec backend python manage.py createsuperuser
```

---

## 🔒 Step 6: Finalize SSL (HTTPS)

Once the containers are running and your DNS A-Record is pointed to the server IP:

**On the server:**
```bash
# The deploy_arm.sh script already installed Certbot
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🛠️ Common Maintenance Commands

| Action | Command |
| :--- | :--- |
| **View Logs** | `docker compose logs -f` |
| **Stop App** | `docker compose down` |
| **Restart App** | `docker compose restart` |
| **Update Code** | `git pull && docker compose up -d --build` |
| **Check Backend Status** | `docker compose ps` |

---

### ⚠️ Important Note for Image Uploads
Your images are stored in `/home/finlogic/app/media`. This directory is mapped to the Docker containers. **Do not delete this folder**, or you will lose your uploaded article images.
