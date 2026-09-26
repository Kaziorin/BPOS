@echo off
title BlueOceans OmniPOS Terminator
color 0C

echo ========================================================
echo          BLUEOCEANS OMNIPOS - STOPPING SERVICES
echo ========================================================
echo.

echo Stopping processes on port 4000 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4000" ^| findstr "LISTENING"') do (
    echo Terminating backend process ID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo Stopping processes on port 3000 (POS Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Terminating frontend process ID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo Stopping processes on port 3001 (E-Commerce Storefront)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001" ^| findstr "LISTENING"') do (
    echo Terminating ecommerce process ID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo [OK] All POS & E-Commerce services stopped successfully.
timeout /t 3
