<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import * as echarts from 'echarts';
import { useWarehouseStore } from '@/data/warehouseStore';
import { MapPin } from 'lucide-vue-next';
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

  chartInstance.setOption(getChartOption(store.channels));
}

function getChartOption(channels: any[]) {
  const data = channels.map(ch => ({
    name: ch.code,
    value: ch.congestionLevel,
    vehicleCount: ch.vehicleCount,
  }));

  return {
    animation: true,
    animationDuration: 500,
    animationEasing: 'cubicOut' as const,
    progressive: 500,
    progressiveThreshold: 1000,
    grid: {
      left: 70,
      right: 40,
      top: 30,
      bottom: 30,
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10, 22, 40, 0.95)',
      borderColor: 'rgba(24, 144, 255, 0.3)',
      textStyle: {
        color: '#fff',
        fontSize: 12,
      },
      formatter: (params: any) => {
        const color = params.value >= 90 ? '#FF4D4F' : params.value >= 70 ? '#FAAD14' : '#52C41A';
        return `<div style="padding: 4px 8px;">
          <div style="color: #9CA3AF; font-size: 11px; margin-bottom: 6px;">${params.name}</div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${color};"></span>
            <span style="font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 700; color: ${color};">${params.value.toFixed(1)}%</span>
          </div>
          <div style="font-size: 11px; color: rgba(255,255,255,0.6);">车辆数量: ${params.data.vehicleCount}</div>
        </div>`;
      },
    },
    visualMap: {
      min: 0,
      max: 100,
      right: 10,
      top: 'center',
      text: ['拥堵', '畅通'],
      textStyle: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 10,
      },
      inRange: {
        color: ['#52C41A', '#FAAD14', '#FF4D4F'],
      },
      calculable: true,
      show: true,
      itemWidth: 10,
      itemHeight: 80,
    },
    xAxis: {
      type: 'value',
      max: 100,
      axisLine: {
        show: false,
      },
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 10,
        formatter: '{value}%',
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.05)',
          type: 'dashed',
        },
      },
    },
    yAxis: {
      type: 'category',
      data: data.map(d => d.name),
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      axisLabel: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 11,
      },
      axisTick: {
        show: false,
      },
    },
    series: [
      {
        type: 'bar',
        data: data,
        barWidth: 14,
        label: {
          show: true,
          position: 'right',
          distance: 8,
          formatter: (params: any) => `${params.data.vehicleCount}辆`,
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: 10,
        },
        itemStyle: {
          borderRadius: [0, 7, 7, 0],
          color: (params: any) => {
            const value = params.value;
            if (value >= 90) return '#FF4D4F';
            if (value >= 70) return '#FAAD14';
            return '#52C41A';
          },
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 15,
            shadowColor: 'rgba(255, 255, 255, 0.3)',
          },
        },
      },
    ],
  };
}

function getDataHash(channels: any[]): string {
  return channels.map(ch => `${ch.code}-${ch.congestionLevel}-${ch.vehicleCount}`).join('|');
}

const throttledUpdateChart = throttle(() => {
  if (!chartInstance || !isChartVisible) return;

  const channels = store.channels;
  const newHash = getDataHash(channels);

  if (newHash === lastDataHash) return;
  lastDataHash = newHash;

  const data = channels.map(ch => ({
    name: ch.code,
    value: ch.congestionLevel,
    vehicleCount: ch.vehicleCount,
  }));

  chartInstance.setOption({
    yAxis: {
      data: data.map(d => d.name),
    },
    series: [{
      data: data,
    }],
  }, {
    notMerge: false,
    lazyUpdate: true,
  });
}, 3000);

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
  () => store.channels,
  () => {
    throttledUpdateChart();
  },
  { deep: false }
);

onMounted(() => {
  setTimeout(() => {
    initChart();
  }, 400);

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
        <MapPin :size="16" />
        通道拥堵状况
      </h4>
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
}

.chart-container {
  flex: 1;
  min-height: 180px;
}
</style>
