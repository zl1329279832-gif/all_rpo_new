<template>
  <div class="search-bar">
    <div class="search-input-wrapper">
      <input
        v-model="searchText"
        type="text"
        placeholder="搜索箱号、设备编号..."
        class="search-input"
        @input="handleSearch"
        @keyup.enter="handleSearch"
      />
      <span class="search-icon">🔍</span>
    </div>
    <div v-if="results.length > 0" class="search-results">
      <div
        v-for="result in results"
        :key="result.id"
        class="search-result-item"
        @click="handleSelect(result)"
      >
        <span class="result-type">{{ getTypeLabel(result.type) }}</span>
        <span class="result-name">{{ result.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Container, Truck, QuayCrane } from '@/types'

interface SearchResult {
  id: string
  type: string
  name: string
  data: Container | Truck | QuayCrane
}

const props = defineProps<{
  containers: Container[]
  trucks: Truck[]
  cranes: QuayCrane[]
}>()

const emit = defineEmits<{
  (e: 'select', result: SearchResult): void
}>()

const searchText = ref('')
const results = ref<SearchResult[]>([])

const handleSearch = () => {
  if (!searchText.value.trim()) {
    results.value = []
    return
  }

  const keyword = searchText.value.toLowerCase()
  const matched: SearchResult[] = []

  props.containers
    .filter(c => c.containerNumber.toLowerCase().includes(keyword))
    .slice(0, 5)
    .forEach(c => {
      matched.push({
        id: c.id,
        type: 'container',
        name: c.containerNumber,
        data: c
      })
    })

  props.trucks
    .filter(t => t.name.toLowerCase().includes(keyword) || t.plateNumber.includes(keyword))
    .slice(0, 5)
    .forEach(t => {
      matched.push({
        id: t.id,
        type: 'truck',
        name: t.name,
        data: t
      })
    })

  props.cranes
    .filter(c => c.name.toLowerCase().includes(keyword))
    .slice(0, 3)
    .forEach(c => {
      matched.push({
        id: c.id,
        type: 'quayCrane',
        name: c.name,
        data: c
      })
    })

  results.value = matched.slice(0, 10)
}

const handleSelect = (result: SearchResult) => {
  emit('select', result)
  searchText.value = ''
  results.value = []
}

const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    container: '箱体',
    truck: '集卡',
    quayCrane: '岸桥'
  }
  return labels[type] || type
}
</script>

<style scoped>
.search-bar {
  position: relative;
  width: 320px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 14px;
  background: rgba(16, 32, 56, 0.9);
  border: 1px solid rgba(24, 144, 255, 0.3);
  border-radius: 4px;
  color: #e6f7ff;
  font-size: 14px;
  outline: none;
  transition: all 0.3s;
}

.search-input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 8px rgba(24, 144, 255, 0.3);
}

.search-input::placeholder {
  color: #8c8c8c;
}

.search-icon {
  position: absolute;
  right: 12px;
  font-size: 16px;
  color: #8c8c8c;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: rgba(16, 32, 56, 0.98);
  border: 1px solid rgba(24, 144, 255, 0.3);
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
}

.search-result-item {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid rgba(24, 144, 255, 0.1);
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background: rgba(24, 144, 255, 0.15);
}

.result-type {
  padding: 2px 8px;
  background: rgba(24, 144, 255, 0.2);
  color: #1890ff;
  font-size: 12px;
  border-radius: 3px;
  margin-right: 10px;
}

.result-name {
  color: #e6f7ff;
  font-size: 14px;
}
</style>
