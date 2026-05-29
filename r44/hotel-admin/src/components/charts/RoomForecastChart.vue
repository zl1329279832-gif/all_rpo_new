<template>
  <div class="chart-container">
    <v-chart
      ref="chartRef"
      :option="chartOption"
      :theme="isDark ? 'dark' : 'light'"
      autoresize
      class="chart"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
} from 'echarts/components'
import type { ComposeOption } from 'echarts/core'
import type { BarSeriesOption } from 'echarts/charts'
import type {
  TitleComponentOption,
  TooltipComponentOption,
  GridComponentOption,
  LegendComponentOption
} from 'echarts/components'
import type { RoomForecastDataItem } from './types'

use([
  CanvasRenderer,
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
])

type ECOption = ComposeOption<
  | BarSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | LegendComponentOption
>

const props = defineProps<{
  data: RoomForecastDataItem[]
  title?: string
}>()

const chartRef = ref()
const isDark = ref(false)

const getCSSVariable = (name: string): string => {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

const updateTheme = () => {
  isDark.value = document.documentElement.classList.contains('dark')
}

const chartOption = computed<ECOption>(() => {
  const textColor = getCSSVariable('--color-text-primary')
  const secondaryTextColor = getCSSVariable('--color-text-secondary')
  const borderColor = getCSSVariable('--color-border-lighter')
  const primaryColor = getCSSVariable('--color-primary')
  const successColor = getCSSVariable('--color-success')
  const infoColor = getCSSVariable('--color-info')
  const splitLineColor = getCSSVariable('--color-border-extra-light')

  const dates = props.data.map(item => item.date)
  const occupiedData = props.data.map(item => item.occupied)
  const reservedData = props.data.map(item => item.reserved)
  const availableData = props.data.map(item => item.available)

  const maxValue = Math.max(
    ...occupiedData.map((v, i) => v + reservedData[i] + availableData[i])
  )

  return {
    title: {
      text: props.title || '未来七日房态预测',
      left: 'center',
      top: 10,
      textStyle: {
        color: textColor,
        fontSize: 16,
        fontWeight: 500
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      backgroundColor: isDark.value ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderColor: borderColor,
      textStyle: {
        color: textColor
      },
      formatter: (params: any) => {
        const date = params[0].axisValue
        const occupied = params.find((p: any) => p.seriesName === '在住')?.value || 0
        const reserved = params.find((p: any) => p.seriesName === '预订')?.value || 0
        const available = params.find((p: any) => p.seriesName === '空房')?.value || 0
        const total = occupied + reserved + available
        const occupancyRate = total > 0 ? (((occupied + reserved) / total) * 100).toFixed(1) : 0

        return `<div style="font-weight: 500; margin-bottom: 8px;">${date}</div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: ${primaryColor};"></span>
                    <span>在住: <strong>${occupied}</strong> 间</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: ${successColor};"></span>
                    <span>预订: <strong>${reserved}</strong> 间</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: ${infoColor};"></span>
                    <span>空房: <strong>${available}</strong> 间</span>
                  </div>
                </div>
                <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid ${borderColor};">
                  <span style="color: ${secondaryTextColor};">入住率: </span>
                  <strong style="color: ${primaryColor};">${occupancyRate}%</strong>
                </div>`
      }
    },
    legend: {
      data: ['在住', '预订', '空房'],
      top: 45,
      textStyle: {
        color: secondaryTextColor,
        fontSize: 12
      },
      itemWidth: 14,
      itemHeight: 10,
      itemGap: 20
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 85,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: {
        lineStyle: {
          color: borderColor
        }
      },
      axisLabel: {
        color: secondaryTextColor,
        fontSize: 11,
        formatter: (value: string) => {
          const date = new Date(value)
          const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
          const monthDay = `${date.getMonth() + 1}/${date.getDate()}`
          const weekDay = weekDays[date.getDay()]
          return `${monthDay}\n${weekDay}`
        },
        interval: 0,
        lineHeight: 18
      },
      axisTick: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: Math.ceil(maxValue * 1.1 / 10) * 10,
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: secondaryTextColor,
        fontSize: 11,
        formatter: '{value}间'
      },
      splitLine: {
        lineStyle: {
          color: splitLineColor,
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: '在住',
        type: 'bar',
        stack: 'total',
        barWidth: '50%',
        data: occupiedData,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: primaryColor },
              { offset: 1, color: primaryColor + 'cc' }
            ]
          },
          borderRadius: [0, 0, 0, 0]
        },
        emphasis: {
          focus: 'series',
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        }
      },
      {
        name: '预订',
        type: 'bar',
        stack: 'total',
        data: reservedData,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: successColor },
              { offset: 1, color: successColor + 'cc' }
            ]
          }
        },
        emphasis: {
          focus: 'series',
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        }
      },
      {
        name: '空房',
        type: 'bar',
        stack: 'total',
        data: availableData,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: infoColor },
              { offset: 1, color: infoColor + 'cc' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        },
        emphasis: {
          focus: 'series',
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        }
      }
    ]
  }
})

watch(() => props.data, () => {
  if (chartRef.value) {
    chartRef.value.setOption(chartOption.value)
  }
}, { deep: true })

watch(isDark, () => {
  if (chartRef.value) {
    chartRef.value.setOption(chartOption.value, { notMerge: true })
  }
})

onMounted(() => {
  updateTheme()
  const observer = new MutationObserver(() => {
    updateTheme()
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  })
  ;(window as any).__forecastChartThemeObserver = observer
})

onUnmounted(() => {
  if ((window as any).__forecastChartThemeObserver) {
    (window as any).__forecastChartThemeObserver.disconnect()
  }
})
</script>

<style lang="scss" scoped>
.chart-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
  background-color: var(--color-bg-container);
  border-radius: var(--border-radius-base);
  padding: var(--spacing-base);
  box-shadow: var(--box-shadow-base);
  transition: background-color var(--transition-base), box-shadow var(--transition-base);

  .chart {
    width: 100%;
    height: 100%;
    min-height: 260px;
  }
}
</style>
