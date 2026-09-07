@echo off
title BlueOceans OmniPOS Launcher
color 0B

echo ========================================================
echo          BLUEOCEANS OMNIPOS - STARTING ALL SERVICES
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"

echo [1/4] Checking environment prerequisites...
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python was not found in your PATH. Please install Python 3.10+
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js/npm was not found in your PATH. Please install Node.js 18+
    pause
    exit /b 1
)

echo [OK] Prerequisites found.
echo.

echo [2/4] Freeing up ports (4000 and 3000)...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":4000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo [3/4] Starting FastAPI Backend on port 4000...
start "BlueOceans POS - Backend API (:4000)" cmd /k "cd /d "%ROOT_DIR%backend" && echo Starting FastAPI Backend on http://127.0.0.1:4000... && python -m uvicorn main:app --port 4000 --host 0.0.0.0 --reload"

echo [4/4] Starting Next.js Frontend on port 3000...
start "BlueOceans POS - Frontend App (:3000)" cmd /k "cd /d "%ROOT_DIR%frontend" && echo Starting Next.js Frontend on http://localhost:3000... && npm run dev"

echo.
echo ========================================================
echo   Services are starting in separate windows!
echo   - Backend API Docs:   http://127.0.0.1:4000/docs
echo   - Frontend App:       http://localhost:3000
echo ========================================================
echo.
echo Waiting 5 seconds before opening browser...
timeout /t 5 >nul

start http://localhost:3000

echo.
echo Both services are now running!
echo To stop services, run stop_all.bat or close the opened command windows.
pause
