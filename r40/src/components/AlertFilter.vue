<template>
  <div class="alert-filter">
    <span class="label">告警等级：</span>
    <div class="filter-buttons">
      <button
        v-for="level in levels"
        :key="level.id"
        class="filter-btn"
        :class="{ active: selectedLevels.includes(level.id) }"
        :style="getButtonStyle(level.id)"
        @click="toggleLevel(level.id)"
      >
        {{ level.name }}
        <span class="count">({{ getAlertCount(level.id) }})</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Alert, AlertLevel } from '@/types'

interface AlertLevelInfo {
  id: AlertLevel
  name: string
  color: string
}

const props = defineProps<{
  alerts: Alert[]
}>()

const emit = defineEmits<{
  (e: 'change', levels: AlertLevel[]): void
}>()

const levels: AlertLevelInfo[] = [
  { id: 'info', name: '信息', color: '#13c2c2' },
  { id: 'warning', name: '警告', color: '#faad14' },
  { id: 'danger', name: '危险', color: '#ff4d4f' },
  { id: 'critical', name: '严重', color: '#eb2f96' }
]

const selectedLevels = ref<AlertLevel[]>(['warning', 'danger', 'critical'])

const toggleLevel = (levelId: AlertLevel) => {
  const index = selectedLevels.value.indexOf(levelId)
  if (index > -1) {
    selectedLevels.value.splice(index, 1)
  } else {
    selectedLevels.value.push(levelId)
  }
  emit('change', [...selectedLevels.value])
}

const getAlertCount = (levelId: AlertLevel): number => {
  return props.alerts.filter(a => a.level === levelId && !a.acknowledged).length
}

const getButtonStyle = (levelId: string) => {
  const level = levels.find(l => l.id === levelId)
  if (!level) return {}
  
  const isActive = selectedLevels.value.includes(levelId as AlertLevel)
  return {
    borderColor: isActive ? level.color : undefined,
    color: isActive ? level.color : undefined,
    background: isActive ? `${level.color}20` : undefined
  }
}
</script>

<style scoped>
.alert-filter {
  display: flex;
  align-items: center;
  gap: 12px;
}

.label {
  color: #e6f7ff;
  font-size: 14px;
  white-space: nowrap;
}

.filter-buttons {
  display: flex;
  gap: 8px;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(16, 32, 56, 0.8);
  border: 1px solid rgba(24, 144, 255, 0.3);
  border-radius: 4px;
  color: #8c8c8c;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-btn:hover {
  background: rgba(24, 144, 255, 0.1);
}

.filter-btn.active {
  background: rgba(24, 144, 255, 0.15);
}

.count {
  font-size: 12px;
  opacity: 0.8;
}
</style>
