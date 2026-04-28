<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { getBuildingTrend, getAggregatedTrend } from '@/mock';

const props = defineProps<{
  buildingId?: string;
  timeRange: string;
}>();

const chartRef = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const chartData = computed(() => {
  if (props.buildingId) {
    return getBuildingTrend(props.buildingId, props.timeRange);
  }
  return getAggregatedTrend(props.timeRange);
});

function formatTime(timestamp: string, range: string): string {
  const date = new Date(timestamp);
  
  switch (range) {
    case 'today':
      return `${date.getHours().toString().padStart(2, '0')}:00`;
    case 'week':
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return weekDays[date.getDay()];
    case 'month':
      return `${date.getMonth() + 1}/${date.getDate()}`;
    case 'year':
      return `${date.getMonth() + 1}月`;
    default:
      return `${date.getMonth() + 1}/${date.getDate()}`;
  }
}

function getChartOption(): EChartsOption {
  const data = chartData.value;
  
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: 'rgba(71, 85, 105, 0.5)',
      borderWidth: 1,
      textStyle: {
        color: '#e2e8f0',
        fontSize: 12
      },
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: 'rgba(59, 130, 246, 0.8)'
        }
      }
    },
    legend: {
      data: ['用电量', '用水量', '碳排放'],
      textStyle: {
        color: '#94a3b8',
        fontSize: 11
      },
      itemWidth: 10,
      itemHeight: 10,
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map(d => formatTime(d.timestamp, props.timeRange)),
      axisLine: {
        lineStyle: {
          color: 'rgba(71, 85, 105, 0.5)'
        }
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#64748b',
        fontSize: 11
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '用电量/碳排放',
        position: 'left',
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: '#64748b',
          fontSize: 10,
          formatter: (value: number) => {
            if (value >= 10000) {
              return (value / 10000).toFixed(1) + '万';
            }
            return value.toString();
          }
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(71, 85, 105, 0.2)',
            type: 'dashed'
          }
        }
      },
      {
        type: 'value',
        name: '用水量',
        position: 'right',
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: '#64748b',
          fontSize: 10
        },
        splitLine: {
          show: false
        }
      }
    ],
    series: [
      {
        name: '用电量',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        sampling: 'lttb',
        itemStyle: {
          color: '#eab308'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(234, 179, 8, 0.3)' },
            { offset: 1, color: 'rgba(234, 179, 8, 0.01)' }
          ])
        },
        lineStyle: {
          width: 2
        },
        data: data.map(d => d.electricity)
      },
      {
        name: '用水量',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        yAxisIndex: 1,
        itemStyle: {
          color: '#06b6d4'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(6, 182, 212, 0.3)' },
            { offset: 1, color: 'rgba(6, 182, 212, 0.01)' }
          ])
        },
        lineStyle: {
          width: 2
        },
        data: data.map(d => d.water)
      },
      {
        name: '碳排放',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: {
          color: '#ef4444'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
            { offset: 1, color: 'rgba(239, 68, 68, 0.01)' }
          ])
        },
        lineStyle: {
          width: 2
        },
        data: data.map(d => d.carbonEmission)
      }
    ]
  };
}

function initChart(): void {
  if (!chartRef.value) return;

  chartInstance = echarts.init(chartRef.value);
  chartInstance.setOption(getChartOption());
}

function updateChart(): void {
  if (chartInstance) {
    chartInstance.setOption(getChartOption(), true);
  }
}

function handleResize(): void {
  if (chartInstance) {
    chartInstance.resize();
  }
}

watch(
  () => [props.buildingId, props.timeRange],
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
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
});
</script>

<template>
  <div ref="chartRef" class="trend-chart"></div>
</template>

<style scoped>
.trend-chart {
  width: 100%;
  height: 220px;
}
</style>
