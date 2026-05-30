<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { TimeSeriesPoint } from '@/types'

use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const props = defineProps<{
  daily: TimeSeriesPoint[]
  monthly: TimeSeriesPoint[]
}>()

const option = computed(() => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(10, 22, 40, 0.9)',
    borderColor: 'rgba(30, 144, 255, 0.3)',
    textStyle: { color: '#e6f7ff', fontSize: 12 },
  },
  legend: {
    data: ['日能耗(kWh)'],
    textStyle: { color: '#8cb8d8', fontSize: 11 },
    top: 0,
  },
  grid: { left: 50, right: 16, top: 36, bottom: 30 },
  xAxis: {
    type: 'category',
    data: props.daily.map((_, i) => `${i}:00`),
    axisLine: { lineStyle: { color: 'rgba(30, 144, 255, 0.2)' } },
    axisLabel: { color: '#6a8caa', fontSize: 10, interval: 3 },
    splitLine: { show: false },
  },
  yAxis: {
    type: 'value',
    name: 'kWh',
    nameTextStyle: { color: '#6a8caa', fontSize: 10 },
    axisLine: { show: false },
    axisLabel: { color: '#6a8caa', fontSize: 10 },
    splitLine: { lineStyle: { color: 'rgba(30, 144, 255, 0.08)' } },
  },
  series: [
    {
      name: '日能耗(kWh)',
      type: 'bar',
      data: props.daily.map(p => p.value),
      barWidth: '50%',
      itemStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: '#1e90ff' }, { offset: 1, color: 'rgba(30, 144, 255, 0.2)' }],
        },
        borderRadius: [3, 3, 0, 0],
      },
    },
  ],
}))
</script>

<template>
  <div class="chart-card">
    <div class="chart-title">能耗分析</div>
    <VChart :option="option" autoresize style="height: 220px" />
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
</style>
