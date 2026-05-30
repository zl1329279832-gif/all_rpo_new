<script setup lang="ts">
import type { DeviceData } from '@/types'
import { ALARM_LEVEL_COLORS, ALARM_LEVEL_LABELS } from '@/types'
import { X, AlertTriangle, Clock } from 'lucide-vue-next'

const props = defineProps<{
  device: DeviceData | null
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
}
</script>

<template>
  <Transition name="slide">
    <div v-if="visible && device" class="detail-panel">
      <div class="panel-header">
        <div class="panel-title">
          <span class="status-dot" :class="device.status"></span>
          <span>{{ device.name }}</span>
        </div>
        <button class="close-btn" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <div class="panel-section">
        <div class="section-title">实时参数</div>
        <div class="params-grid">
          <div v-for="(value, key) in device.params" :key="key" class="param-item">
            <span class="param-key">{{ key }}</span>
            <span class="param-value">{{ value }}</span>
          </div>
        </div>
      </div>

      <div v-if="device.alarms.length > 0" class="panel-section">
        <div class="section-title">
          <AlertTriangle :size="14" class="alarm-icon" />
          告警信息
        </div>
        <div class="alarm-list">
          <div v-for="alarm in device.alarms" :key="alarm.id" class="alarm-item">
            <span class="alarm-level-dot" :style="{ background: ALARM_LEVEL_COLORS[alarm.level] }"></span>
            <div class="alarm-content">
              <div class="alarm-msg">{{ alarm.message }}</div>
              <div class="alarm-time">
                <Clock :size="12" />
                {{ formatTime(alarm.timestamp) }}
              </div>
            </div>
            <span class="alarm-level-tag" :style="{ color: ALARM_LEVEL_COLORS[alarm.level] }">
              {{ ALARM_LEVEL_LABELS[alarm.level] }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.detail-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 320px;
  height: 100%;
  background: linear-gradient(180deg, rgba(10, 22, 40, 0.96), rgba(8, 18, 35, 0.98));
  border-left: 1px solid rgba(30, 144, 255, 0.2);
  backdrop-filter: blur(16px);
  overflow-y: auto;
  z-index: 50;
  padding: 20px;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(30, 144, 255, 0.15);
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #e6f7ff;
}
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.status-dot.running { background: #52c41a; box-shadow: 0 0 6px rgba(82, 196, 26, 0.5); }
.status-dot.stopped { background: #595959; }
.status-dot.alarm { background: #ff4d4f; animation: pulse-dot 1s infinite; }
.status-dot.maintenance { background: #fadb14; }
.status-dot.offline { background: #434343; }

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid rgba(30, 144, 255, 0.2);
  border-radius: 6px;
  background: transparent;
  color: #8cb8d8;
  cursor: pointer;
  transition: all 0.2s;
}
.close-btn:hover {
  background: rgba(255, 77, 79, 0.2);
  border-color: rgba(255, 77, 79, 0.4);
  color: #ff4d4f;
}
.panel-section {
  margin-bottom: 20px;
}
.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #8cb8d8;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.alarm-icon {
  color: #ff4d4f;
}
.params-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.param-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  background: rgba(30, 144, 255, 0.06);
  border: 1px solid rgba(30, 144, 255, 0.1);
  border-radius: 6px;
}
.param-key {
  font-size: 11px;
  color: #6a8caa;
  text-transform: uppercase;
}
.param-value {
  font-size: 18px;
  font-weight: 700;
  color: #00e5ff;
  font-variant-numeric: tabular-nums;
}
.alarm-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.alarm-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px;
  background: rgba(255, 77, 79, 0.06);
  border: 1px solid rgba(255, 77, 79, 0.15);
  border-radius: 6px;
}
.alarm-level-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
}
.alarm-content {
  flex: 1;
}
.alarm-msg {
  font-size: 13px;
  color: #e6f7ff;
  margin-bottom: 4px;
}
.alarm-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #6a8caa;
}
.alarm-level-tag {
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}
.slide-enter-active, .slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-enter-from, .slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
