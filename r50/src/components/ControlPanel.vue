<template>
  <div class="control-panel">
    <div class="panel-header">
      <h2 class="panel-title">中式古建筑院落</h2>
      <button class="help-btn" @click="sceneStore.toggleHelp()">
        <span>?</span>
      </button>
    </div>

    <div class="panel-section">
      <h3 class="section-title">
        <span class="icon">☀️</span>
        光照模式
      </h3>
      <div class="btn-group">
        <button
          v-for="mode in lightModes"
          :key="mode.value"
          :class="['mode-btn', { active: sceneStore.lightMode === mode.value }]"
          @click="sceneStore.setLightMode(mode.value)"
        >
          <span class="mode-icon">{{ mode.icon }}</span>
          <span class="mode-text">{{ mode.label }}</span>
        </button>
      </div>
    </div>

    <div class="panel-section">
      <h3 class="section-title">
        <span class="icon">🎥</span>
        视角模式
      </h3>
      <div class="btn-group">
        <button
          v-for="mode in cameraModes"
          :key="mode.value"
          :class="['mode-btn', { active: sceneStore.cameraMode === mode.value }]"
          @click="sceneStore.setCameraMode(mode.value)"
        >
          <span class="mode-icon">{{ mode.icon }}</span>
          <span class="mode-text">{{ mode.label }}</span>
        </button>
      </div>
      <p class="hint" v-if="sceneStore.cameraMode === 'roam'">
        点击画面锁定鼠标，WASD 移动，Space/Shift 上下
      </p>
      <p class="hint" v-else>
        左键拖动旋转视角，滚轮缩放
      </p>
    </div>

    <div class="panel-section">
      <h3 class="section-title">
        <span class="icon">🏗️</span>
        结构分层
      </h3>
      <div class="layer-btns">
        <button
          v-for="layer in structureLayers"
          :key="layer.value"
          :class="['layer-btn', { active: sceneStore.structureLayer === layer.value }]"
          @click="sceneStore.setStructureLayer(layer.value)"
        >
          <span class="layer-icon">{{ layer.icon }}</span>
          <span class="layer-text">{{ layer.label }}</span>
        </button>
      </div>
    </div>

    <div class="panel-footer">
      <div class="status-bar">
        <div class="status-item">
          <span class="status-dot" :class="sceneStore.lightMode"></span>
          {{ sceneStore.lightModeLabel }}
        </div>
        <div class="status-item">
          <span class="status-dot" :class="sceneStore.cameraMode"></span>
          {{ sceneStore.cameraModeLabel }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSceneStore } from '@/stores/sceneStore'
import type { LightMode, CameraMode, StructureLayer } from '@/types'

const sceneStore = useSceneStore()

const lightModes: Array<{ value: LightMode; label: string; icon: string }> = [
  { value: 'day', label: '白天', icon: '☀️' },
  { value: 'dusk', label: '黄昏', icon: '🌅' },
  { value: 'night', label: '夜晚', icon: '🌙' }
]

const cameraModes: Array<{ value: CameraMode; label: string; icon: string }> = [
  { value: 'topdown', label: '俯视', icon: '👁️' },
  { value: 'roam', label: '漫游', icon: '🚶' }
]

const structureLayers: Array<{ value: StructureLayer; label: string; icon: string }> = [
  { value: 'all', label: '完整', icon: '🏯' },
  { value: 'roof', label: '屋顶', icon: '🏠' },
  { value: 'columns', label: '梁柱', icon: '🪵' },
  { value: 'walls', label: '墙体', icon: '🧱' },
  { value: 'foundation', label: '地基', icon: '⬜' }
]
</script>

<style scoped>
.control-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 280px;
  background: rgba(20, 20, 25, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 215, 0, 0.2);
  padding: 20px;
  color: #f0f0f0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 100;
  user-select: none;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: #ffd700;
  margin: 0;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.help-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffd700, #b8860b);
  border: none;
  color: #1a1a1a;
  font-weight: bold;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.help-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
}

.panel-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: #d4a84b;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon {
  font-size: 16px;
}

.btn-group {
  display: flex;
  gap: 8px;
}

.mode-btn {
  flex: 1;
  padding: 10px 8px;
  background: rgba(60, 60, 70, 0.6);
  border: 1px solid rgba(255, 215, 0, 0.15);
  border-radius: 8px;
  color: #ccc;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.mode-btn:hover {
  background: rgba(80, 80, 90, 0.8);
  border-color: rgba(255, 215, 0, 0.3);
}

.mode-btn.active {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(184, 134, 11, 0.3));
  border-color: #ffd700;
  color: #ffd700;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
}

.mode-icon {
  font-size: 18px;
}

.mode-text {
  font-size: 12px;
}

.hint {
  font-size: 11px;
  color: #888;
  margin: 8px 0 0 0;
  font-style: italic;
}

.layer-btns {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}

.layer-btn {
  padding: 8px 4px;
  background: rgba(60, 60, 70, 0.6);
  border: 1px solid rgba(255, 215, 0, 0.15);
  border-radius: 6px;
  color: #ccc;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.layer-btn:hover {
  background: rgba(80, 80, 90, 0.8);
  border-color: rgba(255, 215, 0, 0.3);
}

.layer-btn.active {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(184, 134, 11, 0.3));
  border-color: #ffd700;
  color: #ffd700;
}

.layer-icon {
  font-size: 16px;
}

.layer-text {
  font-size: 10px;
}

.panel-footer {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 215, 0, 0.2);
}

.status-bar {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #aaa;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.day {
  background: #ffd700;
  box-shadow: 0 0 8px #ffd700;
}

.status-dot.dusk {
  background: #ff6b35;
  box-shadow: 0 0 8px #ff6b35;
}

.status-dot.night {
  background: #4a6fa5;
  box-shadow: 0 0 8px #4a6fa5;
}

.status-dot.topdown {
  background: #00ff88;
  box-shadow: 0 0 8px #00ff88;
}

.status-dot.roam {
  background: #00aaff;
  box-shadow: 0 0 8px #00aaff;
}
</style>
