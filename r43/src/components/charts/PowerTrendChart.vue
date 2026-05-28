<template>
  <div ref="chartRef" class="chart-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import type { PowerGenerationData } from '@/types'

const props = defineProps<{
  data: PowerGenerationData[]
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

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#333',
      textStyle: { color: '#fff' },
      axisPointer: {
        type: 'cross',
        crossStyle: { color: '#999' }
      }
    },
    legend: {
      data: ['发电量', '辐照度', '温度'],
      textStyle: { color: '#333' },
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: props.data.map(d => d.time),
      axisPointer: { type: 'shadow' },
      axisLabel: { color: '#666' }
    },
    yAxis: [
      {
        type: 'value',
        name: '发电量(MW)',
        position: 'left',
        axisLabel: { color: '#666' },
        nameTextStyle: { color: '#666' }
      },
      {
        type: 'value',
        name: '辐照度(W/㎡)',
        position: 'right',
        axisLabel: { color: '#666' },
        nameTextStyle: { color: '#666' }
      },
      {
        type: 'value',
        name: '温度(℃)',
        position: 'right',
        offset: 60,
        axisLabel: { color: '#666' },
        nameTextStyle: { color: '#666' }
      }
    ],
    series: [
      {
        name: '发电量',
        type: 'bar',
        data: props.data.map(d => d.power),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#2ecc71' },
            { offset: 1, color: '#27ae60' }
          ])
        }
      },
      {
        name: '辐照度',
        type: 'line',
        yAxisIndex: 1,
        data: props.data.map(d => d.irradiance),
        smooth: true,
        lineStyle: { color: '#f39c12', width: 2 },
        itemStyle: { color: '#f39c12' }
      },
      {
        name: '温度',
        type: 'line',
        yAxisIndex: 2,
        data: props.data.map(d => d.temperature),
        smooth: true,
        lineStyle: { color: '#e74c3c', width: 2 },
        itemStyle: { color: '#e74c3c' }
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
  height: 280px;
}
</style>
