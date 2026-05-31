# 城市立交桥三维模型展示系统 - 运行文档

## 项目简介

基于 Vue 3 + TypeScript + Three.js 构建的城市立交桥三维可视化展示系统，实现了多层立交桥结构的真实感渲染和动态交通流模拟。

## 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0 或 pnpm >= 8.0.0
- 现代浏览器（Chrome/Edge/Firefox/Safari 最新版本）
- 支持 WebGL 2.0 的显卡

## 安装依赖

```bash
npm install
```

或使用 pnpm：

```bash
pnpm install
```

## 开发运行

```bash
npm run dev
```

启动后访问 `http://localhost:5173` 查看效果。

## 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist` 目录。

## 预览生产构建

```bash
npm run preview
```

## 类型检查

```bash
npm run check
```

## 代码检查

```bash
npm run lint
```

自动修复：

```bash
npm run lint:fix
```

## 操作说明

### 视角切换

1. **俯视视角** (快捷键 `1`)：正交投影，从上往下俯瞰整个立交桥
2. **驾驶视角** (快捷键 `2`)：跟随随机车辆，以驾驶员视角体验行驶
3. **自由视角** (快捷键 `3`)：可自由控制相机移动和旋转

### 自由视角控制

- `W` / `↑`：向前移动
- `S` / `↓`：向后移动
- `A` / `←`：向左移动
- `D` / `→`：向右移动
- `Shift`：加速移动
- 鼠标左键拖拽：旋转视角
- 鼠标滚轮：缩放视角

### 交互功能

- 点击车辆：切换到该车辆的驾驶视角
- 右侧控制面板：调节车流密度、切换昼夜模式、设置道路状态
- 显示标签开关：显示/隐藏道路层级说明标签

## 性能建议

- 建议使用独立显卡以获得最佳体验
- 如果帧率较低，可以降低车流密度
- 关闭阴影可以显著提升性能（如需修改请编辑 `useThreeScene.ts`）
- 建议在 1920x1080 或更高分辨率下使用

## 常见问题

### Q: 场景加载缓慢？
A: 首次加载需要生成复杂的几何体，请耐心等待。后续刷新会更快。

### Q: 车辆显示不完整？
A: 请检查浏览器是否支持 WebGL 2.0，并更新显卡驱动。

### Q: 夜间模式灯光效果不明显？
A: 请确保显示器亮度足够，部分显示器对暗色显示效果不佳。

### Q: 如何调整立交桥结构？
A: 编辑 `src/data/trafficData.ts` 中的 `roadSegments` 数组，可以添加、修改或删除道路段。

## 目录结构

```
├── src/
│   ├── components/          # Vue 组件
│   │   ├── ControlPanel.vue # 控制面板
│   │   ├── ViewSwitcher.vue # 视角切换器
│   │   └── StatsPanel.vue   # 统计面板
│   ├── composables/         # 组合式函数
│   │   ├── useThreeScene.ts     # Three.js 场景管理
│   │   ├── useRoadGenerator.ts  # 道路生成器
│   │   ├── useTrafficSystem.ts  # 交通系统
│   │   └── useCameraController.ts # 相机控制器
│   ├── store/               # Pinia 状态管理
│   │   └── sceneStore.ts
│   ├── types/               # TypeScript 类型定义
│   ├── utils/               # 工具函数
│   │   ├── curveUtils.ts       # 曲线计算
│   │   ├── geometryUtils.ts    # 几何生成
│   │   └── materialPresets.ts  # 材质预设
│   ├── data/                # 模拟数据
│   │   └── trafficData.ts      # 道路和交通数据
│   ├── App.vue
│   ├── main.ts
│   └── style.css
├── public/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```
