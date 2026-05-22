<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as echarts from 'echarts';
import { useWarehouseStore } from '@/data/warehouseStore';
import { TrendingUp } from 'lucide-vue-next';

const store = useWarehouseStore();
const chartContainer = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

function initChart() {
  if (!chartContainer.value) return;

  chartInstance = echarts.init(chartContainer.value, 'dark');
  updateChart();
}

function updateChart() {
  if (!chartInstance) return;

  const data = store.historicalUtilization;

  const option: echarts.EChartsOption = {
    grid: {
      left: 50,
      right: 20,
      top: 30,
      bottom: 30,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 22, 40, 0.95)',
      borderColor: 'rgba(24, 144, 255, 0.3)',
      textStyle: {
        color: '#fff',
        fontSize: 12,
      },
      formatter: (params: any) => {
        const data = params[0];
        return `<div style="padding: 4px 8px;">
          <div style="color: #9CA3AF; font-size: 11px; margin-bottom: 4px;">${data.name}</div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${data.color};"></span>
            <span style="font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 600;">${(data.value * 100).toFixed(1)}%</span>
          </div>
        </div>`;
      },
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.date),
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 11,
      },
      axisTick: {
        show: false,
      },
    },
    yAxis: {
      type: 'value',
      min: 0.5,
      max: 1,
      axisLine: {
        show: false,
      },
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 11,
        formatter: (value: number) => `${(value * 100).toFixed(0)}%`,
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
        name: '利用率',
        type: 'line',
        data: data.map(d => d.value),
        smooth: true,
        symbol: 'circle',
        lineStyle: {
          width: 3,
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#1890FF' },
            { offset: 1, color: '#13C2C2' },
          ]),
        },
        itemStyle: {
          color: '#1890FF',
          borderWidth: 2,
          borderColor: '#fff',
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(24, 144, 255, 0.4)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0.0)' },
          ]),
        },
        symbolSize: 8,
        emphasis: {
          scale: 1.5,
          itemStyle: {
            shadowColor: 'rgba(24, 144, 255, 0.8)',
            shadowBlur: 10,
          },
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: {
            color: '#FF4D4F',
            type: 'dashed',
            width: 1,
          },
          data: [
            {
              yAxis: 0.95,
              label: {
                formatter: '告警线 95%',
                color: '#FF4D4F',
                fontSize: 10,
              },
            },
          ],
        },
      },
    ],
  };

  chartInstance.setOption(option);
}

function handleResize() {
  chartInstance?.resize();
}

watch(
  () => store.historicalUtilization,
  () => {
    updateChart();
  },
  { deep: true }
);

onMounted(() => {
  initChart();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  chartInstance?.dispose();
});
</script>

<template>
  <div class="chart-card glass-panel-light">
    <div class="chart-header">
      <h4 class="chart-title">
        <TrendingUp :size="16" />
        库存利用率趋势 (近7天)
      </h4>
      <span class="chart-current-value">
        当前: <span class="font-mono font-bold">{{ (store.stats.utilizationRate * 100).toFixed(1) }}%</span>
      </span>
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

  .chart-current-value {
    font-size: 12px;
    color: var(--text-secondary);

    span {
      color: var(--color-primary-light);
      font-size: 14px;
    }
  }
}

.chart-container {
  flex: 1;
  min-height: 180px;
}
</style>
