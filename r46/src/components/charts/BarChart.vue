<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { useChart, createBarOption } from '@/hooks'

const props = defineProps<{
  xData: string[]
  seriesData: { name: string; data: number[]; color?: string }[]
  title?: string
  height?: string
}>()

const emit = defineEmits<{
  (e: 'click', params: any): void
}>()

const chartRef = ref<HTMLElement | null>(null)
const { initChart, updateChart, onChartClick, showLoading, hideLoading, disposeChart } = useChart(chartRef)

const loading = ref(false)

const renderChart = () => {
  if (!props.xData.length || !props.seriesData.length) return

  loading.value = true
  showLoading()

  nextTick(() => {
    const option = createBarOption(props.xData, props.seriesData, props.title)
    updateChart(option)
    hideLoading()
    loading.value = false
  })
}

watch(
  () => [props.xData, props.seriesData],
  () => {
    renderChart()
  },
  { deep: true }
)

onMounted(() => {
  renderChart()
  onChartClick((params) => {
    emit('click', params)
  })
})

defineExpose({
  disposeChart,
})
</script>

<template>
  <div class="chart-wrapper" :style="{ height: height || '300px' }">
    <div v-if="loading" class="chart-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
    </div>
    <div ref="chartRef" class="chart-content"></div>
  </div>
</template>

<style scoped>
.chart-wrapper {
  width: 100%;
  position: relative;
}

.chart-content {
  width: 100%;
  height: 100%;
}

.chart-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  z-index: 10;
}
</style>
