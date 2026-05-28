<template>
  <div class="stats-panel">
    <div class="panel-section">
      <div class="section-header">
        <span class="section-title">📈 发电量趋势</span>
      </div>
      <PowerTrendChart :data="powerData" />
    </div>

    <div class="panel-row">
      <div class="panel-section half">
        <div class="section-header">
          <span class="section-title">📊 故障排行</span>
        </div>
        <FaultRankingChart :data="faultRanking" />
      </div>
      <div class="panel-section half">
        <div class="section-header">
          <span class="section-title">💚 设备在线率</span>
        </div>
        <OnlineRateChart :rate="onlineRate" />
      </div>
    </div>

    <div class="panel-section">
      <div class="section-header">
        <span class="section-title">🔧 维护进度</span>
      </div>
      <MaintenanceProgress 
        :progress="maintenanceProgress" 
        :totalCount="maintenanceCount" 
      />
    </div>

    <div class="panel-section">
      <AlarmPanel :alarms="alarms" @locate="$emit('locate', $event)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import PowerTrendChart from '@/components/charts/PowerTrendChart.vue'
import FaultRankingChart from '@/components/charts/FaultRankingChart.vue'
import OnlineRateChart from '@/components/charts/OnlineRateChart.vue'
import MaintenanceProgress from '@/components/charts/MaintenanceProgress.vue'
import AlarmPanel from '@/components/AlarmPanel.vue'
import type { PowerGenerationData, FaultRankingData, AlarmData } from '@/types'

defineProps<{
  powerData: PowerGenerationData[]
  faultRanking: FaultRankingData[]
  onlineRate: number
  maintenanceProgress: number
  maintenanceCount: number
  alarms: AlarmData[]
}>()

defineEmits<{
  (e: 'locate', deviceId: string): void
}>()
</script>

<style scoped>
.stats-panel {
  width: 400px;
  height: 100%;
  background: #f8fafc;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.panel-row {
  display: flex;
  gap: 16px;
}

.panel-section.half {
  flex: 1;
}

.section-header {
  margin-bottom: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: bold;
  color: #1e293b;
}
</style>
