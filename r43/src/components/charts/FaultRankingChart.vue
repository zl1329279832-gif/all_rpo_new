<template>
  <div ref="chartRef" class="chart-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import type { FaultRankingData } from '@/types'
import { STATUS_COLORS } from '@/types'

const props = defineProps<{
  data: FaultRankingData[]
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const initChart = () => {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

const updateChart = () => {
  if (!chartInstance) return

  const colors = props.data.map(d => {
    const colorHex = STATUS_COLORS[d.type]
    return `#${colorHex.toString(16).padStart(6, '0')}`
  })

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      textStyle: { color: '#fff' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#666' }
    },
    yAxis: {
      type: 'category',
      data: props.data.map(d => d.name),
      axisLabel: { color: '#666' }
    },
    series: [
      {
        type: 'bar',
        data: props.data.map((d, index) => ({
          value: d.count,
          itemStyle: {
            color: colors[index],
            borderRadius: [0, 4, 4, 0]
          }
        })),
        barWidth: '50%',
        label: {
          show: true,
          position: 'right',
          formatter: '{c} 台',
          color: '#333'
        }
      }
    ]
  }

  chartInstance.setOption(option)
}

const handleResize = () => {
  chartInstance?.resize()
}

watch(() => props.data, () => {
  updateChart()
}, { deep: true })

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 200px;
}
</style>
