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
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent
} from 'echarts/components'
import type { ComposeOption } from 'echarts/core'
import type { LineSeriesOption } from 'echarts/charts'
import type {
  TitleComponentOption,
  TooltipComponentOption,
  GridComponentOption,
  LegendComponentOption
} from 'echarts/components'
import type { OccupancyRateDataItem } from './types'

use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent
])

type ECOption = ComposeOption<
  | LineSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | LegendComponentOption
>

const props = defineProps<{
  data: OccupancyRateDataItem[]
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
  const textColor = isDark.value ? getCSSVariable('--color-text-primary') : getCSSVariable('--color-text-primary')
  const secondaryTextColor = isDark.value ? getCSSVariable('--color-text-secondary') : getCSSVariable('--color-text-secondary')
  const borderColor = isDark.value ? getCSSVariable('--color-border-lighter') : getCSSVariable('--color-border-lighter')
  const primaryColor = getCSSVariable('--color-primary')
  const splitLineColor = isDark.value ? getCSSVariable('--color-border-extra-light') : getCSSVariable('--color-border-extra-light')

  const dates = props.data.map(item => item.date)
  const rates = props.data.map(item => item.rate)
  const avgRate = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0

  return {
    title: {
      text: props.title || '入住率趋势（最近30天）',
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
      backgroundColor: isDark.value ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderColor: borderColor,
      textStyle: {
        color: textColor
      },
      formatter: (params: any) => {
        const data = params[0]
        return `<div style="font-weight: 500; margin-bottom: 4px;">${data.axisValue}</div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${primaryColor};"></span>
                  <span>入住率: <strong style="color: ${primaryColor};">${data.value.toFixed(1)}%</strong></span>
                </div>`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 60,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLine: {
        lineStyle: {
          color: borderColor
        }
      },
      axisLabel: {
        color: secondaryTextColor,
        fontSize: 11,
        rotate: dates.length > 15 ? 45 : 0,
        formatter: (value: string) => {
          if (dates.length > 20) {
            const date = new Date(value)
            return `${date.getMonth() + 1}/${date.getDate()}`
          }
          return value
        }
      },
      axisTick: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: secondaryTextColor,
        fontSize: 11,
        formatter: '{value}%'
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
        name: '入住率',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: false,
        data: rates,
        lineStyle: {
          width: 3,
          color: primaryColor
        },
        itemStyle: {
          color: primaryColor,
          borderColor: isDark.value ? '#141414' : '#ffffff',
          borderWidth: 2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: primaryColor + '40' },
              { offset: 1, color: primaryColor + '05' }
            ]
          }
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: {
            color: getCSSVariable('--color-warning'),
            type: 'dashed',
            width: 1
          },
          data: [
            {
              yAxis: avgRate,
              label: {
                formatter: `平均: ${avgRate.toFixed(1)}%`,
                color: getCSSVariable('--color-warning'),
                fontSize: 11
              }
            }
          ]
        },
        emphasis: {
          focus: 'series',
          itemStyle: {
            symbolSize: 10
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
  ;(window as any).__chartThemeObserver = observer
})

onUnmounted(() => {
  if ((window as any).__chartThemeObserver) {
    (window as any).__chartThemeObserver.disconnect()
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
