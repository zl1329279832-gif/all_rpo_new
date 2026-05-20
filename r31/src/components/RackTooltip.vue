<script setup lang="ts">
import { computed } from 'vue'
import type { RackData } from '@/core/types'

interface Props {
  rack: RackData
  position: { x: number; y: number; visible: boolean }
  isSelected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false
})

const statusText = computed(() => {
  const map: Record<string, string> = {
    normal: '正常运行',
    warning: '温度告警',
    critical: '严重告警',
    offline: '离线'
  }
  return map[props.rack.status] || '未知'
})

const statusClass = computed(() => `status-${props.rack.status}`)

const typeText = computed(() => {
  const map: Record<string, string> = {
    server: '服务器机柜',
    network: '网络机柜',
    storage: '存储机柜'
  }
  return map[props.rack.rackType] || '未知类型'
})

const temperatureColor = computed(() => {
  const temp = props.rack.temperature
  if (temp > 45) return '#ef4444'
  if (temp > 35) return '#f59e0b'
  return '#22c55e'
})
</script>

<template>
  <Teleport to="body">
    <div
      v-show="position.visible"
      class="rack-tooltip"
      :class="{ 'is-selected': isSelected }"
      :style="{
        left: position.x + 'px',
        top: position.y + 'px'
      }"
    >
      <div class="tooltip-header">
        <span class="rack-id">机柜 #{{ rack.id.toString().padStart(4, '0') }}</span>
        <span class="status-badge" :class="statusClass">{{ statusText }}</span>
      </div>
      
      <div class="tooltip-body">
        <div class="info-row">
          <span class="label">类型</span>
          <span class="value">{{ typeText }}</span>
        </div>
        <div class="info-row">
          <span class="label">位置</span>
          <span class="value">第 {{ rack.row + 1 }} 排 · 第 {{ rack.col + 1 }} 列</span>
        </div>
        <div class="info-row">
          <span class="label">温度</span>
          <span class="value" :style="{ color: temperatureColor }">
            {{ rack.temperature }}°C
          </span>
        </div>
        <div class="info-row">
          <span class="label">功耗</span>
          <span class="value">{{ rack.power }} kW</span>
        </div>
      </div>
      
      <div v-if="isSelected" class="tooltip-footer">
        点击空白处取消选中
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.rack-tooltip {
  position: fixed;
  z-index: 1000;
  min-width: 240px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  transform: translate(-50%, -100%) translateY(-12px);
  pointer-events: none;
  animation: fadeIn 0.15s ease-out;
}

.rack-tooltip::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 12px;
  height: 12px;
  background: rgba(15, 23, 42, 0.95);
  border-right: 1px solid rgba(148, 163, 184, 0.2);
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
}

.is-selected {
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 10px 40px rgba(59, 130, 246, 0.3);
}

.tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.rack-id {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.status-normal {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.status-warning {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.status-critical {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.status-offline {
  background: rgba(107, 114, 128, 0.2);
  color: #6b7280;
}

.tooltip-body {
  padding: 12px 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 12px;
}

.label {
  color: #94a3b8;
}

.value {
  color: #e2e8f0;
  font-weight: 500;
}

.tooltip-footer {
  padding: 8px 16px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  font-size: 11px;
  color: #64748b;
  text-align: center;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -100%) translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -100%) translateY(-12px);
  }
}
</style>
