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
import { GaugeChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent
} from 'echarts/components'
import type { ComposeOption } from 'echarts/core'
import type { GaugeSeriesOption } from 'echarts/charts'
import type {
  TitleComponentOption,
  TooltipComponentOption
} from 'echarts/components'
import type { RevPARData } from './types'

use([
  CanvasRenderer,
  GaugeChart,
  TitleComponent,
  TooltipComponent
])

type ECOption = ComposeOption<
  | GaugeSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
>

const props = defineProps<{
  data: RevPARData
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
  const primaryColor = getCSSVariable('--color-primary')
  const successColor = getCSSVariable('--color-success')
  const warningColor = getCSSVariable('--color-warning')
  const dangerColor = getCSSVariable('--color-danger')

  const value = props.data.value
  const max = props.data.max || 1000
  const unit = props.data.unit || '¥'
  const percentage = Math.min((value / max) * 100, 100)

  let progressColor = primaryColor
  if (percentage >= 80) {
    progressColor = successColor
  } else if (percentage >= 50) {
    progressColor = warningColor
  } else {
    progressColor = dangerColor
  }

  return {
    title: {
      text: props.title || '每房收益（RevPAR）',
      left: 'center',
      top: 10,
      textStyle: {
        color: textColor,
        fontSize: 16,
        fontWeight: 500
      }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: isDark.value ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderColor: getCSSVariable('--color-border-lighter'),
      textStyle: {
        color: textColor
      },
      formatter: () => {
        return `<div style="text-align: center;">
                  <div style="font-size: 14px; margin-bottom: 4px;">RevPAR</div>
                  <div style="font-size: 24px; font-weight: 600; color: ${progressColor};">${unit}${value.toFixed(0)}</div>
                  <div style="font-size: 12px; color: ${secondaryTextColor}; margin-top: 4px;">目标完成度: ${percentage.toFixed(1)}%</div>
                </div>`
      }
    },
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: max,
        center: ['50%', '65%'],
        radius: '75%',
        progress: {
          show: true,
          width: 20,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: dangerColor },
                { offset: 0.5, color: warningColor },
                { offset: 1, color: successColor }
              ]
            }
          }
        },
        pointer: {
          show: false
        },
        axisLine: {
          lineStyle: {
            width: 20,
            color: [[1, isDark.value ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)']]
          }
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: false
        },
        axisLabel: {
          show: false
        },
        anchor: {
          show: false
        },
        detail: {
          valueAnimation: true,
          width: '60%',
          lineHeight: 40,
          borderRadius: 8,
          offsetCenter: [0, '0%'],
          fontSize: 32,
          fontWeight: '600',
          formatter: `{value}`,
          color: progressColor
        },
        title: {
          offsetCenter: [0, '35%'],
          fontSize: 13,
          color: secondaryTextColor,
          formatter: `目标: ${unit}${max}`
        },
        data: [
          {
            value: value
          }
        ]
      },
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: max,
        center: ['50%', '65%'],
        radius: '95%',
        progress: {
          show: false
        },
        pointer: {
          show: false
        },
        axisLine: {
          show: false
        },
        axisTick: {
          distance: -30,
          splitNumber: 5,
          lineStyle: {
            width: 2,
            color: isDark.value ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
          }
        },
        splitLine: {
          distance: -38,
          length: 14,
          lineStyle: {
            width: 3,
            color: isDark.value ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
          }
        },
        axisLabel: {
          distance: -20,
          color: secondaryTextColor,
          fontSize: 10,
          formatter: (value: number) => {
            if (value === 0 || value === max) return `${unit}${value}`
            return ''
          }
        },
        detail: {
          show: false
        },
        data: [
          {
            value: value
          }
        ]
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
  ;(window as any).__revparChartThemeObserver = observer
})

onUnmounted(() => {
  if ((window as any).__revparChartThemeObserver) {
    (window as any).__revparChartThemeObserver.disconnect()
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
