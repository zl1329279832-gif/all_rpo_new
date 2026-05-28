<template>
  <div class="data-panel">
    <div class="panel-header">
      <span>📊 数据监控</span>
      <div class="toggle-btn" @click="toggleCollapse">
        {{ collapsed ? '展开' : '收起' }}
      </div>
    </div>

    <div v-if="!collapsed" class="panel-content">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ totalContainers }}</div>
          <div class="stat-label">在港箱量</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ totalThroughput }}</div>
          <div class="stat-label">今日吞吐量</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ activeTrucks }}</div>
          <div class="stat-label">作业车辆</div>
        </div>
        <div class="stat-card">
          <div class="stat-value danger">{{ alertCount }}</div>
          <div class="stat-label">待处理告警</div>
        </div>
      </div>

      <div class="chart-section">
        <div class="chart-title">吞吐量趋势</div>
        <div ref="throughputChart" class="chart-container"></div>
      </div>

      <div class="chart-section">
        <div class="chart-title">设备利用率</div>
        <div ref="utilizationChart" class="chart-container"></div>
      </div>

      <div class="chart-section">
        <div class="chart-title">拥堵趋势</div>
        <div ref="congestionChart" class="chart-container"></div>
      </div>

      <div class="chart-section">
        <div class="chart-title">告警等级分布</div>
        <div ref="alertChart" class="chart-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import type { ThroughputData, EquipmentUtilization, CongestionData, Alert } from '@/types'

const props = defineProps<{
  containers: any[]
  throughputData: ThroughputData[]
  utilizationData: EquipmentUtilization[]
  congestionData: CongestionData[]
  alerts: Alert[]
}>()

const collapsed = ref(false)
const throughputChart = ref<HTMLElement | null>(null)
const utilizationChart = ref<HTMLElement | null>(null)
const congestionChart = ref<HTMLElement | null>(null)
const alertChart = ref<HTMLElement | null>(null)

let throughputChartInstance: echarts.ECharts | null = null
let utilizationChartInstance: echarts.ECharts | null = null
let congestionChartInstance: echarts.ECharts | null = null
let alertChartInstance: echarts.ECharts | null = null

const totalContainers = computed(() => props.containers.length)
const totalThroughput = computed(() => {
  return props.throughputData.reduce((sum, d) => sum + d.total, 0)
})
const activeTrucks = computed(() => {
  return props.utilizationData.filter(d => d.status === 'normal').length
})
const alertCount = computed(() => {
  return props.alerts.filter(a => !a.acknowledged).length
})

const toggleCollapse = () => {
  collapsed.value = !collapsed.value
  if (!collapsed.value) {
    setTimeout(() => {
      resizeCharts()
    }, 100)
  }
}

const initCharts = () => {
  if (throughputChart.value) {
    throughputChartInstance = echarts.init(throughputChart.value)
    renderThroughputChart()
  }

  if (utilizationChart.value) {
    utilizationChartInstance = echarts.init(utilizationChart.value)
    renderUtilizationChart()
  }

  if (congestionChart.value) {
    congestionChartInstance = echarts.init(congestionChart.value)
    renderCongestionChart()
  }

  if (alertChart.value) {
    alertChartInstance = echarts.init(alertChart.value)
    renderAlertChart()
  }
}

const renderThroughputChart = () => {
  if (!throughputChartInstance) return

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(16, 32, 56, 0.95)',
      borderColor: 'rgba(24, 144, 255, 0.3)',
      textStyle: { color: '#e6f7ff' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: props.throughputData.map(d => d.time),
      axisLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.3)' } },
      axisLabel: { color: '#8c8c8c', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.3)' } },
      axisLabel: { color: '#8c8c8c', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.1)' } }
    },
    series: [
      {
        name: '进口',
        type: 'bar',
        stack: 'total',
        data: props.throughputData.map(d => d.importCount),
        itemStyle: { color: '#1890ff' }
      },
      {
        name: '出口',
        type: 'bar',
        stack: 'total',
        data: props.throughputData.map(d => d.exportCount),
        itemStyle: { color: '#52c41a' }
      }
    ]
  }

  throughputChartInstance.setOption(option)
}

const renderUtilizationChart = () => {
  if (!utilizationChartInstance) return

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(16, 32, 56, 0.95)',
      borderColor: 'rgba(24, 144, 255, 0.3)',
      textStyle: { color: '#e6f7ff' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      max: 100,
      axisLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.3)' } },
      axisLabel: { color: '#8c8c8c', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.1)' } }
    },
    yAxis: {
      type: 'category',
      data: props.utilizationData.slice(0, 8).map(d => d.equipmentName),
      axisLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.3)' } },
      axisLabel: { color: '#8c8c8c', fontSize: 10 }
    },
    series: [
      {
        type: 'bar',
        data: props.utilizationData.slice(0, 8).map(d => ({
          value: d.utilization.toFixed(1),
          itemStyle: {
            color: d.status === 'normal' ? '#52c41a' : d.status === 'warning' ? '#faad14' : '#ff4d4f'
          }
        })),
        barWidth: '60%'
      }
    ]
  }

  utilizationChartInstance.setOption(option)
}

const renderCongestionChart = () => {
  if (!congestionChartInstance) return

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(16, 32, 56, 0.95)',
      borderColor: 'rgba(24, 144, 255, 0.3)',
      textStyle: { color: '#e6f7ff' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: props.congestionData.map(d => d.time),
      axisLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.3)' } },
      axisLabel: { color: '#8c8c8c', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      max: 1,
      axisLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.3)' } },
      axisLabel: { color: '#8c8c8c', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(24, 144, 255, 0.1)' } }
    },
    series: [
      {
        type: 'line',
        data: props.congestionData.map(d => d.level),
        smooth: true,
        lineStyle: { color: '#faad14', width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(250, 173, 20, 0.3)' },
            { offset: 1, color: 'rgba(250, 173, 20, 0.05)' }
          ])
        }
      }
    ]
  }

  congestionChartInstance.setOption(option)
}

const renderAlertChart = () => {
  if (!alertChartInstance) return

  const levelCounts = {
    info: props.alerts.filter(a => a.level === 'info').length,
    warning: props.alerts.filter(a => a.level === 'warning').length,
    danger: props.alerts.filter(a => a.level === 'danger').length,
    critical: props.alerts.filter(a => a.level === 'critical').length
  }

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(16, 32, 56, 0.95)',
      borderColor: 'rgba(24, 144, 255, 0.3)',
      textStyle: { color: '#e6f7ff' }
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: { color: '#8c8c8c', fontSize: 11 }
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: 'rgba(16, 32, 56, 0.95)',
          borderWidth: 2
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: '#e6f7ff'
          }
        },
        data: [
          { value: levelCounts.info, name: '信息', itemStyle: { color: '#13c2c2' } },
          { value: levelCounts.warning, name: '警告', itemStyle: { color: '#faad14' } },
          { value: levelCounts.danger, name: '危险', itemStyle: { color: '#ff4d4f' } },
          { value: levelCounts.critical, name: '严重', itemStyle: { color: '#eb2f96' } }
        ]
      }
    ]
  }

  alertChartInstance.setOption(option)
}

const resizeCharts = () => {
  throughputChartInstance?.resize()
  utilizationChartInstance?.resize()
  congestionChartInstance?.resize()
  alertChartInstance?.resize()
}

watch(() => [props.throughputData, props.utilizationData, props.congestionData, props.alerts], () => {
  renderThroughputChart()
  renderUtilizationChart()
  renderCongestionChart()
  renderAlertChart()
}, { deep: true })

onMounted(() => {
  setTimeout(initCharts, 100)
  window.addEventListener('resize', resizeCharts)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCharts)
  throughputChartInstance?.dispose()
  utilizationChartInstance?.dispose()
  congestionChartInstance?.dispose()
  alertChartInstance?.dispose()
})
</script>

<style scoped>
.data-panel {
  position: absolute;
  top: 80px;
  left: 20px;
  width: 340px;
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  backdrop-filter: blur(10px);
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-color);
}

.toggle-btn {
  font-size: 12px;
  color: #8c8c8c;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 3px;
  background: rgba(24, 144, 255, 0.1);
}

.toggle-btn:hover {
  color: var(--primary-color);
}

.panel-content {
  padding: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.stat-card {
  background: rgba(24, 144, 255, 0.08);
  border-radius: 4px;
  padding: 12px;
  text-align: center;
}

.stat-value {
  font-size: 22px;
  font-weight: 600;
  color: #e6f7ff;
  margin-bottom: 4px;
}

.stat-value.danger {
  color: #ff4d4f;
}

.stat-label {
  font-size: 12px;
  color: #8c8c8c;
}

.chart-section {
  margin-bottom: 16px;
}

.chart-section:last-child {
  margin-bottom: 0;
}

.chart-title {
  font-size: 13px;
  color: #e6f7ff;
  margin-bottom: 8px;
  padding-left: 8px;
  border-left: 3px solid var(--primary-color);
}

.chart-container {
  width: 100%;
  height: 160px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}
</style>
