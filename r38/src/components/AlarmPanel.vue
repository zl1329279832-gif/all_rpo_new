<template>
  <div class="alarm-panel">
    <div class="panel-header">
      <h3 class="section-title">
        告警列表
        <span class="alarm-count">{{ alarms.length }}</span>
      </h3>
      <div class="filter-tabs">
        <button
          v-for="tab in filterTabs"
          :key="tab.value"
          :class="{ active: alarmFilter === tab.value }"
          @click="$emit('filter-change', tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div class="alarm-list">
      <div
        v-for="alarm in alarms"
        :key="alarm.id"
        :class="['alarm-item', alarm.level, alarm.status]"
      >
        <div class="alarm-indicator"></div>
        <div class="alarm-content">
          <div class="alarm-header">
            <span class="alarm-type">{{ alarm.type }}</span>
            <span :class="['alarm-level', alarm.level]">
              {{ levelLabels[alarm.level] }}
            </span>
          </div>
          <div class="alarm-device">{{ alarm.deviceName }}</div>
          <div class="alarm-desc">{{ alarm.description }}</div>
          <div class="alarm-footer">
            <span class="alarm-time">{{ alarm.time }}</span>
            <span :class="['alarm-status', alarm.status]">
              {{ statusLabels[alarm.status] }}
            </span>
          </div>
          <div v-if="alarm.handler" class="alarm-handler">
            处理人: {{ alarm.handler }}
            <span v-if="alarm.handleTime"> | {{ alarm.handleTime }}</span>
          </div>
        </div>
        <div class="alarm-actions">
          <button class="action-btn locate" @click="$emit('locate', alarm)" title="定位">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </button>
          <button
            v-if="alarm.status === 'unhandled'"
            class="action-btn handle"
            @click="$emit('handle', alarm)"
            title="处理"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </button>
        </div>
      </div>

      <div v-if="alarms.length === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
          <path d="M8 12l2 2 4-4"/>
        </svg>
        <span>暂无告警信息</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Alarm, AlarmLevel } from '@/types'

defineProps<{
  alarms: Alarm[]
  alarmFilter: AlarmLevel | 'all'
}>()

defineEmits<{
  (e: 'filter-change', filter: AlarmLevel | 'all'): void
  (e: 'locate', alarm: Alarm): void
  (e: 'handle', alarm: Alarm): void
}>()

const filterTabs = [
  { label: '全部', value: 'all' as const },
  { label: '紧急', value: 'critical' as const },
  { label: '高', value: 'high' as const },
  { label: '中', value: 'medium' as const },
  { label: '低', value: 'low' as const }
]

const levelLabels: Record<AlarmLevel, string> = {
  critical: '紧急',
  high: '高',
  medium: '中',
  low: '低'
}

const statusLabels: Record<string, string> = {
  unhandled: '待处理',
  handling: '处理中',
  resolved: '已解决'
}
</script>

<style scoped>
.alarm-panel {
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  backdrop-filter: blur(10px);
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid rgba(24, 144, 255, 0.2);
}

.section-title {
  font-size: 14px;
  color: var(--text-primary);
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 14px;
  background: var(--primary-color);
  border-radius: 2px;
}

.alarm-count {
  background: var(--error-color);
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.filter-tabs {
  display: flex;
  gap: 4px;
}

.filter-tabs button {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-tabs button:hover {
  color: var(--text-primary);
  background: rgba(24, 144, 255, 0.1);
}

.filter-tabs button.active {
  background: rgba(24, 144, 255, 0.2);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.alarm-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.alarm-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.alarm-item:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateX(-2px);
}

.alarm-item.critical { border-left: 3px solid #ff4d4f; }
.alarm-item.high { border-left: 3px solid #ff7a45; }
.alarm-item.medium { border-left: 3px solid #faad14; }
.alarm-item.low { border-left: 3px solid #1890ff; }

.alarm-item.resolved {
  opacity: 0.6;
}

.alarm-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
  animation: blink 1.5s infinite;
}

.alarm-item.critical .alarm-indicator { background: #ff4d4f; }
.alarm-item.high .alarm-indicator { background: #ff7a45; }
.alarm-item.medium .alarm-indicator { background: #faad14; }
.alarm-item.low .alarm-indicator { background: #1890ff; }

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.alarm-item.resolved .alarm-indicator {
  animation: none;
  opacity: 0.4;
}

.alarm-content {
  flex: 1;
  min-width: 0;
}

.alarm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.alarm-type {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.alarm-level {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 3px;
  font-weight: 600;
}

.alarm-level.critical { background: rgba(255, 77, 79, 0.2); color: #ff4d4f; }
.alarm-level.high { background: rgba(255, 122, 69, 0.2); color: #ff7a45; }
.alarm-level.medium { background: rgba(250, 173, 20, 0.2); color: #faad14; }
.alarm-level.low { background: rgba(24, 144, 255, 0.2); color: #1890ff; }

.alarm-device {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.alarm-desc {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-bottom: 8px;
  line-height: 1.5;
}

.alarm-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alarm-time {
  font-size: 11px;
  color: var(--text-tertiary);
}

.alarm-status {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
}

.alarm-status.unhandled { background: rgba(255, 77, 79, 0.2); color: #ff4d4f; }
.alarm-status.handling { background: rgba(24, 144, 255, 0.2); color: #1890ff; }
.alarm-status.resolved { background: rgba(82, 196, 26, 0.2); color: #52c41a; }

.alarm-handler {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
}

.alarm-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: rgba(24, 144, 255, 0.1);
  color: var(--primary-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.action-btn:hover {
  background: rgba(24, 144, 255, 0.3);
}

.action-btn.handle {
  background: rgba(82, 196, 26, 0.1);
  color: var(--success-color);
}

.action-btn.handle:hover {
  background: rgba(82, 196, 26, 0.3);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-tertiary);
  gap: 12px;
}

.empty-state svg {
  opacity: 0.3;
}
</style>
