import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption, ECharts } from 'echarts'

export function useChart(chartRef: { value: HTMLElement | null }) {
  const chartInstance = ref<ECharts | null>(null)
  const isLoading = ref(false)

  const initChart = (option: EChartsOption) => {
    if (!chartRef.value) return

    chartInstance.value = echarts.init(chartRef.value)
    chartInstance.value.setOption(option)

    window.addEventListener('resize', handleResize)
  }

  const updateChart = (option: EChartsOption, notMerge: boolean = false) => {
    if (!chartInstance.value) {
      initChart(option)
      return
    }

    chartInstance.value.setOption(option, notMerge)
  }

  const handleResize = () => {
    chartInstance.value?.resize()
  }

  const showLoading = () => {
    isLoading.value = true
    chartInstance.value?.showLoading()
  }

  const hideLoading = () => {
    isLoading.value = false
    chartInstance.value?.hideLoading()
  }

  const onChartClick = (callback: (params: any) => void) => {
    chartInstance.value?.on('click', callback)
  }

  const disposeChart = () => {
    if (chartInstance.value) {
      window.removeEventListener('resize', handleResize)
      chartInstance.value.dispose()
      chartInstance.value = null
    }
  }

  const getChartInstance = () => {
    return chartInstance.value
  }

  onMounted(() => {
    nextTick(() => {
      if (chartRef.value && !chartInstance.value) {
        chartInstance.value = echarts.init(chartRef.value)
      }
    })
  })

  onUnmounted(() => {
    disposeChart()
  })

  return {
    chartInstance,
    isLoading,
    initChart,
    updateChart,
    showLoading,
    hideLoading,
    onChartClick,
    disposeChart,
    getChartInstance,
  }
}

export function createLineOption(
  xData: string[],
  seriesData: { name: string; data: number[]; color?: string }[],
  title?: string
): EChartsOption {
  return {
    title: title ? { text: title, left: 'center', textStyle: { fontSize: 16 } } : undefined,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
    },
    legend: {
      data: seriesData.map((s) => s.name),
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: title ? '15%' : '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xData,
    },
    yAxis: {
      type: 'value',
    },
    series: seriesData.map((series) => ({
      name: series.name,
      type: 'line',
      smooth: true,
      data: series.data,
      itemStyle: {
        color: series.color,
      },
      areaStyle: series.color
        ? {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: series.color + '40' },
              { offset: 1, color: series.color + '10' },
            ]),
          }
        : undefined,
    })),
  }
}

export function createBarOption(
  xData: string[],
  seriesData: { name: string; data: number[]; color?: string }[],
  title?: string
): EChartsOption {
  return {
    title: title ? { text: title, left: 'center', textStyle: { fontSize: 16 } } : undefined,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      data: seriesData.map((s) => s.name),
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: title ? '15%' : '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: {
        rotate: xData.length > 5 ? 30 : 0,
        interval: 0,
      },
    },
    yAxis: {
      type: 'value',
    },
    series: seriesData.map((series) => ({
      name: series.name,
      type: 'bar',
      data: series.data,
      itemStyle: {
        color: series.color,
        borderRadius: [4, 4, 0, 0],
      },
      barMaxWidth: 40,
    })),
  }
}

export function createPieOption(
  data: { name: string; value: number }[],
  title?: string
): EChartsOption {
  return {
    title: title ? { text: title, left: 'center', textStyle: { fontSize: 16 } } : undefined,
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle',
    },
    series: [
      {
        name: title || '数据分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data,
      },
    ],
  }
}

export function createGaugeOption(value: number, title: string, max: number = 100): EChartsOption {
  return {
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max,
        splitNumber: 5,
        itemStyle: {
          color: value > 90 ? '#F44336' : value > 70 ? '#FF9800' : '#4CAF50',
        },
        progress: {
          show: true,
          width: 20,
        },
        pointer: {
          show: false,
        },
        axisLine: {
          lineStyle: {
            width: 20,
          },
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          show: false,
        },
        axisLabel: {
          show: false,
        },
        title: {
          show: true,
          offsetCenter: [0, '30%'],
          fontSize: 14,
          color: '#666',
        },
        detail: {
          valueAnimation: true,
          fontSize: 32,
          fontWeight: 'bold',
          offsetCenter: [0, '0%'],
          formatter: '{value}%',
        },
        data: [
          {
            value,
            name: title,
          },
        ],
      },
    ],
  }
}
