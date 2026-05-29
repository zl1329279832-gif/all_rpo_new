# 摄影工作室订单管理系统

基于 Python + PySide6 + SQLite 的桌面端摄影工作室订单管理软件。

## 功能概览

- **订单管理**: 创建/编辑/删除订单，跟踪客户、套餐、摄影师、预约日期、金额和状态
- **日历预约**: 可视化日历查看预约，检测摄影师档期冲突
- **缩略图墙**: 导入照片自动生成缩略图，可视化浏览素材
- **选片管理**: 客户选片标记、精修状态管理、批量操作
- **条件搜索**: 按关键词、状态、摄影师、日期范围搜索
- **付款跟踪**: 多次付款记录，自动更新付款状态
- **售后备注**: 为订单添加售后记录
- **交付文件**: 记录交付文件，检查文件丢失
- **导出清单**: 导出交付清单（xlsx/csv/json）
- **数据备份**: 数据库备份与恢复
- **误删恢复**: 软删除机制，支持恢复误删记录

## 业务约束

- 摄影师同一时段不可重复预约（档期冲突检测）
- 重复素材导入自动跳过（基于文件哈希）
- 未结清订单不可标记为"已完成"
- 文件丢失检测与提示
- 误删记录可从回收站恢复

## 项目结构

```
r45/
├── main.py                  # 程序入口
├── requirements.txt         # 依赖
├── .gitignore
├── database/                # 数据库模块
│   ├── db_manager.py        # 数据库管理器
│   └── models.py            # 数据模型
├── services/                # 服务模块
│   ├── order_service.py     # 订单服务（业务逻辑）
│   ├── file_index_service.py # 文件索引服务
│   ├── thumbnail_service.py  # 缩略图管理
│   └── export_backup_service.py # 导出与备份
├── ui/                      # 界面模块
│   ├── main_window.py       # 主窗口
│   ├── order_nav_panel.py   # 订单导航
│   ├── calendar_widget.py   # 日历组件
│   ├── detail_editor.py     # 详情编辑
│   ├── thumbnail_wall.py    # 缩略图墙
│   ├── photo_selector.py    # 选片管理
│   ├── search_dialog.py     # 搜索对话框
│   ├── delivery_export.py   # 导出备份界面
│   ├── manage_dialogs.py    # 管理对话框
│   └── styles.py            # 样式
├── utils/                   # 配置模块
│   └── __init__.py          # 全局配置
├── demo/                    # 演示数据
│   └── seed_data.py         # 种子数据脚本
├── thumbnails/              # 缩略图目录（自动生成）
├── exports/                 # 导出清单目录
├── backups/                 # 备份目录
└── logs/                    # 日志目录
```

## 快速开始

### 1. 环境准备

```bash
# 确保已安装 Python 3.10+
python --version

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 2. 初始化演示数据

```bash
python demo/seed_data.py
```

这将创建 5 个客户、6 个套餐、3 个摄影师和 10 个示例订单。

### 3. 启动应用

```bash
python main.py
```

### 4. 使用流程

1. **新建订单**: 点击左侧"新建订单"按钮，填写客户、套餐、摄影师和预约信息
2. **查看日历**: 左下方日历绿色标记日期表示有预约，点击查看当日详情
3. **导入照片**: 选择订单后切换到"缩略图墙"标签，点击"导入照片"
4. **选片标记**: 在缩略图墙中点击照片切换选片状态，或使用"选片管理"批量操作
5. **付款记录**: 在"订单详情"的"付款记录"标签添加付款
6. **导出清单**: 切换到"导出与备份"标签，选择格式后导出
7. **数据备份**: 在"导出与备份"中点击"立即备份数据库"

## 打包说明

### 使用 PyInstaller 打包

```bash
# 安装 PyInstaller
pip install pyinstaller

# 打包为单文件可执行程序
pyinstaller --name "摄影工作室订单管理" --windowed --onefile `
  --add-data "utils;utils" `
  --add-data "database;database" `
  --add-data "services;services" `
  --add-data "ui;ui" `
  --add-data "assets;assets" `
  main.py

# 打包结果在 dist/ 目录下
```

### 注意事项

- 打包后首次运行会自动创建数据库文件 `studio.db`
- 缩略图目录 `thumbnails/`、导出目录 `exports/`、备份目录 `backups/` 会在运行时自动创建
- 如果使用 `--onefile` 模式，运行时需要将内嵌资源解压到临时目录，可能影响启动速度
- 推荐使用 `--onedir` 模式以获得更好的性能

### 使用 Nuitka 打包（可选）

```bash
pip install nuitka

nuitka --standalone --onefile --windows-disable-console `
  --enable-plugin=pyside6 `
  --output-dir=dist `
  main.py
```

## 技术栈

- **Python 3.10+**: 编程语言
- **PySide6**: Qt6 Python 绑定，构建桌面界面
- **SQLite**: 嵌入式数据库，WAL 模式提升并发性能
- **Pillow**: 图片处理，生成缩略图
- **openpyxl**: Excel 文件导出
