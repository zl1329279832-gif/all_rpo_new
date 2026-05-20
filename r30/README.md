# 虚拟概念跑车沉浸式展厅

基于 Vue 3 + Vite + Three.js 构建的线上 3D 虚拟车展应用。

## 功能特性

- 🚗 **3D 实时渲染**：基于 Three.js 的高性能 3D 渲染引擎
- 🎨 **车身颜色定制**：8 种预设颜色可供选择
- 🖱️ **交互式体验**：
  - 鼠标拖拽旋转视角
  - 滚轮缩放
  - 右键平移
  - 点击车门开合
- 📱 **响应式设计**：完美适配桌面端和移动端
- ⚡ **加载进度**：实时显示模型加载进度
- 💡 **专业光照**：多光源系统 + HDR 环境光支持

## 技术栈

- **前端框架**: Vue 3 (Composition API)
- **构建工具**: Vite 5
- **3D 引擎**: Three.js r160
- **样式**: Vue Scoped CSS

## 项目结构

```
├── src/
│   ├── scene/              # Three.js 场景模块
│   │   ├── SceneManager.js     # 场景管理器（相机、渲染器、控制器）
│   │   ├── LightingSystem.js   # 光照系统（环境光、主光、补光、轮廓光）
│   │   ├── CarModel.js         # 车辆模型管理（加载、交互、车门开合）
│   │   └── ShowroomScene.js    # 场景门面（统一入口）
│   ├── App.vue             # 主组件（加载进度条、颜色菜单、画布集成）
│   ├── main.js             # 入口文件
│   └── style.css           # 全局样式
├── public/                 # 静态资源目录
│   ├── models/             # 3D 模型文件 (.glb, .gltf) - Git 忽略
│   └── hdr/                # HDR 环境贴图 - Git 忽略
├── vite.config.js          # Vite 配置
├── package.json            # 依赖配置
└── .gitignore              # Git 忽略规则（含 3D 文件）
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 生产构建

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

## 使用真实 3D 模型

项目默认使用内置的程序化生成模型。如需使用真实的跑车模型：

1. 将 `.glb` 或 `.gltf` 模型文件放入 `public/models/` 目录
2. 如有 HDR 环境贴图，放入 `public/hdr/` 目录
3. 修改 `src/App.vue` 中的初始化代码：

```javascript
await showroom.init({
  carModelPath: '/models/your-sports-car.glb',  // 你的模型路径
  hdrPath: '/hdr/studio_env.hdr'                // 可选：HDR 环境贴图
})
```

### 模型命名规范

为了让车门交互功能正常工作，模型中的车门部件命名需要包含：
- 左车门：名称包含 `door` 和 `left`（或中文 `左车门`）
- 右车门：名称包含 `door` 和 `right`（或中文 `右车门`）
- 车身：名称包含 `body`（或中文 `车身`、`外壳`）

## 代码架构设计

### 模块化设计原则

1. **单一职责**：每个模块只负责一个功能
2. **依赖注入**：场景管理器通过构造函数注入到子模块
3. **门面模式**：`ShowroomScene` 提供统一的对外接口
4. **生命周期管理**：每个模块都有完整的 `init` / `start` / `stop` / `dispose` 方法

### Vue 与 Three.js 解耦

- Vue 只负责 UI 层（加载进度、颜色菜单、控制面板）
- Three.js 逻辑完全封装在 `src/scene/` 目录下
- 通过 `ref` 获取 canvas DOM 节点，不直接操作 Three.js
- 事件回调实现 Vue 与 3D 场景的通信

### 性能优化

详见 [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md)

## License

MIT
