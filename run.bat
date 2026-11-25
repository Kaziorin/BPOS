@echo off
title Blue Oceans POS Launcher
cd /d "%~dp0"

echo =====================================================================
echo    BLUE OCEANS POS (BPOS) - FULL STACK LAUNCHER
echo =====================================================================
echo.

where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python 3 not found in PATH. Please install Python 3.10+ and check "Add Python to PATH".
    pause
    exit /b 1
)

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js not found in PATH. Please install Node.js 20+ first.
    pause
    exit /b 1
)

:: Ensure backend\.env exists (do not overwrite existing configs)
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        echo [INFO] Creating backend\.env from backend\.env.example...
        copy /Y "backend\.env.example" "backend\.env" >nul
    )
)

:: Read backend PORT from backend\.env (default 4000)
set "BACKEND_PORT=4000"
if exist "backend\.env" (
    for /f "usebackq tokens=1,* delims==" %%A in ("backend\.env") do (
        if /i "%%A"=="PORT" set "BACKEND_PORT=%%B"
    )
)
set "BACKEND_PORT=%BACKEND_PORT: =%"
set "BACKEND_PORT=%BACKEND_PORT:"=%"
if "%BACKEND_PORT%"=="" set "BACKEND_PORT=4000"
set "FRONTEND_PORT=3000"

:: Free lingering processes on backend/frontend ports
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%BACKEND_PORT% " ^| findstr "LISTENING"') do (
    echo [INFO] Freeing port %BACKEND_PORT% ^(PID %%a^)...
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%FRONTEND_PORT% " ^| findstr "LISTENING"') do (
    echo [INFO] Freeing port %FRONTEND_PORT% ^(PID %%a^)...
    taskkill /F /PID %%a >nul 2>&1
)

if exist "frontend\.next\dev\lock" del /f /q "frontend\.next\dev\lock" >nul 2>&1

:: Check MySQL connectivity from backend\.env (+ .env.<APP_ENV>)
python -c "import os,socket; from urllib.parse import urlparse; bd=r'%~dp0backend'; env={}; [env.update({l.split('=',1)[0].strip():l.split('=',1)[1].strip().strip(chr(34)+chr(39))}) for p in [os.path.join(bd,'.env')] if os.path.exists(p) for l in open(p,encoding='utf-8') if l.strip() and not l.strip().startswith('#') and '=' in l]; app_env=env.get('APP_ENV','local').strip().lower(); pf=os.path.join(bd,f'.env.{app_env}'); [env.update({l.split('=',1)[0].strip():l.split('=',1)[1].strip().strip(chr(34)+chr(39))}) for l in open(pf,encoding='utf-8') if l.strip() and not l.strip().startswith('#') and '=' in l] if os.path.exists(pf) else None; u=urlparse(env['DATABASE_URL']) if env.get('DATABASE_URL') else None; h=(u.hostname if u and u.hostname else env.get('DB_HOST','localhost')); p=(u.port if u and u.port else int(env.get('DB_PORT','3306'))); s=socket.socket(); s.settimeout(2.5); res=s.connect_ex((h,p)); s.close(); print(f'[OK] MySQL reachable at {h}:{p} (profile: {app_env})' if res==0 else f'[WARNING] Cannot reach MySQL at {h}:{p} (profile: {app_env}).')"

:: Setup backend venv & dependencies if missing
if not exist "backend\venv\Scripts\uvicorn.exe" (
    echo [INFO] Setting up backend Python virtual environment...
    pushd backend
    python -m venv venv
    if %ERRORLEVEL% neq 0 (
        popd
        echo [ERROR] Failed to create Python venv.
        pause
        exit /b 1
    )
    call venv\Scripts\pip.exe install --upgrade pip
    call venv\Scripts\pip.exe install -r requirements.txt
    if %ERRORLEVEL% neq 0 (
        popd
        echo [ERROR] Failed to install backend dependencies.
        pause
        exit /b 1
    )
    popd
)

:: Install frontend dependencies if missing
if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend dependencies...
    pushd frontend
    call npm install
    if %ERRORLEVEL% neq 0 (
        popd
        echo [ERROR] Failed to install frontend dependencies.
        pause
        exit /b 1
    )
    popd
)

echo.
echo [1/2] Starting FastAPI Backend in new window (Port %BACKEND_PORT%)...
start "Blue Oceans POS - Backend (%BACKEND_PORT%)" /D "%~dp0backend" cmd /k "venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port %BACKEND_PORT% --reload"

timeout /t 4 /nobreak >nul

echo [2/2] Starting Next.js POS Frontend in new window (Port %FRONTEND_PORT%)...
start "Blue Oceans POS - Frontend (%FRONTEND_PORT%)" /D "%~dp0frontend" cmd /k "npm run dev -- -p %FRONTEND_PORT%"

timeout /t 4 /nobreak >nul

echo Opening browser...
start "" "http://localhost:%FRONTEND_PORT%"

echo.
echo =====================================================================
echo    BLUE OCEANS POS IS LAUNCHED!
echo    - POS App:     http://localhost:%FRONTEND_PORT%
echo    - Backend API: http://localhost:%BACKEND_PORT%
echo    - API Swagger: http://localhost:%BACKEND_PORT%/docs
echo =====================================================================
echo    Close the two server windows or run stop.bat to stop servers.
echo.
pause
