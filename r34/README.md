# 企业文档治理自动化工具

Enterprise Document Governance Auto Processor - 具备可追踪、可恢复和智能识别能力的企业文档批处理治理程序。

## 版本信息

- **当前版本**: 2.0.0
- **前一版本**: 1.0.0（基础批处理功能）

## 功能特性

### 核心功能（保留自 v1.0）

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

### ✨ 新增功能（v2.0）

#### 🔍 批次追踪与持久化
- **唯一批次编号**: 每次处理任务生成 `BATCH_YYYYMMDD_HHMMSS_UUID8` 格式的唯一编号
- **SQLite 持久化**: 保存文件原路径、目标路径、哈希值、元数据、处理状态和失败原因
- **历史查询**: 支持查询所有批次、查看批次详情、列出失败文件

#### 🎯 重复文件检测
- **SHA-256 哈希**: 完整哈希计算确保准确性
- **快速哈希模式**: 大文件采样哈希（头部 + 尾部 + 文件大小）
- **三种去重策略**:
  - `skip`: 跳过重复文件，保留第一个处理的文件
  - `keep_copy`: 保留副本，自动添加 `_copy1`, `_copy2` 后缀
  - `move_to_duplicate_area`: 移动到重复文件专区

#### 📝 OCR 智能识别
- **扫描版 PDF 识别**: 支持将扫描版 PDF 转换为文本
- **图片识别**: 支持 JPG、PNG、TIFF 等图片格式的 OCR
- **关键字提取**: 自动从识别文本中提取：
  - 项目编号（`PRJ-1234`, `PROJ_ABC567`, `项目123`）
  - 合同编号（`HT-2024-001`, `合同ABC123`, `Contract No.`）
  - 日期（`2024-01-15`, `20240115`, `2024年1月15日`）
- **优雅降级**: OCR 依赖缺失时自动禁用并提示

#### 📋 操作清单与完整性
- **Manifest 清单**: 所有实际移动与重命名操作生成 JSON 格式清单
- **哈希校验**: 清单自带 SHA-256 完整性校验，防止篡改
- **清单验证**: 支持独立命令验证清单完整性

#### ↩️ 安全回滚
- **按批次回滚**: 根据批次编号安全撤销归档操作
- **冲突检测**: 回滚前检查目标位置文件状态：
  - 相同内容（SHA-256 匹配）: 自动跳过
  - 不同内容: 禁止覆盖，生成冲突报告
- **空目录清理**: 回滚后自动清理空目录
- **回滚报告**: 生成详细的回滚操作报告

#### 📊 管理命令
- `history list`: 列出所有处理批次
- `history show`: 查看批次详细信息
- `history failed`: 查看批次失败文件
- `rollback`: 按批次撤销操作
- `retry`: 重试批次中的失败任务
- `export`: 导出处理结果（JSON/CSV）
- `validate-config`: 校验配置文件
- `verify-manifest`: 验证操作清单完整性
- `init-db`: 初始化数据库

## 项目结构

```
doc_auto_processor/
├── __init__.py           # 包初始化，导出所有公共接口
├── cli.py                # 命令行接口（多命令架构）
├── models.py             # 数据模型定义（枚举和数据类）
├── logger.py             # 日志模块
├── scanner.py            # 文件扫描模块
├── rules.py              # 规则引擎和元数据提取
├── executor.py           # 执行器（核心处理逻辑）
├── reporter.py           # 报告生成模块
│
├── indexer.py            # ✨ SQLite 数据库管理（新增）
├── deduplicator.py       # ✨ SHA-256 重复文件检测（新增）
├── ocr.py                # ✨ OCR 文本提取与关键字解析（新增）
├── manifest.py           # ✨ 操作清单生成与校验（新增）
├── history.py            # ✨ 历史查询与结果导出（新增）
└── rollback.py           # ✨ 批次回滚与冲突检测（新增）

tests/                    # ✨ 单元测试和异常场景测试（新增）
├── __init__.py
├── conftest.py           # pytest 配置和 fixtures
├── test_models.py        # 数据模型测试
├── test_indexer.py       # 数据库模块测试
├── test_deduplicator.py  # 去重模块测试
├── test_ocr.py           # OCR 模块测试
├── test_manifest.py      # 清单模块测试
├── test_history.py       # 历史管理测试
├── test_rollback.py      # 回滚模块测试
├── test_cli.py           # CLI 命令测试
└── test_exception_scenarios.py  # 异常场景测试
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

#### OCR 可选依赖（启用 OCR 功能时需要）

```bash
# 1. 安装 Python 包
pip install pytesseract pdf2image

# 2. 安装系统依赖
# Windows:
#   - 安装 Tesseract OCR: https://github.com/UB-Mannheim/tesseract/wiki
#   - 安装 Poppler: https://github.com/oschwartz10612/poppler-windows/releases
#   - 将 Tesseract 和 Poppler 添加到 PATH
#
# macOS:
#   brew install tesseract poppler
#
# Linux:
#   sudo apt-get install tesseract-ocr tesseract-ocr-chi-sim poppler-utils
```

### 2. 初始化数据库（可选，首次运行自动创建）

```bash
doc-processor init-db
```

或指定数据库路径：

```bash
doc-processor init-db --db-path ./.doc_processor/index.db
```

### 3. 基本使用

```bash
# 扫描并处理 ./documents 目录
doc-processor process ./documents

# 试运行模式
doc-processor process ./documents --dry-run

# 启用去重和 OCR
doc-processor process ./documents --deduplicate --enable-ocr
```

## 命令行参考

### 全局选项

```
--log-level [DEBUG|INFO|WARNING|ERROR|CRITICAL]  # 日志级别，默认 INFO
--log-dir PATH                                   # 日志输出目录
```

### process 命令（核心处理）

```bash
doc-processor process [OPTIONS] SOURCE_DIR

选项:
  -c, --config PATH               # 规则配置文件路径
  -t, --target-dir PATH           # 归档目标目录
  --dry-run                       # 试运行模式，不实际修改文件
  --safe-preview                  # 安全预览模式，仅显示处理计划
  --recursive / --no-recursive    # 是否递归扫描子目录，默认 True
  --include-hidden                # 包含隐藏文件，默认 False
  --conflict [skip|rename|overwrite]  # 冲突处理策略，默认 rename
  --archive-strategy [date|project|type|none]  # 归档策略，默认 date
  --max-retries INTEGER           # 失败最大重试次数，默认 3
  --report-format [text|json|csv|html]  # 报告格式，默认 text
  --report-dir PATH               # 报告输出目录，默认 ./reports
  --no-report                     # 不生成处理报告
  --file-types TEXT               # 指定处理的文件类型，逗号分隔
  --rename-pattern TEXT           # 自定义重命名模板
  --preserve-original / --no-preserve-original  # 保留原始文件，默认 True
  --no-progress                   # 不显示进度条

  # ✨ 新增选项
  --deduplicate                   # 启用重复文件检测
  --duplicate-strategy [skip|keep_copy|move_to_duplicate_area]  # 去重策略
  --fast-hash                     # 使用快速哈希（大文件推荐）
  --enable-ocr                    # 启用 OCR 文本提取
  --ocr-languages TEXT            # OCR 语言，默认 chi_sim+eng
  --no-persistence                # 禁用 SQLite 持久化
```

### history 命令（历史管理）

```bash
# 列出所有批次
doc-processor history list [--limit N] [--status STATUS]

# 查看批次详情
doc-processor history show BATCH_ID

# 查看批次失败文件
doc-processor history failed BATCH_ID
```

### rollback 命令（安全回滚）

```bash
doc-processor rollback [OPTIONS] BATCH_ID

选项:
  --dry-run           # 试运行回滚，不实际修改文件
  --simulate          # 仅模拟并显示回滚计划
  --max-retries INT   # 最大重试次数，默认 3
```

### retry 命令（失败重试）

```bash
doc-processor retry [OPTIONS] BATCH_ID

选项:
  --dry-run           # 试运行，不实际修改文件
  --max-retries INT   # 最大重试次数，默认 3
```

### export 命令（结果导出）

```bash
doc-processor export [OPTIONS] BATCH_ID

选项:
  -o, --output-dir PATH   # 输出目录，默认 ./exports
  -f, --format [json|csv]  # 导出格式，默认 json
  --include-ocr           # 包含 OCR 文本
```

### validate-config 命令（配置校验）

```bash
doc-processor validate-config [OPTIONS] CONFIG_PATH

选项:
  --show              # 显示完整的配置详情
```

### verify-manifest 命令（清单验证）

```bash
doc-processor verify-manifest MANIFEST_PATH
```

### init-db 命令（数据库初始化）

```bash
doc-processor init-db [OPTIONS]

选项:
  --db-path PATH      # 数据库路径，默认 ./.doc_processor/index.db
  --force             # 强制重置数据库（删除现有数据）
```

## 常用场景示例

### 1. 完整文档治理流程

```bash
# 1. 校验配置文件
doc-processor validate-config config.example.yaml --show

# 2. 试运行并启用去重和 OCR
doc-processor process ./documents \
  --target-dir ./archive \
  --deduplicate \
  --duplicate-strategy move_to_duplicate_area \
  --enable-ocr \
  --dry-run

# 3. 实际执行
doc-processor process ./documents \
  --target-dir ./archive \
  --deduplicate \
  --duplicate-strategy move_to_duplicate_area \
  --enable-ocr
```

### 2. 批次管理

```bash
# 查看历史批次
doc-processor history list

# 查看批次详情
doc-processor history show BATCH_20240101_120000_ABC12345

# 查看失败文件
doc-processor history failed BATCH_20240101_120000_ABC12345

# 导出处理结果
doc-processor export BATCH_20240101_120000_ABC12345 --format csv
```

### 3. 回滚操作

```bash
# 模拟回滚（不实际修改）
doc-processor rollback BATCH_20240101_120000_ABC12345 --dry-run

# 实际回滚
doc-processor rollback BATCH_20240101_120000_ABC12345
```

### 4. 重试失败任务

```bash
# 重试批次中的失败任务
doc-processor retry BATCH_20240101_120000_ABC12345

# 试运行重试
doc-processor retry BATCH_20240101_120000_ABC12345 --dry-run
```

### 5. 清单验证

```bash
# 验证操作清单完整性
doc-processor verify-manifest ./manifests/BATCH_20240101_120000_ABC12345_manifest.json
```

## 配置文件说明

参考 [config.example.yaml](config.example.yaml)，复制为 `config.yaml` 或 `config.local.yaml` 后进行自定义。

### ✨ 新增配置段

#### deduplication（重复文件检测）

```yaml
deduplication:
  enabled: true
  strategy: "skip"                    # skip | keep_copy | move_to_duplicate_area
  duplicate_area_dir: "./_duplicates"
  fast_hash: false
  fast_hash_sample_size: 1048576      # 1MB
```

#### ocr（文本识别）

```yaml
ocr:
  enabled: false
  languages: "chi_sim+eng"
  confidence_threshold: 60
  pdf_dpi: 300
  temp_dir: "./ocr_temp"
  cache_results: true
```

#### persistence（持久化）

```yaml
persistence:
  enabled: true
  db_path: "./.doc_processor/index.db"
  auto_manifest: true
  manifest_dir: "./manifests"
  export_history_on_completion: false
```

#### extraction（提取规则扩展）

```yaml
extraction:
  project_code_pattern: "(?:PRJ|PROJ|项目)[-_]?([A-Za-z0-9]{4,})"
  project_code_default: "DEFAULT"
  contract_code_pattern: "(?:HT|合同|Contract)[-_]?([A-Za-z0-9-]{6,})"
  date_patterns:
    - "\\d{4}[-_]\\d{2}[-_]\\d{2}"
    - "\\d{4}\\d{2}\\d{2}"
    - "\\d{4}年\\d{1,2}月\\d{1,2}日"
```

## 安全特性

1. **默认不删除原始文件**: `preserve_original: true` 确保原始文件被复制而非移动
2. **回滚不覆盖**: 遇到目标位置已存在不同内容的文件时，禁止覆盖并报告
3. **日志脱敏**: 关键操作日志中不泄露敏感内容（如完整文件路径可配置脱敏）
4. **Manifest 完整性**: 所有操作清单自带 SHA-256 哈希校验，防止篡改
5. **事务支持**: 数据库操作支持事务，异常时自动回滚
6. **优雅降级**: OCR、数据库等依赖缺失时自动降级，不影响核心功能

## 测试

### 运行单元测试

```bash
# 安装测试依赖
pip install pytest pytest-cov

# 运行所有测试
pytest tests/ -v

# 运行特定模块测试
pytest tests/test_deduplicator.py -v
pytest tests/test_rollback.py -v

# 生成覆盖率报告
pytest tests/ --cov=doc_auto_processor --cov-report=html
```

### 异常场景测试

项目包含专门的异常场景测试，覆盖：
- 文件锁定/占用
- 权限不足
- 磁盘 IO 错误
- 文件中途删除
- 数据库锁定
- 清单篡改
- 回滚冲突
- 配置错误

## 支持的文件类型

| 类型 | 扩展名 | OCR 支持 |
|------|--------|----------|
| PDF | `.pdf` | ✅ 扫描版支持 |
| Word | `.doc`, `.docx`, `.docm`, `.dotx`, `.dotm` | ❌ |
| Excel | `.xls`, `.xlsx`, `.xlsm`, `.xlsb`, `.xltx`, `.xltm`, `.csv` | ❌ |
| 图片 | `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.tiff`, `.tif`, `.webp` | ✅ |

## 退出码

| 退出码 | 说明 |
|--------|------|
| `0` | 所有文件处理成功 |
| `1` | 有文件处理失败或程序错误 |
| `2` | 命令行参数错误 |
| `130` | 用户中断（Ctrl+C） |

## 日志

- 控制台输出（彩色）+ 可选文件输出（轮转日志，10MB × 5）
- 支持 5 个级别：DEBUG < INFO < WARNING < ERROR < CRITICAL
- 日志格式: `时间 | 级别 | 消息`

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
- **cli.py**: Click 多命令架构，参数解析，流程编排
- **indexer.py**: ✨ SQLite 单例数据库，批次和文档持久化
- **deduplicator.py**: ✨ SHA-256 哈希计算，重复检测，三种策略处理
- **ocr.py**: ✨ Tesseract OCR 封装，关键字提取，优雅降级
- **manifest.py**: ✨ 操作清单生成、加载、完整性校验
- **history.py**: ✨ 批次查询、统计、结果导出（JSON/CSV）
- **rollback.py**: ✨ 按批次回滚，SHA-256 冲突检测，回滚报告

## 数据存储

### SQLite 数据库结构

#### batches 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PRIMARY KEY | 主键 |
| batch_id | TEXT UNIQUE | 批次编号 |
| status | TEXT | 批次状态 |
| source_dir | TEXT | 源目录 |
| target_dir | TEXT | 目标目录 |
| start_time | TEXT | 开始时间 |
| end_time | TEXT | 结束时间 |
| total_files | INTEGER | 总文件数 |
| success_count | INTEGER | 成功数 |
| failed_count | INTEGER | 失败数 |
| dry_run | INTEGER | 是否试运行 |
| config_hash | TEXT | 配置哈希 |
| manifest_path | TEXT | 清单路径 |
| notes | TEXT | 备注 |

#### documents 表

包含 25+ 字段，记录每个文件的完整处理历史，包括：
- 源路径、目标路径
- SHA-256 哈希值
- 完整元数据
- 处理状态和时间戳
- 失败原因
- OCR 状态和文本
- 重复关联信息

## 许可证

MIT License
