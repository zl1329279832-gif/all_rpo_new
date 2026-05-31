# 场景结构说明

## 概述

本场景模拟了一个三层式城市互通立交桥，包含地面层、一层和二层三个标高的道路系统，通过多条匝道实现不同层级之间的交通转换。

## 道路层级结构

### 地面层 (Level 0, Y=0)

| 道路ID | 名称 | 类型 | 车道数 | 宽度 | 方向 |
|--------|------|------|--------|------|------|
| main-east-west-l0 | 东西主干道 | 主路 | 6 | 24m | 双向 |
| ramp-ne-l0-to-l1 | 东北匝道 | 匝道 | 2 | 10m | 单向 (→一层) |
| ramp-sw-l0-to-l1 | 西南匝道 | 匝道 | 2 | 10m | 单向 (→一层) |
| ramp-se-l2-to-l0 | 东南环形匝道 | 匝道 | 2 | 10m | 单向 (二层→) |

### 一层 (Level 1, Y=6)

| 道路ID | 名称 | 类型 | 车道数 | 宽度 | 方向 |
|--------|------|------|--------|------|------|
| main-north-south-l1 | 南北主干道 | 主路 | 6 | 24m | 双向 |
| connect-north-l1 | 北向连接路 | 主路 | 3 | 12m | 单向 |
| ramp-nw-l1-to-l2 | 西北匝道 | 匝道 | 2 | 10m | 单向 (→二层) |
| ramp-curve-uturn | U型转弯匝道 | 匝道 | 2 | 10m | 单向 |

### 二层 (Level 2, Y=12)

| 道路ID | 名称 | 类型 | 车道数 | 宽度 | 方向 |
|--------|------|------|--------|------|------|
| main-east-west-l2 | 东西快速路 | 主路 | 4 | 20m | 单向 |

## 匝道连接关系

```
地面层东西向 ──┬── 东北匝道 ──> 一层南北向
              │
              ├── 西南匝道 ──> 一层南北向
              │
              └── 东南环形匝道 <── 二层东西向

一层南北向 ──┬── 西北匝道 ──> 二层东西向
            │
            └── U型转弯匝道

二层东西向 ── 东南环形匝道 ──> 地面层
```

## 场景对象树

```
Scene
├── AmbientLight (环境光)
├── DirectionalLight (太阳光)
├── HemisphereLight (半球光)
├── DirectionalLight (月光)
├── Sky (天空盒)
├── Stars (星空粒子)
├── roads (道路组)
│   ├── main-east-west-l0
│   │   ├── 路面网格
│   │   ├── 防撞护栏
│   │   ├── 车道线
│   │   └── 中央隔离带
│   ├── main-north-south-l1
│   ├── main-east-west-l2
│   ├── ramp-ne-l0-to-l1
│   ├── ramp-nw-l1-to-l2
│   ├── ramp-se-l2-to-l0
│   ├── ramp-sw-l0-to-l1
│   ├── connect-north-l1
│   └── ramp-curve-uturn
├── pillars (桥墩组)
│   └── [圆柱桥墩 + 柱帽]
├── streetLights (路灯组)
│   └── [灯杆 + 灯罩 + 点光源]
├── roadSigns (路牌组)
│   └── [立柱 + 指示牌]
├── buildings (建筑群)
│   ├── b1 ~ b12 (12栋周边建筑)
│   │   ├── 建筑主体
│   │   └── 窗户 (发光材质)
│   └── ...
├── vehicles (车辆组)
│   └── [动态生成的车辆]
│       ├── 车身
│       ├── 车顶
│       ├── 4个车轮
│       ├── 前大灯 (聚光灯)
│       └── 尾灯
└── labels (标签组)
    ├── main-road-label (地面层)
    ├── level1-road-label (一层)
    └── level2-road-label (二层)
```

## 技术实现要点

### 道路几何生成

1. **曲线算法**：使用 Catmull-Rom 样条曲线生成平滑的道路中心线
2. **坡道过渡**：使用缓动函数实现高度的平滑过渡，避免突变
3. **桥面网格化**：沿曲线法线方向扩展道路宽度，生成带厚度的桥面几何体
4. **UV 映射**：正确设置纹理坐标，支持路面纹理贴图

### 车辆动画系统

1. **路径跟随**：使用 `curve.getPointAt(progress)` 获取位置，`getTangentAt()` 计算朝向
2. **实例化渲染**：计划使用 InstancedMesh 优化大量车辆的渲染性能
3. **车流调度**：根据密度参数动态生成和销毁车辆
4. **车道偏移**：根据车道参数在道路宽度方向上偏移

### 光照系统

#### 白天模式
- 方向光模拟太阳光 (强度 1.0)
- 环境光提供基础照明 (强度 0.6)
- 半球光模拟天空和地面反射

#### 夜间模式
- 月光提供冷色调环境光 (强度 0.3)
- 路灯自动点亮，每盏灯带有轻微闪烁效果
- 车辆大灯开启，照亮前方道路
- 建筑窗户随机点亮
- 星空背景显现

### 性能优化策略

1. **视锥剔除**：Three.js 内置，自动跳过不可见物体
2. **阴影优化**：仅主光源投射阴影，限制阴影贴图分辨率
3. **LOD**：远处建筑使用简化模型（预留接口）
4. **帧率自适应**：根据性能动态调整质量
5. **资源释放**：组件卸载时正确释放几何体和材质

### 材质系统

| 对象 | 材质类型 | 颜色 | 特殊属性 |
|------|----------|------|----------|
| 路面 | MeshStandardMaterial | #2a2a2a | 高粗糙度 |
| 车道线 | MeshStandardMaterial | #ffffff | 轻微发光 |
| 护栏 | MeshStandardMaterial | #888888 | 高金属度 |
| 桥墩 | MeshStandardMaterial | #888888 | 混凝土质感 |
| 建筑玻璃 | MeshPhysicalMaterial | #8899aa | 透射、半透明 |
| 路灯 | MeshStandardMaterial | #ffffaa | 夜间发光 |
| 车灯 | SpotLight | #ffffcc | 聚光效果 |

## 扩展开发指南

### 添加新的道路段

编辑 `src/data/trafficData.ts`，在 `roadSegments` 数组中添加新的道路定义：

```typescript
{
  id: 'new-road-id',
  name: '道路名称',
  type: 'main' | 'ramp',
  level: 0,  // 0=地面, 1=一层, 2=二层
  points: createStraightRoad(...),  // 或 createRampPoints, createCurveRoad
  width: 20,
  lanes: 4,
  direction: 'forward' | 'backward' | 'bidirectional'
}
```

### 添加新的建筑

在 `buildings` 数组中添加：

```typescript
{
  id: 'b13',
  position: { x: 50, y: 0, z: -50 },
  width: 20,
  depth: 20,
  height: 35,
  style: 'office' | 'residential' | 'commercial'
}
```

### 自定义车辆颜色

编辑 `src/utils/materialPresets.ts` 中的 `vehicleColors` 数组。

### 调整光照参数

在 `src/composables/useThreeScene.ts` 中修改光源的位置、强度和颜色。
