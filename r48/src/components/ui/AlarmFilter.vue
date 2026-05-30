<script setup lang="ts">
import type { AlarmLevel } from '@/types'
import { ALARM_LEVEL_LABELS, ALARM_LEVEL_COLORS } from '@/types'
import { useDeviceStore } from '@/stores'
import { AlertTriangle } from 'lucide-vue-next'

const store = useDeviceStore()
const levels: AlarmLevel[] = ['critical', 'major', 'minor', 'info']

function toggleFilter(level: AlarmLevel) {
  if (store.alarmFilter === level) {
    store.setAlarmFilter(null)
  } else {
    store.setAlarmFilter(level)
  }
}
</script>

<template>
  <div class="alarm-filter">
    <div class="filter-label">
      <AlertTriangle :size="14" />
      <span>告警筛选</span>
    </div>
    <div class="filter-buttons">
      <button
        v-for="level in levels"
        :key="level"
        class="filter-btn"
        :class="{ active: store.alarmFilter === level }"
        @click="toggleFilter(level)"
      >
        <span class="dot" :style="{ background: ALARM_LEVEL_COLORS[level] }"></span>
        {{ ALARM_LEVEL_LABELS[level] }}
      </button>
      <button
        class="filter-btn"
        :class="{ active: store.alarmFilter === null }"
        @click="store.setAlarmFilter(null)"
      >
        全部
      </button>
    </div>
  </div>
</template>

<style scoped>
.alarm-filter {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 14px;
  background: rgba(10, 22, 40, 0.85);
  border: 1px solid rgba(30, 144, 255, 0.15);
  border-radius: 8px;
  backdrop-filter: blur(8px);
}
.filter-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #8cb8d8;
  font-size: 12px;
  white-space: nowrap;
}
.filter-buttons {
  display: flex;
  gap: 6px;
}
.filter-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border: 1px solid rgba(30, 144, 255, 0.2);
  border-radius: 4px;
  background: transparent;
  color: #8cb8d8;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.filter-btn:hover {
  background: rgba(30, 144, 255, 0.1);
  color: #e6f7ff;
}
.filter-btn.active {
  background: rgba(30, 144, 255, 0.2);
  border-color: rgba(30, 144, 255, 0.5);
  color: #00e5ff;
}
.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>
