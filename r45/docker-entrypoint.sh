#!/bin/bash
set -e

echo "=========================================="
echo "  摄影工作室订单管理系统 - Docker 启动"
echo "=========================================="

if [ -n "$DISPLAY" ]; then
    echo "检测到 DISPLAY=$DISPLAY"
else
    echo "警告: 未设置 DISPLAY 环境变量"
    echo "如果需要 GUI 显示，请设置 DISPLAY"
    echo "  Linux:   export DISPLAY=:0"
    echo "  Windows: 设置 VcXsrv 后 export DISPLAY=host.docker.internal:0.0"
fi

if [ ! -f "/app/studio.db" ]; then
    echo "检测到首次启动，正在初始化演示数据..."
    python demo/seed_data.py || echo "初始化数据失败或已存在，继续启动"
else
    echo "数据库已存在，跳过初始化"
fi

echo "正在启动应用..."
exec "$@"
