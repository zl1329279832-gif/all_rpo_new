# Windows 环境诊断脚本
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  File Batch Tool - Environment Diagnostics" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Go 环境
Write-Host "[1/6] Checking Go environment..." -ForegroundColor Yellow
try {
    $goVersion = go version
    Write-Host "[OK] $goVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Go not found in PATH" -ForegroundColor Red
}

# 检查 CGO 支持
Write-Host ""
Write-Host "[2/6] Checking CGO support..." -ForegroundColor Yellow
$cgoEnabled = $env:CGO_ENABLED
if ($cgoEnabled -eq "1") {
    Write-Host "[OK] CGO is enabled" -ForegroundColor Green
} else {
    Write-Host "[WARN] CGO is disabled (CGO_ENABLED=$cgoEnabled)" -ForegroundColor Yellow
    Write-Host "       Fyne requires CGO for Windows GUI" -ForegroundColor Yellow
}

# 检查 gcc
Write-Host ""
Write-Host "[3/6] Checking GCC (required for CGO)..." -ForegroundColor Yellow
try {
    $gccVersion = gcc --version 2>&1 | Select-Object -First 1
    Write-Host "[OK] $gccVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] GCC not found! This is required for Fyne GUI." -ForegroundColor Red
    Write-Host "        Please install TDM-GCC or MinGW-w64." -ForegroundColor Red
}

# 检查 WebView2
Write-Host ""
Write-Host "[4/6] Checking WebView2 Runtime..." -ForegroundColor Yellow
$webView2Path = "HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"
if (Test-Path $webView2Path) {
    Write-Host "[OK] WebView2 Runtime is installed" -ForegroundColor Green
} else {
    Write-Host "[WARN] WebView2 Runtime may not be installed" -ForegroundColor Yellow
    Write-Host "       Download: https://developer.microsoft.com/en-us/microsoft-edge/webview2/" -ForegroundColor Yellow
}

# 检查 OpenGL
Write-Host ""
Write-Host "[5/6] Checking OpenGL support..." -ForegroundColor Yellow
try {
    $gpuInfo = Get-WmiObject Win32_VideoController | Select-Object -First 1 Name, DriverVersion
    Write-Host "[OK] GPU: $($gpuInfo.Name)" -ForegroundColor Green
    Write-Host "[OK] Driver: $($gpuInfo.DriverVersion)" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Cannot detect GPU info" -ForegroundColor Yellow
}

# 检查编译文件
Write-Host ""
Write-Host "[6/6] Checking compiled files..." -ForegroundColor Yellow
$exePath = "bin\file-batch-tool.exe"
if (Test-Path $exePath) {
    $exeInfo = Get-Item $exePath
    Write-Host "[OK] EXE file found: $exePath" -ForegroundColor Green
    Write-Host "[OK] Size: $($exeInfo.Length / 1MB) MB" -ForegroundColor Green
} else {
    Write-Host "[INFO] EXE file not found at: $exePath" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Recommendations" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "To run Fyne GUI properly:" -ForegroundColor Yellow
Write-Host "1. Install TDM-GCC: https://jmeubank.github.io/tdm-gcc/" -ForegroundColor White
Write-Host "2. Or install MinGW-w64: https://www.mingw-w64.org/" -ForegroundColor White
Write-Host "3. Set CGO_ENABLED=1" -ForegroundColor White
Write-Host "4. Recompile: go build -o bin/file-batch-tool.exe cmd/main.go" -ForegroundColor White
Write-Host ""
Write-Host "Alternative: Use the CLI version (no GUI required)" -ForegroundColor Yellow
Write-Host "   go run cmd/cli_main.go" -ForegroundColor White
