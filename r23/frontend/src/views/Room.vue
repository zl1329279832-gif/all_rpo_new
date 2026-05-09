<template>
  <div class="room-container">
    <header class="room-header">
      <div class="room-info">
        <div class="room-title-row">
          <h1>{{ room?.name || '加载中...' }}</h1>
          <span class="room-badge" :class="roleClass">
            {{ roleText }}
          </span>
        </div>
        <span class="room-id">房间ID: {{ roomId }}</span>
      </div>
      <div class="header-actions">
        <button 
          v-if="canUndo && canEdit" 
          class="btn btn-secondary undo-btn"
          @click="handleUndo"
          :disabled="!canUndo"
        >
          ↩️ 撤销
        </button>
        <button 
          v-if="canRedo && canEdit" 
          class="btn btn-secondary redo-btn"
          @click="handleRedo"
          :disabled="!canRedo"
        >
          ↪️ 重做
        </button>
        <button 
          v-if="isOwner" 
          class="btn btn-danger clear-btn"
          @click="handleClear"
        >
          🗑️ 清空白板
        </button>
        <button 
          v-if="isOwner" 
          class="btn btn-secondary"
          @click="showMemberPanel = !showMemberPanel"
        >
          👥 成员管理
        </button>
        <button class="btn btn-secondary" @click="copyRoomId">复制房间ID</button>
        <button class="btn btn-secondary" @click="goHome">返回首页</button>
      </div>
    </header>

    <div class="room-body">
      <aside class="sidebar" v-if="canEdit">
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
          <button 
            class="btn btn-danger" 
            @click="deleteSelected" 
            :disabled="!canDelete"
          >
            删除选中
          </button>
        </div>
      </aside>

      <aside class="sidebar read-only-sidebar" v-else>
        <div class="read-only-notice">
          <div class="notice-icon">👁️</div>
          <h3>只读模式</h3>
          <p>您当前以查看者身份加入，只能查看白板内容，不能进行编辑操作。</p>
          <p class="notice-tip">请联系房主或管理员获取编辑权限。</p>
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
          :readOnly="!canEdit"
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
              <span v-if="user.userId === userId" class="user-self">(我)</span>
            </div>
          </div>
        </div>

        <div v-if="showMemberPanel && isOwner" class="member-manage-section">
          <h3>成员管理</h3>
          <div class="member-invite">
            <input 
              v-model="inviteUsername" 
              type="text" 
              class="input" 
              placeholder="输入用户昵称"
            />
            <select v-model="inviteRole" class="input">
              <option value="EDITOR">编辑者</option>
              <option value="VIEWER">查看者</option>
            </select>
            <button class="btn btn-primary" @click="inviteMember">邀请</button>
          </div>
          <div class="member-list" v-if="roomMembers.length > 0">
            <div v-for="member in roomMembers" :key="member.userId" class="member-item">
              <span class="member-name">{{ member.username }}</span>
              <span class="member-role" :class="member.role.toLowerCase()">{{ getRoleText(member.role) }}</span>
              <select 
                v-if="member.role !== 'OWNER'" 
                v-model="member.role" 
                @change="updateMemberRole(member)"
                class="role-select"
              >
                <option value="EDITOR">编辑者</option>
                <option value="VIEWER">查看者</option>
              </select>
              <button 
                v-if="member.role !== 'OWNER'"
                class="btn btn-danger btn-small"
                @click="removeMember(member)"
              >
                移除
              </button>
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
const roomMembers = ref([])
const currentTool = ref('pen')
const currentColor = ref('#333333')
const lineWidth = ref(3)
const showMemberPanel = ref(false)
const inviteUsername = ref('')
const inviteRole = ref('EDITOR')

const userId = ref(localStorage.getItem('userId') || uuidv4())
localStorage.setItem('userId', userId.value)

const username = ref(localStorage.getItem('username') || '匿名用户')

const isOwner = ref(false)
const canEdit = ref(true)
const canUndo = ref(false)
const canRedo = ref(false)
const currentRole = ref('VIEWER')

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

const canDelete = computed(() => currentTool.value === 'select' && canEdit.value)

const roleText = computed(() => {
  switch (currentRole.value) {
    case 'OWNER': return '房主'
    case 'EDITOR': return '编辑者'
    case 'VIEWER': return '查看者'
    default: return '查看者'
  }
})

const roleClass = computed(() => `role-${currentRole.value.toLowerCase()}`)

function getRoleText(role) {
  switch (role) {
    case 'OWNER': return '房主'
    case 'EDITOR': return '编辑者'
    case 'VIEWER': return '查看者'
    default: return '查看者'
  }
}

onMounted(async () => {
  try {
    const data = await api.getRoomInitialData(roomId, userId.value)
    room.value = data.room
    elements.value = data.elements
    onlineUsers.value = data.onlineUsers

    if (data.permissions) {
      isOwner.value = data.permissions.isOwner || false
      canEdit.value = data.permissions.canEdit !== false
      currentRole.value = data.permissions.role || 'VIEWER'
    }

    await wsService.connect(roomId, userId.value)
    wsService.addListener('*', handleWebSocketMessage)

    wsService.send('/app/whiteboard/join', {
      type: 'JOIN',
      roomId: roomId,
      userId: userId.value,
      payload: { 
        username: username.value,
        role: isOwner.value ? 'OWNER' : 'VIEWER'
      }
    })

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('keydown', handleKeyDown)
  } catch (e) {
    console.error('Failed to load room:', e)
    alert('房间不存在或加载失败')
    router.push('/')
  }
})

onUnmounted(() => {
  wsService.disconnect()
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('keydown', handleKeyDown)
})

function handleBeforeUnload() {
  wsService.disconnect()
}

function handleKeyDown(e) {
  if (!canEdit.value) return
  
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    handleUndo()
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
    e.preventDefault()
    handleRedo()
  }
}

function handleWebSocketMessage(message) {
  if (message.userId === userId.value) {
    if (message.type === 'ADD' || message.type === 'UPDATE' || message.type === 'DELETE') {
      canUndo.value = true
      canRedo.value = false
    }
    return
  }

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
    case 'UNDO':
    case 'REDO':
      handleUndoRedoMessage(message)
      break
    case 'USER_LIST':
      onlineUsers.value = message.payload
      break
    case 'ROLE_ASSIGNED':
      if (message.userId === userId.value && message.payload) {
        isOwner.value = message.payload.isOwner || false
        canEdit.value = message.payload.canEdit !== false
        currentRole.value = message.payload.role || 'VIEWER'
      }
      break
    case 'CLEAR':
      elements.value = []
      whiteboardRef.value?.redraw()
      break
  }
}

function handleUndoRedoMessage(message) {
  const payload = message.payload
  const operationType = payload.operationType
  const elementId = message.elementId
  const elementData = payload.elementData

  if (payload.isUndo) {
    switch (operationType) {
      case 'ADD':
        whiteboardRef.value?.remoteDeleteElement({ elementId })
        break
      case 'UPDATE':
      case 'DRAW':
        if (elementData) {
          whiteboardRef.value?.remoteUpdateElement({ elementId, payload: elementData })
        }
        break
      case 'DELETE':
        if (elementData) {
          whiteboardRef.value?.remoteAddElement({ elementId, payload: elementData })
        }
        break
    }
  } else {
    switch (operationType) {
      case 'ADD':
        if (elementData) {
          whiteboardRef.value?.remoteAddElement({ elementId, payload: elementData })
        }
        break
      case 'UPDATE':
      case 'DRAW':
        if (elementData) {
          whiteboardRef.value?.remoteUpdateElement({ elementId, payload: elementData })
        }
        break
      case 'DELETE':
        whiteboardRef.value?.remoteDeleteElement({ elementId })
        break
    }
  }
}

function handleAddElement(data) {
  wsService.send('/app/whiteboard/add', {
    type: 'ADD',
    roomId: roomId,
    userId: userId.value,
    elementId: data.elementId,
    payload: data.payload
  })
}

function handleUpdateElement(data) {
  wsService.send('/app/whiteboard/update', {
    type: 'UPDATE',
    roomId: roomId,
    userId: userId.value,
    elementId: data.elementId,
    payload: data.payload
  })
}

function handleDeleteElement(data) {
  wsService.send('/app/whiteboard/delete', {
    type: 'DELETE',
    roomId: roomId,
    userId: userId.value,
    elementId: data.elementId
  })
}

function handleDraw(data) {
  wsService.send('/app/whiteboard/draw', {
    type: 'DRAW',
    roomId: roomId,
    userId: userId.value,
    elementId: data.elementId,
    payload: data.payload
  })
}

function handleUndo() {
  if (!canEdit.value) return
  wsService.send('/app/whiteboard/undo', {
    type: 'UNDO',
    roomId: roomId,
    userId: userId.value
  })
}

function handleRedo() {
  if (!canEdit.value) return
  wsService.send('/app/whiteboard/redo', {
    type: 'REDO',
    roomId: roomId,
    userId: userId.value
  })
}

function handleClear() {
  if (!isOwner.value) return
  if (confirm('确定要清空白板的所有内容吗？此操作不可撤销。')) {
    wsService.send('/app/whiteboard/clear', {
      type: 'CLEAR',
      roomId: roomId,
      userId: userId.value
    })
  }
}

function deleteSelected() {
  if (!canEdit.value) return
  whiteboardRef.value?.deleteSelected()
}

async function inviteMember() {
  if (!isOwner.value || !inviteUsername.value.trim()) return
  try {
    const targetUserId = uuidv4().substring(0, 12)
    await api.inviteMember(roomId, targetUserId, inviteUsername.value, inviteRole.value, userId.value)
    alert(`已邀请 ${inviteUsername.value} 加入房间`)
    inviteUsername.value = ''
    loadRoomMembers()
  } catch (e) {
    alert('邀请失败：' + e.message)
  }
}

async function updateMemberRole(member) {
  if (!isOwner.value) return
  try {
    await api.updateMemberRole(roomId, member.userId, member.role, userId.value)
  } catch (e) {
    alert('更新角色失败：' + e.message)
  }
}

async function removeMember(member) {
  if (!isOwner.value) return
  if (!confirm(`确定要移除 ${member.username} 吗？`)) return
  try {
    await api.removeMember(roomId, member.userId, userId.value)
    loadRoomMembers()
  } catch (e) {
    alert('移除失败：' + e.message)
  }
}

async function loadRoomMembers() {
  if (!isOwner.value) return
  try {
    roomMembers.value = await api.getRoomMembers(roomId, userId.value)
  } catch (e) {
    console.error('Failed to load members:', e)
  }
}

async function copyRoomId() {
  try {
    await navigator.clipboard.writeText(roomId)
    alert('房间ID已复制到剪贴板')
  } catch (e) {
    prompt('复制房间ID:', roomId)
  }
}

function goHome() {
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

.room-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.room-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.room-title-row h1 {
  font-size: 18px;
  color: #333;
  margin: 0;
}

.room-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.room-badge.role-owner {
  background: #ffebee;
  color: #c62828;
}

.room-badge.role-editor {
  background: #e3f2fd;
  color: #1565c0;
}

.room-badge.role-viewer {
  background: #f5f5f5;
  color: #616161;
}

.room-id {
  font-size: 12px;
  color: #999;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
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

.read-only-sidebar {
  display: flex;
  align-items: flex-start;
  padding-top: 40px;
}

.read-only-notice {
  text-align: center;
  padding: 20px;
}

.notice-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.read-only-notice h3 {
  font-size: 16px;
  color: #666;
  margin-bottom: 8px;
}

.read-only-notice p {
  font-size: 13px;
  color: #999;
  line-height: 1.6;
}

.notice-tip {
  margin-top: 8px;
  font-style: italic;
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
.users-section,
.member-manage-section {
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

.user-self {
  font-size: 11px;
  color: #4a90d9;
  font-weight: 500;
}

.whiteboard-area {
  flex: 1;
  position: relative;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-small {
  padding: 4px 8px;
  font-size: 12px;
}

.undo-btn:disabled,
.redo-btn:disabled {
  opacity: 0.4;
}

.member-manage-section {
  border-top: 1px solid #eee;
  padding-top: 16px;
}

.member-invite {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.member-invite .input {
  width: 100%;
  padding: 6px 10px;
  font-size: 12px;
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 6px;
  flex-wrap: wrap;
}

.member-name {
  font-size: 12px;
  color: #333;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-role {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
}

.member-role.owner {
  background: #ffebee;
  color: #c62828;
}

.member-role.editor {
  background: #e3f2fd;
  color: #1565c0;
}

.member-role.viewer {
  background: #f5f5f5;
  color: #616161;
}

.role-select {
  font-size: 11px;
  padding: 2px 4px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: auto;
}
</style>
