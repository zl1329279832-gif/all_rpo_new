<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { TelemetryData } from '../types'
import { TelemetryGenerator } from '../data/mockTelemetry'

const props = defineProps<{
  isOpen: boolean
}>()

const telemetryData = ref<TelemetryData | null>(null)
const telemetryGenerator = new TelemetryGenerator()

function formatNumber(num: number, decimals: number = 1): string {
  return num.toFixed(decimals)
}

function formatAngle(angle: number): string {
  return (angle * 180 / Math.PI).toFixed(2)
}

function getStatusColor(value: number, thresholds: { low: number; high: number }): string {
  if (value < thresholds.low) return '#ff4444'
  if (value > thresholds.high) return '#ffaa00'
  return '#00ff88'
}

function getBatteryColor(level: number): string {
  if (level < 20) return '#ff4444'
  if (level < 50) return '#ffaa00'
  return '#00ff88'
}

function getLinkStatusColor(status: string): string {
  switch (status) {
    case 'connected': return '#00ff88'
    case 'degraded': return '#ffaa00'
    default: return '#ff4444'
  }
}

function getLinkStatusText(status: string): string {
  switch (status) {
    case 'connected': return '正常'
    case 'degraded': return '降级'
    default: return '断开'
  }
}

onMounted(() => {
  telemetryGenerator.start(500)
  telemetryGenerator.subscribe((data) => {
    telemetryData.value = data
  })
})

onUnmounted(() => {
  telemetryGenerator.dispose()
})
</script>

<template>
  <div class="data-panel" :class="{ visible: isOpen }">
    <div class="panel-header">
      <h3>遥测数据</h3>
      <div class="status-indicator">
        <span class="dot"></span>
        <span>实时</span>
      </div>
    </div>

    <div class="panel-content" v-if="telemetryData">
      <div class="data-section">
        <div class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          功率系统
        </div>
        <div class="data-grid">
          <div class="data-item">
            <span class="label">太阳能输出</span>
            <span class="value" :style="{ color: getStatusColor(telemetryData.power.solarPanelOutput, { low: 5000, high: 25000 }) }">
              {{ formatNumber(telemetryData.power.solarPanelOutput / 1000) }} kW
            </span>
          </div>
          <div class="data-item">
            <span class="label">电池电量</span>
            <span class="value" :style="{ color: getBatteryColor(telemetryData.power.batteryLevel) }">
              {{ formatNumber(telemetryData.power.batteryLevel) }}%
            </span>
          </div>
          <div class="data-item">
            <span class="label">功耗</span>
            <span class="value">
              {{ formatNumber(telemetryData.power.powerConsumption / 1000) }} kW
            </span>
          </div>
        </div>
        <div class="battery-bar">
          <div 
            class="battery-fill" 
            :style="{ 
              width: telemetryData.power.batteryLevel + '%',
              background: getBatteryColor(telemetryData.power.batteryLevel)
            }"
          ></div>
        </div>
      </div>

      <div class="data-section">
        <div class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88"/>
          </svg>
          姿态状态
        </div>
        <div class="data-grid">
          <div class="data-item">
            <span class="label">滚转 (Roll)</span>
            <span class="value">{{ formatAngle(telemetryData.attitude.roll) }}°</span>
          </div>
          <div class="data-item">
            <span class="label">俯仰 (Pitch)</span>
            <span class="value">{{ formatAngle(telemetryData.attitude.pitch) }}°</span>
          </div>
          <div class="data-item">
            <span class="label">偏航 (Yaw)</span>
            <span class="value">{{ formatAngle(telemetryData.attitude.yaw) }}°</span>
          </div>
        </div>
        <div class="attitude-indicator">
          <div class="axis">
            <span class="axis-label">X</span>
            <div class="axis-bar">
              <div 
                class="axis-fill" 
                :style="{ width: 50 + telemetryData.attitude.angularVelocity.x * 100 + '%' }"
              ></div>
            </div>
          </div>
          <div class="axis">
            <span class="axis-label">Y</span>
            <div class="axis-bar">
              <div 
                class="axis-fill" 
                :style="{ width: 50 + telemetryData.attitude.angularVelocity.y * 100 + '%' }"
              ></div>
            </div>
          </div>
          <div class="axis">
            <span class="axis-label">Z</span>
            <div class="axis-bar">
              <div 
                class="axis-fill" 
                :style="{ width: 50 + telemetryData.attitude.angularVelocity.z * 100 + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div class="data-section">
        <div class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
          </svg>
          温度监控
        </div>
        <div class="data-grid">
          <div class="data-item">
            <span class="label">舱体温度</span>
            <span class="value">{{ formatNumber(telemetryData.temperature.body) }}°C</span>
          </div>
          <div class="data-item">
            <span class="label">帆板温度</span>
            <span class="value">{{ formatNumber(telemetryData.temperature.solarPanel) }}°C</span>
          </div>
          <div class="data-item">
            <span class="label">电池温度</span>
            <span class="value">{{ formatNumber(telemetryData.temperature.battery) }}°C</span>
          </div>
          <div class="data-item">
            <span class="label">CPU温度</span>
            <span class="value" :style="{ color: getStatusColor(telemetryData.temperature.cpu, { low: 0, high: 70 }) }">
              {{ formatNumber(telemetryData.temperature.cpu) }}°C
            </span>
          </div>
        </div>
      </div>

      <div class="data-section">
        <div class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 16.9V11a7 7 0 0 1 14 0v5.9"/>
            <rect x="3" y="16.9" width="18" height="4.1" rx="1"/>
          </svg>
          通信状态
        </div>
        <div class="data-grid">
          <div class="data-item">
            <span class="label">信号强度</span>
            <span class="value" :style="{ color: getStatusColor(telemetryData.communication.signalStrength, { low: 30, high: 60 }) }">
              {{ formatNumber(telemetryData.communication.signalStrength) }} dBm
            </span>
          </div>
          <div class="data-item">
            <span class="label">数据速率</span>
            <span class="value">{{ formatNumber(telemetryData.communication.dataRate / 1000, 2) }} Mbps</span>
          </div>
          <div class="data-item">
            <span class="label">链路状态</span>
            <span class="value" :style="{ color: getLinkStatusColor(telemetryData.communication.linkStatus) }">
              {{ getLinkStatusText(telemetryData.communication.linkStatus) }}
            </span>
          </div>
        </div>
        <div class="signal-bars">
          <div 
            class="signal-bar" 
            :class="{ active: telemetryData.communication.signalStrength > 20 }"
          ></div>
          <div 
            class="signal-bar" 
            :class="{ active: telemetryData.communication.signalStrength > 35 }"
          ></div>
          <div 
            class="signal-bar" 
            :class="{ active: telemetryData.communication.signalStrength > 50 }"
          ></div>
          <div 
            class="signal-bar" 
            :class="{ active: telemetryData.communication.signalStrength > 65 }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.data-panel {
  position: absolute;
  top: 100px;
  right: 20px;
  width: 320px;
  max-height: calc(100vh - 140px);
  background: rgba(10, 22, 40, 0.95);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  overflow: hidden;
  transform: translateX(360px);
  transition: transform 0.3s ease;
  z-index: 90;
  display: flex;
  flex-direction: column;

  &.visible {
    transform: translateX(0);
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #fff;
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #00ff88;

    .dot {
      width: 8px;
      height: 8px;
      background: #00ff88;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.panel-content {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 212, 255, 0.3);
    border-radius: 2px;
  }
}

.data-section {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #00d4ff;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;

  svg {
    width: 16px;
    height: 16px;
  }
}

.data-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.data-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;

  .label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
  }

  .value {
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    font-family: 'JetBrains Mono', monospace;
  }
}

.battery-bar {
  margin-top: 12px;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;

  .battery-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease, background 0.3s ease;
  }
}

.attitude-indicator {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;

  .axis {
    display: flex;
    align-items: center;
    gap: 8px;

    .axis-label {
      width: 16px;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.5);
      font-weight: 600;
    }

    .axis-bar {
      flex: 1;
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: hidden;
      position: relative;

      &::before {
        content: '';
        position: absolute;
        left: 50%;
        top: 0;
        bottom: 0;
        width: 1px;
        background: rgba(255, 255, 255, 0.3);
      }

      .axis-fill {
        height: 100%;
        background: #00d4ff;
        border-radius: 3px;
        transition: width 0.1s ease;
        min-width: 0;
        max-width: 100%;
      }
    }
  }
}

.signal-bars {
  margin-top: 12px;
  display: flex;
  gap: 4px;
  align-items: flex-end;
  height: 24px;

  .signal-bar {
    width: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    transition: background 0.3s ease;

    &:nth-child(1) { height: 8px; }
    &:nth-child(2) { height: 12px; }
    &:nth-child(3) { height: 18px; }
    &:nth-child(4) { height: 24px; }

    &.active {
      background: #00d4ff;
    }
  }
}

@media (max-width: 768px) {
  .data-panel {
    width: 280px;
    right: 10px;
    top: 80px;
  }
}
</style>
