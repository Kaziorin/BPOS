# BlueOceans SalePay Enterprise POS - Automated Production Packaging Script
$ErrorActionPreference = "Stop"

$RootDir = $PSScriptRoot
$FrontendDir = Join-Path $RootDir "frontend"
$EcommerceDir = Join-Path $RootDir "ecommerce-frontend"
$WebsiteDir = Join-Path $RootDir "website-frontend"
$BackendDir = Join-Path $RootDir "backend"
$StagingDir = Join-Path $RootDir "deploy_staging"
$ZipFile = Join-Path $RootDir "salepay_prod_deploy.zip"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  SalePay Enterprise POS - Production Packaging" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Clean previous builds & staging
if (Test-Path $StagingDir) {
    Remove-Item -Recurse -Force $StagingDir
}
if (Test-Path $ZipFile) {
    Remove-Item -Force $ZipFile
}
New-Item -ItemType Directory -Path $StagingDir | Out-Null
New-Item -ItemType Directory -Path (Join-Path $StagingDir "backend") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $StagingDir "frontend") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $StagingDir "ecommerce-frontend") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $StagingDir "website-frontend") | Out-Null

# 2. Package Backend
Write-Host "`n[1/5] Packaging Python Backend..." -ForegroundColor Yellow
$BackendStaging = Join-Path $StagingDir "backend"

# Copy all root python modules (db.py, security.py, main.py, etc.)
Copy-Item -Path (Join-Path $BackendDir "*.py") -Destination $BackendStaging -Force

# Copy app module and configuration
if (Test-Path (Join-Path $BackendDir "app")) {
    Copy-Item -Path (Join-Path $BackendDir "app") -Destination $BackendStaging -Recurse -Force
}
if (Test-Path (Join-Path $BackendDir "requirements.txt")) {
    Copy-Item -Path (Join-Path $BackendDir "requirements.txt") -Destination $BackendStaging -Force
}
if (Test-Path (Join-Path $BackendDir "alembic.ini")) {
    Copy-Item -Path (Join-Path $BackendDir "alembic.ini") -Destination $BackendStaging -Force
}
if (Test-Path (Join-Path $BackendDir "alembic")) {
    Copy-Item -Path (Join-Path $BackendDir "alembic") -Destination $BackendStaging -Recurse -Force
}

# Copy ai_engine shell scripts and create models directory placeholder
$AiEngineStaging = Join-Path $BackendStaging "ai_engine"
New-Item -ItemType Directory -Path (Join-Path $AiEngineStaging "models") -Force | Out-Null
Copy-Item -Path (Join-Path $BackendDir "ai_engine\*") -Destination $AiEngineStaging -Exclude "models" -Force -ErrorAction SilentlyContinue

New-Item -ItemType Directory -Path (Join-Path $BackendStaging "uploads") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $BackendStaging "media") -Force | Out-Null

# Remove __pycache__ from backend staging
Get-ChildItem -Path $BackendStaging -Recurse -Directory -Filter "__pycache__" | Remove-Item -Recurse -Force

# Generate Production .env for Backend
$ProdEnvContent = @"
# Production Environment Settings
APP_ENV="prod"
PROJECT_NAME="SalePay Enterprise POS API"
VERSION="2.0.0-production"
PORT=4000
API_V1_STR="/api/v1"
JWT_SECRET="salepay-production-jwt-secret-9d25e094faa6ca2556c818166b7a9563b"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_HOURS=168

# Production Database Credentials
DB_CONNECTION=mysql
DB_HOST=72.60.209.22
DB_PORT=3306
DB_DATABASE=blue_oceans_pos
DB_NAME=blue_oceans_pos
DB_USERNAME=dba
DB_USER=dba
DB_PASSWORD="EF@j#TpZB413!"

# CORS Configuration
CORS_ORIGIN="https://blueoceanstech.com,https://pos.blueoceanstech.com,http://localhost:3000,http://localhost:3001,http://127.0.0.1:4000"

# Local AI Engine (Ollama Offline)
OLLAMA_BASE_URL="http://127.0.0.1:11434"
OLLAMA_MODEL="qwen2.5:1.5b"
OLLAMA_MODELS_DIR="backend/ai_engine/models"

REDIS_URL="redis://localhost:6379/0"
"@
Set-Content -Path (Join-Path $BackendStaging ".env") -Value $ProdEnvContent -Encoding UTF8
Set-Content -Path (Join-Path $BackendStaging ".env.prod") -Value $ProdEnvContent -Encoding UTF8
Write-Host "Backend packaged with production database configuration (72.60.209.22)." -ForegroundColor Green

# 3. Package POS Frontend (Excluding node_modules & .next)
Write-Host "`n[2/4] Packaging POS Frontend..." -ForegroundColor Yellow
$FrontendStaging = Join-Path $StagingDir "frontend"
robocopy $FrontendDir $FrontendStaging /E /XD node_modules .next .git /XF .env.local npm-debug.log | Out-Null

$FrontendEnvContent = @"
NEXT_PUBLIC_API_URL="/api/v1"
NEXT_PUBLIC_APP_NAME="SalePay Enterprise POS"
"@
Set-Content -Path (Join-Path $FrontendStaging ".env.production") -Value $FrontendEnvContent -Encoding UTF8
Write-Host "POS Frontend packaged." -ForegroundColor Green

# 4. Package E-Commerce Customer Storefront
Write-Host "`n[3/5] Packaging E-Commerce Storefront..." -ForegroundColor Yellow
$EcommerceStaging = Join-Path $StagingDir "ecommerce-frontend"
robocopy $EcommerceDir $EcommerceStaging /E /XD node_modules .next .git /XF .env.local npm-debug.log | Out-Null

$EcommerceEnvContent = @"
NEXT_PUBLIC_API_URL="/api/v1/storefront"
NEXT_PUBLIC_APP_NAME="BlueOceans Storefront"
"@
Set-Content -Path (Join-Path $EcommerceStaging ".env.production") -Value $EcommerceEnvContent -Encoding UTF8
Write-Host "E-Commerce Frontend packaged." -ForegroundColor Green

# 5. Package Corporate Website Frontend
Write-Host "`n[4/5] Packaging Corporate Website Frontend..." -ForegroundColor Yellow
$WebsiteStaging = Join-Path $StagingDir "website-frontend"
robocopy $WebsiteDir $WebsiteStaging /E /XD node_modules .next .git /XF .env.local npm-debug.log | Out-Null

$WebsiteEnvContent = @"
NEXT_PUBLIC_APP_NAME="BlueOceans POS Enterprise Showcase"
"@
Set-Content -Path (Join-Path $WebsiteStaging ".env.production") -Value $WebsiteEnvContent -Encoding UTF8
Write-Host "Corporate Website Frontend packaged." -ForegroundColor Green

# 6. Copy PM2 & Deploy Scripts
Write-Host "`n[5/5] Adding PM2 ecosystem & deploy scripts..." -ForegroundColor Yellow
Copy-Item -Path (Join-Path $RootDir "ecosystem.config.js") -Destination $StagingDir -Force
Copy-Item -Path (Join-Path $RootDir "deploy_server.sh") -Destination $StagingDir -Force

# Create Final ZIP
Write-Host "Creating deployment ZIP archive ($ZipFile)..." -ForegroundColor Yellow
Set-Location $RootDir
Compress-Archive -Path "$StagingDir\*" -DestinationPath $ZipFile -Force

# Cleanup staging
Remove-Item -Recurse -Force $StagingDir

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " SUCCESS: Production deployment package created at:" -ForegroundColor Green
Write-Host " $ZipFile" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
