<template>
  <div class="showroom-container">
    <div v-if="!isLoaded" class="loading-overlay">
      <div class="loading-content">
        <h1 class="loading-title">虚拟概念跑车展厅</h1>
        <div class="progress-bar-container">
          <div class="progress-bar" :style="{ width: loadProgress + '%' }"></div>
        </div>
        <span class="progress-text">{{ Math.floor(loadProgress) }}%</span>
      </div>
    </div>

    <canvas
      ref="canvasRef"
      class="three-canvas"
      :class="{ 'canvas-visible': isLoaded }"
    ></canvas>

    <div v-if="isLoaded" class="header">
      <h1 class="title">概念跑车沉浸式展厅</h1>
      <p class="subtitle">拖拽旋转视角 · 点击车门开启</p>
    </div>

    <div v-if="isLoaded" class="control-panel">
      <div class="panel-section">
        <h3 class="panel-title">车身颜色</h3>
        <div class="color-palette">
          <button
            v-for="color in colorOptions"
            :key="color.value"
            class="color-btn"
            :class="{ active: currentColor === color.value }"
            :style="{ backgroundColor: color.value }"
            @click="changeColor(color.value)"
            :title="color.name"
          ></button>
        </div>
      </div>

      <div class="panel-section">
        <h3 class="panel-title">车门控制</h3>
        <div class="door-controls">
          <button
            class="control-btn"
            :class="{ active: leftDoorOpen }"
            @click="toggleLeftDoor"
          >
            {{ leftDoorOpen ? '关闭左门' : '开启左门' }}
          </button>
          <button
            class="control-btn"
            :class="{ active: rightDoorOpen }"
            @click="toggleRightDoor"
          >
            {{ rightDoorOpen ? '关闭右门' : '开启右门' }}
          </button>
        </div>
      </div>

      <div class="panel-section">
        <h3 class="panel-title">车辆控制</h3>
        <div class="view-controls">
          <button
            class="control-btn"
            :class="{ active: isDriving }"
            @click="toggleDriving"
          >
            {{ isDriving ? '停止车辆' : '启动车辆' }}
          </button>
        </div>
      </div>

      <div class="panel-section">
        <h3 class="panel-title">视角预设</h3>
        <div class="view-controls">
          <button class="control-btn" @click="resetCamera">
            重置视角
          </button>
        </div>
      </div>
    </div>

    <div v-if="isLoaded" class="hint-text">
      鼠标左键旋转 · 滚轮缩放 · 右键平移
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ShowroomScene } from './scene/ShowroomScene.js'

const canvasRef = ref(null)
const isLoaded = ref(false)
const loadProgress = ref(0)
const currentColor = ref('#ff2200')
const leftDoorOpen = ref(false)
const rightDoorOpen = ref(false)
const isDriving = ref(false)

let showroom = null

const colorOptions = [
  { name: '烈焰红', value: '#ff2200' },
  { name: '深海蓝', value: '#0066ff' },
  { name: '暗夜黑', value: '#1a1a1a' },
  { name: '珍珠白', value: '#f0f0f0' },
  { name: '金属银', value: '#c0c0c0' },
  { name: '竞速黄', value: '#ffcc00' },
  { name: '翡翠绿', value: '#00aa55' },
  { name: '暮光紫', value: '#6633cc' }
]

const changeColor = (color) => {
  currentColor.value = color
  if (showroom) {
    showroom.setCarColor(color)
  }
}

const toggleLeftDoor = () => {
  if (showroom) {
    showroom.toggleDoor('left')
  }
}

const toggleRightDoor = () => {
  if (showroom) {
    showroom.toggleDoor('right')
  }
}

const resetCamera = () => {
  if (showroom && showroom.sceneManager) {
    const { camera, controls } = showroom.sceneManager
    camera.position.set(5, 2.5, 8)
    controls.target.set(0, 0.8, 0)
    controls.update()
  }
}

const toggleDriving = () => {
  if (showroom) {
    isDriving.value = showroom.toggleDriving()
  }
}

onMounted(async () => {
  if (!canvasRef.value) return

  showroom = new ShowroomScene(canvasRef.value)

  showroom.onLoadProgress = (progress) => {
    loadProgress.value = progress
  }

  showroom.onLoadComplete = () => {
    loadProgress.value = 100
    setTimeout(() => {
      isLoaded.value = true
      currentColor.value = showroom.getCarColor()
    }, 300)
  }

  showroom.onDoorClick = (side, isOpen) => {
    if (side === 'left') {
      leftDoorOpen.value = isOpen
    } else if (side === 'right') {
      rightDoorOpen.value = isOpen
    }
  }

  await showroom.init({
  })

  showroom.start()
})

onUnmounted(() => {
  if (showroom) {
    showroom.dispose()
    showroom = null
  }
})
</script>

<style scoped>
.showroom-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
}

.three-canvas {
  width: 100%;
  height: 100%;
  display: block;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.canvas-visible {
  opacity: 1;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
  z-index: 1000;
}

.loading-content {
  text-align: center;
}

.loading-title {
  font-size: 2rem;
  font-weight: 300;
  letter-spacing: 0.3em;
  color: #ffffff;
  margin-bottom: 2rem;
  text-transform: uppercase;
}

.progress-bar-container {
  width: 300px;
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin: 0 auto 1rem;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #ff2200, #ff6600);
  transition: width 0.3s ease;
  border-radius: 2px;
}

.progress-text {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.1em;
}

.header {
  position: absolute;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 100;
  pointer-events: none;
}

.title {
  font-size: 2.5rem;
  font-weight: 300;
  letter-spacing: 0.2em;
  color: #ffffff;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.5);
}

.subtitle {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.15em;
}

.control-panel {
  position: absolute;
  right: 30px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(10, 10, 15, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  min-width: 260px;
  z-index: 100;
}

.panel-section {
  margin-bottom: 24px;
}

.panel-section:last-child {
  margin-bottom: 0;
}

.panel-title {
  font-size: 0.85rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.color-palette {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.color-btn {
  width: 44px;
  height: 44px;
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.color-btn:hover {
  transform: scale(1.1);
}

.color-btn.active {
  border-color: #ffffff;
  transform: scale(1.15);
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
}

.door-controls,
.view-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.control-btn {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #ffffff;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.control-btn.active {
  background: rgba(255, 34, 0, 0.3);
  border-color: rgba(255, 34, 0, 0.6);
}

.hint-text {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.1em;
  z-index: 100;
  pointer-events: none;
}

@media (max-width: 768px) {
  .title {
    font-size: 1.5rem;
  }

  .subtitle {
    font-size: 0.8rem;
  }

  .control-panel {
    right: 15px;
    left: 15px;
    top: auto;
    bottom: 80px;
    transform: none;
    min-width: auto;
    padding: 16px;
  }

  .color-palette {
    grid-template-columns: repeat(8, 1fr);
  }

  .color-btn {
    width: 32px;
    height: 32px;
  }

  .door-controls {
    flex-direction: row;
  }

  .control-btn {
    flex: 1;
  }

  .hint-text {
    display: none;
  }
}
</style>
