# 卫星模型层级说明

## 概述

本文档详细说明卫星三维模型的层级结构、部件组成和坐标系统定义。

## 坐标系统

- **原点 (0, 0, 0)**：卫星质心位置
- **X轴**：卫星飞行方向（前方）
- **Y轴**：卫星右侧方向
- **Z轴**：卫星天顶方向（上方）

## 层级结构

```
Satellite (Group)
├── MainBody (Group) - 主体舱
│   ├── BusStructure (Mesh) - 主结构框架
│   ├── TopPanel (Mesh) - 顶部面板
│   ├── BottomPanel (Mesh) - 底部面板
│   ├── FrontPanel (Mesh) - 前面板
│   ├── BackPanel (Mesh) - 后面板
│   ├── LeftPanel (Mesh) - 左面板
│   ├── RightPanel (Mesh) - 右面板
│   ├── Bolts[] (Mesh) - 螺栓阵列
│   ├── Interfaces[] (Mesh) - 接口面板
│   └── HeatSinks[] (Mesh) - 散热片
├── SolarPanels (Group) - 太阳能帆板系统
│   ├── LeftSolarPanel (Group) - 左侧太阳能帆板
│   │   ├── Yoke (Group) - 连接支架
│   │   ├── Hinge (Mesh) - 铰链机构
│   │   ├── DriveMotor (Mesh) - 驱动电机
│   │   ├── PanelSegments[] (Group) - 帆板分段
│   │   │   ├── Substrate (Mesh) - 基板
│   │   │   ├── SolarCells (Mesh) - 电池片阵列
│   │   │   └── Connectors (Mesh) - 连接器
│   │   └── DeployedRotation (Group) - 展开旋转节点
│   └── RightSolarPanel (Group) - 右侧太阳能帆板（结构同左侧）
├── AntennaSystem (Group) - 天线系统
│   ├── HighGainAntenna (Group) - 高增益天线
│   │   ├── Reflector (Mesh) - 反射面
│   │   ├── FeedHorn (Mesh) - 馈源喇叭
│   │   ├── SupportStruts[] (Mesh) - 支撑杆
│   │   ├── GimbalX (Group) - X轴万向节
│   │   └── GimbalY (Group) - Y轴万向节
│   └── SBandAntennas[] (Group) - S波段全向天线
│       ├── Mast (Mesh) - 天线杆
│       └── Radiator (Mesh) - 辐射阵子
├── PropulsionSystem (Group) - 推进系统
│   ├── MainThruster (Group) - 主推进器
│   │   ├── CombustionChamber (Mesh) - 燃烧室
│   │   ├── Nozzle (Mesh) - 喷管
│   │   └── MountingBracket (Mesh) - 安装支架
│   └── RCSThrusters[] (Group) - RCS姿态控制喷口
│       ├── ThrusterBody (Mesh) - 喷口主体
│       └── Nozzle (Mesh) - 喷管
├── SensorSystem (Group) - 传感器系统
│   ├── StarTrackers[] (Group) - 星敏感器
│   │   ├── Housing (Mesh) - 外壳
│   │   ├── Lens (Mesh) - 镜头
│   │   └── Baffle (Mesh) - 遮光罩
│   ├── SunSensors[] (Group) - 太阳敏感器
│   │   ├── Housing (Mesh) - 外壳
│   │   └── Detector (Mesh) - 探测器窗口
│   ├── IMU (Group) - 惯性测量单元
│   │   ├── Housing (Mesh) - 外壳
│   │   └── Connectors (Mesh) - 连接器
│   └── GPSAntennas[] (Group) - GPS天线
│       ├── Housing (Mesh) - 天线罩
│       └── Mount (Mesh) - 安装座
├── ThermalSystem (Group) - 热控系统
│   ├── Radiators[] (Group) - 散热器
│   │   ├── Panel (Mesh) - 散热面板
│   │   ├── HeatPipes[] (Mesh) - 热管
│   │   └── MountingBrackets[] (Mesh) - 安装支架
│   ├── Louvers[] (Group) - 百叶窗
│   │   ├── Frame (Mesh) - 框架
│   │   └── Blades[] (Mesh) - 叶片
│   └── MLI (Mesh) - 多层隔热组件
├── SupportStructure (Group) - 支撑结构
│   ├── SolarPanelBoom (Group) - 太阳能帆板臂
│   │   ├── BoomSegments[] (Mesh) - 臂杆分段
│   │   └── Joints[] (Mesh) - 关节
│   ├── AntennaMast (Group) - 天线桅杆
│   │   ├── MastTube (Mesh) - 桅杆管
│   │   └── BaseMount (Mesh) - 基座
│   └── SensorMounts[] (Group) - 传感器安装座
│       ├── Bracket (Mesh) - 支架
│       └── AdapterPlate (Mesh) - 转接板
├── CableSystem (Group) - 线缆系统
│   ├── PowerCables[] (Group) - 电力电缆
│   │   ├── CableSegments[] (Mesh) - 电缆分段
│   │   └── Connectors[] (Mesh) - 连接器
│   ├── DataCables[] (Group) - 数据电缆
│   │   ├── CableSegments[] (Mesh) - 电缆分段
│   │   └── Connectors[] (Mesh) - 连接器
│   ├── SignalCables[] (Group) - 信号电缆
│   │   ├── CableSegments[] (Mesh) - 电缆分段
│   │   └── Connectors[] (Mesh) - 连接器
│   └── CableHarnesses[] (Group) - 线束
│       ├── Bundle (Mesh) - 线束主体
│       ├── Clamps[] (Mesh) - 线卡
│       └── Labels[] (Mesh) - 标签
└── InternalModules (Group) - 内部模块
    ├── MainBoard (Group) - 主板
    │   ├── PCB (Mesh) - 印制电路板
    │   ├── Processors[] (Mesh) - 处理器
    │   ├── MemoryChips[] (Mesh) - 存储芯片
    │   └── Connectors[] (Mesh) - 连接器
    ├── BatteryPack (Group) - 蓄电池组
    │   ├── BatteryCells[] (Mesh) - 电芯
    │   ├── Housing (Mesh) - 外壳
    │   └── BMSBoard (Mesh) - 管理电路板
    ├── OnBoardComputer (Group) - 星载计算机
    │   ├── Chassis (Mesh) - 机箱
    │   ├── Motherboard (Mesh) - 主板
    │   ├── CPU (Mesh) - 中央处理器
    │   └── IOBoard (Mesh) - IO板
    ├── PowerController (Group) - 电源控制器
    │   ├── Chassis (Mesh) - 机箱
    │   ├── PowerModules[] (Mesh) - 功率模块
    │   └── Capacitors[] (Mesh) - 电容
    └── DataStorage (Group) - 数据存储器
        ├── Housing (Mesh) - 外壳
        ├── DriveModules[] (Mesh) - 存储模块
        └── InterfaceBoard (Mesh) - 接口板
```

## 部件详细说明

### 1. 主体舱 (MainBody)

**尺寸**：1.2m × 1.0m × 0.8m（长×宽×高）

**组成部分**：
- **主结构框架**：铝合金蜂窝板结构，碳纤维蒙皮
- **多层面板**：6个外表面面板，每个包含多层结构
- **螺栓**：M5规格，分布在面板接缝处，共48个
- **接口面板**：包含电源接口、数据接口、热控接口
- **散热片**：铝制散热片，分布在南北面板

**材质属性**：
- 碳纤维：金属度 0.3，粗糙度 0.4
- 铝合金：金属度 0.9，粗糙度 0.2
- 涂层：黑色阳极氧化，金属度 0.1，粗糙度 0.6

### 2. 太阳能帆板 (SolarPanel)

**规格**：
- 单翼展开尺寸：2.5m × 0.8m
- 电池片：三结砷化镓，28%效率
- 展开角度：0°（收起）~ 180°（展开）

**结构层次**：
1. **铰链机构**：钛合金材质，提供旋转自由度
2. **驱动电机**：步进电机，带减速器
3. **基板**：碳纤维蜂窝板，厚度10mm
4. **电池阵列**：120片太阳能电池，6×20排列
5. **连接器**：SMP连接器，用于帆板间连接

**动画节点**：
- `DeployedRotation`：控制帆板展开旋转
- `SegmentRotation`：控制各分段旋转

### 3. 天线系统 (AntennaSystem)

#### 高增益天线
- **反射面**：直径0.6m，碳纤维材质
- **馈源**：喇叭天线，X波段
- **指向范围**：方位±180°，俯仰±90°
- **增益**：35 dBi

#### S波段全向天线
- **类型**：螺旋天线
- **工作频率**：2.0-2.3 GHz
- **增益**：3 dBi
- **数量**：2个，安装在±Z面

### 4. 推进系统 (PropulsionSystem)

#### 主推进器
- **类型**：双组元液体火箭发动机
- **推力**：500 N
- **比冲**：320 s
- **安装位置**：-Z面中心

#### RCS姿态控制喷口
- **数量**：12个（每个轴4个）
- **推力**：10 N
- **布局**：分布在卫星四周
- **用途**：姿态控制、轨道保持

### 5. 传感器系统 (SensorSystem)

#### 星敏感器
- **数量**：2个（冗余配置）
- **精度**：1 弧秒
- **视场**：20° × 20°
- **安装位置**：+Z面

#### 太阳敏感器
- **数量**：6个（各面1个）
- **精度**：0.1°
- **视场**：±60°
- **用途**：太阳捕获、姿态确定

#### IMU惯性测量单元
- **类型**：光纤陀螺 + 加速度计
- **陀螺精度**：0.01 °/h
- **加速度计量程**：±10 g
- **安装位置**：卫星质心附近

### 6. 热控系统 (ThermalSystem)

#### 散热器
- **类型**：可展开式散热器
- **展开面积**：1.5 m²
- **散热能力**：300 W
- **工作温度**：-40°C ~ +60°C

#### 热管
- **类型**：铝氨热管
- **数量**：8根
- **传热能力**：50 W/m
- **布局**：连接内部模块与散热器

### 7. 内部模块 (InternalModules)

#### 星载计算机
- **处理器**：双核 LEON3
- **主频**：100 MHz
- **内存**：256 MB
- **存储**：1 GB Flash

#### 电源控制器
- **输入电压**：28 V
- **功率等级**：1000 W
- **效率**：92%
- **保护功能**：过流、过压、过温

#### 蓄电池
- **类型**：锂离子电池
- **容量**：100 Ah
- **电压**：28 V
- **循环寿命**：5000 次

## 爆炸视图偏移量

| 部件 | X偏移 | Y偏移 | Z偏移 |
|------|-------|-------|-------|
| 主体舱 | 0 | 0 | 0 |
| 左太阳能帆板 | -2.0 | 0 | 0 |
| 右太阳能帆板 | 2.0 | 0 | 0 |
| 高增益天线 | 0 | 0 | 1.5 |
| 主推进器 | 0 | 0 | -1.0 |
| 星敏感器1 | 0 | 0.5 | 1.0 |
| 星敏感器2 | 0 | -0.5 | 1.0 |
| 左散热器 | -0.8 | 0 | 0.5 |
| 右散热器 | 0.8 | 0 | 0.5 |
| 蓄电池 | -0.3 | 0 | 0 |
| 星载计算机 | 0.3 | 0 | 0 |
| 电源控制器 | 0 | 0 | 0.3 |

## 材质清单

| 材质名称 | 类型 | 颜色 | 金属度 | 粗糙度 | 用途 |
|---------|------|------|--------|--------|------|
| carbonFiber | MeshStandard | #1a1a1a | 0.3 | 0.4 | 主体结构、帆板基板 |
| aluminum | MeshStandard | #c0c0c0 | 0.9 | 0.2 | 金属结构件、螺栓 |
| titanium | MeshStandard | #888888 | 0.8 | 0.3 | 铰链、支架 |
| solarCell | MeshStandard | #000080 | 0.1 | 0.8 | 太阳能电池片 |
| solarCellLine | MeshStandard | #333333 | 0.5 | 0.5 | 电池片栅线 |
| gold | MeshStandard | #ffd700 | 1.0 | 0.3 | 反射面、连接器 |
| copper | MeshStandard | #b87333 | 0.9 | 0.4 | 线缆导体、散热片 |
| whitePaint | MeshStandard | #f5f5f5 | 0.0 | 0.7 | 外表面涂层 |
| blackPaint | MeshStandard | #1a1a1a | 0.0 | 0.7 | 散热面、遮光罩 |
| glass | MeshPhysical | #88ccff | 0.0 | 0.1 | 镜头、窗口 |
| glowGreen | MeshStandard | #00ff00 | 0.0 | 0.5 | 状态指示灯 |
| glowRed | MeshStandard | #ff0000 | 0.0 | 0.5 | 警告指示灯 |
| glowBlue | MeshStandard | #0088ff | 0.0 | 0.5 | 电源指示灯 |
| cableBlack | MeshStandard | #1a1a1a | 0.1 | 0.9 | 电缆外皮 |
| cableGray | MeshStandard | #666666 | 0.1 | 0.9 | 数据电缆 |
| pcbGreen | MeshStandard | #006600 | 0.0 | 0.8 | 印制电路板 |
| chipBlack | MeshStandard | #0a0a0a | 0.3 | 0.5 | 芯片封装 |

## 用户数据

| 部件 | 功能说明 | 技术参数 |
|------|---------|---------|
| 主体舱 | 卫星主结构，承载所有载荷 | 结构质量：150kg，固有频率：15Hz |
| 太阳能帆板 | 提供卫星电力供应 | 输出功率：800W，效率：28% |
| 高增益天线 | 高速数据传输 | 数据速率：100Mbps，增益：35dBi |
| 主推进器 | 轨道机动、变轨 | 推力：500N，比冲：320s |
| 星敏感器 | 高精度姿态确定 | 精度：1角秒，更新率：10Hz |
| 蓄电池组 | 阴影期供电 | 容量：100Ah，循环寿命：5000次 |
| 星载计算机 | 星上数据处理 | 算力：200MIPS，内存：256MB |
