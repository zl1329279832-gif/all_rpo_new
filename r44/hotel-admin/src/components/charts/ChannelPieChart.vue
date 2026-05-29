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
import { PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import type { ComposeOption } from 'echarts/core'
import type { PieSeriesOption } from 'echarts/charts'
import type {
  TitleComponentOption,
  TooltipComponentOption,
  LegendComponentOption
} from 'echarts/components'
import type { ChannelDataItem } from './types'

use([
  CanvasRenderer,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent
])

type ECOption = ComposeOption<
  | PieSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | LegendComponentOption
>

const props = defineProps<{
  data: ChannelDataItem[]
  title?: string
  ring?: boolean
}>()

const chartRef = ref()
const isDark = ref(false)

const getCSSVariable = (name: string): string => {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

const updateTheme = () => {
  isDark.value = document.documentElement.classList.contains('dark')
}

const channelColors = [
  '#409eff',
  '#67c23a',
  '#e6a23c',
  '#f56c6c',
  '#909399',
  '#8e44ad',
  '#16a085',
  '#d35400'
]

const chartOption = computed<ECOption>(() => {
  const textColor = getCSSVariable('--color-text-primary')
  const secondaryTextColor = getCSSVariable('--color-text-secondary')
  const borderColor = getCSSVariable('--color-border-lighter')
  const total = props.data.reduce((sum, item) => sum + item.value, 0)
  const isRing = props.ring !== false

  return {
    title: {
      text: props.title || '渠道订单占比',
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
      borderColor: borderColor,
      textStyle: {
        color: textColor
      },
      formatter: (params: any) => {
        const percentage = total > 0 ? ((params.value / total) * 100).toFixed(1) : 0
        return `<div style="font-weight: 500; margin-bottom: 6px;">${params.name}</div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
                  <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${params.color};"></span>
                  <span>订单数: <strong>${params.value}</strong></span>
                </div>
                <div style="font-size: 12px; color: ${secondaryTextColor};">占比: ${percentage}%</div>`
      }
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: {
        color: secondaryTextColor,
        fontSize: 12
      },
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 12,
      formatter: (name: string) => {
        const item = props.data.find(d => d.name === name)
        if (!item) return name
        const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
        return `${name}  ${percentage}%`
      }
    },
    series: [
      {
        name: '渠道订单',
        type: 'pie',
        radius: isRing ? ['45%', '70%'] : '70%',
        center: ['35%', '55%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: isDark.value ? '#141414' : '#ffffff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: textColor
          },
          itemStyle: {
            shadowBlur: 20,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.4)'
          }
        },
        labelLine: {
          show: false
        },
        data: props.data.map((item, index) => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: channelColors[index % channelColors.length]
          }
        }))
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
  ;(window as any).__channelChartThemeObserver = observer
})

onUnmounted(() => {
  if ((window as any).__channelChartThemeObserver) {
    (window as any).__channelChartThemeObserver.disconnect()
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
