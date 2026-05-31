# 火山地质结构三维可视化项目

一个基于 Python 的火山地质结构三维可视化系统，支持交互式探索火山的内部结构、熔岩流动和热力分布。

## 功能特性

- **三维地形建模**：高精度火山锥体、火山口、熔岩流路径和地表植被
- **地下结构展示**：岩浆通道、多层岩层、断裂带的立体展示
- **剖面分析**：任意平面切割、正交剖面视图、等值面提取
- **动态模拟**：熔岩流动、热力扩散、喷发过程动画
- **交互式控制**：调节岩浆压力、喷发强度、时间进度
- **结果导出**：支持图像、网格、动画格式导出

## 项目结构

```
volcano-3d-visualization/
├── src/
│   └── volcano_vis/          # 主包目录
│       ├── data_generator.py      # 数据生成模块
│       ├── mesh_builder.py        # 网格构建模块
│       ├── material_mapper.py     # 材质映射模块
│       ├── clipper.py             # 剖面切割模块
│       ├── animator.py            # 动画模拟模块
│       ├── legend.py              # 图例说明模块
│       ├── exporter.py            # 结果导出模块
│       └── utils.py               # 工具函数
├── config/                    # 配置文件
│   ├── default_params.yaml        # 默认参数
│   └── example_params.yaml        # 示例参数
├── examples/                  # 示例脚本
│   └── quick_start.py             # 快速入门
├── exports/                   # 导出目录（运行时生成）
├── tests/                     # 测试文件
├── app.py                     # Streamlit 主程序
├── main.py                    # 命令行主程序
├── requirements.txt           # 依赖清单
└── README.md                  # 项目文档
```

## 快速开始

### 1. 安装依赖

```bash
# 创建虚拟环境
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt
```

### 2. 运行命令行版本

```bash
python main.py --config config/example_params.yaml
```

### 3. 运行交互式界面

```bash
streamlit run app.py
```

## 模块说明

### 1. 数据生成模块 (`data_generator.py`)
- 火山地形生成（锥形、破火山口）
- 地下岩层建模（沉积层、变质层、岩浆房）
- 岩浆通道和断裂带生成
- 熔岩流路径模拟（基于元胞自动机）
- 热力场分布计算
- 植被分布模拟

### 2. 网格构建模块 (`mesh_builder.py`)
- 结构化网格生成
- 非结构化网格转换
- 多尺度网格细化
- 边界条件处理

### 3. 材质映射模块 (`material_mapper.py`)
- 地质颜色映射（岩层、熔岩、植被）
- 温度色阶映射
- 透明度设置
- 材质属性（光泽度、粗糙度）

### 4. 剖面切割模块 (`clipper.py`)
- 任意平面切割
- XYZ正交剖面
- 等值面提取
- 轮廓线生成

### 5. 动画模拟模块 (`animator.py`)
- 熔岩流动动画
- 热力扩散模拟
- 喷发过程动画
- 危险区域扩散

### 6. 图例说明模块 (`legend.py`)
- 颜色条生成
- 地质图例
- 标注和箭头
- 比例尺

### 7. 结果导出模块 (`exporter.py`)
- 图像导出（PNG/JPG）
- 网格导出（VTK/STL/PLY）
- 动画导出（MP4/GIF）

## 参数配置

主要可调参数：

| 参数 | 说明 | 默认值 | 范围 |
|------|------|--------|------|
| volcano_height | 火山高度 | 800m | 200-2000m |
| crater_radius | 火山口半径 | 300m | 50-800m |
| magma_pressure | 岩浆压力 | 0.7 | 0.1-1.0 |
| eruption_intensity | 喷发强度 | 0.6 | 0.1-1.0 |
| time_progress | 时间进度 | 0.0 | 0.0-1.0 |
| lava_viscosity | 熔岩粘度 | 0.5 | 0.1-1.0 |

## 示例

查看 [examples/quick_start.py](examples/quick_start.py) 获取完整示例。

## 许可证

MIT License
