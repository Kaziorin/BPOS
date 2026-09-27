#!/usr/bin/env bash
# ========================================================
#   BLUEOCEANS OMNIPOS - START ALL SERVICES (Linux/macOS)
# ========================================================

set -e

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "========================================================"
echo "         BLUEOCEANS OMNIPOS - STARTING ALL SERVICES"
echo "========================================================"
echo ""

# [1/5] Check prerequisites
echo "[1/5] Checking environment prerequisites..."
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "[ERROR] Python 3 was not found in your PATH!"
    exit 1
fi

PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PYTHON_CMD="python"
fi

if ! command -v npm &> /dev/null; then
    echo "[ERROR] Node.js/npm was not found in your PATH!"
    exit 1
fi
echo "[OK] Python and Node.js/npm found."
echo ""

# [2/5] Check and install dependencies
echo "[2/5] Checking and installing dependencies..."

# Python backend
echo "Checking Backend dependencies..."
cd "$ROOT_DIR/backend"

if [ -d "venv" ]; then
    source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null || true
fi

if ! $PYTHON_CMD -c "import fastapi, uvicorn, sqlalchemy, pydantic" &> /dev/null; then
    echo "[INFO] Backend dependencies missing or incomplete. Running pip install..."
    $PYTHON_CMD -m pip install -r requirements.txt
    echo "[OK] Backend dependencies installed."
else
    echo "[OK] Backend dependencies are already installed."
fi

# E-Commerce Frontend
echo "Checking E-Commerce Frontend dependencies..."
if [ ! -d "$ROOT_DIR/ecommerce-frontend/node_modules" ]; then
    echo "[INFO] E-Commerce frontend node_modules not found. Running npm install..."
    cd "$ROOT_DIR/ecommerce-frontend"
    npm install
    echo "[OK] E-Commerce frontend dependencies installed."
else
    echo "[OK] E-Commerce frontend dependencies are already installed."
fi

# POS Frontend
echo "Checking POS Frontend dependencies..."
if [ ! -d "$ROOT_DIR/frontend/node_modules" ]; then
    echo "[INFO] POS frontend node_modules not found. Running npm install..."
    cd "$ROOT_DIR/frontend"
    npm install
    echo "[OK] POS frontend dependencies installed."
else
    echo "[OK] POS frontend dependencies are already installed."
fi
echo ""

# [3/5] Freeing up ports (4000, 3000, 3001)
echo "[3/5] Freeing up ports 4000, 3000, and 3001..."
for PORT in 4000 3000 3001; do
    if command -v lsof &> /dev/null; then
        PID=$(lsof -ti:$PORT || true)
        if [ -n "$PID" ]; then
            kill -9 $PID 2>/dev/null || true
        fi
    elif command -v fuser &> /dev/null; then
        fuser -k ${PORT}/tcp 2>/dev/null || true
    fi
done
echo "[OK] Ports ready."
echo ""

# [4/5] Starting Services
echo "[4/5] Starting FastAPI Backend on port 4000..."
cd "$ROOT_DIR/backend"
$PYTHON_CMD -m uvicorn main:app --port 4000 --host 0.0.0.0 --reload > /tmp/bpos_backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend running (PID: $BACKEND_PID, Log: /tmp/bpos_backend.log)"

echo "[5/5] Starting POS Frontend (:3000) and E-Commerce (:3001)..."
cd "$ROOT_DIR/frontend"
npm run dev > /tmp/bpos_frontend.log 2>&1 &
FRONTEND_PID=$!
echo "POS Frontend running (PID: $FRONTEND_PID, Log: /tmp/bpos_frontend.log)"

cd "$ROOT_DIR/ecommerce-frontend"
npm run dev > /tmp/bpos_storefront.log 2>&1 &
STOREFRONT_PID=$!
echo "Storefront running (PID: $STOREFRONT_PID, Log: /tmp/bpos_storefront.log)"

echo ""
echo "========================================================"
echo "   All 3 Services are running successfully!"
echo "   - Backend API Docs:       http://127.0.0.1:4000/docs"
echo "   - POS Staff & Admin App:  http://localhost:3000"
echo "   - Online E-Commerce App:  http://localhost:3001"
echo "========================================================"
echo ""
echo "Waiting 5 seconds before opening browser..."
sleep 5

# Open browser based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:3000 || true
    open http://localhost:3001 || true
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000 || true
    xdg-open http://localhost:3001 || true
fi

echo "To stop services, run ./stop_all.sh"
