# 组件结构文档

## 组件层级关系

```
App.vue (根组件)
├── Header.vue (顶部导航)
├── ThreeScene.vue (3D场景容器)
├── DataPanel.vue (左侧数据面板)
├── AlarmPanel.vue (右侧告警面板)
├── SearchBar.vue (顶部搜索栏)
└── DeviceDetail.vue (设备详情弹窗)
```

---

## 组件详细说明

### 1. App.vue - 根组件

**职责**: 应用入口，管理全局状态和组件通信

**Props**: 无

**State**:
- `sceneManager: SceneManager | null` - Three.js 场景管理器实例
- `selectedDevice: Device | null` - 当前选中的设备
- `labelsVisible: boolean` - 标签显示状态
- `alarmFilter: AlarmLevel | 'all'` - 告警筛选条件
- `isSimulating: boolean` - 模拟事件播放状态

**Methods**:
- `handleSceneReady(manager: SceneManager)` - 场景初始化完成回调
- `handlePick(result: PickResult)` - 场景对象拾取回调
- `handleSearch(item)` - 搜索结果选中处理
- `handleLocateAlarm(alarm: Alarm)` - 告警定位
- `handleHandleAlarm(alarm: Alarm)` - 告警处理
- `startSimulation()` - 启动事件模拟
- `stopSimulation()` - 停止事件模拟

**生命周期**:
- `onMounted`: 2秒后自动启动事件模拟
- `onUnmounted`: 停止模拟、释放场景资源

---

### 2. Header.vue - 顶部导航栏

**职责**: 显示系统标题、关键指标、控制按钮

**Props**:
```typescript
{
  statistics: Statistics      // 统计数据
  labelsVisible: boolean     // 标签显示状态
}
```

**Emits**:
- `reset-view` - 重置视角
- `toggle-labels` - 切换标签显示

**内部状态**:
- `currentTime: string` - 当前时间字符串

**功能**:
- 显示系统Logo和标题
- 展示三个关键指标：设备在线率、今日告警、待处理数
- 提供"显示/隐藏标签"和"重置视角"按钮
- 实时显示当前时间

---

### 3. ThreeScene.vue - 3D场景容器

**职责**: Three.js 场景的 Vue 封装

**Props**: 无

**Emits**:
- `scene-ready(manager: SceneManager)` - 场景初始化完成
- `pick(result: PickResult)` - 对象被拾取

**暴露方法**:
- `getSceneManager(): SceneManager | null` - 获取场景管理器实例

**功能**:
- 创建 Three.js 渲染容器
- 自动适配容器大小
- 组件卸载时自动释放资源

---

### 4. DataPanel.vue - 数据统计面板

**职责**: 展示安防态势统计数据和图表

**Props**:
```typescript
{
  statistics: Statistics          // 总览统计
  alarmTrends: AlarmTrend[]       // 24小时告警趋势
  regionRisks: RegionRisk[]       // 区域风险分布
  responseStats: ResponseStat[]   // 响应统计
}
```

**内部图表**:
1. **设备状态统计** - 四宫格展示在线/离线/故障/告警设备数
2. **设备在线率** - 进度条展示
3. **告警趋势图** - ECharts 折线图，24小时告警数量变化
4. **区域风险分布** - ECharts 横向柱状图
5. **响应统计** - 平均响应时间、处置完成率 + 混合图表

**功能**:
- 响应式图表，窗口大小变化时自动重绘
- 数据变化时自动更新图表

---

### 5. AlarmPanel.vue - 告警列表面板

**职责**: 展示告警列表，提供筛选和操作功能

**Props**:
```typescript
{
  alarms: Alarm[]                  // 告警数据列表
  alarmFilter: AlarmLevel | 'all'  // 当前筛选条件
}
```

**Emits**:
- `filter-change(filter)` - 筛选条件变化
- `locate(alarm: Alarm)` - 定位告警
- `handle(alarm: Alarm)` - 处理告警

**内部状态**:
- `filterTabs` - 筛选标签配置
- `levelLabels` - 告警级别文本映射
- `statusLabels` - 告警状态文本映射

**告警项展示**:
- 告警类型和级别标签
- 设备名称
- 告警描述
- 发生时间和处理状态
- 处理人信息（如有）
- 定位和处理操作按钮

---

### 6. SearchBar.vue - 搜索定位栏

**职责**: 提供建筑和设备的搜索定位功能

**Props**:
```typescript
{
  buildings: Building[]  // 建筑列表
  devices: Device[]      // 设备列表
}
```

**Emits**:
- `search(item: { type: 'building' | 'device'; data: any })` - 选中搜索结果

**内部状态**:
- `searchText: string` - 搜索输入文本
- `showDropdown: boolean` - 下拉列表显示状态

**功能**:
- 实时过滤建筑和设备
- 输入框聚焦时显示热门推荐
- 点击外部自动收起下拉列表
- 支持键盘操作（可扩展）

---

### 7. DeviceDetail.vue - 设备详情弹窗

**职责**: 展示设备详细信息

**Props**:
```typescript
{
  device: Device  // 设备数据
}
```

**Emits**:
- `close` - 关闭弹窗

**展示内容**:
1. **设备头部** - 设备图标、名称、状态徽章
2. **基本信息** - 设备ID、类型、楼层、安装时间、最后检查时间、坐标
3. **设备描述** - 安装位置描述
4. **实时数据** - 运行时长、数据传输率、信号强度、电量

**操作按钮**:
- 关闭
- 报修处理（故障/离线状态显示）
- 查看告警详情（告警状态显示）

---

## 数据流架构

### 场景交互数据流

```
用户点击3D场景
    ↓
InteractionManager 射线检测
    ↓
ThreeScene 触发 pick 事件
    ↓
App.vue 接收 PickResult
    ↓
如果是设备 → 显示 DeviceDetail 弹窗
    ↓
SceneManager.selectObject() 高亮选中对象
```

### 告警联动数据流

```
告警列表点击定位按钮
    ↓
App.vue 接收 locate 事件
    ↓
SceneManager.focusPosition() 相机飞行到目标位置
    ↓
选中环动画更新到目标位置
```

### 搜索定位数据流

```
用户输入搜索关键词
    ↓
SearchBar 实时过滤建筑/设备列表
    ↓
用户选择搜索结果
    ↓
App.vue 接收 search 事件
    ↓
SceneManager.focusPosition() 定位到目标
    ↓
如果是设备 → 显示详情弹窗
```

---

## Three.js 模块架构

### SceneManager - 场景管理器

**核心职责**: 统筹管理整个 Three.js 场景生命周期

**主要方法**:
- `constructor(container: HTMLElement)` - 初始化场景
- `loadBuildings(buildings: Building[])` - 加载建筑模型
- `loadDevices(devices: Device[])` - 加载设备模型
- `loadGates(gates: CampusGate[])` - 加载出入口
- `showAlarm(alarm: Alarm)` - 显示告警指示器
- `removeAlarm(alarmId: string)` - 移除告警指示器
- `selectObject(object: Object3D | null)` - 选中对象
- `focusPosition(position, distance)` - 聚焦到指定位置
- `dispose()` - 释放所有资源

**内部协作**:
- 使用 ModelFactory 创建模型
- 使用 LabelSystem 管理标签
- 使用 InteractionManager 处理交互
- 使用 AnimationController 控制动画
- 使用 OrbitControls 处理相机控制

---

## 性能优化策略

### 渲染优化
1. **像素比限制**: `setPixelRatio(Math.min(window.devicePixelRatio, 2))`
2. **阴影优化**: 仅关键建筑和设备投射阴影
3. **材质复用**: ModelFactory 缓存相同颜色材质
4. **几何体优化**: 使用低多边形模型，远距离简化

### 内存管理
1. **资源释放**: `disposeObject3D()` 递归释放几何体和材质
2. **纹理清理**: LabelSystem 动态创建的 CanvasTexture 及时释放
3. **事件解绑**: 所有事件监听器在 dispose 时移除
4. **动画清理**: TWEEN.removeAll() 清除所有补间动画

### 交互优化
1. **点击阈值**: 5像素拖动阈值，区分点击和拖动
2. **拾取优化**: 只对指定组进行射线检测
3. **防抖处理**: 窗口 resize 事件防抖（可扩展）

---

## 事件系统

### 自定义事件

| 事件名 | 触发时机 | 数据 |
|--------|----------|------|
| `scene-ready` | 场景初始化完成 | SceneManager 实例 |
| `pick` | 用户点击场景对象 | PickResult |
| `reset-view` | 点击重置视角按钮 | - |
| `toggle-labels` | 点击标签切换按钮 | - |
| `search` | 选中搜索结果 | { type, data } |
| `filter-change` | 告警筛选变化 | 筛选条件 |
| `locate` | 点击告警定位 | Alarm |
| `handle` | 点击处理告警 | Alarm |
| `close` | 关闭详情弹窗 | - |

---

## 扩展建议

### 可扩展功能
1. **设备筛选**: 按类型、状态筛选显示设备
2. **时间轴**: 历史告警回放
3. **热图叠加**: 人流/风险热图可视化
4. **视频融合**: 接入真实监控视频流
5. **告警通知**: 声音/桌面通知
6. **多语言**: 国际化支持
7. **主题切换**: 深色/浅色主题
8. **视角预设**: 保存常用视角

### 性能优化方向
1. **LOD 系统**: 不同距离显示不同细节模型
2. **实例化渲染**: InstancedMesh 批量渲染设备
3. **Web Worker**: 数据计算移至 Worker
4. **按需加载**: 大数据量时分块加载
