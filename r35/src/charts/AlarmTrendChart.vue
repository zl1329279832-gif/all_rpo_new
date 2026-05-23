<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import * as echarts from 'echarts';
import { useWarehouseStore } from '@/data/warehouseStore';
import { AlertTriangle, BarChart3 } from 'lucide-vue-next';
import { debounce, throttle } from '@/utils';

const store = useWarehouseStore();
const chartContainer = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
let isChartVisible = true;
let lastDataHash = '';

function initChart() {
  if (!chartContainer.value || chartInstance) return;

  chartInstance = echarts.init(chartContainer.value, 'dark', {
    renderer: 'canvas',
    useDirtyRect: true,
  });

  chartInstance.setOption(getChartOption(store.alarmTrend));
}

function getChartOption(data: any[]) {
  return {
    animation: true,
    animationDuration: 500,
    animationEasing: 'cubicOut' as const,
    progressive: 500,
    progressiveThreshold: 1000,
    grid: {
      left: 50,
      right: 20,
      top: 30,
      bottom: 30,
    },
    legend: {
      data: ['严重', '警告', '提示'],
      top: 0,
      right: 0,
      itemWidth: 12,
      itemHeight: 8,
      textStyle: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 11,
      },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 22, 40, 0.95)',
      borderColor: 'rgba(24, 144, 255, 0.3)',
      textStyle: {
        color: '#fff',
        fontSize: 12,
      },
      axisPointer: {
        type: 'shadow',
        shadowStyle: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
      },
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.time),
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 10,
        interval: 3,
      },
      axisTick: {
        show: false,
      },
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false,
      },
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 11,
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.05)',
          type: 'dashed',
        },
      },
    },
    series: [
      {
        name: '严重',
        type: 'bar',
        stack: 'total',
        data: data.map(d => d.critical),
        itemStyle: {
          color: '#FF4D4F',
          borderRadius: [0, 0, 0, 0],
        },
        emphasis: {
          itemStyle: {
            shadowColor: 'rgba(255, 77, 79, 0.6)',
            shadowBlur: 10,
          },
        },
      },
      {
        name: '警告',
        type: 'bar',
        stack: 'total',
        data: data.map(d => d.warning),
        itemStyle: {
          color: '#FAAD14',
          borderRadius: [0, 0, 0, 0],
        },
        emphasis: {
          itemStyle: {
            shadowColor: 'rgba(250, 173, 20, 0.6)',
            shadowBlur: 10,
          },
        },
      },
      {
        name: '提示',
        type: 'bar',
        stack: 'total',
        data: data.map(d => d.info),
        itemStyle: {
          color: '#1890FF',
          borderRadius: [4, 4, 0, 0],
        },
        emphasis: {
          itemStyle: {
            shadowColor: 'rgba(24, 144, 255, 0.6)',
            shadowBlur: 10,
          },
        },
      },
    ],
  };
}

function getDataHash(data: any[]): string {
  return data.map(d => `${d.time}-${d.critical}-${d.warning}-${d.info}`).join('|');
}

const throttledUpdateChart = throttle(() => {
  if (!chartInstance || !isChartVisible) return;

  const data = store.alarmTrend;
  const newHash = getDataHash(data);

  if (newHash === lastDataHash) return;
  lastDataHash = newHash;

  chartInstance.setOption({
    series: [
      { data: data.map(d => d.critical) },
      { data: data.map(d => d.warning) },
      { data: data.map(d => d.info) },
    ],
  }, {
    notMerge: false,
    lazyUpdate: true,
  });
}, 2000);

const debouncedHandleResize = debounce(() => {
  if (chartInstance && isChartVisible) {
    chartInstance.resize();
  }
}, 150);

function handleVisibilityChange() {
  isChartVisible = !document.hidden;
  if (isChartVisible && chartInstance) {
    nextTick(() => {
      chartInstance?.resize();
    });
  }
}

watch(
  () => store.alarmTrend,
  () => {
    throttledUpdateChart();
  },
  { deep: false }
);

onMounted(() => {
  setTimeout(() => {
    initChart();
  }, 300);

  window.addEventListener('resize', debouncedHandleResize, { passive: true });
  document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('resize', debouncedHandleResize);
  document.removeEventListener('visibilitychange', handleVisibilityChange);

  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
});
</script>

<template>
  <div class="chart-card glass-panel-light">
    <div class="chart-header">
      <h4 class="chart-title">
        <BarChart3 :size="16" />
        告警趋势 (近24小时)
      </h4>
      <div class="alarm-stats">
        <span class="stat critical">
          <AlertTriangle :size="12" />
          {{ store.stats.criticalAlarms }}
        </span>
        <span class="stat warning">
          <AlertTriangle :size="12" />
          {{ store.stats.warningAlarms }}
        </span>
      </div>
    </div>
    <div ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<style scoped lang="scss">
.chart-card {
  padding: 14px 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;

  .chart-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .alarm-stats {
    display: flex;
    gap: 12px;

    .stat {
      display: flex;
      align-items: center;
      gap: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      font-weight: 700;

      &.critical {
        color: var(--color-danger);
      }

      &.warning {
        color: var(--color-warning);
      }
    }
  }
}

.chart-container {
  flex: 1;
  min-height: 180px;
}
</style>
