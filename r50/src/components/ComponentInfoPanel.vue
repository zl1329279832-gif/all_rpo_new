<template>
  <Transition name="slide">
    <div v-if="sceneStore.selectedComponent" class="info-panel">
      <div class="info-header">
        <div class="info-category">
          <span class="category-badge">{{ sceneStore.selectedComponent.category }}</span>
        </div>
        <button class="close-btn" @click="closePanel">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <h3 class="info-title">{{ sceneStore.selectedComponent.name }}</h3>

      <div class="info-body">
        <p class="info-description">{{ sceneStore.selectedComponent.description }}</p>

        <div class="info-meta">
          <div class="meta-item">
            <span class="meta-label">构件编号</span>
            <span class="meta-value">{{ sceneStore.selectedComponent.id }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">空间位置</span>
            <span class="meta-value">
              ({{ formatPosition(sceneStore.selectedComponent.position.x) }},
              {{ formatPosition(sceneStore.selectedComponent.position.y) }},
              {{ formatPosition(sceneStore.selectedComponent.position.z) }})
            </span>
          </div>
        </div>

        <div class="info-tip">
          <span class="tip-icon">💡</span>
          <span>点击场景空白处取消选择</span>
        </div>
      </div>
    </div>
  </Transition>

  <Transition name="fade">
    <div v-if="sceneStore.hoveredComponent && !sceneStore.selectedComponent" class="hover-tooltip">
      <div class="tooltip-header">
        <span class="tooltip-category">{{ sceneStore.hoveredComponent.category }}</span>
      </div>
      <h4 class="tooltip-title">{{ sceneStore.hoveredComponent.name }}</h4>
      <p class="tooltip-preview">{{ truncateText(sceneStore.hoveredComponent.description, 50) }}</p>
      <span class="tooltip-hint">点击查看详情</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useSceneStore } from '@/stores/sceneStore'

const sceneStore = useSceneStore()

function closePanel() {
  sceneStore.setSelectedComponent(null)
}

function formatPosition(value: number): string {
  return value.toFixed(1)
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
</script>

<style scoped>
.info-panel {
  position: absolute;
  bottom: 20px;
  left: 20px;
  width: 360px;
  background: rgba(20, 20, 25, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 215, 0, 0.25);
  padding: 0;
  color: #f0f0f0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 100;
  overflow: hidden;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px 8px;
  background: linear-gradient(135deg, rgba(139, 26, 26, 0.3), rgba(100, 20, 20, 0.1));
}

.category-badge {
  display: inline-block;
  padding: 4px 10px;
  background: linear-gradient(135deg, #8b1a1a, #6b1515);
  border-radius: 12px;
  font-size: 11px;
  color: #ffd700;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.close-btn {
  width: 28px;
  height: 28px;
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

.info-title {
  font-size: 20px;
  font-weight: 600;
  color: #ffd700;
  margin: 0;
  padding: 8px 20px 16px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.15);
}

.info-body {
  padding: 16px 20px 20px;
}

.info-description {
  font-size: 13px;
  line-height: 1.8;
  color: #d0d0d0;
  margin: 0 0 16px 0;
  text-align: justify;
}

.info-meta {
  background: rgba(255, 215, 0, 0.05);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.meta-label {
  font-size: 11px;
  color: #888;
}

.meta-value {
  font-size: 11px;
  color: #d4a84b;
  font-family: 'Consolas', monospace;
}

.info-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(0, 255, 136, 0.08);
  border-radius: 8px;
  font-size: 11px;
  color: #00ff88;
}

.tip-icon {
  font-size: 14px;
}

.hover-tooltip {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 280px;
  background: rgba(20, 20, 25, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  border: 1px solid rgba(255, 215, 0, 0.2);
  padding: 14px 18px;
  color: #f0f0f0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 90;
  pointer-events: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.tooltip-header {
  margin-bottom: 6px;
}

.tooltip-category {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(255, 215, 0, 0.15);
  border-radius: 8px;
  font-size: 10px;
  color: #d4a84b;
}

.tooltip-title {
  font-size: 15px;
  font-weight: 600;
  color: #ffd700;
  margin: 0 0 6px 0;
}

.tooltip-preview {
  font-size: 12px;
  line-height: 1.6;
  color: #aaa;
  margin: 0 0 8px 0;
}

.tooltip-hint {
  font-size: 10px;
  color: #00ff88;
  font-style: italic;
}
</style>
