<template>
  <div class="home-container">
    <div class="card main-card">
      <h1 class="title">实时协同白板</h1>
      <p class="subtitle">多人同时在线协作，实时同步绘制</p>

      <div class="section">
        <h2>创建新房间</h2>
        <div class="form-group">
          <input
            v-model="roomName"
            type="text"
            class="input"
            placeholder="输入房间名称"
            @keyup.enter="createRoom"
          />
        </div>
        <button class="btn btn-primary" @click="createRoom">创建房间</button>
      </div>

      <div class="section">
        <h2>加入房间</h2>
        <div class="form-group">
          <input
            v-model="joinRoomId"
            type="text"
            class="input"
            placeholder="输入房间ID"
            @keyup.enter="joinRoom"
          />
        </div>
        <div class="form-group">
          <input
            v-model="username"
            type="text"
            class="input"
            placeholder="输入你的昵称"
          />
        </div>
        <button class="btn btn-secondary" @click="joinRoom">加入房间</button>
      </div>

      <div v-if="rooms.length > 0" class="section">
        <h2>已有房间</h2>
        <div class="room-list">
          <div
            v-for="room in rooms"
            :key="room.id"
            class="room-item"
            @click="selectRoom(room.id)"
          >
            <div class="room-name">{{ room.name }}</div>
            <div class="room-id">ID: {{ room.id }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../services/api'

const router = useRouter()
const roomName = ref('')
const joinRoomId = ref('')
const username = ref('')
const rooms = ref([])

onMounted(async () => {
  try {
    rooms.value = await api.getAllRooms()
  } catch (e) {
    console.error('Failed to load rooms:', e)
  }
})

const createRoom = async () => {
  if (!roomName.value.trim()) {
    alert('请输入房间名称')
    return
  }
  try {
    const room = await api.createRoom(roomName.value.trim())
    localStorage.setItem('username', username.value.trim() || '匿名用户')
    router.push(`/room/${room.id}`)
  } catch (e) {
    alert('创建房间失败')
    console.error(e)
  }
}

const joinRoom = () => {
  if (!joinRoomId.value.trim()) {
    alert('请输入房间ID')
    return
  }
  localStorage.setItem('username', username.value.trim() || '匿名用户')
  router.push(`/room/${joinRoomId.value.trim()}`)
}

const selectRoom = (roomId) => {
  joinRoomId.value = roomId
  joinRoom()
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.main-card {
  width: 100%;
  max-width: 450px;
}

.title {
  font-size: 28px;
  color: #333;
  text-align: center;
  margin-bottom: 8px;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 24px;
}

.section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #eee;
}

.section:first-of-type {
  border-top: none;
  padding-top: 0;
  margin-top: 0;
}

.section h2 {
  font-size: 18px;
  color: #333;
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 12px;
}

.input {
  width: 100%;
  margin-bottom: 8px;
}

.room-list {
  max-height: 200px;
  overflow-y: auto;
}

.room-item {
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.room-item:hover {
  border-color: #4a90d9;
  background-color: #f5f9ff;
}

.room-name {
  font-weight: 500;
  color: #333;
}

.room-id {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>
