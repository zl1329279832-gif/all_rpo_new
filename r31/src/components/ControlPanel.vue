<script setup lang="ts">
import type { RackData } from '@/core/types'

interface Props {
  selectedRack: RackData | null
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'reset-view'): void
  (e: 'clear-selection'): void
}>()
</script>

<template>
  <div class="control-panel">
    <div class="panel-header">
      <span class="panel-title">数据中心可视化</span>
    </div>
    
    <div class="panel-content">
      <div class="legend-section">
        <span class="section-title">状态图例</span>
        <div class="legend-items">
          <div class="legend-item">
            <span class="legend-dot" style="background: #22c55e"></span>
            <span class="legend-text">正常</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background: #f59e0b"></span>
            <span class="legend-text">告警</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background: #ef4444"></span>
            <span class="legend-text">严重</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background: #6b7280"></span>
            <span class="legend-text">离线</span>
          </div>
        </div>
      </div>
      
      <div class="controls-section">
        <span class="section-title">操作</span>
        <div class="control-buttons">
          <button class="control-btn" @click="emit('reset-view')">
            重置视角
          </button>
          <button 
            v-if="selectedRack" 
            class="control-btn secondary"
            @click="emit('clear-selection')"
          >
            取消选中
          </button>
        </div>
      </div>
      
      <div class="help-section">
        <span class="section-title">操作说明</span>
        <ul class="help-list">
          <li>左键拖动：旋转视角</li>
          <li>右键拖动：平移视角</li>
          <li>滚轮：缩放</li>
          <li>点击机柜：选中并飞行</li>
        </ul>
      </div>
    </div>
    
    <div class="panel-footer">
      <span class="version">v1.0.0 · Vue 3 + Three.js</span>
    </div>
  </div>
</template>

<style scoped>
.control-panel {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 220px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  overflow: hidden;
}

.panel-header {
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.3));
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
}

.panel-content {
  padding: 12px 16px;
}

.section-title {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.legend-section {
  margin-bottom: 16px;
}

.legend-items {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-text {
  font-size: 11px;
  color: #cbd5e1;
}

.controls-section {
  margin-bottom: 16px;
}

.control-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-btn {
  padding: 8px 12px;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 6px;
  color: #60a5fa;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.control-btn:hover {
  background: rgba(59, 130, 246, 0.3);
  border-color: rgba(59, 130, 246, 0.5);
}

.control-btn.secondary {
  background: rgba(107, 114, 128, 0.2);
  border-color: rgba(107, 114, 128, 0.3);
  color: #9ca3af;
}

.control-btn.secondary:hover {
  background: rgba(107, 114, 128, 0.3);
  border-color: rgba(107, 114, 128, 0.5);
}

.help-section {
  margin-bottom: 8px;
}

.help-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.help-list li {
  font-size: 11px;
  color: #94a3b8;
  padding: 2px 0;
}

.panel-footer {
  padding: 8px 16px;
  background: rgba(30, 41, 59, 0.3);
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

.version {
  font-size: 10px;
  color: #64748b;
}
</style>
