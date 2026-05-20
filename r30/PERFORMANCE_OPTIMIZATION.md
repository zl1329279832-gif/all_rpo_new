# 3D 虚拟展厅性能优化思路

## 一、渲染性能优化

### 1. 模型优化
- **LOD (Level of Detail) 技术**：根据相机距离自动切换不同精度的模型
- **面数优化**：使用 Blender 等工具进行减面处理，保持外观的同时降低三角面数
- **贴图压缩**：使用 Basis Universal 或 KTX2 格式压缩纹理，减少 GPU 内存占用
- **实例化渲染**：如果场景中有重复物体（如多辆汽车），使用 `THREE.InstancedMesh`

### 2. 材质与着色器优化
- **合并材质**：尽可能减少材质数量，使用纹理图集（Texture Atlas）
- **关闭不必要的特性**：如 `aoMap`、`emissiveMap`、`bumpMap` 等如非必要不要启用
- **使用 MeshStandardMaterial 替代 MeshPhysicalMaterial**：后者性能开销更大
- **透明度优化**：减少透明材质数量，透明物体需要额外的排序和绘制

### 3. 阴影优化
```javascript
// 减小阴影贴图尺寸
light.shadow.mapSize.width = 1024;
light.shadow.mapSize.height = 1024;

// 限制阴影相机范围
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 15;
light.shadow.camera.left = -8;
light.shadow.camera.right = 8;
light.shadow.camera.top = 8;
light.shadow.camera.bottom = -8;

// 使用更高效的阴影类型
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 比 VSM 快
```

## 二、代码架构优化

### 1. 资源管理
- **对象池模式**：对于频繁创建销毁的对象使用对象池复用
- **延迟加载**：非关键资源使用异步加载，首屏只加载必要内容
- **资源预加载**：使用 LoadingManager 统一管理加载进度

```javascript
const manager = new THREE.LoadingManager();
manager.onProgress = (url, loaded, total) => {
  console.log((loaded / total * 100) + '% loaded');
};
```

### 2. 动画系统优化
- **节流更新**：非关键动画可降低更新频率（如 30fps）
- **避免每帧创建对象**：在 update 循环中不要 new 对象
- **使用 requestAnimationFrame 同步**：所有动画统一由主循环驱动

### 3. 交互优化
- **Raycaster 优化**：减少检测对象数量，使用图层过滤
```javascript
// 使用图层分离交互对象
doorMesh.layers.set(1);
raycaster.layers.set(1);
```
- **点击检测降频**：mousemove 事件使用节流（throttle）
- **避免复杂计算**：在交互回调中不要执行 heavy operation

## 三、WebGL 性能调优

### 1. 状态管理
- **减少 WebGL 调用**：合并相同材质的物体，减少 draw call
- **状态缓存**：避免重复设置相同的 WebGL 状态
- **合理排序**：不透明物体从前到后渲染，透明物体从后到前

### 2. 像素比控制
```javascript
// 限制最高像素比，移动端可进一步降低
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
```

### 3. 上下文丢失处理
```javascript
renderer.domElement.addEventListener(
  'webglcontextlost',
  (event) => {
    event.preventDefault();
    cancelAnimationFrame(animationId);
  },
  false
);
```

## 四、内存管理

### 1. 资源释放
```javascript
// 完整的 dispose 流程
object.traverse((child) => {
  if (child.geometry) child.geometry.dispose();
  if (child.material) {
    if (Array.isArray(child.material)) {
      child.material.forEach(m => {
        Object.values(m).forEach(prop => {
          if (prop && prop.isTexture) prop.dispose();
        });
        m.dispose();
      });
    } else {
      Object.values(child.material).forEach(prop => {
        if (prop && prop.isTexture) prop.dispose();
      });
      child.material.dispose();
    }
  }
});
scene.remove(object);
```

### 2. 避免内存泄漏
- 组件卸载时务必移除事件监听器
- 取消所有 pending 的动画帧请求
- 清除缓存的数据和引用

## 五、加载性能优化

### 1. 模型压缩
- 使用 glTF-Pipeline 压缩 GLB 文件
- 启用 Draco 压缩几何体
```javascript
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');
gltfLoader.setDRACOLoader(dracoLoader);
```

### 2. 渐进式加载
1. 先加载低精度模型
2. 显示加载进度
3. 后台加载高精度模型
4. 加载完成后无缝切换

### 3. 代码分割
```javascript
// vite.config.js
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        three: ['three'],
        'three-addons': ['three/addons/controls/OrbitControls.js'],
      }
    }
  }
}
```

## 六、移动端优化

### 1. 性能降级策略
```javascript
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

if (isMobile) {
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = false;
  controls.enableDamping = false;
}
```

### 2. 触摸交互优化
- 增加点击检测区域大小
- 实现双指旋转/缩放手势
- 减少同时进行的动画数量

## 七、性能监控

### 1. 使用 stats.js 监控 FPS
```javascript
import Stats from 'stats.js';
const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb
document.body.appendChild(stats.dom);

function animate() {
  stats.begin();
  // render...
  stats.end();
}
```

### 2. Chrome DevTools 分析
- 使用 Performance 面板分析帧率
- 使用 Memory 面板检测内存泄漏
- 使用 WebGL Inspector 检查 draw call

## 八、常见性能瓶颈排查

| 问题 | 可能原因 | 解决方案 |
|------|---------|---------|
| 帧率低 | 模型面数过高 | 减面 / LOD |
| 加载慢 | 贴图太大 | 压缩纹理 / 渐进式加载 |
| 内存持续增长 | 资源未释放 | 检查 dispose 逻辑 |
| 点击卡顿 | Raycaster 检测对象多 | 图层过滤 / 对象池 |
| 移动端崩溃 | 显存不足 | 降低分辨率 / 关闭阴影 |
