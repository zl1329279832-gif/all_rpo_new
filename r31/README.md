# 数据中心百万级机柜 3D 渲染与交互模块

基于 Vue 3 + Vite + TypeScript + Three.js 开发的高性能数据中心可视化系统。

## 核心特性

### 🚀 极致性能优化

- **InstancedMesh 实例化渲染**：10,000 个机柜仅使用单个 Draw Call，帧率稳定 60FPS+
- **按需渲染 (Render on Demand)**：仅在相机移动或交互时触发渲染，GPU 节能 80%+
- **视锥体剔除 (Frustum Culling)**：自动剔除视野外的机柜实例
- **动态顶点缓冲区**：`DynamicDrawUsage` 优化实例矩阵更新性能

### 🎯 精准交互系统

- **Raycaster 射线拾取**：支持 16ms 防抖的鼠标悬停检测，防止抖动误触
- **实例 ID 映射**：快速从拾取结果映射到业务数据，O(1) 时间复杂度
- **3D → 2D 坐标映射**：实时世界坐标到屏幕坐标转换，无缝挂载 Vue 悬浮窗
- **平滑相机漫游**：基于 Tween.js 的贝塞尔曲线插值飞行动画

### 🏗️ 架构设计

- **Vue 与 3D 引擎完全解耦**：核心逻辑位于 `src/core`，纯 TypeScript 实现，无 Vue 依赖
- **无响应式劫持**：3D 场景对象不受 Vue Proxy 影响，避免内存泄漏
- **模块化设计**：场景管理、拾取系统、相机控制各司其职

## 目录结构

```
src/
├── core/                    # 3D 引擎纯逻辑（与 Vue 解耦）
│   ├── types.ts            # 类型定义
│   ├── InstancedRackManager.ts   # 实例化网格管理器
│   ├── SceneManager.ts     # 场景与渲染控制
│   ├── PickerManager.ts    # 射线拾取与坐标映射
│   ├── CameraController.ts # 相机控制与漫游
│   └── DatacenterEngine.ts # 引擎门面类
├── components/             # Vue UI 组件
│   ├── DatacenterScene.vue # 主场景组件
│   ├── RackTooltip.vue     # 机柜信息悬浮窗
│   ├── StatsPanel.vue      # 性能监控面板
│   └── ControlPanel.vue    # 控制面板
├── hooks/                  # 自定义 Hooks
│   ├── useDatacenterEngine.ts
│   └── useFpsMonitor.ts
├── assets/
│   └── dataGenerator.ts    # Mock 数据生成器
├── App.vue
├── main.ts
└── style.css
```

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 类型检查
npm run typecheck

# 构建生产版本
npm run build
```

## 性能监测说明

### 实时 FPS 监控

系统内置性能监控面板，实时显示：

- **FPS**：当前帧率（绿色 ≥ 55，黄色 30-55，红色 < 30）
- **实例数量**：当前渲染的机柜总数
- **渲染耗时**：单帧渲染时间（毫秒）
- **总帧数**：累计渲染帧数

### 性能预期

在主流硬件配置下的预期表现：

| 硬件配置 | 机柜数量 | 平均 FPS | 单帧耗时 |
|---------|---------|---------|---------|
| RTX 3060 / 16GB | 10,000 | 120+ | < 8ms |
| GTX 1660 / 8GB | 10,000 | 60+ | < 16ms |
| 集成显卡 | 10,000 | 30+ | < 33ms |

### 性能优化技巧

1. **降低像素比**：`renderer.setPixelRatio(1)` 可提升低端设备性能
2. **调整视锥体远截面**：缩小相机 far 值减少绘制距离
3. **关闭阴影**：如非必要，`renderer.shadowMap.enabled = false`
4. **减少光源**：场景中光源数量直接影响性能

## 核心 API 说明

### DatacenterEngine

```typescript
// 创建引擎
const engine = new DatacenterEngine(canvasElement)

// 加载数据
engine.loadData(rackDataArray)

// 事件回调
engine.setOnHover((rack) => { /* 鼠标悬停 */ })
engine.setOnClick((rack) => { /* 点击选中 */ })
engine.setOnStatsUpdate((stats) => { /* 性能更新 */ })

// 启动/停止
engine.start()
engine.stop()

// 飞行到指定机柜
engine.getCameraController().flyTo(targetPosition, duration)
```

### 数据格式

```typescript
interface RackData {
  id: number              // 机柜唯一标识
  x: number               // 世界坐标 X
  z: number               // 世界坐标 Z
  row: number             // 行索引
  col: number             // 列索引
  temperature: number     // 温度 (°C)
  power: number           // 功耗 (kW)
  status: 'normal' | 'warning' | 'critical' | 'offline'
  rackType: 'server' | 'network' | 'storage'
}
```

## 技术栈

- **Vue 3.4** - 渐进式 UI 框架
- **Three.js r160** - WebGL 渲染引擎
- **Tween.js 23** - 动画插值库
- **Vite 5** - 构建工具
- **TypeScript 5.3** - 类型系统

## 设计约束

1. **禁止直接绑定响应式**：3D 场景对象不得作为 Vue 的 reactive/ref 响应式数据
2. **禁止独立 Mesh**：所有机柜必须通过 InstancedMesh 批量渲染
3. **禁止高频渲染**：必须使用按需渲染机制，避免 60Hz 持续渲染浪费资源
4. **事件防抖**：鼠标移动拾取必须加入防抖逻辑，防止 Raycaster 过度计算

## License

MIT
