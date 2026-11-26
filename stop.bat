@echo off
title Stop Blue Oceans POS
cd /d "%~dp0"

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
set "ECOMMERCE_PORT=3001"
set "WEBSITE_PORT=3002"

echo Stopping SalePay POS, E-Commerce & Website on ports %BACKEND_PORT%, %FRONTEND_PORT%, %ECOMMERCE_PORT%, and %WEBSITE_PORT%...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%BACKEND_PORT% " ^| findstr "LISTENING"') do (
    echo Terminating backend process %%a...
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%FRONTEND_PORT% " ^| findstr "LISTENING"') do (
    echo Terminating frontend process %%a...
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%ECOMMERCE_PORT% " ^| findstr "LISTENING"') do (
    echo Terminating ecommerce process %%a...
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%WEBSITE_PORT% " ^| findstr "LISTENING"') do (
    echo Terminating website process %%a...
    taskkill /F /PID %%a >nul 2>&1
)

if exist "frontend\.next\dev\lock" del /f /q "frontend\.next\dev\lock" >nul 2>&1
if exist "ecommerce-frontend\.next\dev\lock" del /f /q "ecommerce-frontend\.next\dev\lock" >nul 2>&1
if exist "website-frontend\.next\dev\lock" del /f /q "website-frontend\.next\dev\lock" >nul 2>&1

echo Blue Oceans POS stopped.
pause
