<template>
  <div class="user-list-container">
    <div class="user-list-trigger" @click="toggleList">
      <div class="avatars">
        <div 
          v-for="(user, index) in displayUsers" 
          :key="user.userId"
          class="avatar"
          :style="{ backgroundColor: user.color, zIndex: store.users.length - index }"
          :title="user.userName"
        >
          {{ user.userName ? user.userName.charAt(0).toUpperCase() : '?' }}
        </div>
      </div>
      <span class="user-count">{{ store.users.length }}</span>
    </div>
    
    <div v-if="isOpen" class="user-list-dropdown" @click.stop>
      <div class="dropdown-header">
        <span>在线用户</span>
        <button class="close-btn" @click="isOpen = false">&times;</button>
      </div>
      <div class="user-list">
        <div 
          v-for="user in store.users" 
          :key="user.userId"
          class="user-item"
        >
          <div 
            class="avatar"
            :style="{ backgroundColor: user.color }"
          >
            {{ user.userName ? user.userName.charAt(0).toUpperCase() : '?' }}
          </div>
          <div class="user-info">
            <div class="user-name">{{ user.userName }}</div>
            <div class="user-id">ID: {{ user.userId }}</div>
          </div>
          <div class="user-status">
            <span class="status-dot online"></span>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="isOpen" class="backdrop" @click="isOpen = false"></div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useWhiteboardStore } from '@/stores/whiteboard'

const store = useWhiteboardStore()
const isOpen = ref(false)

const displayUsers = computed(() => {
  return store.users.slice(0, 3)
})

function toggleList() {
  isOpen.value = !isOpen.value
}
</script>

<style scoped>
.user-list-container {
  position: relative;
}

.user-list-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 20px;
  background: #f5f5f5;
  transition: background 0.2s ease;
}

.user-list-trigger:hover {
  background: #eee;
}

.avatars {
  display: flex;
  position: relative;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: 600;
  border: 2px solid white;
  margin-left: -8px;
  position: relative;
}

.avatars .avatar:first-child {
  margin-left: 0;
}

.user-count {
  font-size: 14px;
  font-weight: 500;
  color: #666;
}

.user-list-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 250px;
  z-index: 1000;
  overflow: hidden;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  font-weight: 600;
  color: #333;
}

.close-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #666;
}

.user-list {
  max-height: 300px;
  overflow-y: auto;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
  transition: background 0.2s ease;
}

.user-item:hover {
  background: #f9f9f9;
}

.user-item .avatar {
  width: 36px;
  height: 36px;
  font-size: 14px;
  margin: 0;
  border: none;
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.user-id {
  font-size: 11px;
  color: #999;
  font-family: monospace;
}

.user-status {
  display: flex;
  align-items: center;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.online {
  background: #27ae60;
}

.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}
</style>
