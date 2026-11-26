@echo off
title BlueOceans OmniPOS Launcher
color 0B

echo ========================================================
echo          BLUEOCEANS OMNIPOS - STARTING ALL SERVICES
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"

echo [1/7] Checking environment prerequisites...
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python was not found in your PATH!
    echo Please install Python 3.10+ from python.org and check "Add Python to PATH".
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js/npm was not found in your PATH!
    echo Please install Node.js 18+ from nodejs.org.
    pause
    exit /b 1
)
echo [OK] Python and Node.js/npm found.
echo.

echo [2/7] Checking and installing dependencies...

REM Check Python backend dependencies
echo Checking Backend dependencies...
python -c "import fastapi, uvicorn, sqlalchemy, pydantic" >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Backend dependencies missing or incomplete. Running pip install...
    cd /d "%ROOT_DIR%backend"
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install backend dependencies.
        pause
        exit /b 1
    )
    echo [OK] Backend dependencies installed.
) else (
    echo [OK] Backend dependencies are already installed.
)

echo Checking E-Commerce Frontend dependencies...
if not exist "%ROOT_DIR%ecommerce-frontend\node_modules" (
    echo [INFO] E-Commerce frontend node_modules not found. Running npm install...
    cd /d "%ROOT_DIR%ecommerce-frontend"
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install ecommerce frontend dependencies.
        pause
        exit /b 1
    )
    echo [OK] E-Commerce frontend dependencies installed.
) else (
    echo [OK] E-Commerce frontend dependencies are already installed.
)
echo.

echo [3/7] Freeing up ports (4000, 3000, and 3001)...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":4000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3001" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3002" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo [OK] Ports 4000, 3000, 3001, and 3002 ready.
echo.

echo [4/7] Checking and starting Local AI Engine (Ollama :11434)...
set "OLLAMA_EXE="
where ollama >nul 2>nul
if %errorlevel% equ 0 (
    set "OLLAMA_EXE=ollama"
) else if exist "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" (
    set "OLLAMA_EXE=%LOCALAPPDATA%\Programs\Ollama\ollama.exe"
) else if exist "%ProgramFiles%\Ollama\ollama.exe" (
    set "OLLAMA_EXE=%ProgramFiles%\Ollama\ollama.exe"
)

if defined OLLAMA_EXE (
    netstat -aon 2^>nul | findstr ":11434" | findstr "LISTENING" >nul 2>nul
    if %errorlevel% neq 0 (
        echo Starting Ollama Local AI Server (:11434)...
        start "BlueOceans POS - Local AI Engine (:11434)" cmd /c "title Ollama Local AI Engine (:11434) && "%OLLAMA_EXE%" serve"
        timeout /t 2 >nul
        echo [OK] Ollama Local AI Engine launched.
    ) else (
        echo [OK] Ollama Local AI Engine is already active on port 11434.
    )
) else (
    echo [WARNING] Ollama executable not found in PATH or standard directories.
    echo AI features will operate via cloud or rule-based fallback.
)
echo.

echo [5/7] Starting FastAPI Backend on port 4000...
start "BlueOceans POS - Backend API (:4000)" cmd /k "color 0A && cd /d "%ROOT_DIR%backend" && echo Starting FastAPI Backend on http://127.0.0.1:4000... && python -m uvicorn main:app --port 4000 --host 0.0.0.0 --reload"

echo [6/7] Starting POS Frontend on port 3000...
start "BlueOceans POS - Staff App (:3000)" cmd /k "color 0E && cd /d "%ROOT_DIR%frontend" && echo Starting POS Frontend on http://localhost:3000... && npm run dev"

echo [6/7] Starting E-Commerce Customer Storefront on port 3001...
start "SalePay E-Commerce (:3001)" cmd /k "color 0B && cd /d "%ROOT_DIR%ecommerce-frontend" && echo Starting E-Commerce Storefront on http://localhost:3001... && npm run dev"

echo [7/7] Starting Dynamic Business Website on port 3002...
start "SalePay Dynamic Website (:3002)" cmd /k "color 0D && cd /d "%ROOT_DIR%website-frontend" && if not exist node_modules (npm install) && echo Starting Dynamic Website on http://localhost:3002... && npm run dev"

echo.
echo ========================================================
echo   All 4 Services are starting in separate windows!
echo   - Backend API Docs:       http://127.0.0.1:4000/docs
echo   - POS Staff & Admin App:  http://localhost:3000
echo   - Online E-Commerce App:  http://localhost:3001
echo   - Dynamic Website:        http://localhost:3002
echo ========================================================
echo.
echo Waiting 6 seconds for servers to initialize before opening browser...
timeout /t 6 >nul

set "CHROME_EXE="
where chrome >nul 2>&1 && set "CHROME_EXE=chrome"
if "%CHROME_EXE%"=="" if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME_EXE=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if "%CHROME_EXE%"=="" if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "CHROME_EXE=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if "%CHROME_EXE%"=="" if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "CHROME_EXE=%LocalAppData%\Google\Chrome\Application\chrome.exe"

if not "%CHROME_EXE%"=="" (
    start "" "%CHROME_EXE%" "http://localhost:3000" "http://localhost:3001" "http://localhost:3002"
) else (
    start "" "http://localhost:3000"
    start "" "http://localhost:3001"
    start "" "http://localhost:3002"
)

echo.
echo All services are now running!
echo To stop services, run stop_all.bat or close the command windows.
pause
