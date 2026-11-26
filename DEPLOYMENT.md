# 🚀 Production Deployment & Server Configuration Guide
## BlueOceans SalePay Enterprise POS

This document provides complete, step-by-step instructions for deploying **BlueOceans SalePay Enterprise POS** (FastAPI Backend, Next.js POS Staff App, Next.js E-Commerce Storefront, and Local Offline Ollama AI Engine) using the automated 1-click build script and configuring a secure NGINX + PM2 environment.

---

## 📁 1. Target Server Directory Structure

On your production server (`/var/www/blueoceanstech.com/public/SalePayEnterprisePOS/`), the layout will be structured as follows:

```text
/var/www/blueoceanstech.com/public/SalePayEnterprisePOS/
│
├── frontend/                          # Next.js POS Staff & Admin App (Port 3000)
│   ├── .next/                         # Compiled Next.js Production Build
│   ├── public/                        # Static Assets & Icons
│   ├── package.json
│   └── node_modules/
│
├── ecommerce-frontend/                # Next.js Customer Storefront (Port 3001)
│   ├── .next/                         # Compiled Storefront Production Build
│   ├── public/                        # Storefront Assets & Banners
│   ├── package.json
│   └── node_modules/
│
├── website-frontend/                  # Next.js Corporate Website & Showcase (Port 3002)
│   ├── .next/                         # Compiled Website Production Build
│   ├── public/                        # Static Assets & Hero VFX
│   ├── package.json
│   └── node_modules/
│
├── backend/                           # Python FastAPI API (Managed by PM2 on Port 4000)
│   ├── app/                           # FastAPI Application Modules
│   ├── ai_engine/                     # Local AI Engine Daemon & Models Directory
│   │   └── models/                    # Offline Quantized LLM Weights
│   ├── venv/                          # Python Virtual Environment
│   ├── requirements.txt
│   ├── main.py
│   ├── .env                           # Production database & secrets
│   ├── .env.prod                      # Production profile configuration
│   ├── uploads/                       # Product images & receipts
│   └── media/                         # Barcodes, QR codes & reports
│
├── ecosystem.config.js                # PM2 Process Manager Configuration (All 4 Services)
├── deploy_server.sh                   # 1-Click Server Setup / Redeploy Script
└── salepay_prod_deploy.zip            # Uploaded deployment archive
```

---

## ⚡ 2. One-Click Build & Packaging (On Local PC)

Whenever you make code changes in development and want to deploy to production, run this single command in your project root:

```cmd
build_and_package_prod.bat
```
*(Or in PowerShell: `.\package_prod.ps1`)*

### What the script automatically does:
1. Packages the **Python Backend** cleanly (excluding local `venv`, `__pycache__`, dev logs, and test databases).
2. Generates production `.env` and `.env.prod` configured with your production MySQL database (`72.60.209.22:3306`) and offline Ollama AI settings.
3. Packages **POS Frontend** & **E-Commerce Storefront** (excluding bulky `node_modules` and local `.next` cache to keep zip lightweight and fast to upload).
4. Bundles `ecosystem.config.js` and `deploy_server.sh` for one-click server deployment.
5. Generates the final ready-to-upload deployment archive: **`salepay_prod_deploy.zip`**.

---

## 🚀 3. Server Deployment Steps

### Step 3.1: Upload ZIP Archive
Upload **`salepay_prod_deploy.zip`** to `/var/www/blueoceanstech.com/public/SalePayEnterprisePOS/` using FileZilla, WinSCP, or SCP:
```bash
scp salepay_prod_deploy.zip root@your-server-ip:/var/www/blueoceanstech.com/public/SalePayEnterprisePOS/
```

---

### Step 3.2: Unzip on Server
SSH into your server and run:
```bash
cd /var/www/blueoceanstech.com/public/SalePayEnterprisePOS
unzip -o salepay_prod_deploy.zip
```
*(This extracts all application files, backend code, frontends, and deployment scripts cleanly).*

---

### Step 3.3: Deploy & Run with PM2

#### অপশন ১: অটোমেটিক ১-ক্লিক স্ক্রিপ্ট (Recommended)
```bash
chmod +x deploy_server.sh
./deploy_server.sh
```
> এটি নিজে থেকেই:
> 1. Linux সার্ভারে `ollama` ইন্সটল ও কনফিগার করবে এবং অফলাইন AI মডেল (`qwen2.5:0.5b` ও `qwen2.5:1.5b`) ক্যাশ করবে।
> 2. পাইথন `venv` তৈরি করবে এবং ব্যাকএন্ডের ডিপেন্ডেন্সি আপডেট করবে।
> 3. POS Frontend ও E-Commerce Storefront-এর Next.js প্রোডাকশন বিল্ড তৈরি করবে।
> 4. PM2 দিয়ে ৪টি সার্ভিস (FastAPI, POS Frontend, E-Commerce, Ollama) অটো চালু/রিলোড করবে।

---

#### অপশন ২: ম্যানুয়ালি চালানো (Manual Step-by-Step Execution)

##### 🟢 প্রথমবার ডিপ্লয় করলে (First Time Deployment):

```bash
cd /var/www/blueoceanstech.com/public/SalePayEnterprisePOS

# ১. Ollama AI Engine ইনস্টলেশন ও মডেল ডাউনলোড
curl -fsSL https://ollama.com/install.sh | sh
ollama pull qwen2.5:0.5b
ollama pull qwen2.5:1.5b

# ২. Python Virtual Environment তৈরি ও ডিপেন্ডেন্সি ইনস্টলেশন
cd /var/www/blueoceanstech.com/public/SalePayEnterprisePOS/backend
python3 -m venv venv
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt pymysql asyncmy cryptography uvicorn gunicorn

# ৩. POS Frontend Next.js প্রোডাকশন বিল্ড
cd /var/www/blueoceanstech.com/public/SalePayEnterprisePOS/frontend
npm install
npm run build

# ৪. E-Commerce Storefront Next.js প্রোডাকশন বিল্ড
cd /var/www/blueoceanstech.com/public/SalePayEnterprisePOS/ecommerce-frontend
npm install
npm run build

# ৫. PM2 প্রসেস শুরু করা
cd /var/www/blueoceanstech.com/public/SalePayEnterprisePOS
pm2 start ecosystem.config.js

# ৬. সার্ভার রিবুট হলেও যেন অটোমেটিক সার্ভিস চালু থাকে
pm2 save
pm2 startup
```

---

##### 🔄 পুনরায় ডিপ্লয় / আপডেট করলে (Every Update / Re-deployment):
যখন নতুন কোডের ZIP আপলোড করে আনজিপ করবেন:

```bash
cd /var/www/blueoceanstech.com/public/SalePayEnterprisePOS

# ১. ডিপ্লয় স্ক্রিপ্ট রান করুন অথবা সরাসরি PM2 রিলোড করুন:
./deploy_server.sh

# অথবা ম্যানুয়ালি জিরো ডাউনটাইম রিস্টার্ট:
pm2 reload ecosystem.config.js
pm2 save
```

---

##### 🗑️ সম্পূর্ণ নতুন করে PM2 প্রসেস ক্লিন করে পুনরায় চালু করতে চাইলে (Clean Delete & Fresh Deploy):

```bash
cd /var/www/blueoceanstech.com/public/SalePayEnterprisePOS

# ১. পুরাতন PM2 প্রসেস বন্ধ ও ডিলিট করুন
pm2 delete salepay-backend salepay-pos-frontend salepay-ecommerce salepay-ollama

# ২. নতুন করে PM2 প্রসেস চালু করুন
pm2 start ecosystem.config.js

# ৩. কনফিগারেশন সেভ করুন
pm2 save
```

---

## 🤖 4. Local Offline AI Engine (Ollama) Setup & Verification

SalePay Enterprise POS-এ ইন্টিগ্রেটেড AI সেলস ইন্টেলিজেন্স, ইনভয়েস ওসিআর এবং ক্যাশ ফ্লো প্রেডিকশন রান করার জন্য লোকাল Ollama সার্ভিস কার্যকর রাখা আবশ্যক।

### ১. সার্ভারে Ollama স্ট্যাটাস চেক:
```bash
curl -s http://127.0.0.1:11434/api/tags
```
সফল আউটপুটে ইনস্টল করা মডেলের তালিকা আসবে:
```json
{"models":[{"name":"qwen2.5:1.5b:latest",...},{"name":"qwen2.5:0.5b:latest",...}]}
```

### ২. মডেল ম্যানুয়াল টেস্ট:
```bash
ollama run qwen2.5:1.5b "Hello, POS AI Agent is ready."
```

### ৩. ব্যাকএন্ডের AI ডেমনের সাথে সংযোগ পরীক্ষা:
```bash
curl -s http://127.0.0.1:4000/api/v1/ai/status
```

---

## 🌐 5. NGINX Configuration for SalePay Enterprise POS

নিচের NGINX কনফিগারেশন ব্লকটি আপনার `/etc/nginx/sites-available/blueoceanstech.com` ফাইলের `server { listen 443 ssl http2; ... }` ব্লকের ভেতরে পেস্ট করুন:

```nginx
    # ==============================================================
    # NGINX Configuration for BlueOceans SalePay Enterprise POS
    # ==============================================================

    # ----------------------------------------------------------
    # 1. Corporate Marketing Website & Showcase (Next.js :3002)
    # ----------------------------------------------------------
    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # ----------------------------------------------------------
    # 2. POS Staff & Admin Web App (Next.js Reverse Proxy :3000)
    # ----------------------------------------------------------
    location /pos {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # ----------------------------------------------------------
    # 3. Online E-Commerce Customer Storefront (Next.js :3001)
    # ----------------------------------------------------------
    location /store {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # ----------------------------------------------------------
    # 4. FastAPI Backend API (Port 4000)
    # ----------------------------------------------------------
    location /api/ {
        proxy_pass http://127.0.0.1:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        client_max_body_size 50M;
        proxy_connect_timeout 180s;
        proxy_send_timeout 180s;
        proxy_read_timeout 180s;
    }

    # ----------------------------------------------------------
    # 4. Backend Interactive Docs & OpenAPI
    # ----------------------------------------------------------
    location /docs {
        proxy_pass http://127.0.0.1:4000/docs;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /openapi.json {
        proxy_pass http://127.0.0.1:4000/openapi.json;
        proxy_set_header Host $host;
    }

    # ----------------------------------------------------------
    # 5. Physical Image Uploads & Media Files (Port 4000)
    # ----------------------------------------------------------
    location /uploads/ {
        proxy_pass http://127.0.0.1:4000/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /media/ {
        proxy_pass http://127.0.0.1:4000/media/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # ----------------------------------------------------------
    # 6. WebSocket Real-time Sync Support
    # ----------------------------------------------------------
    location /ws/ {
        proxy_pass http://127.0.0.1:4000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 3600s;
    }

    # Security: Block direct access to environment files & git
    location ~ /\.(env|git) {
        deny all;
        return 404;
    }
```

### Apply & Reload NGINX:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔐 6. Production Environment & Database Checklist

The backend `.env` file generated inside `/var/www/blueoceanstech.com/public/SalePayEnterprisePOS/backend/.env`:

```ini
APP_ENV="prod"
PROJECT_NAME="SalePay Enterprise POS API"
VERSION="2.0.0-production"
PORT=4000
API_V1_STR="/api/v1"
JWT_SECRET="salepay-production-jwt-secret-9d25e094faa6ca2556c818166b7a9563b"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_HOURS=168

# Production Database Credentials (MySQL)
DB_CONNECTION=mysql
DB_HOST=72.60.209.22
DB_PORT=3306
DB_DATABASE=blue_oceans_pos
DB_NAME=blue_oceans_pos
DB_USERNAME=dba
DB_USER=dba
DB_PASSWORD=EF@j#TpZB413!

# CORS Origins
CORS_ORIGIN="https://blueoceanstech.com,https://pos.blueoceanstech.com,http://localhost:3000,http://localhost:3001,http://127.0.0.1:4000"

# Local AI Engine (Ollama Offline / Air-Gapped)
OLLAMA_BASE_URL="http://127.0.0.1:11434"
OLLAMA_MODEL="qwen2.5:1.5b"
OLLAMA_MODELS_DIR="backend/ai_engine/models"

# Redis Cache
REDIS_URL="redis://localhost:6379/0"
```

### Verification Checklist

| # | Item | How to Verify | Expected Output |
|---|------|---------------|-----------------|
| ✅ | Backend is running on port 4000 | `pm2 status salepay-backend` | `online` |
| ✅ | POS Frontend is running on port 3000 | `pm2 status salepay-pos-frontend` | `online` |
| ✅ | E-Commerce Storefront is on port 3001 | `pm2 status salepay-ecommerce` | `online` |
| ✅ | Corporate Website is on port 3002 | `pm2 status salepay-website` | `online` |
| ✅ | Ollama AI Engine is on port 11434 | `pm2 status salepay-ollama` / `curl http://127.0.0.1:11434/api/tags` | List of models |
| ✅ | API Docs are accessible | `curl http://127.0.0.1:4000/docs` | 200 OK |
| ✅ | Remote MySQL connection | `mysql -h 72.60.209.22 -P 3306 -u dba -pEF@j#TpZB413! blue_oceans_pos -e "SHOW TABLES;"` | Table list |
| ✅ | Environment file security | `curl https://blueoceanstech.com/pos/backend/.env` | 403 / 404 Forbidden |

---

## 🔍 7. Troubleshooting & PM2 Commands

### PM2 Quick Reference:

| কমান্ড | বিবরণ |
|---|---|
| `pm2 status` | সব রানিং প্রসেসের লিস্ট ও মেমোরি স্ট্যাটাস দেখা |
| `pm2 logs` | সবগুলো সার্ভিসের লাইভ লগ দেখা |
| `pm2 logs salepay-backend` | ব্যাকএন্ডের এরর ও লাইভ লগ দেখা |
| `pm2 logs salepay-pos-frontend` | POS ফ্রন্টএন্ডের লাইভ লগ দেখা |
| `pm2 logs salepay-ollama` | AI Engine এর অ্যাক্টিভিটি লগ দেখা |
| `pm2 restart all` | সবগুলো সার্ভিস একবারে রিস্টার্ট করা |
| `pm2 restart salepay-backend` | শুধুমাত্র ব্যাকএন্ড রিস্টার্ট করা |
| `pm2 reload all` | জিরো-ডাউনটাইম রিলোড |
| `pm2 stop all` | সবগুলো সার্ভিস সাময়িক বন্ধ করা |
| `pm2 save` | বর্তমান সার্ভিস স্টেট সেভ রাখা (সার্ভার রিবুট হলেও স্বয়ংক্রিয় চালুর জন্য) |

### কমন সমস্যার সমাধান:

| সমস্যা | কারণ | সমাধান |
|---|---|---|
| **502 Bad Gateway on `/api/`** | Backend প্রসেস ক্র্যাশ বা অফলাইন | `pm2 logs salepay-backend` চেক করুন। `pm2 restart salepay-backend` চালান। |
| **502 Bad Gateway on `/pos`** | Next.js ফ্রন্টএন্ড স্টার্ট হয়নি | `pm2 logs salepay-pos-frontend` চেক করুন। বিল্ড হয়েছে কি না দেখতে `cd frontend && npm run build` চালান। |
| **AI Features Not Responding** | Ollama সার্ভার অফলাইন বা পোর্ট বন্ধ | `curl http://127.0.0.1:11434/api/tags` চেক করুন। `ollama serve` চালু রাখুন। |
| **Database Connection Error** | Firewall এ MySQL পোর্ট ব্লক বা ভুল ক্রেডেনশিয়াল | সার্ভার থেকে `nc -zv 72.60.209.22 3306` দিয়ে পোর্ট টেস্ট করুন। `.env` এ ইউজার ও পাসওয়ার্ড ঠিক আছে কি না নিশ্চিত করুন। |
| **Permission Denied (Uploads)** | uploads ফোল্ডারের পারমিশন সমস্যা | `chmod -R 777 /var/www/blueoceanstech.com/public/SalePayEnterprisePOS/backend/uploads` চালান। |
| **Out of Memory on Build** | সার্ভারে RAM কম থাকার কারণে বিল্ড ফেইল | `export NODE_OPTIONS="--max-old-space-size=1536"` সেট করে বিল্ড রান করুন। |

---

## 💡 Support & Maintenance

যেকোনো কনফিগারেশন পরিবর্তন শেষে সর্বদা রান করুন:
```bash
sudo nginx -t && sudo systemctl reload nginx
pm2 save
```
BlueOceans SalePay Enterprise POS এখন সম্পূর্ণ সুরক্ষিত এবং হাই-পারফরম্যান্স প্রোডাকশনে চলার জন্য প্রস্তুত! 🚀
