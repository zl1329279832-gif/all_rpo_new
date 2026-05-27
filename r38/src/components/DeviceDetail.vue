<template>
  <div class="device-detail-overlay" @click.self="$emit('close')">
    <div class="device-detail-panel">
      <div class="panel-header">
        <h3 class="panel-title">设备详情</h3>
        <button class="close-btn" @click="$emit('close')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="panel-body">
        <div class="device-header">
          <div :class="['device-status-icon', device.status]">
            <svg v-if="device.type === 'camera'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M23 7l-7 5 7 5V7z"/>
              <rect x="1" y="5" width="15" height="14" rx="2"/>
            </svg>
            <svg v-else-if="device.type === 'fireExtinguisher'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 2v4"/>
              <path d="M10 6h4v2h-4z"/>
              <path d="M7 10h10v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V10z"/>
            </svg>
            <svg v-else-if="device.type === 'smokeDetector'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="8"/>
              <path d="M12 8v8"/>
              <path d="M8 12h8"/>
            </svg>
            <svg v-else width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="2" y="7" width="20" height="10" rx="2"/>
              <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/>
            </svg>
          </div>
          <div class="device-title">
            <h4>{{ device.name }}</h4>
            <span :class="['status-badge', device.status]">{{ statusLabels[device.status] }}</span>
          </div>
        </div>

        <div class="info-section">
          <h5>基本信息</h5>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">设备ID</span>
              <span class="info-value">{{ device.id }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">设备类型</span>
              <span class="info-value">{{ typeLabels[device.type] }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">所在楼层</span>
              <span class="info-value">{{ device.floor }} 层</span>
            </div>
            <div class="info-item">
              <span class="info-label">安装时间</span>
              <span class="info-value">{{ device.installTime }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">最后检查</span>
              <span class="info-value">{{ device.lastCheckTime }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">位置坐标</span>
              <span class="info-value">
                ({{ device.position.x.toFixed(1) }}, {{ device.position.y.toFixed(1) }}, {{ device.position.z.toFixed(1) }})
              </span>
            </div>
          </div>
        </div>

        <div class="info-section">
          <h5>设备描述</h5>
          <p class="description">{{ device.description }}</p>
        </div>

        <div class="info-section">
          <h5>实时数据</h5>
          <div class="realtime-stats">
            <div class="stat-item">
              <span class="stat-label">运行时长</span>
              <span class="stat-value">{{ Math.floor(Math.random() * 8000) + 1000 }}h</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">数据传输</span>
              <span class="stat-value">{{ (Math.random() * 100).toFixed(1) }}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">信号强度</span>
              <span class="stat-value">{{ Math.floor(Math.random() * 30) + 70 }}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">电量</span>
              <span class="stat-value">{{ Math.floor(Math.random() * 40) + 60 }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="panel-footer">
        <button class="btn secondary" @click="$emit('close')">关闭</button>
        <button class="btn primary" v-if="device.status === 'fault' || device.status === 'offline'">
          报修处理
        </button>
        <button class="btn danger" v-if="device.status === 'alarm'">
          查看告警详情
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Device } from '@/types'

defineProps<{
  device: Device
}>()

defineEmits<{
  (e: 'close'): void
}>()

const statusLabels: Record<string, string> = {
  online: '在线',
  offline: '离线',
  fault: '故障',
  alarm: '告警'
}

const typeLabels: Record<string, string> = {
  camera: '监控摄像头',
  fireExtinguisher: '灭火器',
  fireHydrant: '消防栓',
  smokeDetector: '烟雾探测器'
}
</script>

<style scoped>
.device-detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.device-detail-panel {
  width: 480px;
  max-height: 90vh;
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  backdrop-filter: blur(20px);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(24, 144, 255, 0.2);
}

.panel-title {
  margin: 0;
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 600;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.close-btn:hover {
  background: rgba(255, 77, 79, 0.2);
  color: #ff4d4f;
}

.panel-body {
  padding: 20px;
  max-height: calc(90vh - 140px);
  overflow-y: auto;
}

.device-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.device-status-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.device-status-icon.online {
  background: rgba(82, 196, 26, 0.15);
  color: #52c41a;
}

.device-status-icon.offline {
  background: rgba(140, 140, 140, 0.15);
  color: #8c8c8c;
}

.device-status-icon.fault {
  background: rgba(250, 173, 20, 0.15);
  color: #faad14;
}

.device-status-icon.alarm {
  background: rgba(255, 77, 79, 0.15);
  color: #ff4d4f;
}

.device-title h4 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: var(--text-primary);
}

.status-badge {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 4px;
  font-weight: 600;
}

.status-badge.online { background: rgba(82, 196, 26, 0.2); color: #52c41a; }
.status-badge.offline { background: rgba(140, 140, 140, 0.2); color: #8c8c8c; }
.status-badge.fault { background: rgba(250, 173, 20, 0.2); color: #faad14; }
.status-badge.alarm { background: rgba(255, 77, 79, 0.2); color: #ff4d4f; }

.info-section {
  margin-bottom: 20px;
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-section h5 {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
}

.info-label {
  font-size: 11px;
  color: var(--text-tertiary);
}

.info-value {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.description {
  margin: 0;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.realtime-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.realtime-stats .stat-item {
  padding: 16px;
  background: rgba(24, 144, 255, 0.05);
  border: 1px solid rgba(24, 144, 255, 0.2);
  border-radius: 8px;
  text-align: center;
}

.realtime-stats .stat-label {
  display: block;
  font-size: 11px;
  color: var(--text-tertiary);
  margin-bottom: 6px;
}

.realtime-stats .stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary-color);
  font-family: 'DIN', monospace;
}

.panel-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid rgba(24, 144, 255, 0.2);
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
}

.btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.btn.secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn.primary {
  background: var(--primary-color);
  color: white;
}

.btn.primary:hover {
  background: #40a9ff;
}

.btn.danger {
  background: #ff4d4f;
  color: white;
}

.btn.danger:hover {
  background: #ff7875;
}
</style>
