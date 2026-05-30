<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { TimeSeriesPoint, AlarmLevel } from '@/types'
import { ALARM_LEVEL_COLORS, ALARM_LEVEL_LABELS } from '@/types'

use([LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const props = defineProps<{
  trend: TimeSeriesPoint[]
  distribution: Record<AlarmLevel, number>
}>()

const option = computed(() => {
  const levels: AlarmLevel[] = ['critical', 'major', 'minor', 'info']
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 22, 40, 0.9)',
      borderColor: 'rgba(30, 144, 255, 0.3)',
      textStyle: { color: '#e6f7ff', fontSize: 12 },
    },
    legend: {
      textStyle: { color: '#8cb8d8', fontSize: 11 },
      top: 0,
      data: ['告警总数', ...levels.map(l => ALARM_LEVEL_LABELS[l])],
    },
    grid: { left: 50, right: 16, top: 36, bottom: 30 },
    xAxis: {
      type: 'category',
      data: props.trend.map((_, i) => `${i + 1}日`),
      axisLine: { lineStyle: { color: 'rgba(30, 144, 255, 0.2)' } },
      axisLabel: { color: '#6a8caa', fontSize: 10 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { color: '#6a8caa', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(30, 144, 255, 0.08)' } },
    },
    series: [
      {
        name: '告警总数',
        type: 'line',
        smooth: true,
        data: props.trend.map(p => p.value),
        lineStyle: { color: '#ff4d4f', width: 2 },
        itemStyle: { color: '#ff4d4f' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(255, 77, 79, 0.2)' }, { offset: 1, color: 'rgba(255, 77, 79, 0.02)' }] } },
      },
      ...levels.map(level => ({
        name: ALARM_LEVEL_LABELS[level],
        type: 'bar' as const,
        stack: 'distribution',
        data: Array(7).fill(Math.floor(props.distribution[level] / 7 * (0.5 + Math.random()))),
        barWidth: '30%',
        itemStyle: { color: ALARM_LEVEL_COLORS[level] },
      })),
    ],
  }
})
</script>

<template>
  <div class="chart-card">
    <div class="chart-title">告警趋势</div>
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
