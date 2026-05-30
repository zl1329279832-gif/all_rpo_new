<script setup lang="ts">
import TopToolbar from '@/components/ui/TopToolbar.vue'
import FlowChart from '@/components/charts/FlowChart.vue'
import PressureGauge from '@/components/charts/PressureGauge.vue'
import EnergyChart from '@/components/charts/EnergyChart.vue'
import OnlineRateChart from '@/components/charts/OnlineRateChart.vue'
import AlarmTrendChart from '@/components/charts/AlarmTrendChart.vue'
import { useSceneStore } from '@/stores'

const sceneStore = useSceneStore()
const metrics = sceneStore.stationMetrics
</script>

<template>
  <div class="dashboard-page">
    <TopToolbar />
    <div class="dashboard-body">
      <div class="dashboard-grid">
        <FlowChart :flow-in="metrics.flowIn" :flow-out="metrics.flowOut" />
        <PressureGauge :pressure-points="metrics.pressure" />
        <EnergyChart :daily="metrics.energyDaily" :monthly="metrics.energyMonthly" />
        <OnlineRateChart :online="metrics.onlineRate.online" :offline="metrics.onlineRate.offline" />
        <AlarmTrendChart :trend="metrics.alarmTrend" :distribution="metrics.alarmDistribution" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  background: #0a1628;
  overflow: hidden;
}
.dashboard-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  max-width: 1400px;
  margin: 0 auto;
}
@media (max-width: 900px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
