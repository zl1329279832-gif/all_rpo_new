<template>
  <div class="help-overlay" @click.self="$emit('close')">
    <div class="help-content">
      <div class="help-header">
        <h2 class="help-title">使用帮助</h2>
        <button class="close-btn" @click="$emit('close')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="help-body">
        <div class="help-section">
          <h3 class="section-title">🏯 项目简介</h3>
          <p class="section-text">
            本项目使用 Vue 3、TypeScript 和 Three.js 构建了一个高还原度的中式古建筑院落三维场景。
            场景包含传统四合院的典型布局：正殿、东西厢房、牌楼、院墙等建筑元素，
            完整展现了中国古建筑的木结构体系、屋顶形制和装饰艺术。
          </p>
        </div>

        <div class="help-section">
          <h3 class="section-title">🎮 操作说明</h3>

          <div class="operation-group">
            <h4 class="operation-title">俯视模式</h4>
            <ul class="operation-list">
              <li><span class="key">鼠标左键拖动</span> 旋转视角</li>
              <li><span class="key">滚轮</span> 缩放场景</li>
            </ul>
          </div>

          <div class="operation-group">
            <h4 class="operation-title">漫游模式</h4>
            <ul class="operation-list">
              <li><span class="key">鼠标左键点击</span> 锁定鼠标</li>
              <li><span class="key">W / ↑</span> 向前移动</li>
              <li><span class="key">S / ↓</span> 向后移动</li>
              <li><span class="key">A / ←</span> 向左移动</li>
              <li><span class="key">D / →</span> 向右移动</li>
              <li><span class="key">Space</span> 上升</li>
              <li><span class="key">Shift</span> 下降</li>
              <li><span class="key">ESC</span> 退出鼠标锁定</li>
            </ul>
          </div>

          <div class="operation-group">
            <h4 class="operation-title">交互功能</h4>
            <ul class="operation-list">
              <li><span class="key">鼠标悬停</span> 显示构件预览信息</li>
              <li><span class="key">鼠标点击</span> 查看构件详细说明</li>
              <li><span class="key">点击空白处</span> 取消选择</li>
            </ul>
          </div>
        </div>

        <div class="help-section">
          <h3 class="section-title">🏗️ 建筑结构分层</h3>
          <div class="layer-list">
            <div class="layer-item">
              <span class="layer-icon">⬜</span>
              <div>
                <span class="layer-name">地基台基</span>
                <span class="layer-desc">石台基、台阶、栏杆、地面</span>
              </div>
            </div>
            <div class="layer-item">
              <span class="layer-icon">🪵</span>
              <div>
                <span class="layer-name">梁柱结构</span>
                <span class="layer-desc">立柱、梁枋、斗拱等木构件</span>
              </div>
            </div>
            <div class="layer-item">
              <span class="layer-icon">🧱</span>
              <div>
                <span class="layer-name">墙体门窗</span>
                <span class="layer-desc">砖墙、隔扇门、花窗</span>
              </div>
            </div>
            <div class="layer-item">
              <span class="layer-icon">🏠</span>
              <div>
                <span class="layer-name">屋顶系统</span>
                <span class="layer-desc">瓦片、屋脊、飞檐、脊兽</span>
              </div>
            </div>
          </div>
        </div>

        <div class="help-section">
          <h3 class="section-title">☀️ 光照模式</h3>
          <div class="light-list">
            <div class="light-item">
              <span class="light-icon">☀️</span>
              <span class="light-name">白天</span>
              <span class="light-desc">明亮的自然日光，适合观察建筑细节</span>
            </div>
            <div class="light-item">
              <span class="light-icon">🌅</span>
              <span class="light-name">黄昏</span>
              <span class="light-desc">温暖的金色余晖，营造古典氛围</span>
            </div>
            <div class="light-item">
              <span class="light-icon">🌙</span>
              <span class="light-name">夜晚</span>
              <span class="light-desc">灯笼点亮，感受庭院夜色</span>
            </div>
          </div>
        </div>

        <div class="help-section">
          <h3 class="section-title">📁 代码结构</h3>
          <div class="code-structure">
            <pre><code>src/
├── builders/           # 建筑组件生成
│   ├── BaseComponents.ts    # 基础构件（柱、梁、斗拱等）
│   └── BuildingComponents.ts # 主体建筑（正殿、厢房、牌楼）
├── materials/          # 纹理材质系统
│   ├── TextureManager.ts    # 程序化纹理生成
│   └── MaterialLibrary.ts   # 预设材质库
├── lighting/           # 光照系统
│   └── LightingSystem.ts    # 三种光照模式
├── controls/           # 相机控制
│   └── CameraControls.ts    # 漫游/俯视双模式
├── interactions/       # 交互系统
│   └── ComponentLabelSystem.ts # 构件标签系统
├── scene/              # 场景管理
│   └── SceneManager.ts      # 场景组装与分层
├── stores/             # 状态管理
│   └── sceneStore.ts        # Pinia 状态
├── components/         # Vue 组件
│   ├── SceneCanvas.vue      # Three.js 画布
│   ├── ControlPanel.vue     # 控制面板
│   └── ...
└── types/              # 类型定义
    └── index.ts</code></pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  (e: 'close'): void
}>()
</script>

<style scoped>
.help-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  overflow-y: auto;
}

.help-content {
  background: linear-gradient(135deg, rgba(25, 25, 30, 0.98), rgba(35, 30, 25, 0.98));
  border: 1px solid rgba(255, 215, 0, 0.25);
  border-radius: 20px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}

.help-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  background: linear-gradient(135deg, rgba(139, 26, 26, 0.3), rgba(184, 134, 11, 0.15));
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
  position: sticky;
  top: 0;
  z-index: 10;
}

.help-title {
  font-size: 24px;
  font-weight: 600;
  color: #ffd700;
  margin: 0;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #888;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 100, 100, 0.3);
  color: #ff6b6b;
}

.help-body {
  padding: 28px 32px 32px;
  color: #e0e0e0;
}

.help-section {
  margin-bottom: 28px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #d4a84b;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.15);
}

.section-text {
  font-size: 14px;
  line-height: 1.8;
  color: #c0c0c0;
  margin: 0;
}

.operation-group {
  margin-bottom: 16px;
}

.operation-title {
  font-size: 14px;
  font-weight: 500;
  color: #ffd700;
  margin: 0 0 10px 0;
}

.operation-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.operation-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  font-size: 13px;
  color: #b0b0b0;
}

.key {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 6px;
  font-family: 'Consolas', monospace;
  font-size: 11px;
  color: #ffd700;
  min-width: 120px;
  text-align: center;
}

.layer-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 215, 0, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(255, 215, 0, 0.1);
}

.layer-icon {
  font-size: 24px;
}

.layer-item > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.layer-name {
  font-size: 14px;
  font-weight: 500;
  color: #ffd700;
}

.layer-desc {
  font-size: 12px;
  color: #888;
}

.light-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.light-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 215, 0, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(255, 215, 0, 0.1);
}

.light-icon {
  font-size: 24px;
}

.light-name {
  font-size: 14px;
  font-weight: 500;
  color: #ffd700;
  min-width: 60px;
}

.light-desc {
  font-size: 12px;
  color: #888;
}

.code-structure {
  background: rgba(0, 0, 0, 0.4);
  border-radius: 10px;
  padding: 16px;
  border: 1px solid rgba(255, 215, 0, 0.15);
  overflow-x: auto;
}

.code-structure pre {
  margin: 0;
}

.code-structure code {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.7;
  color: #a0a0a0;
}
</style>
