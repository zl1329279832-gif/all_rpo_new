#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

info() { echo -e "${CYAN}$1${NC}"; }
success() { echo -e "${GREEN}$1${NC}"; }
warning() { echo -e "${YELLOW}$1${NC}"; }
error() { echo -e "${RED}$1${NC}"; }

check_docker() {
    if ! command -v docker &> /dev/null; then
        error "错误: 未检测到 Docker，请先安装 Docker"
        exit 1
    fi
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "错误: 未检测到 Docker Compose"
        exit 1
    fi
}

do_build() {
    info "=== 构建 Docker 镜像 ==="
    docker compose build
    success "镜像构建成功!"
}

do_up() {
    info "=== 配置显示环境 ==="
    xhost +local:root > /dev/null 2>&1 || warning "xhost 授权失败，请手动执行: xhost +local:root"
    export DISPLAY=${DISPLAY:-:0}
    info "DISPLAY=$DISPLAY"
    
    info "=== 启动容器 ==="
    docker compose up -d
    if [ $? -eq 0 ]; then
        success "容器启动成功!"
        sleep 2
        do_logs
    else
        error "容器启动失败!"
        exit 1
    fi
}

do_down() {
    info "=== 停止并移除容器 ==="
    docker compose down
    success "完成"
}

do_logs() {
    docker compose logs -f
}

do_restart() {
    info "=== 重启容器 ==="
    docker compose restart
    success "完成"
    sleep 1
    do_logs
}

do_headless() {
    info "=== 启动无界面模式 ==="
    docker compose --profile headless up headless-demo
}

do_init() {
    info "=== 初始化演示数据 ==="
    docker run -it --rm \
        -v "$(pwd)/studio.db:/app/studio.db" \
        -v "$(pwd)/thumbnails:/app/thumbnails" \
        -v "$(pwd)/exports:/app/exports" \
        -v "$(pwd)/backups:/app/backups" \
        -v "$(pwd)/logs:/app/logs" \
        studio-order-system python demo/seed_data.py
}

show_help() {
    info "=== 摄影工作室订单管理系统 - Docker 一键部署 ==="
    echo ""
    warning "用法:"
    echo "  $0 build     # 仅构建镜像"
    echo "  $0 up        # 构建并启动 GUI 应用"
    echo "  $0 down      # 停止并移除容器"
    echo "  $0 logs      # 查看日志"
    echo "  $0 restart   # 重启容器"
    echo "  $0 headless  # 无界面模式查询数据"
    echo "  $0 init      # 初始化演示数据"
    echo "  $0 help      # 显示帮助"
    echo ""
    warning "首次运行请确保:"
    echo "  1. 已安装 Docker 并运行"
    echo "  2. 执行: xhost +local:root"
    echo ""
}

# 主逻辑
check_docker

case "${1:-help}" in
    build)
        do_build
        ;;
    up)
        if [ -z "$(docker images -q studio-order-system)" ]; then
            do_build
        fi
        do_up
        ;;
    down)
        do_down
        ;;
    logs)
        do_logs
        ;;
    restart)
        do_restart
        ;;
    headless)
        if [ -z "$(docker images -q studio-order-system)" ]; then
            do_build
        fi
        do_headless
        ;;
    init)
        if [ -z "$(docker images -q studio-order-system)" ]; then
            do_build
        fi
        do_init
        ;;
    help)
        show_help
        ;;
    *)
        show_help
        read -p "是否执行 构建+启动? (y/n): " confirm
        if [[ "$confirm" =~ ^[Yy]$ ]]; then
            do_build
            do_up
        fi
        ;;
esac
