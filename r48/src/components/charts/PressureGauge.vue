<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { GaugeChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([GaugeChart, TooltipComponent, CanvasRenderer])

const props = defineProps<{
  pressurePoints: Record<string, { time: number; value: number }[]>
}>()

const gaugeOption = (name: string, value: number) => ({
  series: [{
    type: 'gauge',
    startAngle: 210,
    endAngle: -30,
    min: 0,
    max: 1,
    progress: { show: true, width: 10, itemStyle: { color: '#1e90ff' } },
    axisLine: { lineStyle: { width: 10, color: [[1, 'rgba(30, 144, 255, 0.15)']] } },
    axisTick: { show: false },
    splitLine: { show: false },
    axisLabel: { show: false },
    pointer: { show: true, length: '60%', width: 3, itemStyle: { color: '#00e5ff' } },
    detail: { valueAnimation: true, formatter: '{value} MPa', color: '#e6f7ff', fontSize: 12, offsetCenter: [0, '70%'] },
    title: { show: true, color: '#8cb8d8', fontSize: 11, offsetCenter: [0, '90%'] },
    data: [{ value: Number(value.toFixed(2)), name }],
  }],
})

const gauges = computed(() => {
  const result: { name: string; option: any }[] = []
  for (const [name, points] of Object.entries(props.pressurePoints)) {
    const latest = points[points.length - 1]?.value ?? 0
    result.push({ name, option: gaugeOption(name, latest) })
  }
  return result
})
</script>

<template>
  <div class="chart-card">
    <div class="chart-title">压力监测</div>
    <div class="gauge-grid">
      <div v-for="g in gauges" :key="g.name" class="gauge-item">
        <VChart :option="g.option" autoresize style="height: 160px" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-card {
  background: rgba(10, 22, 40, 0.8);
  border: 1px solid rgba(30, 144, 255, 0.15);
  border-radius: 8px;
  padding: 14px;
  backdrop-filter: blur(8px);
}
.chart-title {
  font-size: 13px;
  color: #8cb8d8;
  margin-bottom: 8px;
  letter-spacing: 1px;
}
.gauge-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.gauge-item {
  background: rgba(30, 144, 255, 0.04);
  border-radius: 6px;
  padding: 4px;
}
</style>
