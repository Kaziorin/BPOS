@echo off
title Office VPN Connector
color 0B

echo ========================================================
echo          BLUEOCEANS - CONNECTING TO OFFICE VPN
echo ========================================================
echo.

echo Connecting to Office Gateway (182.163.113.141)...
rasdial "OfficeVPN" orin "$orin967@@"

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo   [SUCCESS] Connected to Office VPN!
    echo   Office Network is active.
    echo   Office Database IP: 192.168.181.104
    echo ========================================================
    echo.
    echo Testing ping to Office DB (192.168.181.104)...
    ping -n 2 192.168.181.104
) else (
    echo.
    echo [ERROR] Connection failed. Error Code: %errorlevel%
    echo Please make sure your internet is working or PPTP is allowed on your network.
)

echo.
pause
