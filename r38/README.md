# 校园安防三维态势展示系统

基于 Vue 3 + TypeScript + Three.js + ECharts 构建的校园安防三维态势展示前端应用。

## 功能特性

### 三维场景展示
- 校园全景三维模型，包含教学楼、宿舍楼、道路、出入口
- 监控摄像头、消防设备（灭火器、消防栓、烟雾探测器）可视化
- 设备状态标识：在线（绿色）、离线（灰色）、故障（橙色）、告警（红色）
- 支持场景旋转、缩放、平移操作
- 自适应窗口大小

### 交互功能
- 建筑/设备搜索定位
- 设备点击查看详情
- 告警类型筛选（全部/紧急/高/中/低）
- 告警列表联动定位
- 模拟事件自动播放
- 标签显示/隐藏切换
- 视角重置

### 数据面板
- 设备在线率统计
- 24小时告警趋势图
- 区域风险分布
- 响应统计（平均响应时间、处置完成率）

## 技术栈

- **框架**: Vue 3.4 + TypeScript
- **构建工具**: Vite 5
- **3D引擎**: Three.js 0.160
- **图表库**: ECharts 5.4
- **动画库**: Tween.js
- **代码规范**: TypeScript Strict Mode

## 项目结构

```
src/
├── components/           # Vue 组件
│   ├── Header.vue        # 顶部导航栏
│   ├── ThreeScene.vue    # 3D场景容器
│   ├── DataPanel.vue     # 数据统计面板
│   ├── AlarmPanel.vue    # 告警列表面板
│   ├── SearchBar.vue     # 搜索定位栏
│   └── DeviceDetail.vue  # 设备详情弹窗
├── three/               # Three.js 核心模块
│   ├── SceneManager.ts   # 场景管理器
│   ├── ModelFactory.ts   # 模型生成工厂
│   ├── InteractionManager.ts  # 交互拾取
│   ├── LabelSystem.ts    # 标注系统
│   ├── AnimationController.ts # 动画控制
│   ├── OrbitControls.ts  # 轨道控制器
│   ├── constants.ts      # 常量配置
│   ├── utils.ts          # 工具函数
│   └── index.ts          # 模块导出
├── data/                # 模拟数据
│   ├── buildings.ts      # 建筑数据
│   ├── devices.ts        # 设备数据
│   ├── gates.ts          # 出入口数据
│   ├── alarms.ts         # 告警数据
│   ├── statistics.ts     # 统计数据
│   └── index.ts          # 数据导出
├── types/               # TypeScript 类型定义
│   └── index.ts
├── styles/              # 全局样式
│   └── global.css
├── App.vue              # 根组件
└── main.ts              # 应用入口
```

## Three.js 模块说明

### SceneManager（场景管理）
- 场景初始化、相机配置、渲染器设置
- 光照系统（环境光、平行光、半球光、点光源）
- 建筑、设备、告警对象的加载与管理
- 资源释放机制

### ModelFactory（模型生成）
- 程序化生成建筑模型（多层结构、窗户、屋顶）
- 设备模型（摄像头、灭火器、烟雾探测器等）
- 道路、地面、草地等环境元素
- 材质缓存复用，优化性能

### InteractionManager（交互拾取）
- Raycaster 射线检测
- 鼠标/触摸事件处理
- 点击拾取与悬停检测
- 拖动/点击区分阈值

### LabelSystem（标注系统）
- Canvas 纹理生成文字标签
- Sprite 面向相机
- 标签显隐控制
- 动态更新标签内容

### AnimationController（动画控制）
- Tween.js 相机飞行动画
- 设备脉冲告警动画
- 自定义动画注册机制
- 物体高亮闪烁效果

### OrbitControls（轨道控制）
- 鼠标左键旋转
- 鼠标右键平移
- 滚轮缩放
- 触摸手势支持
- 阻尼平滑效果

## 快速开始

### 安装依赖
```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

### 构建生产版本
```bash
npm run build
```

### 预览生产构建
```bash
npm run preview
```

## 操作指南

### 场景操作
- **旋转视角**: 按住鼠标左键拖动
- **平移场景**: 按住鼠标右键拖动
- **缩放视图**: 滚动鼠标滚轮
- **重置视角**: 点击顶部"重置视角"按钮
- **切换标签**: 点击顶部"显示/隐藏标签"按钮

### 设备操作
- **查看详情**: 点击场景中的设备图标
- **搜索定位**: 在顶部搜索框输入建筑或设备名称
- **告警定位**: 在告警列表中点击定位按钮

### 告警筛选
- 点击告警面板顶部的筛选标签
- 支持按紧急程度筛选：全部、紧急、高、中、低

## 性能优化

- **材质复用**: 相同颜色材质共享引用
- **几何体合并**: 同类几何体批量处理
- **像素比限制**: 最大像素比 2，避免高 DPI 设备性能损耗
- **阴影优化**: 仅关键物体投射阴影
- **LOD 策略**: 远距离设备简化渲染
- **资源释放**: 组件卸载时完整清理 Three.js 资源

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

需要支持 WebGL 2.0 的现代浏览器。

## 许可证

MIT License
