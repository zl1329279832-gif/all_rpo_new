# 中式古建筑院落三维场景

基于 Vue 3 + TypeScript + Three.js 构建的高还原度中式古建筑院落三维可视化项目。

## 🏯 项目简介

本项目使用程序化建模方式构建了一个完整的中式四合院建筑群，包含正殿、东西厢房、牌楼、院墙等传统建筑元素。场景完整展现了中国古建筑的木结构体系、屋顶形制、装饰艺术和空间布局特色。

### 核心特色

- **高还原度建筑细节**：斗拱、飞檐、屋脊、鸱吻、脊兽等传统建筑构件完整呈现
- **三种光照模式**：白天、黄昏、夜晚，支持实时切换
- **双视角控制**：俯视浏览模式 + 第一人称漫游模式
- **结构分层展示**：地基、梁柱、墙体、屋顶逐层显示，便于学习建筑结构
- **交互式构件说明**：点击任意建筑构件查看详细介绍
- **程序化纹理**：无需外部图片资源，所有纹理通过 Canvas API 实时生成

## 🏗️ 建筑组成

### 主体建筑

| 建筑 | 说明 |
|------|------|
| **正殿** | 重檐歇山顶，面阔五间，是院落的主体建筑，等级最高 |
| **东厢房** | 硬山顶，面阔三间，位于院落东侧 |
| **西厢房** | 硬山顶，面阔三间，位于院落西侧 |
| **牌楼** | 三间四柱三楼式，作为院落入口的标志性建筑 |
| **院墙** | 青砖砌筑，围合出完整的四合院空间 |

### 建筑构件

- **屋顶系统**：筒瓦铺设、正脊、垂脊、鸱吻、脊兽、飞檐翘角
- **木结构**：立柱、梁枋、斗拱、雀替
- **围护结构**：青砖墙体、隔扇门、棂格花窗
- **台基栏杆**：石台基、垂带踏步、木栏杆
- **装饰元素**：宫灯、匾额、门环、脊饰
- **环境配置**：庭院树木、盆栽、石板甬路

## 🎮 操作说明

### 俯视模式（默认）

- `鼠标左键拖动` - 旋转视角
- `滚轮` - 缩放场景

### 漫游模式

- `鼠标左键点击` - 锁定鼠标进入漫游
- `W / ↑` - 向前移动
- `S / ↓` - 向后移动
- `A / ←` - 向左移动
- `D / →` - 向右移动
- `Space` - 上升
- `Shift` - 下降
- `ESC` - 退出鼠标锁定

### 交互功能

- `鼠标悬停` - 显示构件预览信息
- `鼠标点击` - 查看构件详细说明
- `点击空白处` - 取消选择

## 📁 代码结构

```
src/
├── builders/              # 建筑组件生成模块
│   ├── BaseComponents.ts     # 基础构件（柱、梁、斗拱、瓦片、门窗等）
│   └── BuildingComponents.ts # 主体建筑（正殿、厢房、牌楼、院墙）
├── materials/             # 纹理材质模块
│   ├── TextureManager.ts     # 程序化纹理生成器（单例模式）
│   └── MaterialLibrary.ts    # 预设材质库
├── lighting/              # 光照系统模块
│   └── LightingSystem.ts     # 三种光照模式管理
├── controls/              # 相机控制模块
│   └── CameraControls.ts     # 漫游/俯视双模式控制器
├── interactions/          # 交互系统模块
│   └── ComponentLabelSystem.ts # 射线拾取与构件标签
├── scene/                 # 场景管理模块
│   └── SceneManager.ts       # 场景组装、分层、动画
├── stores/                # 状态管理
│   └── sceneStore.ts         # Pinia 全局状态
├── components/            # Vue UI 组件
│   ├── SceneCanvas.vue       # Three.js 渲染画布
│   ├── ControlPanel.vue      # 控制面板（光照、视角、分层）
│   ├── ComponentInfoPanel.vue # 构件信息面板
│   ├── HelpOverlay.vue       # 帮助文档覆盖层
│   └── LoadingOverlay.vue    # 加载动画
├── types/                 # 类型定义
│   └── index.ts
├── App.vue                # 根组件
└── main.ts                # 应用入口
```

## 🚀 运行方式

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0

### 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 开发模式

```bash
npm run dev
```

启动后访问 `http://localhost:5173`

### 生产构建

```bash
npm run build
```

构建产物将输出到 `dist` 目录

### 预览构建结果

```bash
npm run preview
```

### 类型检查

```bash
npm run type-check
```

## 🎨 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.4.x | 前端框架 |
| TypeScript | 5.3.x | 类型安全 |
| Three.js | 0.160.x | 3D 渲染引擎 |
| Pinia | 2.1.x | 状态管理 |
| Vite | 5.0.x | 构建工具 |

## 🔧 核心模块说明

### 1. 建筑组件生成 (builders/)

**BaseComponents** 提供 13 种基础建筑构件的程序化生成：

- `createColumn()` - 红漆立柱（带柱础、柱帽）
- `createBeam()` - 木梁
- `createDougong()` - 斗拱（斗、升、拱、翘、昂）
- `createTileRow()` - 筒瓦垄（带瓦当、滴水）
- `createRidge()` - 屋脊（带鸱吻、脊兽）
- `createEave()` - 飞檐（曲线翘角）
- `createWindow()` - 棂格花窗
- `createDoor()` - 隔扇门（带门环、门槛）
- `createStoneStep()` - 垂带台阶
- `createRailing()` - 木栏杆（望柱、寻杖、栏板）
- `createLantern()` - 宫灯（带点光源）
- `createTree()` - 庭院树木

**BuildingComponents** 组合基础构件生成主体建筑：

- `createMainHall()` - 正殿（重檐歇山顶）
- `createWingRoom()` - 厢房（硬山顶）
- `createPaifang()` - 牌楼（三间四柱三楼）
- `createCourtyardWalls()` - 院墙（带花窗）
- `createFoundation()` - 台基
- `createGround()` - 地面石板

### 2. 纹理材质系统 (materials/)

**TextureManager**（单例模式）通过 Canvas API 程序化生成 8 种纹理：

- `createStoneFloorTexture()` - 青石板地面（错缝铺设）
- `createBrickTexture()` - 青砖墙体
- `createTileTexture()` - 筒瓦屋面
- `createWoodTexture()` - 木材纹理（年轮、结疤）
- `createLatticePattern()` - 窗格棂花
- `createRedPaintTexture()` - 红漆饰面
- `createGoldPaintTexture()` - 贴金装饰
- `createStoneTexture()` - 石材纹理

**MaterialLibrary** 提供 16 种预定义材质：

```typescript
MaterialLibrary.greyTileRoof      // 灰筒瓦屋面
MaterialLibrary.redWoodColumn     // 红漆木柱
MaterialLibrary.darkWoodBeam      // 深木色梁枋
MaterialLibrary.brickWall         // 青砖墙
MaterialLibrary.stoneFloor        // 石板地面
MaterialLibrary.latticeWindow     // 棂格窗
MaterialLibrary.goldDecorative    // 金色装饰
MaterialLibrary.lanternPaper      // 灯笼纸（发光）
...
```

### 3. 光照系统 (lighting/)

**LightingSystem** 支持三种光照模式实时切换：

| 模式 | 环境光 | 主光源 | 雾气 | 背景 |
|------|--------|--------|------|------|
| ☀️ 白天 | 冷白光 0.7 | 暖白光 1.2 (高角度) | 淡蓝色薄雾 | 天空蓝 |
| 🌅 黄昏 | 暖橙色 0.5 | 金色光 0.8 (低角度) | 橙色雾气 | 橙红色 |
| 🌙 夜晚 | 深蓝光 0.15 | 冷蓝光 0.3 | 深蓝色浓雾 | 近黑色 |

夜晚模式自动点亮 4 盏点光源，模拟灯笼发光效果。

### 4. 相机控制 (controls/)

**CameraControls** 实现双模式控制：

- **俯视模式**：球坐标轨道控制器，支持拖拽旋转、滚轮缩放
- **漫游模式**：基于 Pointer Lock API 的 FPS 控制，支持 WASD + Space/Shift 六自由度移动

### 5. 构件标签系统 (interactions/)

**ComponentLabelSystem** 基于 Raycaster 实现：

- 鼠标悬停高亮 + 预览提示
- 鼠标点击选中 + 详细信息面板
- 包含 20+ 种建筑构件的详细说明（来源 [types/index.ts](src/types/index.ts)）

### 6. 场景管理 (scene/)

**SceneManager** 负责：

- 场景整体布局与组装
- 建筑结构分层显示（地基→梁柱→墙体→屋顶）
- 环境动画（树木微摆、灯光闪烁）
- 资源清理与释放

## 📐 传统建筑知识

### 屋顶形制

| 形制 | 等级 | 应用 |
|------|------|------|
| 重檐歇山顶 | 最高 | 正殿 |
| 硬山顶 | 较低 | 厢房 |
| 牌楼顶 | - | 入口 |

### 木结构体系

- **抬梁式**：柱上搁梁，梁上搁短柱，逐层向上
- **斗拱**：立柱与横梁交接处的承重构件，兼具装饰性
- **侧脚**：立柱微向内倾斜，增强稳定性
- **生起**：立柱由中间向两端逐渐升高

### 装饰文化

- **脊兽**：屋脊上的神兽，数量越多等级越高
- **鸱吻**：正脊两端的龙形装饰，寓意防火
- **门当户对**：门口的装饰构件，象征门第等级
- **匾额**：门楣上的题字，彰显文化内涵

## 🔒 .gitignore 说明

已排除以下内容：

```
node_modules/              # 依赖包
dist/                      # 构建产物
texture_cache/             # 纹理缓存
*.png, *.jpg, *.webp       # 截图和图片
*.log                      # 日志文件
.vscode/                   # 编辑器配置
.env                       # 环境变量
coverage/                  # 测试覆盖率
*.tsbuildinfo              # TypeScript 缓存
```

## 📝 开发说明

### 添加新的建筑构件

1. 在 `BaseComponents` 中添加构件生成方法
2. 在 `types/index.ts` 的 `COMPONENT_INFO` 中添加构件说明
3. 如需要新材质，在 `TextureManager` 添加纹理生成方法，在 `MaterialLibrary` 添加材质

### 扩展光照模式

在 `LightingSystem` 的 `lightConfigs` 中添加新的光照配置即可。

### 性能优化建议

- 降低 `tileCount` 和 `rafterCount` 可提高性能
- 减少阴影贴图尺寸（2048 → 1024）
- 关闭不必要的实时阴影
- 启用 `postProcessing` 时注意性能开销

## 🐛 常见问题

**Q: 页面显示空白？**

A: 检查浏览器是否支持 WebGL2，建议使用 Chrome/Edge/Firefox 最新版本。

**Q: 场景加载很慢？**

A: 首次加载需要生成所有程序化纹理，属于正常现象。后续可考虑纹理缓存。

**Q: 漫游模式下鼠标无法移动？**

A: 点击画面锁定鼠标后才能控制视角，按 ESC 退出。

## 📄 License

MIT License

## 🙏 致谢

参考了大量中国古建筑资料，力求在比例和形制上贴近传统。如有疏漏，欢迎指正。
