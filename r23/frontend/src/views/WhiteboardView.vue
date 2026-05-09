<template>
  <div class="whiteboard-container">
    <header class="header">
      <div class="header-left">
        <button class="btn btn-secondary back-btn" @click="goBack">
          ← 返回
        </button>
        <div class="room-info">
          <span class="room-label">房间:</span>
          <span class="room-id">{{ currentRoomId }}</span>
        </div>
        <button class="btn btn-secondary copy-btn" @click="copyRoomId">
          复制房间ID
        </button>
      </div>
      
      <div class="header-right">
        <div class="connection-status" :class="{ connected: store.isConnected }">
          <span class="status-dot"></span>
          {{ store.isConnected ? '已连接' : '未连接' }}
        </div>
        <UserList />
      </div>
    </header>

    <div class="workspace">
      <Toolbar />
      <div class="canvas-area" @click="handleCanvasClick">
        <WhiteboardCanvas ref="canvasRef" />
        <StickerLayer />
        <SelectionLayer />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWhiteboardStore } from '@/stores/whiteboard'
import Toolbar from '@/components/Toolbar.vue'
import WhiteboardCanvas from '@/components/WhiteboardCanvas.vue'
import StickerLayer from '@/components/StickerLayer.vue'
import SelectionLayer from '@/components/SelectionLayer.vue'
import UserList from '@/components/UserList.vue'

const route = useRoute()
const router = useRouter()
const store = useWhiteboardStore()
const canvasRef = ref(null)
const currentRoomId = ref('')

onMounted(() => {
  currentRoomId.value = route.params.roomId
  store.initializeRoom(currentRoomId.value)
})

onUnmounted(() => {
  store.disconnect()
})

function goBack() {
  router.push('/')
}

function copyRoomId() {
  navigator.clipboard.writeText(currentRoomId.value)
    .then(() => {
      alert('房间ID已复制到剪贴板')
    })
    .catch(err => {
      console.error('复制失败:', err)
    })
}

function handleCanvasClick(event) {
  if (event.target.classList.contains('canvas-area')) {
    store.deselectElement()
  }
}
</script>

<style scoped>
.whiteboard-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f0f0f0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  padding: 8px 16px;
}

.room-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.room-label {
  color: #666;
  font-size: 14px;
}

.room-id {
  font-family: monospace;
  font-weight: 600;
  color: #333;
  background: #f5f5f5;
  padding: 4px 10px;
  border-radius: 4px;
}

.copy-btn {
  padding: 6px 12px;
  font-size: 12px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #e74c3c;
}

.connection-status.connected {
  color: #27ae60;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #e74c3c;
}

.connection-status.connected .status-dot {
  background-color: #27ae60;
}

.workspace {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.canvas-area {
  flex: 1;
  position: relative;
  overflow: hidden;
  background-color: #ffffff;
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
  background-size: 20px 20px;
  cursor: crosshair;
}
</style>
