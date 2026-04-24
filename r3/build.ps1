# Windows PowerShell Build Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  File Batch Tool - Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create bin directory
if (-not (Test-Path "bin")) {
    New-Item -ItemType Directory -Path "bin" | Out-Null
    Write-Host "[OK] Created bin directory" -ForegroundColor Green
}

# Check Go environment
Write-Host "[1/3] Checking Go environment..." -ForegroundColor Yellow
$goVersion = go version
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Go not found, please install Go 1.22+" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] $goVersion" -ForegroundColor Green

# Download dependencies
Write-Host ""
Write-Host "[2/3] Downloading dependencies..." -ForegroundColor Yellow
go mod tidy
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to download dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Dependencies downloaded" -ForegroundColor Green

# Build
Write-Host ""
Write-Host "[3/3] Building EXE..." -ForegroundColor Yellow
go build -ldflags "-s -w" -o "bin/file-batch-tool.exe" "cmd/main.go"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Build failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[SUCCESS] Build complete!" -ForegroundColor Green
Write-Host "EXE location: bin/file-batch-tool.exe" -ForegroundColor Cyan
Write-Host ""
Write-Host "Run: .\bin\file-batch-tool.exe" -ForegroundColor Yellow
