@echo off
title SalePay Enterprise POS - Production Build & Zip Packager
echo ========================================================
echo   SalePay Enterprise POS - Building Production Package
echo ========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0package_prod.ps1"

if errorlevel 1 (
    echo.
    echo [ERROR] Build & Packaging failed!
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   Done! Zip file created: salepay_prod_deploy.zip
echo ========================================================
pause
exit /b 0
