<template>
  <div class="room-container">
    <header class="room-header">
      <div class="room-info">
        <h1>{{ room?.name || '加载中...' }}</h1>
        <span class="room-id">房间ID: {{ roomId }}</span>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="copyRoomId">复制房间ID</button>
        <button class="btn btn-secondary" @click="goHome">返回首页</button>
      </div>
    </header>

    <div class="room-body">
      <aside class="sidebar">
        <div class="tool-section">
          <h3>绘图工具</h3>
          <div class="tool-list">
            <button
              v-for="tool in tools"
              :key="tool.id"
              class="tool-btn"
              :class="{ active: currentTool === tool.id }"
              @click="currentTool = tool.id"
              :title="tool.label"
            >
              {{ tool.icon }}
            </button>
          </div>
        </div>

        <div class="color-section">
          <h3>颜色</h3>
          <div class="color-list">
            <button
              v-for="color in colors"
              :key="color"
              class="color-btn"
              :class="{ active: currentColor === color }"
              :style="{ backgroundColor: color }"
              @click="currentColor = color"
            ></button>
          </div>
          <input type="color" v-model="currentColor" class="custom-color" />
        </div>

        <div class="size-section">
          <h3>画笔粗细</h3>
          <input
            type="range"
            v-model="lineWidth"
            min="1"
            max="20"
            class="size-slider"
          />
          <span class="size-value">{{ lineWidth }}px</span>
        </div>

        <div class="action-section">
          <button class="btn btn-danger" @click="deleteSelected" :disabled="!canDelete">
            删除选中
          </button>
        </div>
      </aside>

      <main class="whiteboard-area">
        <Whiteboard
          ref="whiteboardRef"
          :roomId="roomId"
          :userId="userId"
          :tool="currentTool"
          :color="currentColor"
          :lineWidth="lineWidth"
          :initialElements="elements"
          @addElement="handleAddElement"
          @updateElement="handleUpdateElement"
          @deleteElement="handleDeleteElement"
          @draw="handleDraw"
        />
      </main>

      <aside class="users-panel">
        <div class="users-section">
          <h3>在线用户 ({{ onlineUsers.length }})</h3>
          <div class="user-list">
            <div v-for="user in onlineUsers" :key="user.userId" class="user-item">
              <span class="user-dot" :style="{ backgroundColor: user.color }"></span>
              <span class="user-name">{{ user.username }}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { v4 as uuidv4 } from 'uuid'
import Whiteboard from '../components/Whiteboard.vue'
import { api } from '../services/api'
import { wsService } from '../services/websocket'

const route = useRoute()
const router = useRouter()
const roomId = route.params.roomId

const whiteboardRef = ref(null)
const room = ref(null)
const elements = ref([])
const onlineUsers = ref([])
const currentTool = ref('pen')
const currentColor = ref('#333333')
const lineWidth = ref(3)

const userId = ref(localStorage.getItem('userId') || uuidv4())
localStorage.setItem('userId', userId.value)

const username = ref(localStorage.getItem('username') || '匿名用户')

const tools = [
  { id: 'select', label: '选择', icon: '🖱️' },
  { id: 'pen', label: '画笔', icon: '✏️' },
  { id: 'line', label: '直线', icon: '📏' },
  { id: 'rect', label: '矩形', icon: '⬜' },
  { id: 'circle', label: '圆形', icon: '⭕' },
  { id: 'text', label: '文字', icon: '📝' },
  { id: 'sticky', label: '便签', icon: '📌' },
  { id: 'eraser', label: '橡皮擦', icon: '🧽' }
]

const colors = [
  '#000000', '#333333', '#666666', '#999999',
  '#FF0000', '#FF6B6B', '#FF9500', '#FFCC00',
  '#4CD964', '#00CED1', '#4A90D9', '#9B59B6'
]

const canDelete = computed(() => currentTool.value === 'select')

onMounted(async () => {
  try {
    const data = await api.getRoomInitialData(roomId)
    room.value = data.room
    elements.value = data.elements
    onlineUsers.value = data.onlineUsers

    await wsService.connect(roomId, userId.value)
    wsService.addListener('*', handleWebSocketMessage)

    wsService.send('/app/whiteboard/join', {
      type: 'JOIN',
      roomId: roomId,
      userId: userId.value,
      payload: { username: username.value }
    })

    window.addEventListener('beforeunload', handleBeforeUnload)
  } catch (e) {
    console.error('Failed to load room:', e)
    alert('房间不存在或加载失败')
    router.push('/')
  }
})

onUnmounted(() => {
  wsService.disconnect()
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

const handleBeforeUnload = () => {
  wsService.disconnect()
}

const handleWebSocketMessage = (message) => {
  if (message.userId === userId.value) return

  switch (message.type) {
    case 'ADD':
      whiteboardRef.value?.remoteAddElement(message)
      break
    case 'UPDATE':
    case 'CURSOR':
      whiteboardRef.value?.remoteUpdateElement(message)
      break
    case 'DELETE':
      whiteboardRef.value?.remoteDeleteElement(message)
      break
    case 'DRAW':
      whiteboardRef.value?.remoteDraw(message)
      break
    case 'USER_LIST':
      onlineUsers.value = message.payload
      break
  }
}

const handleAddElement = (data) => {
  wsService.send('/app/whiteboard/add', {
    type: 'ADD',
    roomId: roomId,
    userId: userId.value,
    elementId: data.elementId,
    payload: data.payload
  })
}

const handleUpdateElement = (data) => {
  wsService.send('/app/whiteboard/update', {
    type: 'UPDATE',
    roomId: roomId,
    userId: userId.value,
    elementId: data.elementId,
    payload: data.payload
  })
}

const handleDeleteElement = (data) => {
  wsService.send('/app/whiteboard/delete', {
    type: 'DELETE',
    roomId: roomId,
    userId: userId.value,
    elementId: data.elementId
  })
}

const handleDraw = (data) => {
  wsService.send('/app/whiteboard/draw', {
    type: 'DRAW',
    roomId: roomId,
    userId: userId.value,
    elementId: data.elementId,
    payload: data.payload
  })
}

const deleteSelected = () => {
  whiteboardRef.value?.deleteSelected()
}

const copyRoomId = async () => {
  try {
    await navigator.clipboard.writeText(roomId)
    alert('房间ID已复制到剪贴板')
  } catch (e) {
    prompt('复制房间ID:', roomId)
  }
}

const goHome = () => {
  wsService.disconnect()
  router.push('/')
}
</script>

<style scoped>
.room-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: white;
  border-bottom: 1px solid #eee;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.room-info h1 {
  font-size: 18px;
  color: #333;
  margin: 0;
}

.room-id {
  font-size: 12px;
  color: #999;
  margin-left: 8px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.room-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 200px;
  background: white;
  border-right: 1px solid #eee;
  padding: 16px;
  overflow-y: auto;
}

.users-panel {
  width: 180px;
  background: white;
  border-left: 1px solid #eee;
  padding: 16px;
  overflow-y: auto;
}

.sidebar h3,
.users-panel h3 {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.tool-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.tool-btn {
  width: 40px;
  height: 40px;
  border: 2px solid #eee;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.tool-btn:hover {
  border-color: #4a90d9;
  background: #f5f9ff;
}

.tool-btn.active {
  border-color: #4a90d9;
  background: #e6f0fa;
}

.color-list {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  margin-bottom: 8px;
}

.color-btn {
  width: 24px;
  height: 24px;
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.color-btn:hover {
  transform: scale(1.1);
}

.color-btn.active {
  border-color: #333;
  box-shadow: 0 0 0 2px white, 0 0 0 4px #4a90d9;
}

.custom-color {
  width: 100%;
  height: 30px;
  padding: 0;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
}

.tool-section,
.color-section,
.size-section,
.action-section,
.users-section {
  margin-bottom: 20px;
}

.size-slider {
  width: 100%;
  margin: 8px 0;
}

.size-value {
  display: block;
  text-align: center;
  font-size: 12px;
  color: #666;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  background: #f9f9f9;
}

.user-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.user-name {
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.whiteboard-area {
  flex: 1;
  position: relative;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
