<template>
  <div class="chart-container">
    <div v-if="hasSurge" class="surge-warning">
      <el-icon class="warning-icon"><WarningFilled /></el-icon>
      <span>检测到退订激增！</span>
    </div>
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
  MarkAreaComponent,
  MarkLineComponent
} from 'echarts/components'
import type { ComposeOption } from 'echarts/core'
import type { LineSeriesOption } from 'echarts/charts'
import type {
  TitleComponentOption,
  TooltipComponentOption,
  GridComponentOption,
  LegendComponentOption,
  MarkAreaComponentOption,
  MarkLineComponentOption
} from 'echarts/components'
import { WarningFilled } from '@element-plus/icons-vue'

use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  MarkLineComponent
])

type ECOption = ComposeOption<
  | LineSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | LegendComponentOption
  | MarkAreaComponentOption
  | MarkLineComponentOption
>

const props = defineProps<{
  data: CancellationDataItem[]
  title?: string
  surgeThreshold?: number
}>()

const chartRef = ref()
const isDark = ref(false)

const getCSSVariable = (name: string): string => {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

const updateTheme = () => {
  isDark.value = document.documentElement.classList.contains('dark')
}

const hasSurge = computed(() => {
  return props.data.some(item => item.isSurge)
})

const chartOption = computed<ECOption>(() => {
  const textColor = getCSSVariable('--color-text-primary')
  const secondaryTextColor = getCSSVariable('--color-text-secondary')
  const borderColor = getCSSVariable('--color-border-lighter')
  const dangerColor = getCSSVariable('--color-danger')
  const warningColor = getCSSVariable('--color-warning')
  const splitLineColor = getCSSVariable('--color-border-extra-light')

  const dates = props.data.map(item => item.date)
  const counts = props.data.map(item => item.count)
  const avgCount = counts.length > 0 ? counts.reduce((a, b) => a + b, 0) / counts.length : 0
  const threshold = props.surgeThreshold || avgCount * 1.5

  const markAreas: any[] = []
  const surgeIndices: number[] = []

  props.data.forEach((item, index) => {
    if (item.isSurge || item.count >= threshold) {
      surgeIndices.push(index)
    }
  })

  for (let i = 0; i < surgeIndices.length; i++) {
    const current = surgeIndices[i]
    if (i === 0 || current !== surgeIndices[i - 1] + 1) {
      let end = current
      while (surgeIndices.includes(end + 1)) {
        end++
        i++
      }
      markAreas.push([
        {
          xAxis: dates[current],
          itemStyle: {
            color: dangerColor + '15'
          }
        },
        {
          xAxis: dates[Math.min(end + 1, dates.length - 1)]
        }
      ])
    }
  }

  return {
    title: {
      text: props.title || '退订变化趋势',
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
        type: 'line',
        lineStyle: {
          color: dangerColor,
          width: 1,
          type: 'dashed'
        }
      },
      formatter: (params: any) => {
        const data = params[0]
        const isSurgeDay = data.data >= threshold
        const surgeText = isSurgeDay ? '<span style="color: ' + dangerColor + '; margin-left: 8px;">⚠️ 激增</span>' : ''
        return `<div style="font-weight: 500; margin-bottom: 4px; display: flex; align-items: center;">${data.axisValue}${surgeText}</div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${data.color};"></span>
                  <span>退订量: <strong style="color: ${data.color};">${data.value}</strong></span>
                </div>
                <div style="font-size: 12px; color: ${secondaryTextColor}; margin-top: 4px;">阈值: ${Math.round(threshold)}</div>`
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
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: secondaryTextColor,
        fontSize: 11
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
        name: '退订量',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        showSymbol: true,
        data: counts.map((value, index) => ({
          value,
          itemStyle: {
            color: (props.data[index].isSurge || value >= threshold) ? dangerColor : warningColor,
            borderColor: isDark.value ? '#141414' : '#ffffff',
            borderWidth: 2
          }
        })),
        lineStyle: {
          width: 3,
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: warningColor },
              { offset: 1, color: dangerColor }
            ]
          }
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: warningColor + '40' },
              { offset: 1, color: dangerColor + '10' }
            ]
          }
        },
        markArea: {
          silent: true,
          data: markAreas
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: {
            color: dangerColor,
            type: 'dashed',
            width: 1
          },
          data: [
            {
              yAxis: threshold,
              label: {
                formatter: `阈值: ${Math.round(threshold)}`,
                color: dangerColor,
                fontSize: 11
              }
            }
          ]
        },
        emphasis: {
          focus: 'series',
          itemStyle: {
            symbolSize: 12,
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
  ;(window as any).__cancelChartThemeObserver = observer
})

onUnmounted(() => {
  if ((window as any).__cancelChartThemeObserver) {
    (window as any).__cancelChartThemeObserver.disconnect()
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
  position: relative;

  .surge-warning {
    position: absolute;
    top: 12px;
    right: 16px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    background-color: var(--color-danger-lighter);
    color: var(--color-danger);
    border-radius: var(--border-radius-round);
    font-size: 12px;
    font-weight: 500;
    z-index: 10;
    animation: pulse 2s infinite;

    .warning-icon {
      font-size: 14px;
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  .chart {
    width: 100%;
    height: 100%;
    min-height: 260px;
  }
}

:deep(html.dark) {
  .surge-warning {
    background-color: var(--color-danger-lighter);
    opacity: 0.9;
  }
}
</style>
