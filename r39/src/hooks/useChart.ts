import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption, ECharts } from 'echarts'
import { useAppStore } from '../stores/app'

export function useChart(chartRef: { value: HTMLElement | null }, options: EChartsOption) {
  const appStore = useAppStore()
  const chartInstance = ref<ECharts | null>(null)

  function initChart() {
    if (!chartRef.value) return

    chartInstance.value = echarts.init(chartRef.value)
    chartInstance.value.setOption(options)
  }

  function updateOption(newOptions: EChartsOption) {
    if (chartInstance.value) {
      chartInstance.value.setOption(newOptions, true)
    }
  }

  function handleResize() {
    chartInstance.value?.resize()
  }

  watch(() => appStore.isDarkMode, () => {
    if (chartInstance.value) {
      chartInstance.value.dispose()
      initChart()
    }
  })

  onMounted(() => {
    initChart()
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    chartInstance.value?.dispose()
  })

  return {
    chartInstance,
    updateOption
  }
}
