# code-analyzer - 项目代码行数统计与文件分析 CLI 工具

一个功能丰富的命令行工具，用于统计项目代码行数和分析文件结构。

## 功能特性

- **多语言支持**: 支持 Python, JavaScript, TypeScript, Java, C/C++, Go, Rust, PHP 等 20+ 编程语言
- **详细统计**: 统计文件数量、代码行数、注释行数、空行数
- **智能分析**: 识别最大文件、最近修改文件、行数最多的文件
- **美化输出**: 使用 Rich 库提供精美的表格、进度条和树状文件列表
- **多种导出**: 支持 JSON 和 CSV 格式导出
- **灵活配置**: 支持自定义忽略目录、文件模式和扩展名过滤

## 安装

### 依赖

- Python 3.11+
- typer >= 0.12.0
- rich >= 13.7.0

### 安装方式

```bash
# 方式 1: 使用 pip 安装依赖
pip install typer rich

# 方式 2: 开发模式安装项目
pip install -e .
```

## 使用方法

### 基本命令格式

```bash
# 方式 1: 使用 python -m 运行
python -m code_analyzer [命令] [选项]

# 方式 2: 安装后直接运行
code-analyzer [命令] [选项]
```

### 可用命令

| 命令 | 说明 |
|------|------|
| `scan` | 扫描项目并显示完整分析结果（摘要 + 文件列表） |
| `summary` | 仅显示项目统计摘要（简洁模式） |
| `export` | 将分析结果导出为 JSON 或 CSV 格式 |

### 全局选项

| 选项 | 短选项 | 说明 |
|------|--------|------|
| `--help` | | 显示帮助信息 |
| `--version` | `-v` | 显示版本信息 |

---

## 命令详解

### 1. scan - 完整扫描

扫描项目并显示完整分析结果。

**用法:**
```bash
python -m code_analyzer scan <项目路径> [选项]
```

**选项:**

| 选项 | 短选项 | 说明 | 默认值 |
|------|--------|------|--------|
| `--ignore-dir <目录>` | `-i` | 额外忽略的目录名称（可多次指定） | - |
| `--ignore-pattern <模式>` | `-p` | 额外忽略的文件匹配模式（可多次指定） | - |
| `--ext <扩展名>` | `-e` | 仅分析指定扩展名的文件（可多次指定） | 所有支持的语言 |
| `--quiet` | `-q` | 静默模式，不显示进度条 | False |
| `--files` | `-f` | 显示文件列表 | False |
| `--limit <数量>` | `-n` | 文件列表显示数量限制 | 50 |

**示例:**

```bash
# 基本扫描
python -m code_analyzer scan /path/to/project

# 扫描并显示文件列表
python -m code_analyzer scan /path/to/project --files

# 扫描并限制文件列表显示数量
python -m code_analyzer scan /path/to/project --files --limit 100

# 忽略额外的目录
python -m code_analyzer scan /path/to/project --ignore-dir tests --ignore-dir docs

# 仅分析 Python 文件
python -m code_analyzer scan /path/to/project --ext py

# 分析多种语言文件
python -m code_analyzer scan /path/to/project --ext py --ext ts --ext js

# 静默模式
python -m code_analyzer scan /path/to/project --quiet
```

---

### 2. summary - 摘要模式

仅显示项目统计摘要（更简洁的输出）。

**用法:**
```bash
python -m code_analyzer summary <项目路径> [选项]
```

**选项:**

| 选项 | 短选项 | 说明 | 默认值 |
|------|--------|------|--------|
| `--ignore-dir <目录>` | `-i` | 额外忽略的目录名称（可多次指定） | - |
| `--ignore-pattern <模式>` | `-p` | 额外忽略的文件匹配模式（可多次指定） | - |
| `--ext <扩展名>` | `-e` | 仅分析指定扩展名的文件（可多次指定） | 所有支持的语言 |
| `--quiet` | `-q` | 静默模式，不显示进度条 | False |

**示例:**

```bash
# 显示统计摘要
python -m code_analyzer summary /path/to/project

# 分析特定语言
python -m code_analyzer summary /path/to/project --ext py
```

---

### 3. export - 导出数据

将分析结果导出为 JSON 或 CSV 格式。

**用法:**
```bash
python -m code_analyzer export <项目路径> --output <输出路径> --format <格式> [选项]
```

**选项:**

| 选项 | 短选项 | 说明 | 默认值 |
|------|--------|------|--------|
| `--output <路径>` | `-o` | 导出文件路径（必需） | - |
| `--format <格式>` | `-f` | 导出格式: `json` 或 `csv` | `json` |
| `--ignore-dir <目录>` | `-i` | 额外忽略的目录名称（可多次指定） | - |
| `--ignore-pattern <模式>` | `-p` | 额外忽略的文件匹配模式（可多次指定） | - |
| `--ext <扩展名>` | `-e` | 仅分析指定扩展名的文件（可多次指定） | 所有支持的语言 |
| `--quiet` | `-q` | 静默模式，不显示进度条 | False |

**示例:**

```bash
# 导出为 JSON
python -m code_analyzer export /path/to/project -o result -f json

# 导出为 CSV（会生成两个文件）
python -m code_analyzer export /path/to/project -o result -f csv

# 指定完整输出路径
python -m code_analyzer export /path/to/project -o ./reports/analysis.json

# 导出特定语言的统计数据
python -m code_analyzer export /path/to/project -o result -f json --ext py
```

**CSV 导出说明:**

导出 CSV 格式时会生成两个文件：
- `<文件名>_summary.csv` - 摘要统计（总览、按语言统计、特殊文件）
- `<文件名>_files.csv` - 每个文件的详细统计

---

## 输出示例

### 运行 `scan` 命令的典型输出：

```
────────────────────────────────── 项目代码统计摘要 ──────────────────────────────────

                总览统计
+----------------------+
| 指标      |      数值 |
|-----------+-----------|
| 项目路径  |         . |
| 文件总数  |       125 |
| 总行数    |    15,678 |
| 代码行数  |    12,345 |
| 注释行数  |     1,234 |
| 空行数    |     2,099 |
| 总大小    | 567.89 KB |
+----------------------+

               代码比例
+---------------------------------------------------------------+
| 类型 | 比例  | 进度条                                         |
|------+-------+------------------------------------------------|
| 代码 | 78.7% | ###############################--------- 78.7% |
| 注释 |  7.9% | ###-------------------------------------  7.9% |
| 空行 | 13.4% | #####----------------------------------- 13.4% |
+---------------------------------------------------------------+

              按语言统计
+---------------------------------------------------------------+
| 语言       | 文件数 | 总行数 | 代码行 | 注释行 | 空行 | 大小 |
|------------+--------+--------+--------+--------+------+------|
| Python     |     85 | 12,456 | 10,234 |    876 | 1346 | 456  |
| JavaScript |     30 |  2,890 |  1,890 |    280 |  720 |  98  |
| CSS        |     10 |    332 |    221 |     78 |   33 |  14  |
+---------------------------------------------------------------+

               特殊文件
+--------------------------------------------------------+
| 类别     | 文件                  | 详情                |
|----------+-----------------------+---------------------|
| 最大文件 | src/main.py           | 89.45 KB            |
| 最近修改 | src/utils/helper.py   | 2024-05-15 14:30:22 |
| 行数最多 | src/core/engine.py    | 1,234 行            |
+--------------------------------------------------------+
```

---

## 支持的编程语言

| 语言 | 扩展名 |
|------|--------|
| Python | `.py`, `.pyw` |
| JavaScript | `.js`, `.jsx` |
| TypeScript | `.ts`, `.tsx` |
| HTML | `.html`, `.htm` |
| CSS | `.css`, `.scss`, `.sass`, `.less` |
| Java | `.java` |
| C/C++ | `.c`, `.cpp`, `.cc`, `.h`, `.hpp`, `.hh` |
| C# | `.cs` |
| Go | `.go` |
| Rust | `.rs` |
| PHP | `.php` |
| Ruby | `.rb` |
| Swift | `.swift` |
| Kotlin | `.kt`, `.kts` |
| Shell | `.sh`, `.bash`, `.zsh` |
| PowerShell | `.ps1`, `.psm1`, `.psd1` |
| SQL | `.sql` |
| YAML | `.yaml`, `.yml` |
| JSON | `.json` |
| XML | `.xml` |
| Markdown | `.md`, `.markdown` |
| Text | `.txt` |

---

## 忽略规则

### 默认忽略的目录

```
.venv, venv, __pycache__, dist, build, .git, .idea, .vscode,
node_modules, target, .eggs, .pytest_cache, .mypy_cache, .tox, logs
```

### 默认忽略的文件模式

```
*.egg-info, *.pyc, *.pyo, *.pyd, .Python, *.egg, *.log, *.swp, *.swo
```

### .gitignore 配置

项目包含 `.gitignore` 文件，会忽略：
- 虚拟环境 (`__pycache__/`, `.venv/`)
- 构建产物 (`dist/`, `build/`, `*.egg-info`)
- Python 字节码 (`*.pyc`, `*.pyo`, `*.pyd`)
- IDE 配置 (`.idea/`, `.vscode/`)
- 临时文件 (`*.swp`, `*.swo`, `*.log`)

---

## 项目结构

```
r24/
├── .gitignore              # Git 忽略规则
├── README.md               # 本文件
├── pyproject.toml          # 项目配置和依赖
└── code_analyzer/
    ├── __init__.py         # 包初始化
    ├── __main__.py         # 模块入口（支持 python -m code_analyzer）
    ├── models.py           # 数据模型定义
    ├── scanner.py          # 文件扫描器
    ├── analyzer.py         # 文件分析器
    ├── exporter.py         # 导出器（JSON/CSV）
    └── main.py             # CLI 入口
```

---

## 许可证

MIT License
