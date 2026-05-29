.PHONY: help build up down logs restart headless init clean

help:
	@echo "=== 摄影工作室订单管理系统 - Docker 部署 ==="
	@echo ""
	@echo "可用命令:"
	@echo "  make build      - 构建 Docker 镜像"
	@echo "  make up         - 构建并启动 GUI 应用"
	@echo "  make down       - 停止并移除容器"
	@echo "  make logs       - 查看容器日志"
	@echo "  make restart    - 重启容器"
	@echo "  make headless   - 无界面模式查询数据"
	@echo "  make init       - 初始化演示数据"
	@echo "  make clean      - 清理镜像和容器"
	@echo ""

build:
	docker compose build

up: build
	@echo "授权 X 服务器访问..."
	-xhost +local:root
	@echo "启动容器..."
	docker compose up -d
	@echo "等待启动..."
	@sleep 2
	@echo "查看日志..."
	docker compose logs -f

down:
	docker compose down

logs:
	docker compose logs -f

restart:
	docker compose restart
	@sleep 1
	docker compose logs -f

headless: build
	docker compose --profile headless up headless-demo

init: build
	docker run -it --rm \
		-v $(PWD)/studio.db:/app/studio.db \
		-v $(PWD)/thumbnails:/app/thumbnails \
		-v $(PWD)/exports:/app/exports \
		-v $(PWD)/backups:/app/backups \
		-v $(PWD)/logs:/app/logs \
		studio-order-system python demo/seed_data.py

clean: down
	-docker rmi studio-order-system
	@echo "清理完成"

init-data:
	python demo/seed_data.py

run:
	python main.py
