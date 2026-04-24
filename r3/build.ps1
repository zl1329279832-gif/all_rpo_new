# Windows PowerShell 构建脚本
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  本地文件批量处理工具 - 构建脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 创建 bin 目录
if (-not (Test-Path "bin")) {
    New-Item -ItemType Directory -Path "bin" | Out-Null
    Write-Host "✅ 创建 bin 目录" -ForegroundColor Green
}

# 检查 Go 环境
Write-Host "📦 检查 Go 环境..." -ForegroundColor Yellow
$goVersion = go version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 未找到 Go，请先安装 Go 1.22+" -ForegroundColor Red
    exit 1
}
Write-Host "✅ $goVersion" -ForegroundColor Green

# 下载依赖
Write-Host ""
Write-Host "📥 下载依赖..." -ForegroundColor Yellow
go mod tidy
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 依赖下载失败" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 依赖下载完成" -ForegroundColor Green

# 编译
Write-Host ""
Write-Host "🔨 编译 EXE 文件..." -ForegroundColor Yellow
go build -ldflags "-s -w" -o "bin/file-batch-tool.exe" "cmd/main.go"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 编译失败" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 构建完成！" -ForegroundColor Green
Write-Host "📦 EXE 文件位置: bin/file-batch-tool.exe" -ForegroundColor Cyan
Write-Host ""
Write-Host "运行程序: .\bin\file-batch-tool.exe" -ForegroundColor Yellow
