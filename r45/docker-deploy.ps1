<#
.SYNOPSIS
摄影工作室订单管理系统 - Docker 一键部署脚本 (Windows)
#>

param(
    [switch]$Build,
    [switch]$Up,
    [switch]$Down,
    [switch]$Logs,
    [switch]$Restart,
    [switch]$Headless,
    [switch]$InitData
)

$ErrorActionPreference = "Stop"

function Write-Color {
    param([string]$Text, [string]$Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

function Check-Docker {
    try {
        docker --version | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Check-VcXsrv {
    $vcxsrv = Get-Process -Name vcxsrv -ErrorAction SilentlyContinue
    if ($vcxsrv) {
        return $true
    }
    $xming = Get-Process -Name xming -ErrorAction SilentlyContinue
    return [bool]$xming
}

function Invoke-Build {
    Write-Color "=== 构建 Docker 镜像 ===" "Cyan"
    docker compose build
    if ($LASTEXITCODE -eq 0) {
        Write-Color "镜像构建成功!" "Green"
    } else {
        Write-Color "镜像构建失败!" "Red"
        exit 1
    }
}

function Invoke-Up {
    Write-Color "=== 配置显示环境 ===" "Cyan"
    
    if (-not (Check-VcXsrv)) {
        Write-Color "警告: 未检测到 VcXsrv 或 Xming 运行" "Yellow"
        Write-Color "请启动 VcXsrv 并勾选 'Disable access control'" "Yellow"
    }
    
    $env:DISPLAY = "host.docker.internal:0.0"
    [Environment]::SetEnvironmentVariable("DISPLAY", $env:DISPLAY, "Process")
    
    Write-Color "DISPLAY 设置为: $env:DISPLAY" "Green"
    
    Write-Color "=== 启动容器 ===" "Cyan"
    docker compose up -d
    if ($LASTEXITCODE -eq 0) {
        Write-Color "容器启动成功!" "Green"
        Start-Sleep -Seconds 2
        Invoke-Logs
    } else {
        Write-Color "容器启动失败!" "Red"
        exit 1
    }
}

function Invoke-Down {
    Write-Color "=== 停止并移除容器 ===" "Cyan"
    docker compose down
    Write-Color "完成" "Green"
}

function Invoke-Logs {
    docker compose logs -f
}

function Invoke-Restart {
    Write-Color "=== 重启容器 ===" "Cyan"
    docker compose restart
    Write-Color "完成" "Green"
    Start-Sleep -Seconds 1
    Invoke-Logs
}

function Invoke-Headless {
    Write-Color "=== 启动无界面模式 ===" "Cyan"
    docker compose --profile headless up headless-demo
}

function Invoke-InitData {
    Write-Color "=== 初始化演示数据 ===" "Cyan"
    docker run -it --rm `
        -v "$(Get-Location)/studio.db:/app/studio.db" `
        -v "$(Get-Location)/thumbnails:/app/thumbnails" `
        -v "$(Get-Location)/exports:/app/exports" `
        -v "$(Get-Location)/backups:/app/backups" `
        -v "$(Get-Location)/logs:/app/logs" `
        studio-order-system python demo/seed_data.py
}

# 主逻辑
if (-not (Check-Docker)) {
    Write-Color "错误: 未检测到 Docker，请先安装并启动 Docker Desktop" "Red"
    exit 1
}

if ($Build) {
    Invoke-Build
} elseif ($Up) {
    if (-not (docker images -q studio-order-system)) {
        Invoke-Build
    }
    Invoke-Up
} elseif ($Down) {
    Invoke-Down
} elseif ($Logs) {
    Invoke-Logs
} elseif ($Restart) {
    Invoke-Restart
} elseif ($Headless) {
    if (-not (docker images -q studio-order-system)) {
        Invoke-Build
    }
    Invoke-Headless
} elseif ($InitData) {
    if (-not (docker images -q studio-order-system)) {
        Invoke-Build
    }
    Invoke-InitData
} else {
    # 默认：构建+启动
    Write-Color "=== 摄影工作室订单管理系统 - Docker 一键部署 ===" "Cyan"
    Write-Color ""
    Write-Color "用法: " "Yellow"
    Write-Color "  .\docker-deploy.ps1 -Build     # 仅构建镜像" "Gray"
    Write-Color "  .\docker-deploy.ps1 -Up        # 构建并启动 GUI 应用" "Gray"
    Write-Color "  .\docker-deploy.ps1 -Down      # 停止并移除容器" "Gray"
    Write-Color "  .\docker-deploy.ps1 -Logs      # 查看日志" "Gray"
    Write-Color "  .\docker-deploy.ps1 -Restart   # 重启容器" "Gray"
    Write-Color "  .\docker-deploy.ps1 -Headless  # 无界面模式查询数据" "Gray"
    Write-Color "  .\docker-deploy.ps1 -InitData  # 初始化演示数据" "Gray"
    Write-Color ""
    Write-Color "首次运行请确保:" "Yellow"
    Write-Color "  1. 已安装 Docker Desktop 并运行" "Gray"
    Write-Color "  2. 已安装并启动 VcXsrv (Display=0, Disable access control)" "Gray"
    Write-Color ""
    
    $confirm = Read-Host "是否执行 构建+启动? (y/n)"
    if ($confirm -eq 'y' -or $confirm -eq 'Y') {
        Invoke-Build
        Invoke-Up
    }
}
