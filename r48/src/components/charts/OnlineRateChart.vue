<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer])

const props = defineProps<{
  online: number
  offline: number
}>()

const option = computed(() => ({
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(10, 22, 40, 0.9)',
    borderColor: 'rgba(30, 144, 255, 0.3)',
    textStyle: { color: '#e6f7ff', fontSize: 12 },
  },
  legend: {
    orient: 'vertical',
    right: 10,
    top: 'center',
    textStyle: { color: '#8cb8d8', fontSize: 12 },
  },
  series: [
    {
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      label: {
        show: true,
        position: 'center',
        formatter: () => {
          const total = props.online + props.offline
          const rate = total > 0 ? ((props.online / total) * 100).toFixed(1) : '0'
          return `{rate|${rate}%}\n{label|在线率}`
        },
        rich: {
          rate: { fontSize: 24, fontWeight: 'bold', color: '#00e5ff', lineHeight: 30 },
          label: { fontSize: 12, color: '#8cb8d8', lineHeight: 20 },
        },
      },
      data: [
        { value: props.online, name: '在线', itemStyle: { color: '#52c41a' } },
        { value: props.offline, name: '离线', itemStyle: { color: '#595959' } },
      ],
    },
  ],
}))
</script>

<template>
  <div class="chart-card">
    <div class="chart-title">设备在线率</div>
    <VChart :option="option" autoresize style="height: 220px" />
  </div>
</template>

<style scoped>
.chart-card {
  background: rgba(10, 22, 40, 0.8);
  border: 1px solid rgba(30, 144, 255, 0.15);
  border-radius: 8px;
  padding: 14px;
  backdrop-filter: blur(8px);
}
.chart-title {
  font-size: 13px;
  color: #8cb8d8;
  margin-bottom: 8px;
  letter-spacing: 1px;
}
</style>
