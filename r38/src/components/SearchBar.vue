<template>
  <div class="search-bar">
    <div class="search-input-wrapper">
      <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        v-model="searchText"
        type="text"
        class="search-input"
        placeholder="搜索建筑或设备..."
        @focus="showDropdown = true"
      />
      <button v-if="searchText" class="clear-btn" @click="searchText = ''">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <transition name="fade">
      <div v-if="showDropdown && filteredResults.length > 0" class="search-dropdown">
        <div class="dropdown-section">
          <div class="section-label">建筑</div>
          <div
            v-for="item in filteredBuildings"
            :key="item.id"
            class="search-result building"
            @click="selectResult({ type: 'building', data: item })"
          >
            <span class="result-icon">🏢</span>
            <span class="result-name">{{ item.name }}</span>
          </div>
        </div>
        <div class="dropdown-section">
          <div class="section-label">设备</div>
          <div
            v-for="item in filteredDevices"
            :key="item.id"
            class="search-result device"
            @click="selectResult({ type: 'device', data: item })"
          >
            <span class="result-icon">📹</span>
            <div class="result-info">
              <span class="result-name">{{ item.name }}</span>
              <span :class="['result-status', item.status]">{{ statusLabels[item.status] }}</span>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Building, Device } from '@/types'

const props = defineProps<{
  buildings: Building[]
  devices: Device[]
}>()

const emit = defineEmits<{
  (e: 'search', item: { type: 'building' | 'device'; data: any }): void
}>()

const searchText = ref('')
const showDropdown = ref(false)

const statusLabels: Record<string, string> = {
  online: '在线',
  offline: '离线',
  fault: '故障',
  alarm: '告警'
}

const filteredBuildings = computed(() => {
  if (!searchText.value) return props.buildings.slice(0, 5)
  const keyword = searchText.value.toLowerCase()
  return props.buildings.filter(b => b.name.toLowerCase().includes(keyword)).slice(0, 5)
})

const filteredDevices = computed(() => {
  if (!searchText.value) return props.devices.slice(0, 8)
  const keyword = searchText.value.toLowerCase()
  return props.devices.filter(d =>
    d.name.toLowerCase().includes(keyword) ||
    d.type.toLowerCase().includes(keyword)
  ).slice(0, 8)
})

const filteredResults = computed(() => [...filteredBuildings.value, ...filteredDevices.value])

const selectResult = (item: { type: 'building' | 'device'; data: any }) => {
  emit('search', item)
  searchText.value = ''
  showDropdown.value = false
}

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.search-bar')) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.search-bar {
  position: relative;
  z-index: 500;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 0 12px;
  backdrop-filter: blur(10px);
  transition: all 0.3s;
}

.search-input-wrapper:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
}

.search-icon {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  padding: 10px 12px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.clear-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.clear-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
}

.search-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  max-height: 400px;
  overflow-y: auto;
  backdrop-filter: blur(10px);
}

.dropdown-section {
  padding: 8px 0;
}

.dropdown-section:not(:last-child) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.section-label {
  padding: 4px 16px;
  font-size: 11px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.search-result {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.search-result:hover {
  background: rgba(24, 144, 255, 0.1);
}

.result-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.result-name {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
}

.result-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 3px;
}

.result-status.online { background: rgba(82, 196, 26, 0.2); color: #52c41a; }
.result-status.offline { background: rgba(140, 140, 140, 0.2); color: #8c8c8c; }
.result-status.fault { background: rgba(250, 173, 20, 0.2); color: #faad14; }
.result-status.alarm { background: rgba(255, 77, 79, 0.2); color: #ff4d4f; }

.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
