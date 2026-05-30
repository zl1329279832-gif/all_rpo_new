<script setup lang="ts">
import type { DeviceData } from '@/types'
import { getDeviceStatusSummary } from '@/services/mockDataService'
import { useDeviceStore, useAlarmStore } from '@/stores'
import { Wifi, WifiOff, AlertTriangle, Wrench } from 'lucide-vue-next'

const deviceStore = useDeviceStore()
const alarmStore = useAlarmStore()

const summary = getDeviceStatusSummary(deviceStore.devices)
const alarmCount = alarmStore.alarms.length
</script>

<template>
  <div class="status-bar">
    <div class="status-item">
      <Wifi :size="14" class="icon-green" />
      <span>运行 <strong>{{ summary.running }}</strong></span>
    </div>
    <div class="status-item">
      <WifiOff :size="14" class="icon-gray" />
      <span>停机 <strong>{{ summary.stopped }}</strong></span>
    </div>
    <div class="status-item">
      <AlertTriangle :size="14" class="icon-red" />
      <span>告警 <strong>{{ alarmCount }}</strong></span>
    </div>
    <div class="status-item">
      <Wrench :size="14" class="icon-yellow" />
      <span>检修 <strong>{{ summary.maintenance }}</strong></span>
    </div>
    <div class="status-item time">
      {{ new Date().toLocaleTimeString('zh-CN') }}
    </div>
  </div>
</template>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 4px 16px;
  background: rgba(10, 22, 40, 0.85);
  border: 1px solid rgba(30, 144, 255, 0.1);
  border-radius: 6px;
  backdrop-filter: blur(8px);
}
.status-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #8cb8d8;
}
.status-item strong {
  color: #e6f7ff;
  font-variant-numeric: tabular-nums;
}
.status-item.time {
  color: #6a8caa;
  font-variant-numeric: tabular-nums;
  margin-left: auto;
}
.icon-green { color: #52c41a; }
.icon-gray { color: #595959; }
.icon-red { color: #ff4d4f; }
.icon-yellow { color: #fadb14; }
</style>
