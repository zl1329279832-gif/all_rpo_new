<template>
  <div class="alarm-panel">
    <div class="panel-header">
      <div class="panel-title">
        <span class="title-icon">🚨</span>
        告警列表
      </div>
      <div class="alarm-count" :class="{ active: alarms.length > 0 }">
        {{ alarms.length }}
      </div>
    </div>

    <div class="alarm-list" v-if="alarms.length > 0">
      <div 
        v-for="alarm in alarms" 
        :key="alarm.id"
        class="alarm-item"
        :class="alarm.level"
      >
        <div class="alarm-icon">
          {{ getAlarmIcon(alarm.type) }}
        </div>
        <div class="alarm-content">
          <div class="alarm-device">{{ alarm.deviceName }}</div>
          <div class="alarm-message">{{ alarm.message }}</div>
          <div class="alarm-time">{{ formatTime(alarm.timestamp) }}</div>
        </div>
        <button class="alarm-action" @click="$emit('locate', alarm.deviceId)">
          🎯
        </button>
      </div>
    </div>

    <div class="empty-state" v-else>
      <div class="empty-icon">✅</div>
      <div class="empty-text">暂无告警信息</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AlarmData, DeviceStatus } from '@/types'

defineProps<{
  alarms: AlarmData[]
}>()

defineEmits<{
  (e: 'locate', deviceId: string): void
}>()

const getAlarmIcon = (type: DeviceStatus) => {
  const icons: Record<DeviceStatus, string> = {
    normal: '✅',
    low_power: '⚡',
    temp_abnormal: '🌡️',
    offline: '📴',
    maintenance: '🔧'
  }
  return icons[type]
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
</script>

<style scoped>
.alarm-panel {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: #fef2f2;
  border-bottom: 1px solid #fecaca;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: bold;
  color: #991b1b;
}

.title-icon {
  font-size: 18px;
}

.alarm-count {
  background: #ef4444;
  color: #fff;
  font-size: 12px;
  font-weight: bold;
  padding: 4px 10px;
  border-radius: 12px;
  min-width: 24px;
  text-align: center;
}

.alarm-list {
  max-height: 200px;
  overflow-y: auto;
}

.alarm-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.2s;
}

.alarm-item:hover {
  background: #f8fafc;
}

.alarm-item:last-child {
  border-bottom: none;
}

.alarm-item.warning {
  border-left: 3px solid #f39c12;
}

.alarm-item.error {
  border-left: 3px solid #e74c3c;
}

.alarm-item.critical {
  border-left: 3px solid #c0392b;
  background: #fef2f2;
}

.alarm-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.alarm-content {
  flex: 1;
  min-width: 0;
}

.alarm-device {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 2px;
}

.alarm-message {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
}

.alarm-time {
  font-size: 11px;
  color: #94a3b8;
}

.alarm-action {
  width: 32px;
  height: 32px;
  border: none;
  background: #3b82f6;
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  flex-shrink: 0;
  transition: background 0.2s;
}

.alarm-action:hover {
  background: #2563eb;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 13px;
  color: #94a3b8;
}
</style>
