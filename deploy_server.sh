#!/bin/bash
set -e

echo "=========================================================="
echo "  BlueOceans SalePay Enterprise POS - Production Deploy"
echo "=========================================================="

DEPLOY_DIR="/var/www/blueoceanstech.com/public/SalePayEnterprisePOS"
cd "$DEPLOY_DIR"

echo "[1/7] Verifying System Prerequisites..."
for cmd in python3 node npm curl unzip; do
    if ! command -v $cmd >/dev/null 2>&1; then
        echo "[ERROR] Required tool '$cmd' is not installed."
        echo "Please install it with: sudo apt update && sudo apt install -y $cmd"
        exit 1
    fi
done

if ! command -v pm2 >/dev/null 2>&1; then
    echo "[INFO] Installing PM2 process manager globally..."
    npm install -g pm2
fi

echo "[2/7] Checking and Configuring Local Ollama AI Engine..."
if ! command -v ollama >/dev/null 2>&1; then
    echo "[INFO] Ollama not found. Installing official Ollama Linux client..."
    curl -fsSL https://ollama.com/install.sh | sh
fi

# Ensure Ollama service is running
if ! curl -sf http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
    echo "[INFO] Starting Ollama server..."
    if command -v systemctl >/dev/null 2>&1 && systemctl is-enabled ollama >/dev/null 2>&1; then
        sudo systemctl start ollama
    else
        nohup ollama serve > /tmp/ollama.log 2>&1 &
        sleep 3
    fi
fi

# Pull required local AI models
echo "[INFO] Ensuring AI models are cached locally..."
ollama pull qwen2.5:0.5b || true
ollama pull qwen2.5:1.5b || true

echo "[3/7] Setting up Python Backend Virtual Environment..."
cd "$DEPLOY_DIR/backend"
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

echo "[INFO] Upgrading pip & installing backend dependencies..."
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt pymysql asyncmy cryptography uvicorn gunicorn

echo "[4/7] Building POS Staff & Admin Frontend (Next.js :3000)..."
cd "$DEPLOY_DIR/frontend"
if [ ! -d "node_modules" ]; then
    npm install
else
    npm install --prefer-offline || npm install
fi
npm run build

echo "[5/7] Building E-Commerce Customer Storefront (Next.js :3001)..."
cd "$DEPLOY_DIR/ecommerce-frontend"
if [ ! -d "node_modules" ]; then
    npm install
else
    npm install --prefer-offline || npm install
fi
npm run build

cd "$DEPLOY_DIR"

echo "[6/7] Setting Secure Permissions..."
chmod -R 755 "$DEPLOY_DIR"
chmod 600 "$DEPLOY_DIR/backend/.env"* 2>/dev/null || true

echo "[7/7] Launching & Reloading Services via PM2..."
pm2 startOrReload ecosystem.config.js --update-env
pm2 save

echo ""
echo "=========================================================="
echo "             SERVICE STATUS VERIFICATION                  "
echo "=========================================================="
pm2 status

echo ""
echo "Testing Endpoint Health:"
curl -sf -m 5 http://127.0.0.1:4000/docs >/dev/null && echo " [OK] Backend API (:4000) is LIVE" || echo " [WAIT] Backend API starting..."
curl -sf -m 5 http://127.0.0.1:3000 >/dev/null && echo " [OK] POS Frontend (:3000) is LIVE" || echo " [WAIT] POS Frontend starting..."
curl -sf -m 5 http://127.0.0.1:3001 >/dev/null && echo " [OK] E-Commerce Storefront (:3001) is LIVE" || echo " [WAIT] Storefront starting..."
curl -sf -m 5 http://127.0.0.1:11434/api/tags >/dev/null && echo " [OK] Ollama AI Engine (:11434) is LIVE" || echo " [WARNING] Ollama port unreachable"

echo ""
echo "=========================================================="
echo " BlueOceans SalePay Enterprise POS Deployed Successfully! "
echo "=========================================================="
