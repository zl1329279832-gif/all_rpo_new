# 港口集装箱堆场三维运行监控系统 - 部署说明

## 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0 或 pnpm >= 8.0.0

## 安装依赖

```bash
npm install
```

或使用 pnpm：

```bash
pnpm install
```

## 开发模式

```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

## 生产构建

```bash
npm run build
```

构建产物将输出到 `dist` 目录。

## 预览生产构建

```bash
npm run preview
```

## 项目结构

```
├── src/
│   ├── components/          # UI 组件
│   ├── scene/              # Three.js 3D 场景模块
│   │   ├── SceneManager.ts    # 场景管理器
│   │   ├── ModelFactory.ts    # 模型工厂
│   │   ├── InstancedRenderer.ts # 实例化渲染器
│   │   ├── Raycaster.ts       # 射线拾取
│   │   ├── LabelManager.ts    # 标签管理
│   │   └── AnimationManager.ts # 动画管理
│   ├── services/           # 数据服务
│   │   └── MockDataService.ts # 模拟数据服务
│   ├── types/              # TypeScript 类型定义
│   ├── App.vue             # 根组件
│   ├── main.ts             # 入口文件
│   └── style.css           # 全局样式
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 主要功能模块

### 1. 3D 场景渲染
- 使用 Three.js 进行 3D 渲染
- 支持 InstancedMesh 批量渲染集装箱
- OrbitControls 实现旋转、缩放、平移

### 2. 场景元素
- **泊位**：船舶停靠区域，显示装卸状态
- **堆场区块**：集装箱堆放区域，支持危险品标记
- **岸桥**：岸边集装箱起重机，显示作业状态
- **集卡**：集装箱卡车，模拟行驶路径
- **道路**：显示拥堵状态
- **集装箱**：不同颜色表示状态（正常/超时/危险品）

### 3. 交互功能
- 点击对象查看详情
- 搜索箱号或设备
- 切换作业区域显示
- 过滤告警等级
- 播放/暂停模拟动画

### 4. 数据面板
- 吞吐量统计图表
- 设备利用率统计
- 拥堵趋势图
- 告警数量统计

## 性能优化

1. **实例化渲染**：大量集装箱使用 InstancedMesh
2. **视锥体剔除**：不可见对象不渲染
3. **LOD**：远处对象降低细节
4. **材质复用**：相同材质共享引用

## 配置说明

可在 `src/scene/config.ts` 中调整场景配置：

```typescript
export const SceneConfig = {
  containerCount: 2000,    // 集装箱数量
  truckCount: 30,          // 集卡数量
  craneCount: 6,           // 岸桥数量
  enableAnimation: true,   // 启用动画
  enableLabels: true       // 显示标签
}
```

## 浏览器兼容性

- Chrome >= 90
- Firefox >= 88
- Edge >= 90
- Safari >= 14

需要支持 WebGL 2.0。
