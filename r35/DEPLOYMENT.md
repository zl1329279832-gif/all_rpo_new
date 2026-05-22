# 物流仓库数字孪生监控系统 - 部署与性能优化指南

## 目录

- [1. 项目概述](#1-项目概述)
- [2. 环境要求](#2-环境要求)
- [3. 部署流程](#3-部署流程)
  - [3.1 开发环境部署](#31-开发环境部署)
  - [3.2 生产环境构建](#32-生产环境构建)
  - [3.3 Nginx 部署配置](#33-nginx-部署配置)
  - [3.4 Docker 部署](#34-docker-部署)
- [4. 性能优化](#4-性能优化)
  - [4.1 Three.js 渲染优化](#41-threejs-渲染优化)
  - [4.2 前端性能优化](#42-前端性能优化)
  - [4.3 网络优化](#43-网络优化)
  - [4.4 内存管理](#44-内存管理)
- [5. 监控与运维](#5-监控与运维)
- [6. 常见问题](#6-常见问题)

---

## 1. 项目概述

本项目是基于 Vue 3 + TypeScript + Three.js + ECharts 构建的物流仓库数字孪生监控系统，实现了仓库三维可视化、实时数据监控、告警管理、轨迹回放等核心功能。

**技术栈**：
- 前端框架：Vue 3.4 + TypeScript 5.4
- 构建工具：Vite 5.2
- 3D 引擎：Three.js 0.160
- 图表库：ECharts 5.4
- 状态管理：Pinia 2.1
- UI 组件：Element Plus 2.5

---

## 2. 环境要求

| 环境 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | >= 18.0.0 | 推荐 LTS 版本 |
| npm | >= 9.0.0 | 或 pnpm >= 8.0.0 |
| 浏览器 | Chrome >= 90, Firefox >= 88, Safari >= 14 | 需支持 WebGL 2.0 |
| 显卡 | 支持硬件加速的独立显卡 | 推荐显存 >= 2GB |
| 内存 | >= 8GB | 推荐 16GB |

### 浏览器 WebGL 检测

```javascript
function checkWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && 
      (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch (e) {
    return false;
  }
}
```

---

## 3. 部署流程

### 3.1 开发环境部署

```bash
# 1. 克隆项目
git clone <repository-url>
cd r35

# 2. 安装依赖
npm install
# 或使用 pnpm（推荐）
pnpm install

# 3. 启动开发服务器
npm run dev

# 4. 访问应用
# 浏览器打开 http://localhost:5173
```

### 3.2 生产环境构建

```bash
# 1. 类型检查与构建
npm run build

# 2. 预览构建结果
npm run preview

# 3. 构建产物位于 dist 目录
# dist/
# ├── assets/          # 静态资源
# │   ├── index-*.js   # 主应用代码
# │   ├── index-*.css  # 样式文件
# │   └── *.svg        # 图标资源
# └── index.html       # 入口 HTML
```

**构建优化配置** (`vite.config.ts`)：

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    target: 'es2020',
    minify: 'terser',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'three-vendor': ['three', '@types/three'],
          'echarts-vendor': ['echarts'],
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'ui-vendor': ['element-plus', '@tweenjs/tween.js'],
        },
      },
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
```

### 3.3 Nginx 部署配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml
        application/json
        application/wasm
        image/svg+xml
        image/png
        image/jpeg
        image/webp;

    # 缓存策略
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # HTML 不缓存
    location ~* \.html$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # 根路径
    location / {
        root /var/www/warehouse-digital-twin/dist;
        index index.html;
        try_files $uri $uri/ /index.html;

        # 安全头
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    }

    # API 代理（如需要连接真实后端）
    location /api/ {
        proxy_pass http://backend-server:8080/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket 支持
        proxy_read_timeout 86400;
    }
}
```

### 3.4 Docker 部署

**Dockerfile**：

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml**：

```yaml
version: '3.8'
services:
  warehouse-digital-twin:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## 4. 性能优化

### 4.1 Three.js 渲染优化

#### 4.1.1 几何与材质优化

```typescript
// ✅ 使用 InstancedMesh 渲染大量重复对象
const instancedMesh = new THREE.InstancedMesh(
  geometry,
  material,
  count
);

// ✅ 共享材质
const sharedMaterial = new THREE.MeshStandardMaterial({...});
for (let i = 0; i < count; i++) {
  const mesh = new THREE.Mesh(geometry, sharedMaterial);
}

// ✅ 几何体合并
const mergedGeometry = mergeGeometries(geometries);

// ✅ LOD (Level of Detail)
const lod = new THREE.LOD();
lod.addLevel(new THREE.Mesh(highPolyGeo, mat), 0);
lod.addLevel(new THREE.Mesh(midPolyGeo, mat), 50);
lod.addLevel(new THREE.Mesh(lowPolyGeo, mat), 100);

// ❌ 避免在循环中创建新对象
for (let i = 0; i < 1000; i++) {
  const mat = new THREE.MeshStandardMaterial({...}); // ❌ 重复创建
}
```

#### 4.1.2 渲染性能优化

```typescript
// ✅ 视锥体剔除（默认开启，确保对象正确设置）
mesh.frustumCulled = true;

// ✅ 阴影优化
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
directionalLight.shadow.mapSize.set(1024, 1024); // 平衡质量与性能
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 200;

// ✅ 像素比限制
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ✅ 后处理优化
// 仅在必要时启用后处理
if (usePostProcessing) {
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    0.6,  // strength - 降低强度提升性能
    0.4,  // radius
    0.3   // threshold
  );
}

// ✅ WebGL 上下文优化
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: false,
  alpha: false,
});
```

#### 4.1.3 动画优化

```typescript
// ✅ 使用 requestAnimationFrame
let animationId: number;
function animate() {
  animationId = requestAnimationFrame(animate);
  // 更新逻辑
  renderer.render(scene, camera);
}

// ✅ 组件卸载时清理
onUnmounted(() => {
  cancelAnimationFrame(animationId);
  renderer.dispose();
  geometry.dispose();
  material.dispose();
  texture.dispose();
});

// ✅ 使用 TWEEN.js 管理动画
import * as TWEEN from '@tweenjs/tween.js';

function update() {
  TWEEN.update(); // 在渲染循环中调用
}

// ✅ 节流高频更新
const throttledUpdate = throttle(() => {
  updateForkliftPositions();
}, 100);
```

### 4.2 前端性能优化

#### 4.2.1 Vue 组件优化

```vue
<!-- ✅ 使用 v-memo 缓存静态内容 -->
<template>
  <div v-memo="[item.id]">
    <ShelfCard :item="item" />
  </div>
</template>

<!-- ✅ 虚拟列表（处理大量告警数据） -->
<template>
  <el-scrollbar height="400px">
    <div ref="containerRef">
      <div
        v-for="(alarm, index) in visibleAlarms"
        :key="alarm.id"
        :style="{ transform: `translateY(${index * itemHeight}px)` }"
      >
        <AlarmItem :alarm="alarm" />
      </div>
    </div>
  </el-scrollbar>
</template>

<!-- ✅ 组件懒加载 -->
<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
const HeavyChart = defineAsyncComponent(() =>
  import('@/charts/HeavyChart.vue')
);
</script>

<template>
  <Suspense>
    <template #default>
      <HeavyChart />
    </template>
    <template #fallback>
      <div class="loading">加载中...</div>
    </template>
  </Suspense>
</template>
```

#### 4.2.2 状态管理优化

```typescript
// ✅ 使用 computed 缓存计算值
const stats = computed<WarehouseStats>(() => {
  const shelves = store.shelves;
  return {
    totalCapacity: shelves.reduce((sum, s) => sum + s.capacity, 0),
    usedCapacity: shelves.reduce((sum, s) => sum + s.usedSlots, 0),
    // ...
  };
});

// ✅ 避免不必要的响应式
const nonReactiveData = markRaw(largeDataset);

// ✅ 批量更新
const batchUpdate = () => {
  store.$patch((state) => {
    state.shelves = updateShelves();
    state.forklifts = updateForklifts();
    state.sensors = updateSensors();
  });
};
```

#### 4.2.3 ECharts 优化

```typescript
// ✅ 延迟初始化
onMounted(() => {
  setTimeout(() => {
    initChart();
  }, 100);
});

// ✅ 数据更新节流
const throttledUpdate = throttle(() => {
  chartInstance?.setOption(option);
}, 1000);

// ✅ 启用增量渲染
chartInstance.setOption(option, {
  notMerge: false,
  lazyUpdate: true,
});

// ✅ 组件卸载时销毁
onUnmounted(() => {
  chartInstance?.dispose();
});

// ✅ 图表配置优化
const option = {
  animation: true,
  animationDuration: 500,      // 降低动画时长
  animationEasing: 'cubicOut',
  progressive: 1000,           // 增量渲染
  progressiveThreshold: 2000,  // 数据量超过时启用
};
```

### 4.3 网络优化

```typescript
// ✅ 数据接口使用 WebSocket 实时推送
const ws = new WebSocket('wss://your-server.com/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updateRealtimeData(data);
};

// ✅ HTTP 接口使用节流/防抖
const debouncedSearch = debounce((query: string) => {
  searchShelves(query);
}, 300);

// ✅ 批量请求
const fetchBatchData = async () => {
  const [shelves, forklifts, sensors] = await Promise.all([
    fetchShelves(),
    fetchForklifts(),
    fetchSensors(),
  ]);
};

// ✅ 启用 HTTP/2 和服务端压缩
// （在 Nginx 配置中启用）
```

### 4.4 内存管理

```typescript
// ✅ Three.js 资源释放
function disposeScene() {
  scene.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
    }
    if ((object as any).texture) {
      (object as any).texture.dispose();
    }
  });

  renderer.dispose();
  controls.dispose();
}

// ✅ 事件监听器清理
const resizeHandler = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

window.addEventListener('resize', resizeHandler);

onUnmounted(() => {
  window.removeEventListener('resize', resizeHandler);
});

// ✅ 定时器清理
let dataTimer: number;
onMounted(() => {
  dataTimer = setInterval(refreshData, 3000);
});

onUnmounted(() => {
  clearInterval(dataTimer);
});

// ✅ Map/Set 清理
const objectCache = new Map();

function clearCache() {
  objectCache.forEach((value) => {
    if (value.dispose) value.dispose();
  });
  objectCache.clear();
}
```

---

## 5. 监控与运维

### 5.1 性能监控

```typescript
// ✅ FPS 监控
let frameCount = 0;
let lastTime = performance.now();

function monitorFPS() {
  frameCount++;
  const currentTime = performance.now();
  if (currentTime - lastTime >= 1000) {
    const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
    console.debug(`FPS: ${fps}`);
    
    if (fps < 30) {
      console.warn('FPS 低于 30，建议优化');
    }
    
    frameCount = 0;
    lastTime = currentTime;
  }
}

// ✅ 内存监控（Chrome 专用）
function monitorMemory() {
  if ((performance as any).memory) {
    const usedMB = (performance as any).memory.usedJSHeapSize / 1048576;
    const limitMB = (performance as any).memory.jsHeapSizeLimit / 1048576;
    
    if (usedMB > limitMB * 0.8) {
      console.warn(`内存使用过高: ${usedMB.toFixed(1)}MB / ${limitMB.toFixed(1)}MB`);
    }
  }
}

// ✅ WebGL 上下文监控
renderer.domElement.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  console.error('WebGL 上下文丢失');
  // 触发页面刷新或降级显示
});

renderer.domElement.addEventListener('webglcontextrestored', () => {
  console.log('WebGL 上下文恢复');
  // 重新初始化场景
  initScene();
});
```

### 5.2 错误处理

```typescript
// ✅ 全局错误捕获
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue 错误:', err, info);
  // 上报错误监控系统
};

window.onerror = (message, source, lineno, colno, error) => {
  console.error('全局错误:', message, source, lineno, colno);
  return true;
};

window.onunhandledrejection = (event) => {
  console.error('未处理的 Promise 拒绝:', event.reason);
};

// ✅ Three.js 错误降级
function initSceneSafe() {
  try {
    initThreeJSScene();
  } catch (error) {
    console.error('3D 场景初始化失败，使用降级方案', error);
    show2DFallback();
  }
}
```

### 5.3 日志策略

```typescript
// ✅ 分级日志
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const currentLevel = import.meta.env.DEV ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;

export const logger = {
  debug: (...args: any[]) => {
    if (currentLevel <= LOG_LEVELS.DEBUG) {
      console.debug('[DEBUG]', ...args);
    }
  },
  info: (...args: any[]) => {
    if (currentLevel <= LOG_LEVELS.INFO) {
      console.info('[INFO]', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (currentLevel <= LOG_LEVELS.WARN) {
      console.warn('[WARN]', ...args);
    }
  },
  error: (...args: any[]) => {
    if (currentLevel <= LOG_LEVELS.ERROR) {
      console.error('[ERROR]', ...args);
      // 生产环境上报
      if (!import.meta.env.DEV) {
        // reportError(args);
      }
    }
  },
};
```

---

## 6. 常见问题

### 6.1 性能问题

**Q: 场景中物体很多时 FPS 很低怎么办？**

A: 按优先级尝试以下优化：
1. 使用 `InstancedMesh` 替代多个独立 Mesh
2. 启用 `frustumCulled` 视锥体剔除
3. 降低阴影贴图分辨率或减少阴影投射物体
4. 降低像素比 `renderer.setPixelRatio(1)`
5. 减少光源数量，使用烘焙光照贴图
6. 启用 LOD 层级细节
7. 考虑使用 WebGL 2.0 的新特性

**Q: 浏览器内存持续增长怎么办？**

A: 检查资源释放：
1. 确认所有 `geometry.dispose()`、`material.dispose()` 被正确调用
2. 检查事件监听器是否被正确移除
3. 避免在渲染循环中创建新对象
4. 使用 Chrome DevTools Memory 面板分析内存泄漏

### 6.2 兼容性问题

**Q: 某些浏览器无法显示 3D 场景？**

A: 检查 WebGL 支持并提供降级方案：
```javascript
if (!checkWebGL()) {
  alert('您的浏览器不支持 WebGL，请升级浏览器或启用硬件加速');
  show2DFallback();
}
```

**Q: 移动端性能太差怎么办？**

A: 提供移动端适配：
1. 降低模型复杂度和数量
2. 关闭阴影和后处理效果
3. 降低渲染分辨率
4. 提供 2D 视图切换选项

### 6.3 部署问题

**Q: 刷新页面出现 404？**

A: 确保 Nginx 配置了正确的 fallback：
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

**Q: 刷新后页面空白？**

A: 检查资源路径，确认 Vite 配置中的 `base` 参数：
```typescript
// vite.config.ts
export default defineConfig({
  base: '/', // 或子路径 '/your-app/'
});
```

---

## 性能指标参考

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 首屏加载时间 | < 3s | 从请求到可交互 |
| 3D 场景 FPS | >= 45 | 桌面端 |
| 移动端 FPS | >= 30 | 中高端机型 |
| 内存占用 | < 500MB | 稳定运行时 |
| 包体积 | < 2MB gzipped | 首屏资源 |
| API 响应时间 | < 500ms | 实时数据接口 |
| 标签跟随延迟 | < 16ms | DOM 标签更新 |

---

## 更新日志

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2024-01-xx | 初始版本，包含完整功能 |
