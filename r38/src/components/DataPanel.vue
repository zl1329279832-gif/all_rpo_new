<template>
  <div class="data-panel">
    <div class="panel-section">
      <h3 class="section-title">设备状态统计</h3>
      <div class="device-stats">
        <div class="stat-card online">
          <span class="card-value">{{ statistics.onlineDevices }}</span>
          <span class="card-label">在线</span>
        </div>
        <div class="stat-card offline">
          <span class="card-value">{{ statistics.offlineDevices }}</span>
          <span class="card-label">离线</span>
        </div>
        <div class="stat-card fault">
          <span class="card-value">{{ statistics.faultDevices }}</span>
          <span class="card-label">故障</span>
        </div>
        <div class="stat-card alarm">
          <span class="card-value">{{ statistics.alarmDevices }}</span>
          <span class="card-label">告警</span>
        </div>
      </div>
      <div class="online-rate">
        <div class="rate-header">
          <span>设备在线率</span>
          <span class="rate-value">{{ statistics.onlineRate }}%</span>
        </div>
        <div class="rate-bar">
          <div class="rate-fill" :style="{ width: statistics.onlineRate + '%' }"></div>
        </div>
      </div>
    </div>

    <div class="panel-section">
      <h3 class="section-title">告警趋势 (24小时)</h3>
      <div ref="trendChartRef" class="chart-container small"></div>
    </div>

    <div class="panel-section">
      <h3 class="section-title">区域风险分布</h3>
      <div ref="riskChartRef" class="chart-container medium"></div>
    </div>

    <div class="panel-section">
      <h3 class="section-title">响应统计</h3>
      <div class="response-stats">
        <div class="response-item">
          <span class="response-label">平均响应时间</span>
          <span class="response-value">{{ statistics.avgResponseTime }} 分钟</span>
        </div>
        <div class="response-item">
          <span class="response-label">处置完成率</span>
          <span class="response-value">{{ statistics.resolutionRate }}%</span>
        </div>
      </div>
      <div ref="responseChartRef" class="chart-container small"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import type { Statistics, AlarmTrend, RegionRisk, ResponseStat } from '@/types'

const props = defineProps<{
  statistics: Statistics
  alarmTrends: AlarmTrend[]
  regionRisks: RegionRisk[]
  responseStats: ResponseStat[]
}>()

const trendChartRef = ref<HTMLElement | null>(null)
const riskChartRef = ref<HTMLElement | null>(null)
const responseChartRef = ref<HTMLElement | null>(null)

let trendChart: echarts.ECharts | null = null
let riskChart: echarts.ECharts | null = null
let responseChart: echarts.ECharts | null = null

const initTrendChart = () => {
  if (!trendChartRef.value) return

  trendChart = echarts.init(trendChartRef.value)

  const option: echarts.EChartsOption = {
    grid: { top: 10, right: 10, bottom: 24, left: 35 },
    xAxis: {
      type: 'category',
      data: props.alarmTrends.map(t => t.time),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
      axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, interval: 6 }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10 }
    },
    series: [{
      type: 'line',
      data: props.alarmTrends.map(t => t.count),
      smooth: true,
      lineStyle: { color: '#ff4d4f', width: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(255,77,79,0.4)' },
          { offset: 1, color: 'rgba(255,77,79,0.05)' }
        ])
      },
      symbol: 'circle',
      symbolSize: 4,
      itemStyle: { color: '#ff4d4f' }
    }]
  }

  trendChart.setOption(option)
}

const initRiskChart = () => {
  if (!riskChartRef.value) return

  riskChart = echarts.init(riskChartRef.value)

  const riskColors: Record<string, string> = {
    safe: '#52c41a',
    low: '#1890ff',
    medium: '#faad14',
    high: '#ff4d4f'
  }

  const option: echarts.EChartsOption = {
    grid: { top: 10, right: 10, bottom: 24, left: 60 },
    xAxis: {
      type: 'value',
      max: 30,
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10 }
    },
    yAxis: {
      type: 'category',
      data: props.regionRisks.map(r => r.name),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
      axisLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 }
    },
    series: [{
      type: 'bar',
      data: props.regionRisks.map(r => ({
        value: r.deviceCount,
        itemStyle: {
          color: riskColors[r.riskLevel],
          borderRadius: [0, 4, 4, 0]
        }
      })),
      barWidth: 16,
      label: {
        show: true,
        position: 'right',
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
        formatter: (params: any) => `${params.value}台 / ${props.regionRisks[params.dataIndex].alarmCount}告警`
      }
    }]
  }

  riskChart.setOption(option)
}

const initResponseChart = () => {
  if (!responseChartRef.value) return

  responseChart = echarts.init(responseChartRef.value)

  const option: echarts.EChartsOption = {
    grid: { top: 10, right: 10, bottom: 24, left: 55 },
    xAxis: {
      type: 'category',
      data: props.responseStats.map(r => r.type),
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
      axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9, interval: 0, rotate: 20 }
    },
    yAxis: {
      type: 'value',
      name: '次数/分钟',
      nameTextStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 9 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10 }
    },
    series: [
      {
        type: 'bar',
        name: '处置次数',
        data: props.responseStats.map(r => r.count),
        barWidth: 10,
        itemStyle: { color: '#1890ff', borderRadius: [4, 4, 0, 0] }
      },
      {
        type: 'line',
        name: '平均时间',
        data: props.responseStats.map(r => r.avgTime),
        smooth: true,
        lineStyle: { color: '#faad14', width: 2 },
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: '#faad14' }
      }
    ]
  }

  responseChart.setOption(option)
}

const handleResize = () => {
  trendChart?.resize()
  riskChart?.resize()
  responseChart?.resize()
}

onMounted(() => {
  setTimeout(() => {
    initTrendChart()
    initRiskChart()
    initResponseChart()
    window.addEventListener('resize', handleResize)
  }, 100)
})

watch(() => props.alarmTrends, () => trendChart?.dispose() || initTrendChart(), { deep: true })
watch(() => props.regionRisks, () => riskChart?.dispose() || initRiskChart(), { deep: true })
watch(() => props.responseStats, () => responseChart?.dispose() || initResponseChart(), { deep: true })
</script>

<style scoped>
.data-panel {
  background: var(--bg-panel);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  overflow-y: auto;
  backdrop-filter: blur(10px);
}

.panel-section {
  margin-bottom: 20px;
}

.panel-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 14px;
  color: var(--text-primary);
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(24, 144, 255, 0.2);
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 14px;
  background: var(--primary-color);
  border-radius: 2px;
}

.device-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.stat-card {
  padding: 12px 8px;
  border-radius: 6px;
  text-align: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-card.online { border-left: 3px solid var(--success-color); }
.stat-card.offline { border-left: 3px solid var(--offline-color); }
.stat-card.fault { border-left: 3px solid var(--warning-color); }
.stat-card.alarm { border-left: 3px solid var(--error-color); }

.card-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.card-label {
  font-size: 11px;
  color: var(--text-secondary);
}

.online-rate {
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
}

.rate-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

.rate-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--success-color);
}

.rate-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.rate-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--success-color), #73d13d);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.chart-container {
  width: 100%;
}

.chart-container.small { height: 120px; }
.chart-container.medium { height: 160px; }

.response-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.response-item {
  padding: 10px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  text-align: center;
}

.response-label {
  display: block;
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.response-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--primary-color);
}
</style>
