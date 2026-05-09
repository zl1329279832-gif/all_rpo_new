<template>
  <div class="home-container">
    <div class="hero-section">
      <h1>实时协同白板</h1>
      <p class="subtitle">多人实时协作，创意无限</p>
    </div>
    
    <div class="card create-room-card">
      <h2>创建新房间</h2>
      <div class="form-group">
        <label>房间名称</label>
        <input 
          v-model="roomName" 
          type="text" 
          class="input" 
          placeholder="输入房间名称"
          @keyup.enter="createRoom"
        />
      </div>
      <div class="form-group">
        <label>房间描述 (可选)</label>
        <input 
          v-model="roomDescription" 
          type="text" 
          class="input" 
          placeholder="简单描述一下这个房间"
        />
      </div>
      <button class="btn btn-primary" @click="createRoom">创建房间</button>
    </div>

    <div class="card join-room-card">
      <h2>加入房间</h2>
      <div class="form-group">
        <label>房间 ID</label>
        <input 
          v-model="joinRoomId" 
          type="text" 
          class="input" 
          placeholder="输入房间 ID"
          @keyup.enter="joinRoom"
        />
      </div>
      <button class="btn btn-secondary" @click="joinRoom">加入房间</button>
    </div>

    <div v-if="rooms.length > 0" class="card rooms-list-card">
      <h2>可用房间</h2>
      <div class="rooms-list">
        <div 
          v-for="room in rooms" 
          :key="room.id" 
          class="room-item"
          @click="goToRoom(room.id)"
        >
          <div class="room-info">
            <div class="room-name">{{ room.name }}</div>
            <div class="room-id">ID: {{ room.id }}</div>
            <div v-if="room.description" class="room-description">{{ room.description }}</div>
          </div>
          <div class="room-action">
            <span class="enter-icon">→</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const roomName = ref('')
const roomDescription = ref('')
const joinRoomId = ref('')
const rooms = ref([])

onMounted(async () => {
  await loadRooms()
})

async function loadRooms() {
  try {
    const response = await fetch('/api/rooms')
    if (response.ok) {
      rooms.value = await response.json()
    }
  } catch (error) {
    console.error('Failed to load rooms:', error)
  }
}

async function createRoom() {
  if (!roomName.value.trim()) {
    alert('请输入房间名称')
    return
  }

  try {
    const response = await fetch('/api/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: roomName.value,
        description: roomDescription.value
      })
    })

    if (response.ok) {
      const room = await response.json()
      router.push(`/room/${room.id}`)
    }
  } catch (error) {
    console.error('Failed to create room:', error)
    alert('创建房间失败')
  }
}

function joinRoom() {
  if (!joinRoomId.value.trim()) {
    alert('请输入房间 ID')
    return
  }
  goToRoom(joinRoomId.value.trim())
}

function goToRoom(roomId) {
  router.push(`/room/${roomId}`)
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.hero-section {
  text-align: center;
  margin-bottom: 40px;
  color: white;
}

.hero-section h1 {
  font-size: 48px;
  margin-bottom: 10px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.subtitle {
  font-size: 18px;
  opacity: 0.9;
}

.card {
  width: 100%;
  max-width: 400px;
  margin-bottom: 20px;
}

.card h2 {
  margin-bottom: 20px;
  color: #333;
  font-size: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.input {
  width: 100%;
  margin-bottom: 8px;
}

.btn {
  width: 100%;
  padding: 12px;
  font-size: 16px;
}

.rooms-list-card {
  max-width: 400px;
}

.rooms-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.room-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.room-item:hover {
  background-color: #f9f9f9;
  border-color: #4a90d9;
}

.room-info {
  flex: 1;
}

.room-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.room-id {
  font-size: 12px;
  color: #999;
  font-family: monospace;
}

.room-description {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.room-action {
  margin-left: 16px;
}

.enter-icon {
  font-size: 24px;
  color: #4a90d9;
}
</style>
