# 连锁餐饮数据分析平台

面向连锁餐饮管理人员的 Streamlit 数据分析平台，提供全方位的经营数据洞察与决策支持。

## 功能特性

### 核心功能模块

1. **📊 数据上传与校验**
   - 支持多份 CSV 文件批量上传
   - 自动字段合法性检查与类型校验
   - 缺失数据智能检测与可视化提示
   - 数据质量评分体系

2. **📈 经营概览**
   - 营业额、毛利、客单价等核心 KPI 指标
   - 同比环比趋势分析
   - 门店业绩横向对比
   - 营业时段热力图分析

3. **🍜 菜品分析**
   - 菜品销量/销售额/利润排行榜
   - 品类结构占比分析
   - 菜品利润矩阵四象限分析
   - 菜品组合关联规则挖掘

4. **👥 会员与复购**
   - RFM 客户价值模型（3D可视化）
   - 7层客户价值分层
   - 复购率分析
   - 客单价分布对比

5. **🎁 活动与退款**
   - 促销活动 ROI 分析
   - 活动效果横向对比
   - 退款原因分布分析
   - 退款金额趋势追踪

6. **⚠️ 异常检测**
   - 门店异常识别（IQR / Z-score 算法）
   - 原料成本异常监控
   - 时段异常分析
   - 多维度异常指标雷达图

7. **📄 报告导出**
   - Excel 多工作表格式报告（带格式美化）
   - HTML 专业样式报告
   - 自定义章节选择
   - 一键生成完整分析报告

### 数据覆盖范围

- **门店**：基本信息、面积、人员配置
- **菜品**：品类、价格、成本、辣度等级
- **订单**：1000条完整订单记录
- **订单明细**：每笔订单的菜品组成
- **会员**：200位会员的消费行为数据
- **优惠活动**：促销活动配置与效果
- **退款**：退款记录与原因分析
- **营业时段**：各时段经营指标
- **原料成本**：90条原料采购成本记录

## 技术架构

### 技术栈

| 类别 | 技术 | 版本要求 |
|------|------|----------|
| 前端框架 | Streamlit | ≥1.30.0 |
| 数据处理 | Pandas | ≥2.0.0 |
| 数值计算 | NumPy | ≥1.24.0 |
| 可视化 | Plotly | ≥5.18.0 |
| 统计分析 | SciPy | ≥1.10.0 |
| 机器学习 | Scikit-learn | ≥1.3.0 |
| Excel导出 | OpenPyXL, XlsxWriter | ≥3.1.0 |
| HTML模板 | Jinja2 | ≥3.1.0 |

### 项目结构

```
r36/
├── app.py                      # Streamlit 入口文件
├── requirements.txt            # 项目依赖清单
├── .gitignore                  # Git 忽略配置
├── README.md                   # 项目说明文档
├── config/                     # 配置模块
│   ├── __init__.py
│   └── schemas.py              # 数据Schema定义
├── core/                       # 核心业务模块
│   ├── __init__.py
│   ├── ingestion.py            # 数据接入层
│   ├── validation.py           # 数据校验层
│   ├── transform.py            # 数据转换层
│   ├── metrics.py              # 指标计算层
│   ├── visualization.py        # 可视化层
│   └── export.py               # 报告导出层
├── pages/                      # Streamlit 多页面
│   ├── 1_📊_数据上传与校验.py
│   ├── 2_📈_经营概览.py
│   ├── 3_🍜_菜品分析.py
│   ├── 4_👥_会员与复购.py
│   ├── 5_🎁_活动与退款.py
│   ├── 6_⚠️_异常检测.py
│   └── 7_📄_报告导出.py
├── sample_data/                # 示例数据目录
│   ├── generate_data.py        # 数据生成脚本
│   ├── stores.csv              # 门店数据
│   ├── dishes.csv              # 菜品数据
│   ├── members.csv             # 会员数据
│   ├── orders.csv              # 订单主表（1000条）
│   ├── order_items.csv         # 订单明细
│   ├── promotions.csv          # 促销活动
│   ├── refunds.csv             # 退款记录
│   ├── business_hours.csv      # 营业时段
│   └── ingredient_costs.csv    # 原料成本
├── templates/                  # 导出模板
├── exports/                    # 报告导出目录
├── uploads/                    # 用户上传目录
└── logs/                       # 运行日志目录
```

### 核心算法

1. **RFM 模型**：基于最近购买(Recency)、购买频率(Frequency)、购买金额(Monetary)的客户价值分层
2. **异常检测**：
   - IQR（四分位距）法：识别偏离1.5倍四分位距的异常值
   - Z-score 法：识别偏离均值3倍标准差的异常值
3. **关联规则**：基于支持度计算的菜品组合挖掘
4. **统计检验**：使用 SciPy 进行显著性检验

## 快速开始

### 环境要求

- Python 3.9+
- pip 包管理工具

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd r36
   ```

2. **创建虚拟环境（推荐）**
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # Linux/Mac
   source venv/bin/activate
   ```

3. **安装依赖**
   ```bash
   pip install -r requirements.txt
   ```

4. **生成示例数据**
   ```bash
   python sample_data/generate_data.py
   ```

5. **启动应用**
   ```bash
   streamlit run app.py
   ```

6. **访问应用**
   
   浏览器自动打开 `http://localhost:8501`

### 使用流程

1. **数据准备**：使用示例数据或上传自定义 CSV 文件
2. **数据校验**：在「数据上传与校验」页面检查数据质量
3. **筛选条件**：通过侧边栏选择日期范围和门店
4. **分析探索**：在各分析页面查看图表和指标
5. **生成报告**：在「报告导出」页面下载分析结果

## 数据格式说明

### CSV 文件字段规范

| 表名 | 关键字段 | 说明 |
|------|----------|------|
| stores | store_id, store_name, city, area | 门店基本信息 |
| dishes | dish_id, dish_name, category, price, cost | 菜品信息 |
| members | member_id, member_name, member_level, register_date | 会员信息 |
| orders | order_id, store_id, member_id, total_amount, order_datetime | 订单主表 |
| order_items | order_item_id, order_id, dish_id, quantity, subtotal | 订单明细 |
| promotions | promotion_id, promotion_name, promotion_type, discount_value | 促销活动 |
| refunds | refund_id, order_id, refund_amount, refund_reason | 退款记录 |
| business_hours | store_id, time_slot, is_peak_hour | 营业时段 |
| ingredient_costs | cost_id, ingredient_name, unit_price, total_cost | 原料成本 |

## 核心模块 API

### config/schemas.py

定义所有数据表的字段类型和业务规则：

```python
DATA_SCHEMAS = {
    "stores": {"store_id": "string", "store_name": "string", ...},
    "dishes": {"dish_id": "string", "dish_name": "string", ...},
    ...
}
```

### core/ingestion.py

- `load_csv_files(files)`: 加载多份 CSV 文件
- `load_sample_data()`: 加载内置示例数据
- `detect_file_type(filename)`: 自动识别文件类型

### core/validation.py

- `validate_all_datasets(datasets)`: 校验所有数据集
- `check_missing_values(df)`: 检查缺失值
- 返回 `ValidationReport` 数据类，包含校验详情

### core/transform.py

- `clean_data(df)`: 数据清洗与格式化
- `merge_orders_with_details(orders, items)`: 关联订单与明细
- `filter_by_date_and_store(df, start_date, end_date, stores)`: 联动筛选

### core/metrics.py

- `calculate_kpi_metrics(df)`: 计算核心 KPI 指标
- `calculate_rfm(df)`: RFM 分析与客户分层
- `detect_anomalous_stores(df, method)`: 异常门店识别
- `analyze_dish_combinations(df)`: 菜品组合关联分析

### core/visualization.py

提供 13+ 种 Plotly 图表函数：
- `plot_revenue_trend()`: 营收趋势图
- `plot_store_comparison()`: 门店对比图
- `plot_rfm_3d_scatter()`: RFM 3D散点图
- `plot_profit_matrix()`: 利润矩阵四象限
- `plot_anomaly_radar()`: 异常雷达图

### core/export.py

- `generate_excel_report(analysis_results, output_path)`: 生成 Excel 报告
- `generate_html_report(analysis_results, output_path)`: 生成 HTML 报告

## 示例数据

项目内置可复现的示例数据，包含：

- **门店**：10家连锁门店，覆盖北京、上海、广州等城市
- **订单**：1000条订单记录，时间跨度2024年1月-6月
- **会员**：200位会员，4个会员等级
- **菜品**：39道菜品，覆盖6个品类
- **退款**：64条退款记录，6种退款原因

### 重新生成数据

```bash
cd sample_data
python generate_data.py
```

脚本使用固定随机种子(42)，确保数据可复现。

## 开发指南

### 添加新的分析页面

1. 在 `pages/` 目录下创建新文件，命名格式为 `{序号}_{图标}_{页面名}.py`
2. 导入核心模块：`from core import metrics, visualization, transform`
3. 使用 `st.session_state` 共享数据和筛选条件
4. 参考现有页面的结构实现分析逻辑

### 扩展数据校验规则

在 `config/schemas.py` 中添加新的 schema 定义，然后在 `core/validation.py` 中实现对应的校验函数。

### 自定义图表样式

所有图表样式通过 `core/visualization.py` 中的 `_apply_chart_style()` 函数统一管理，支持：
- 商务蓝(#1976D2)与暖橙(#FF9800)配色
- 统一字体和边距
- 响应式布局

## 配置文件

### .gitignore 过滤规则

已配置以下忽略规则：
- 虚拟环境目录：`venv/`, `__pycache__/`
- Streamlit 缓存：`.streamlit/cache/`
- 用户上传数据：`uploads/`
- 导出报告：`exports/`
- 运行日志：`logs/`
- 本地配置：`.env`, `.local.*`

## 常见问题

**Q: 如何使用自己的业务数据？**

A: 确保数据格式与 schema 定义一致，在「数据上传与校验」页面上传对应的 CSV 文件即可。

**Q: 报告导出失败怎么办？**

A: 检查 `exports/` 目录是否有写入权限，确保已安装 `openpyxl` 和 `xlsxwriter` 包。

**Q: 可以自定义分析指标吗？**

A: 可以在 `core/metrics.py` 中添加新的指标计算函数，然后在对应页面调用。

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 Issue 或 Pull Request。
