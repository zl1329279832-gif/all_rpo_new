<template>
  <div v-if="device" class="device-detail">
    <div class="detail-header">
      <div class="device-info">
        <div class="device-icon">{{ getDeviceIcon(device.type) }}</div>
        <div>
          <div class="device-name">{{ device.name }}</div>
          <div class="device-type">{{ getDeviceTypeName(device.type) }}</div>
        </div>
      </div>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>

    <div class="status-badge" :style="{ background: getStatusColor(device.status) }">
      <span class="status-dot"></span>
      {{ getStatusName(device.status) }}
    </div>

    <div class="detail-section">
      <div class="section-title">运行参数</div>
      <div class="params-grid">
        <div class="param-item">
          <div class="param-icon">⚡</div>
          <div class="param-info">
            <div class="param-label">功率</div>
            <div class="param-value">{{ device.power.toFixed(2) }} kW</div>
          </div>
        </div>
        <div class="param-item">
          <div class="param-icon">🌡️</div>
          <div class="param-info">
            <div class="param-label">温度</div>
            <div class="param-value" :class="{ warning: device.temperature > 60 }">
              {{ device.temperature.toFixed(1) }} ℃
            </div>
          </div>
        </div>
        <div class="param-item">
          <div class="param-icon">🔌</div>
          <div class="param-info">
            <div class="param-label">电压</div>
            <div class="param-value">{{ device.voltage.toFixed(1) }} V</div>
          </div>
        </div>
        <div class="param-item">
          <div class="param-icon">📊</div>
          <div class="param-info">
            <div class="param-label">电流</div>
            <div class="param-value">{{ device.current.toFixed(1) }} A</div>
          </div>
        </div>
        <div class="param-item">
          <div class="param-icon">📈</div>
          <div class="param-info">
            <div class="param-label">效率</div>
            <div class="param-value">{{ (device.efficiency * 100).toFixed(1) }} %</div>
          </div>
        </div>
        <div class="param-item">
          <div class="param-icon">📍</div>
          <div class="param-info">
            <div class="param-label">位置</div>
            <div class="param-value">
              {{ device.position.x.toFixed(1) }}, {{ device.position.z.toFixed(1) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="detail-section">
      <div class="section-title">状态信息</div>
      <div class="status-info">
        <div class="info-row">
          <span class="info-label">设备 ID</span>
          <span class="info-value">{{ device.id }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">所属方阵</span>
          <span class="info-value">{{ device.arrayId || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">最后更新</span>
          <span class="info-value">{{ formatTime(device.lastUpdate) }}</span>
        </div>
      </div>
    </div>

    <div class="detail-actions">
      <button class="action-btn" @click="$emit('locate', device.id)">
        🎯 定位设备
      </button>
      <button 
        v-if="device.status !== 'normal'" 
        class="action-btn primary"
        @click="$emit('add-to-patrol', device.id)"
      >
        🛣️ 加入巡检
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DeviceData, DeviceType, DeviceStatus } from '@/types'
import { DEVICE_TYPE_NAMES, STATUS_NAMES, STATUS_COLORS } from '@/types'

defineProps<{
  device: DeviceData | null
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'locate', deviceId: string): void
  (e: 'add-to-patrol', deviceId: string): void
}>()

const getDeviceIcon = (type: DeviceType) => {
  const icons: Record<DeviceType, string> = {
    pv_panel: '☀️',
    inverter: '🔋',
    combiner_box: '📦',
    alarm_device: '🚨'
  }
  return icons[type]
}

const getDeviceTypeName = (type: DeviceType) => {
  return DEVICE_TYPE_NAMES[type]
}

const getStatusName = (status: DeviceStatus) => {
  return STATUS_NAMES[status]
}

const getStatusColor = (status: DeviceStatus) => {
  return `#${STATUS_COLORS[status].toString(16).padStart(6, '0')}`
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
</script>

<style scoped>
.device-detail {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.device-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.device-icon {
  font-size: 32px;
}

.device-name {
  font-size: 16px;
  font-weight: bold;
}

.device-type {
  font-size: 12px;
  opacity: 0.8;
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  margin: 12px 16px 0;
  border-radius: 20px;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #fff;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.detail-section {
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.section-title {
  font-size: 13px;
  font-weight: bold;
  color: #64748b;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.params-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.param-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f8fafc;
  border-radius: 8px;
}

.param-icon {
  font-size: 20px;
}

.param-label {
  font-size: 11px;
  color: #94a3b8;
}

.param-value {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.param-value.warning {
  color: #e74c3c;
}

.status-info {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px dashed #e2e8f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 12px;
  color: #64748b;
}

.info-value {
  font-size: 12px;
  color: #1e293b;
  font-family: 'Courier New', monospace;
}

.detail-actions {
  display: flex;
  gap: 10px;
  padding: 16px;
}

.action-btn {
  flex: 1;
  padding: 12px;
  border: 1px solid #cbd5e1;
  background: #fff;
  border-radius: 8px;
  font-size: 13px;
  color: #334155;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f1f5f9;
}

.action-btn.primary {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
}

.action-btn.primary:hover {
  background: #2563eb;
}
</style>
