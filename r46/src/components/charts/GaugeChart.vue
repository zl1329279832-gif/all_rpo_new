<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { useChart, createGaugeOption } from '@/hooks'

const props = defineProps<{
  value: number
  title: string
  max?: number
  height?: string
}>()

const chartRef = ref<HTMLElement | null>(null)
const { initChart, updateChart, showLoading, hideLoading, disposeChart } = useChart(chartRef)

const loading = ref(false)

const renderChart = () => {
  loading.value = true
  showLoading()

  nextTick(() => {
    const option = createGaugeOption(props.value, props.title, props.max)
    updateChart(option)
    hideLoading()
    loading.value = false
  })
}

watch(
  () => [props.value, props.title],
  () => {
    renderChart()
  },
  { deep: true }
)

onMounted(() => {
  renderChart()
})

defineExpose({
  disposeChart,
})
</script>

<template>
  <div class="chart-wrapper" :style="{ height: height || '200px' }">
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
