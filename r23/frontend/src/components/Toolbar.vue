<template>
  <div class="toolbar">
    <div class="tool-section">
      <button 
        class="tool-btn" 
        :class="{ active: store.currentTool === 'select' }"
        @click="store.setTool('select')"
        title="选择 (V)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4l7.07 17 2.51-7.39L21 11.07 4 4z"/>
        </svg>
      </button>
      <button 
        class="tool-btn" 
        :class="{ active: store.currentTool === 'pen' }"
        @click="store.setTool('pen')"
        title="画笔 (P)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 19l7-7 3 3-7 7-3-3z"/>
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
          <path d="M2 2l7.586 7.586"/>
        </svg>
      </button>
      <button 
        class="tool-btn" 
        :class="{ active: store.currentTool === 'eraser' }"
        @click="store.setTool('eraser')"
        title="橡皮擦 (E)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 20H7L3 16a4 4 0 015.66-5.66L20 20z"/>
          <path d="M6.5 6.5L13 13"/>
          <path d="M15.5 3.5a3.536 3.536 0 015 5L13 16l-3-3 5.5-9.5z"/>
        </svg>
      </button>
      <button 
        class="tool-btn" 
        :class="{ active: store.currentTool === 'sticker' }"
        @click="store.setTool('sticker')"
        title="添加便签 (S)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M7 3h10a4 4 0 014 4v10l-5-5H7a4 4 0 01-4-4V7a4 4 0 014-4z"/>
          <path d="M17 21v-5h5"/>
        </svg>
      </button>
    </div>

    <div class="divider"></div>

    <div class="color-section" v-if="store.currentTool !== 'eraser'">
      <div class="color-picker">
        <input 
          type="color" 
          v-model="store.currentColor"
          class="color-input"
        />
      </div>
      <div class="preset-colors">
        <button 
          v-for="color in colors" 
          :key="color"
          class="color-btn"
          :style="{ backgroundColor: color }"
          :class="{ active: store.currentColor === color }"
          @click="store.setColor(color)"
        ></button>
      </div>
    </div>

    <div class="divider"></div>

    <div class="size-section">
      <label class="size-label">粗细</label>
      <input 
        type="range" 
        min="1" 
        max="20" 
        v-model.number="store.currentLineWidth"
        class="size-slider"
      />
      <span class="size-value">{{ store.currentLineWidth }}px</span>
    </div>

    <div class="divider"></div>

    <div class="action-section">
      <button 
        class="tool-btn delete-btn"
        @click="handleDelete"
        :disabled="!store.selectedElementId"
        title="删除选中元素 (Delete)"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          <line x1="10" y1="11" x2="10" y2="17"/>
          <line x1="14" y1="11" x2="14" y2="17"/>
        </svg>
      </button>
      <button 
        class="tool-btn clear-btn"
        @click="handleClear"
        title="清空画布"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6l5 5.79V21h8V11.79L21 6"/>
          <path d="M16.5 6V3a2 2 0 00-2-2h-5a2 2 0 00-2 2v3"/>
          <path d="M8 11h8"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useWhiteboardStore } from '@/stores/whiteboard'

const store = useWhiteboardStore()

const colors = [
  '#000000',
  '#e74c3c',
  '#e67e22',
  '#f1c40f',
  '#27ae60',
  '#3498db',
  '#9b59b6',
  '#34495e'
]

function handleDelete() {
  if (store.selectedElementId) {
    store.deleteElement(store.selectedElementId)
  }
}

function handleClear() {
  if (confirm('确定要清空画布吗？此操作不可撤销。')) {
    store.clearCanvas()
  }
}
</script>

<style scoped>
.toolbar {
  width: 80px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  gap: 12px;
}

.tool-section,
.color-section,
.size-section,
.action-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.tool-btn {
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.2s ease;
}

.tool-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.tool-btn.active {
  background: #4a90d9;
  color: white;
}

.tool-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.delete-btn:hover:not(:disabled) {
  background: #fee;
  color: #e74c3c;
}

.clear-btn:hover {
  background: #fee;
  color: #e74c3c;
}

.divider {
  width: 40px;
  height: 1px;
  background: #e0e0e0;
  margin: 4px 0;
}

.color-picker {
  position: relative;
}

.color-input {
  width: 40px;
  height: 40px;
  border: 2px solid #e0e0e0;
  border-radius: 50%;
  padding: 0;
  cursor: pointer;
  background: transparent;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.color-input::-webkit-color-swatch {
  border-radius: 50%;
  border: none;
}

.preset-colors {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
}

.color-btn {
  width: 18px;
  height: 18px;
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-btn:hover {
  transform: scale(1.2);
}

.color-btn.active {
  border-color: #333;
  transform: scale(1.2);
}

.size-section {
  width: 100%;
}

.size-label {
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
}

.size-slider {
  width: 60px;
  height: 4px;
  -webkit-appearance: none;
  background: #e0e0e0;
  border-radius: 2px;
  outline: none;
}

.size-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  background: #4a90d9;
  border-radius: 50%;
  cursor: pointer;
}

.size-value {
  font-size: 10px;
  color: #999;
}
</style>
