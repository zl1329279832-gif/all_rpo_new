<template>
  <div class="kpi-card" :class="typeClass">
    <div class="kpi-header">
      <div class="kpi-icon">
        <component :is="iconComponent" />
      </div>
      <div class="kpi-trend" :class="trendClass">
        <el-icon v-if="trend !== 0" class="trend-icon">
          <ArrowUp v-if="trend > 0" />
          <ArrowDown v-else />
        </el-icon>
        <span class="trend-value">{{ Math.abs(trend).toFixed(1) }}%</span>
        <span class="trend-label">同比</span>
      </div>
    </div>
    <div class="kpi-content">
      <div class="kpi-label">{{ title }}</div>
      <div class="kpi-value">
        <span class="value-prefix" v-if="prefix">{{ prefix }}</span>
        <span class="value-number">{{ formattedValue }}</span>
        <span class="value-suffix" v-if="suffix">{{ suffix }}</span>
      </div>
      <div class="kpi-compare">
        <div class="compare-item">
          <span class="compare-label">环比</span>
          <span class="compare-value" :class="getCompareClass(mom)">
            <el-icon v-if="mom !== 0" class="compare-icon">
              <Top v-if="mom > 0" />
              <Bottom v-else />
            </el-icon>
            {{ mom >= 0 ? '+' : '' }}{{ mom.toFixed(1) }}%
          </span>
        </div>
        <div class="compare-item">
          <span class="compare-label">上周</span>
          <span class="compare-value" :class="getCompareClass(wow)">
            <el-icon v-if="wow !== 0" class="compare-icon">
              <Top v-if="wow > 0" />
              <Bottom v-else />
            </el-icon>
            {{ wow >= 0 ? '+' : '' }}{{ wow.toFixed(1) }}%
          </span>
        </div>
      </div>
    </div>
    <div class="kpi-sparkline">
      <v-chart
        ref="sparklineRef"
        :option="sparklineOption"
        autoresize
        class="sparkline-chart"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, markRaw } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent } from 'echarts/components'
import type { ComposeOption } from 'echarts/core'
import type { LineSeriesOption } from 'echarts/charts'
import type { GridComponentOption } from 'echarts/components'
import {
  ArrowUp,
  ArrowDown,
  Top,
  Bottom,
  DataLine,
  Money,
  Histogram
} from '@element-plus/icons-vue'
import type { KpiCardData, KpiType } from './types'

use([
  CanvasRenderer,
  LineChart,
  GridComponent
])

type ECOption = ComposeOption<
  | LineSeriesOption
  | GridComponentOption
>

const props = defineProps<{
  data: KpiCardData
}>()

const sparklineRef = ref()
const isDark = ref(false)

const iconMap: Record<KpiType, any> = {
  occupancy: markRaw(DataLine),
  adr: markRaw(Money),
  revpar: markRaw(Histogram)
}

const iconComponent = computed(() => iconMap[props.data.type])

const typeClass = computed(() => `kpi-${props.data.type}`)

const trendClass = computed(() => {
  if (props.data.trend > 0) return 'trend-up'
  if (props.data.trend < 0) return 'trend-down'
  return 'trend-flat'
})

const formattedValue = computed(() => {
  const decimals = props.data.decimals ?? (props.data.type === 'occupancy' ? 1 : 0)
  return props.data.value.toFixed(decimals)
})

const getCSSVariable = (name: string): string => {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

const getCompareClass = (value: number) => {
  if (value > 0) return 'compare-up'
  if (value < 0) return 'compare-down'
  return 'compare-flat'
}

const updateTheme = () => {
  isDark.value = document.documentElement.classList.contains('dark')
}

const sparklineOption = computed<ECOption>(() => {
  const typeColorMap: Record<KpiType, string> = {
    occupancy: getCSSVariable('--color-primary'),
    adr: getCSSVariable('--color-success'),
    revpar: getCSSVariable('--color-warning')
  }
  const color = typeColorMap[props.data.type]
  const data = props.data.sparklineData

  return {
    grid: {
      left: 0,
      right: 0,
      top: 5,
      bottom: 5
    },
    xAxis: {
      type: 'category',
      show: false,
      data: data.map((_, i) => i)
    },
    yAxis: {
      type: 'value',
      show: false
    },
    series: [
      {
        type: 'line',
        data: data,
        smooth: true,
        symbol: 'none',
        lineStyle: {
          width: 2,
          color: color
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: color + '30' },
              { offset: 1, color: color + '05' }
            ]
          }
        }
      }
    ]
  }
})

watch(() => props.data, () => {
  if (sparklineRef.value) {
    sparklineRef.value.setOption(sparklineOption.value)
  }
}, { deep: true })

watch(isDark, () => {
  if (sparklineRef.value) {
    sparklineRef.value.setOption(sparklineOption.value, { notMerge: true })
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
  ;(window as any).__kpiChartThemeObserver = observer
})

onUnmounted(() => {
  if ((window as any).__kpiChartThemeObserver) {
    (window as any).__kpiChartThemeObserver.disconnect()
  }
})
</script>

<style lang="scss" scoped>
.kpi-card {
  position: relative;
  background-color: var(--color-bg-container);
  border-radius: var(--border-radius-base);
  padding: var(--spacing-base);
  box-shadow: var(--box-shadow-base);
  transition: all var(--transition-base);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light-3));
  }

  &.kpi-occupancy::before {
    background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light-3));
  }

  &.kpi-adr::before {
    background: linear-gradient(90deg, var(--color-success), var(--color-success-light));
  }

  &.kpi-revpar::before {
    background: linear-gradient(90deg, var(--color-warning), var(--color-warning-light));
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--box-shadow-light);
  }

  .kpi-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-sm);

    .kpi-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--border-radius-base);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      background: linear-gradient(135deg, var(--color-primary-light-9), var(--color-primary-light-8));
      color: var(--color-primary);
      transition: all var(--transition-base);

      :deep(.el-icon) {
        width: 20px;
        height: 20px;
      }
    }

    .kpi-occupancy + .kpi-content + .kpi-sparkline + & .kpi-icon,
    &.kpi-occupancy .kpi-icon {
      background: linear-gradient(135deg, var(--color-primary-light-9), var(--color-primary-light-8));
      color: var(--color-primary);
    }

    &.kpi-adr .kpi-icon {
      background: linear-gradient(135deg, var(--color-success-lighter), var(--color-success-light));
      color: var(--color-success);
    }

    &.kpi-revpar .kpi-icon {
      background: linear-gradient(135deg, var(--color-warning-lighter), var(--color-warning-light));
      color: var(--color-warning);
    }

    .kpi-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: var(--border-radius-round);
      font-size: 12px;
      font-weight: 500;

      &.trend-up {
        background-color: var(--color-success-lighter);
        color: var(--color-success);

        :deep(html.dark) & {
          background-color: var(--color-success-lighter);
          opacity: 0.8;
        }
      }

      &.trend-down {
        background-color: var(--color-danger-lighter);
        color: var(--color-danger);

        :deep(html.dark) & {
          background-color: var(--color-danger-lighter);
          opacity: 0.8;
        }
      }

      &.trend-flat {
        background-color: var(--color-info-lighter);
        color: var(--color-info);
      }

      .trend-icon {
        font-size: 12px;
      }

      .trend-label {
        opacity: 0.8;
        margin-left: 2px;
      }
    }
  }

  .kpi-content {
    .kpi-label {
      font-size: 13px;
      color: var(--color-text-secondary);
      margin-bottom: 4px;
    }

    .kpi-value {
      display: flex;
      align-items: baseline;
      margin-bottom: var(--spacing-sm);

      .value-prefix,
      .value-suffix {
        font-size: 16px;
        color: var(--color-text-secondary);
        font-weight: 400;
      }

      .value-prefix {
        margin-right: 2px;
      }

      .value-suffix {
        margin-left: 2px;
      }

      .value-number {
        font-size: 28px;
        font-weight: 600;
        color: var(--color-text-primary);
        line-height: 1.2;
        letter-spacing: -0.5px;
      }
    }

    .kpi-compare {
      display: flex;
      gap: var(--spacing-lg);

      .compare-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;

        .compare-label {
          color: var(--color-text-secondary);
        }

        .compare-value {
          display: flex;
          align-items: center;
          gap: 2px;
          font-weight: 500;

          &.compare-up {
            color: var(--color-success);
          }

          &.compare-down {
            color: var(--color-danger);
          }

          &.compare-flat {
            color: var(--color-info);
          }

          .compare-icon {
            font-size: 10px;
          }
        }
      }
    }
  }

  .kpi-sparkline {
    height: 40px;
    margin-top: var(--spacing-sm);

    .sparkline-chart {
      width: 100%;
      height: 100%;
    }
  }
}

:deep(html.dark) {
  .kpi-card {
    &::before {
      opacity: 0.8;
    }
  }
}

@media (max-width: 768px) {
  .kpi-card {
    .kpi-content {
      .kpi-value {
        .value-number {
          font-size: 24px;
        }
      }
    }
  }
}
</style>
