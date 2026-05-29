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
  LegendComponent,
  MarkLineComponent
} from 'echarts/components'
import type { ComposeOption } from 'echarts/core'
import type { BarSeriesOption } from 'echarts/charts'
import type {
  TitleComponentOption,
  TooltipComponentOption,
  GridComponentOption,
  LegendComponentOption
} from 'echarts/components'

use([
  CanvasRenderer,
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent
])

type ECOption = ComposeOption<
  | BarSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | LegendComponentOption
>

const props = defineProps<{
  data: ADRDataItem[]
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
  const splitLineColor = getCSSVariable('--color-border-extra-light')

  const dates = props.data.map(item => item.date)
  const adrs = props.data.map(item => item.adr)
  const avgAdr = adrs.length > 0 ? adrs.reduce((a, b) => a + b, 0) / adrs.length : 0
  const maxAdr = adrs.length > 0 ? Math.max(...adrs) : 0

  return {
    title: {
      text: props.title || '平均房价（ADR）',
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
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        const data = params[0]
        const diff = data.value - avgAdr
        const diffText = diff >= 0 ? `+¥${diff.toFixed(0)}` : `-¥${Math.abs(diff).toFixed(0)}`
        const diffColor = diff >= 0 ? successColor : getCSSVariable('--color-danger')
        return `<div style="font-weight: 500; margin-bottom: 4px;">${data.axisValue}</div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <span style="display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: ${primaryColor};"></span>
                  <span>ADR: <strong style="color: ${primaryColor}; font-size: 16px;">¥${data.value.toFixed(0)}</strong></span>
                </div>
                <div style="font-size: 12px; color: ${diffColor};">较平均: ${diffText}</div>`
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
      data: dates,
      axisLine: {
        lineStyle: {
          color: borderColor
        }
      },
      axisLabel: {
        color: secondaryTextColor,
        fontSize: 11,
        rotate: dates.length > 10 ? 45 : 0,
        formatter: (value: string) => {
          if (dates.length > 15) {
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
      max: Math.ceil(maxAdr * 1.1 / 100) * 100,
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: secondaryTextColor,
        fontSize: 11,
        formatter: '¥{value}'
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
        name: 'ADR',
        type: 'bar',
        barWidth: '60%',
        data: adrs.map((value, index) => ({
          value,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: value >= avgAdr ? successColor : primaryColor },
                { offset: 1, color: (value >= avgAdr ? successColor : primaryColor) + '80' }
              ]
            }
          }
        })),
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
              yAxis: avgAdr,
              label: {
                formatter: `平均: ¥${avgAdr.toFixed(0)}`,
                color: getCSSVariable('--color-warning'),
                fontSize: 11
              }
            }
          ]
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
  ;(window as any).__adrChartThemeObserver = observer
})

onUnmounted(() => {
  if ((window as any).__adrChartThemeObserver) {
    (window as any).__adrChartThemeObserver.disconnect()
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
