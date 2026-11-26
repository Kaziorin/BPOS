@echo off
title Office VPN Disconnector
color 0C

echo Disconnecting from Office VPN...
rasdial "OfficeVPN" /disconnect

echo.
echo [OK] Office VPN disconnected successfully.
timeout /t 3
