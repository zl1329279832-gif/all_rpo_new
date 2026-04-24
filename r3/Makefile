# Makefile for 本地文件批量处理工具

.PHONY: all build run clean deps help

# 项目信息
APP_NAME := file-batch-tool
VERSION := 1.0.0
BUILD_DIR := bin

# Go 相关
GO := go
GOFLAGS := -ldflags "-s -w"

# 默认目标
all: deps build

help:  ## 显示帮助信息
	@echo "本地文件批量处理工具 - Makefile"
	@echo ""
	@echo "可用命令:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

deps:  ## 下载依赖
	@echo "下载依赖..."
	$(GO) mod tidy

build:  ## 编译项目
	@echo "编译项目..."
	mkdir -p $(BUILD_DIR)
	$(GO) build $(GOFLAGS) -o $(BUILD_DIR)/$(APP_NAME).exe ./cmd/main.go
	@echo "编译完成: $(BUILD_DIR)/$(APP_NAME).exe"

run:  ## 运行程序
	@echo "运行程序..."
	$(GO) run ./cmd/main.go

clean:  ## 清理编译文件
	@echo "清理..."
	rm -rf $(BUILD_DIR)
	rm -rf logs/*.log
	@echo "清理完成"

install-deps:  ## 安装 Fyne 工具
	@echo "安装 Fyne 打包工具..."
	$(GO) install fyne.io/fyne/v2/cmd/fyne@latest

package:  ## 使用 Fyne 打包（需要先安装 fyne 工具）
	@echo "使用 Fyne 打包..."
	fyne package -os windows -name "文件批量处理工具"
