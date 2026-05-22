# 企业文档批处理自动化工具

Enterprise Document Auto Processor - 自动化扫描、识别、重命名和归档企业文档。

## 功能特性

- **智能扫描**: 支持递归扫描指定目录，识别 PDF、Word、Excel 和图片文件
- **元数据提取**: 自动提取各类文档的标题、作者、创建日期、页数等元数据
- **规则重命名**: 基于可配置模板，使用元数据自动重命名文件
- **智能归档**: 支持按日期、项目编号或文件类型自动归档
- **丰富报告**: 支持生成 text、JSON、CSV、HTML 四种格式的处理报告
- **安全可靠**:
  - `dry-run` 试运行模式，不实际修改文件
  - `safe-preview` 安全预览模式，仅显示处理计划
  - 默认保留原始文件（复制而非移动）
  - 三种冲突处理策略：跳过、自动重命名、覆盖
  - 自动重试失败操作（指数退避）
  - 优雅处理异常中断（Ctrl+C）
  - 自动跳过隐藏文件和空目录
  - 非法字符自动清理
  - 文件占用和权限检查

## 项目结构

```
doc_auto_processor/
├── __init__.py           # 包初始化
├── cli.py                # 命令行接口
├── models.py             # 数据模型定义
├── logger.py             # 日志模块
├── scanner.py            # 文件扫描模块
├── rules.py              # 规则引擎和元数据提取
├── executor.py           # 执行器（核心处理逻辑）
└── reporter.py           # 报告生成模块
```

## 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

或安装为包：

```bash
pip install -e .
```

### 2. 基本使用

```bash
# 扫描并处理 ./documents 目录
python -m doc_auto_processor.cli ./documents

# 或使用安装后的命令
doc-processor ./documents
```

### 3. 常用命令示例

#### 试运行（不实际修改文件）
```bash
doc-processor ./documents --dry-run
```

#### 安全预览（仅显示处理计划）
```bash
doc-processor ./documents --safe-preview
```

#### 使用配置文件
```bash
doc-processor ./documents --config config.example.yaml
```

#### 指定归档目标目录
```bash
doc-processor ./documents --target-dir ./archive
```

#### 按项目编号归档
```bash
doc-processor ./documents --archive-strategy project --target-dir ./archive
```

#### 处理冲突时自动跳过
```bash
doc-processor ./documents --conflict skip
```

#### 不递归扫描（仅当前目录）
```bash
doc-processor ./documents --no-recursive
```

#### 包含隐藏文件
```bash
doc-processor ./documents --include-hidden
```

#### 指定处理 PDF 和 Word 文件
```bash
doc-processor ./documents --file-types pdf,word
```

#### 自定义重命名模板
```bash
doc-processor ./documents --rename-pattern "{date}_{title}_{file_type}"
```

#### 生成 HTML 格式报告
```bash
doc-processor ./documents --report-format html --report-dir ./reports
```

#### 启用调试日志并输出到文件
```bash
doc-processor ./documents --log-level DEBUG --log-dir ./logs
```

#### 设置重试 5 次
```bash
doc-processor ./documents --max-retries 5
```

## 命令行参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `source_dir` | **必填**，要处理的源目录路径 | - |
| `--config, -c` | 规则配置文件路径（YAML格式） | - |
| `--target-dir, -t` | 归档目标目录 | - |
| `--dry-run` | 试运行模式，不实际修改文件 | `False` |
| `--safe-preview` | 安全预览模式，仅显示处理计划 | `False` |
| `--recursive/--no-recursive` | 是否递归扫描子目录 | `True` |
| `--include-hidden` | 包含隐藏文件 | `False` |
| `--conflict` | 冲突策略: skip/rename/overwrite | `rename` |
| `--archive-strategy` | 归档策略: date/project/type/none | `date` |
| `--max-retries` | 失败最大重试次数 | `3` |
| `--log-level` | 日志级别: DEBUG/INFO/WARNING/ERROR/CRITICAL | `INFO` |
| `--log-dir` | 日志输出目录 | 不输出到文件 |
| `--report-format` | 报告格式: text/json/csv/html | `text` |
| `--report-dir` | 报告输出目录 | `./reports` |
| `--no-report` | 不生成处理报告 | `False` |
| `--file-types` | 指定处理的文件类型，逗号分隔 | 全部 |
| `--rename-pattern` | 自定义重命名模板 | - |
| `--preserve-original/--no-preserve-original` | 保留原始文件（复制而非移动） | `True` |
| `--no-progress` | 不显示进度条 | `False` |

## 配置文件

参考 `config.example.yaml`，复制为 `config.yaml` 后进行自定义。

### 重命名模板变量

| 变量 | 说明 |
|------|------|
| `{project_code}` | 项目编号（从文件名或目录提取） |
| `{date}` | 文件创建日期，格式由 `date_format` 决定 |
| `{original_name}` | 原始文件名（不含扩展名） |
| `{title}` | 文档标题（从元数据提取） |
| `{file_type}` | 文件类型: pdf/word/excel/image |
| `{timestamp}` | 处理时间戳 (HHMMSS) |
| 自定义变量 | 在 `general.custom_metadata` 中定义 |

### 项目编号提取

通过正则表达式从文件名或目录路径中提取项目编号。例如：

- 文件名 `PRJ-1234_20240101_report.pdf` + 模式 `(?:PRJ|PROJ)[-_]?([A-Za-z0-9]{4,})` → 提取 `1234`
- 目录 `./PROJECT_ABC567/doc.pdf` → 从目录提取 `ABC567`

## 支持的文件类型

| 类型 | 扩展名 |
|------|--------|
| PDF | `.pdf` |
| Word | `.doc`, `.docx`, `.docm`, `.dotx`, `.dotm` |
| Excel | `.xls`, `.xlsx`, `.xlsm`, `.xlsb`, `.xltx`, `.xltm`, `.csv` |
| 图片 | `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.tiff`, `.tif`, `.webp`, `.svg`, `.heic`, `.raw`, `.psd`, `.ai` |

## 错误处理

程序会认真处理以下异常情况：

- **权限不足**: 自动检测并跳过无权限的文件/目录
- **文件占用**: 检测被其他程序占用的文件，记录错误后继续
- **重名冲突**: 三种处理策略可选，默认自动重命名
- **非法字符**: 自动清理文件名中的非法字符（`< > : " / \ | ? *` 等）
- **隐藏文件**: 默认跳过，可通过 `--include-hidden` 包含
- **空目录**: 自动识别并跳过
- **异常中断**: 捕获 Ctrl+C 等信号，安全退出并保留已完成工作
- **网络异常**: 自动重试，指数退避，最多 3 次（可配置）

## 退出码

| 退出码 | 说明 |
|--------|------|
| `0` | 所有文件处理成功 |
| `1` | 有文件处理失败或程序错误 |
| `130` | 用户中断（Ctrl+C） |

## 日志

- 控制台输出（彩色）+ 可选文件输出（轮转日志，10MB × 5）
- 支持 5 个级别：DEBUG < INFO < WARNING < ERROR < CRITICAL
- 日志格式: `时间 | 级别 | 消息`

## 报告

支持 4 种报告格式：

- **Text**: 人类可读的纯文本报告，适合快速查看
- **JSON**: 结构化数据，适合机器解析
- **CSV**: 表格格式，可直接用 Excel 打开（UTF-8 BOM 编码）
- **HTML**: 美观的网页报告，包含统计图表和详细记录

## 开发

### 运行代码检查

```bash
python -m py_compile doc_auto_processor/*.py
```

### 模块说明

- **models.py**: 定义核心数据结构（枚举和数据类）
- **logger.py**: 单例日志管理器，支持彩色输出和轮转文件
- **scanner.py**: 文件系统扫描，类型识别，隐藏文件/空目录处理
- **rules.py**: 元数据提取，规则引擎（重命名、归档、冲突解决），配置加载
- **executor.py**: 处理执行引擎，权限/占用检查，重试机制，中断处理
- **reporter.py**: 多格式报告生成器
- **cli.py**: Click 命令行接口，参数解析，流程编排

## 许可证

MIT License
