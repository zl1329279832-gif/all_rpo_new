<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { TimeSeriesPoint } from '@/types'

use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const props = defineProps<{
  flowIn: TimeSeriesPoint[]
  flowOut: TimeSeriesPoint[]
}>()

const option = computed(() => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(10, 22, 40, 0.9)',
    borderColor: 'rgba(30, 144, 255, 0.3)',
    textStyle: { color: '#e6f7ff', fontSize: 12 },
  },
  legend: {
    data: ['进水流量', '出水流量'],
    textStyle: { color: '#8cb8d8', fontSize: 11 },
    top: 0,
  },
  grid: { left: 50, right: 16, top: 36, bottom: 30 },
  xAxis: {
    type: 'category',
    data: props.flowIn.map(p => {
      const d = new Date(p.time)
      return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`
    }),
    axisLine: { lineStyle: { color: 'rgba(30, 144, 255, 0.2)' } },
    axisLabel: { color: '#6a8caa', fontSize: 10 },
    splitLine: { show: false },
  },
  yAxis: {
    type: 'value',
    name: 'm³/h',
    nameTextStyle: { color: '#6a8caa', fontSize: 10 },
    axisLine: { show: false },
    axisLabel: { color: '#6a8caa', fontSize: 10 },
    splitLine: { lineStyle: { color: 'rgba(30, 144, 255, 0.08)' } },
  },
  series: [
    {
      name: '进水流量',
      type: 'line',
      smooth: true,
      data: props.flowIn.map(p => p.value),
      lineStyle: { color: '#00e5ff', width: 2 },
      itemStyle: { color: '#00e5ff' },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(0, 229, 255, 0.25)' }, { offset: 1, color: 'rgba(0, 229, 255, 0.02)' }] } },
    },
    {
      name: '出水流量',
      type: 'line',
      smooth: true,
      data: props.flowOut.map(p => p.value),
      lineStyle: { color: '#1e90ff', width: 2 },
      itemStyle: { color: '#1e90ff' },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(30, 144, 255, 0.2)' }, { offset: 1, color: 'rgba(30, 144, 255, 0.02)' }] } },
    },
  ],
}))
</script>

<template>
  <div class="chart-card">
    <div class="chart-title">流量监测</div>
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
