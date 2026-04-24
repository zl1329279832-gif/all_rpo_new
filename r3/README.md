# 本地文件批量处理工具

一个基于 Go 1.22+ 和 Fyne 框架开发的 Windows 桌面应用程序，用于高效处理本地文件批量操作。

## 功能特性

- ✅ **文件夹扫描**: 快速扫描指定目录及其子目录
- 📁 **文件类型筛选**: 按扩展名过滤文件
- 🔄 **批量重命名**: 支持前缀+编号模式重命名
- 📋 **批量复制/移动**: 批量复制或移动文件到指定目录
- 🔍 **重复文件检测**: 基于 MD5 哈希检测重复文件
- 📊 **处理日志**: 实时记录和展示操作日志
- 📈 **任务进度**: 可视化进度条展示处理进度
- ⚠️ **操作确认**: 重要操作前二次确认
- ❌ **错误提示**: 友好的错误提示和结果统计
- ⚙️ **配置管理**: 支持本地配置文件保存用户偏好

## 项目结构

```
file-batch-tool/
├── cmd/
│   └── main.go              # 程序入口
├── internal/
│   ├── app/
│   │   └── app.go           # 应用主逻辑和 UI
│   ├── service/
│   │   ├── config_service.go # 配置管理服务
│   │   └── file_service.go  # 文件处理服务
│   ├── model/
│   │   └── models.go        # 数据模型定义
│   └── utils/
│       ├── file_utils.go    # 文件工具函数
│       └── logger.go        # 日志工具
├── config/
│   └── config.yaml          # 默认配置文件
├── logs/                    # 日志目录
├── tmp/                     # 临时文件目录
├── go.mod                   # Go 模块文件
├── go.sum                   # 依赖版本锁定
├── .gitignore               # Git 忽略文件
└── README.md                # 项目说明文档
```

## 开发环境要求

- **Go**: 1.22 或更高版本
- **操作系统**: Windows (推荐 Windows 10/11)
- **编译器**: gcc (用于 Fyne 编译，可选但推荐)

## 安装与运行

### 1. 安装依赖

```bash
# 下载并安装依赖
go mod tidy
```

### 2. 开发模式运行

```bash
go run cmd/main.go
```

### 3. 编译生成 EXE 文件

#### 方式一：直接编译

```bash
# 编译 Windows EXE（基础版本）
go build -ldflags "-s -w" -o bin/file-batch-tool.exe cmd/main.go
```

#### 方式二：使用 Fyne 打包（推荐，带图标）

首先安装 fyne 命令工具：

```bash
go install fyne.io/fyne/v2/cmd/fyne@latest
```

然后打包：

```bash
# 打包为 Windows EXE
fyne package -os windows -icon icon.png -name "文件批量处理工具"

# 或者使用交叉编译（如果需要）
fyne-cross windows -arch=amd64
```

## 使用说明

### 基本操作流程

1. **选择目录**: 点击工具栏的文件夹图标或输入框右侧的"浏览"按钮
2. **设置过滤**: 在"文件类型"输入框中输入需要的文件类型（如: `txt,jpg,png`）
3. **开始扫描**: 点击"开始扫描"按钮扫描目录
4. **选择文件**: 在文件列表中勾选需要处理的文件
5. **执行操作**: 切换到对应的功能标签页执行批量操作

### 功能说明

#### 批量重命名
- 输入文件名前缀（如: `photo_`）
- 设置起始编号（如: `1`）
- 点击"开始重命名"

#### 复制/移动文件
- 选择目标目录
- 点击"批量复制"或"批量移动"

#### 重复文件检测
- 点击"检测重复文件"按钮
- 查看检测结果（基于文件内容 MD5）

### 配置文件

配置文件位于 `config/config.yaml`，包含以下设置：

```yaml
default_scan_dir: ""          # 默认扫描目录
exclude_dirs:                 # 排除的目录
  - .git
  - node_modules
default_file_types:           # 默认文件类型
  - txt
  - jpg
  - png
log_path: logs/app.log        # 日志文件路径
theme: light                  # 主题
```

## 测试

### 基础功能测试

1. 启动应用：`go run cmd/main.go`
2. 创建测试目录和文件
3. 测试各功能模块是否正常工作

### 编译测试

```bash
# 编译测试
go build -o test.exe cmd/main.go

# 运行编译后的程序
./test.exe
```

## 依赖说明

- **fyne.io/fyne/v2**: 跨平台 GUI 框架
- **gopkg.in/yaml.v3**: YAML 配置文件解析

## 常见问题

### Q: 编译失败提示缺少 gcc？
A: Fyne 需要 CGO 支持，请安装 TDM-GCC 或 MinGW-w64 并配置环境变量。

### Q: 如何添加自定义图标？
A: 准备一个 PNG 格式的图标文件，使用 `fyne package -icon your-icon.png` 命令打包。

### Q: 程序可以在其他 Windows 电脑运行吗？
A: 可以，编译后的 EXE 文件可以直接在 Windows 系统运行，无需安装 Go 环境。

## 许可证

MIT License

## 作者

本地文件批量处理工具开发团队
