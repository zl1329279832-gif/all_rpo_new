# Windows 运行问题修复指南

## 问题描述

运行 `bin/file-batch-tool.exe` 时出现系统弹窗：
**"此文件无法在你的电脑上运行"**

---

## 问题原因

Fyne GUI 框架在 Windows 上需要以下依赖：
1. **CGO** - 需要 GCC 编译器
2. **WebView2 运行时** - 部分 Fyne 版本需要
3. **OpenGL** - 用于图形渲染

---

## 解决方案

### 方案一：使用 CLI 版本（推荐，立即可用）

我们提供了**无需 GUI 依赖的命令行版本，可以立即测试核心功能：

```powershell
# 运行 CLI 版本
go run cmd/cli_main.go

# 或者编译 CLI 版本
go build -o bin/file-batch-cli.exe cmd/cli_main.go
.\bin\file-batch-cli.exe
```

CLI 版本功能：
- ✅ 目录扫描
- ✅ 文件筛选
- ✅ 批量重命名
- ✅ 批量复制/移动
- ✅ 重复文件检测
- ✅ 操作日志

---

### 方案二：安装依赖修复 GUI 版本

#### 步骤 1：安装 TDM-GCC（推荐）

TDM-GCC 是 Windows 上最简单的 GCC 安装包：

1. 下载：https://jmeubank.github.io/tdm-gcc/
2. 选择 **tdm64-gcc** 安装包
3. 运行安装程序，默认选项即可
4. 安装完成后重启终端

#### 或者安装 MinGW-w64

1. 下载：https://www.mingw-w64.org/downloads/
2. 选择 WinLibs 版本
3. 解压到 `C:\mingw64`
4. 将 `C:\mingw64\bin` 添加到系统 PATH

#### 步骤 2：设置环境变量

```powershell
# 设置 CGO 启用
$env:CGO_ENABLED = "1"

# 或者永久设置（管理员权限）
setx CGO_ENABLED "1"
```

#### 步骤 3：重新编译

```powershell
# 清理旧文件
Remove-Item -Recurse -Force bin -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path bin

# 重新编译（启用 CGO）
$env:CGO_ENABLED = "1"
go build -o bin/file-batch-tool.exe cmd/main.go
```

#### 步骤 4：安装 WebView2（如果需要）

Fyne 2.7+ 可能需要 WebView2 运行时：

1. 访问：https://developer.microsoft.com/en-us/microsoft-edge/webview2/
2. 下载 **WebView2 Runtime**（Bootstrapper**
3. 运行安装程序

---

### 方案三：使用 fyne-cross 交叉编译（高级）

安装 fyne 工具：

```powershell
go install fyne.io/fyne/v2/cmd/fyne@latest
```

然后打包：

```powershell
# 打包 Windows
fyne package -os windows -name "FileBatchTool"
```

---

## 快速诊断

运行诊断脚本检查环境：

```powershell
.\diagnose.ps1
```

这将检查：
- Go 环境
- CGO 设置
- GCC 安装
- WebView2 运行时
- OpenGL 支持

---

## 验证修复

### 验证 CLI 版本（无需依赖：

```powershell
# 测试 CLI 版本
go run cmd/cli_main.go
```

### 验证 GUI 版本：

```powershell
# 确保 CGO 启用
$env:CGO_ENABLED = "1"

# 重新编译
go build -o bin\file-batch-tool.exe cmd\main.go

# 运行
.\bin\file-batch-tool.exe
```

---

## 常见错误对照表

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| "此文件无法在你的电脑上运行" | 缺少运行时依赖 | 安装 GCC + 重新编译 |
| 程序闪退 | OpenGL/WebView2 问题 | 安装 WebView2 运行时 |
| 编译时 `undefined | CGO 未启用 | 设置 `CGO_ENABLED=1` |
| 运行时无响应 | 图形驱动问题 | 更新显卡驱动 |

---

## 技术说明

### 为什么需要这些依赖？

1. **GCC (CGO)**: Fyne 使用 CGO 调用系统图形 API
2. **WebView2**: 现代 Fyne 版本使用 WebView2 渲染部分 UI
3. **OpenGL**: 用于硬件加速图形渲染

### CLI 版本不依赖这些，所以可以直接运行。

---

## 联系方式

如果问题仍然存在：
1. 运行 `.\diagnose.ps1` 查看详细诊断信息
2. 确认使用 CLI 版本作为临时解决方案
3. 考虑升级到 Windows 10/11 最新版本
