<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import { useDeviceStore } from '@/stores'
import type { DeviceSearchResult } from '@/types'
import { ref } from 'vue'

const deviceStore = useDeviceStore()
const showResults = ref(false)

function handleBlur() {
  setTimeout(() => {
    showResults.value = false
  }, 200)
}

function selectResult(result: DeviceSearchResult) {
  deviceStore.locateDevice(result.device.id)
  showResults.value = false
}
</script>

<template>
  <div class="device-search">
    <div class="search-input-wrapper">
      <Search :size="16" class="search-icon" />
      <input
        type="text"
        class="search-input"
        placeholder="搜索设备..."
        v-model="deviceStore.searchKeyword"
        @focus="showResults = true"
        @blur="handleBlur"
      />
    </div>
    <Transition name="fade">
      <div v-if="showResults && deviceStore.searchResults.length > 0" class="search-results">
        <div
          v-for="result in deviceStore.searchResults.slice(0, 8)"
          :key="result.device.id"
          class="search-item"
          @mousedown="selectResult(result)"
        >
          <span class="item-name">{{ result.device.name }}</span>
          <span class="item-type">{{ result.device.model }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.device-search {
  position: relative;
  min-width: 260px;
}
.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(10, 22, 40, 0.9);
  border: 1px solid rgba(30, 144, 255, 0.2);
  border-radius: 8px;
  backdrop-filter: blur(8px);
  transition: all 0.2s;
}
.search-input-wrapper:focus-within {
  border-color: rgba(30, 144, 255, 0.5);
  box-shadow: 0 0 10px rgba(30, 144, 255, 0.15);
}
.search-icon {
  color: #6a8caa;
  flex-shrink: 0;
}
.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #e6f7ff;
  font-size: 13px;
  width: 100%;
}
.search-input::placeholder {
  color: #6a8caa;
}
.search-results {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  max-height: 320px;
  overflow-y: auto;
  background: rgba(10, 22, 40, 0.95);
  border: 1px solid rgba(30, 144, 255, 0.2);
  border-radius: 8px;
  backdrop-filter: blur(12px);
  z-index: 200;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
.search-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.15s;
  border-bottom: 1px solid rgba(30, 144, 255, 0.08);
}
.search-item:last-child {
  border-bottom: none;
}
.search-item:hover {
  background: rgba(30, 144, 255, 0.1);
}
.item-name {
  font-size: 13px;
  color: #e6f7ff;
  font-weight: 500;
}
.item-type {
  font-size: 11px;
  color: #6a8caa;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
