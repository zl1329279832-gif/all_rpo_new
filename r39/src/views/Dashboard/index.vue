<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import { useAppStore } from '../../stores/app'
import {
  getDashboardStats,
  getDeviceStatusChart,
  getOrderTrend,
  getIncomeTrend,
  getAreaHeat,
  getRecentAlarms
} from '../../api/dashboard'
import type { DashboardStats, ChartData, TrendData, Alarm } from '../../types'
import { TrendCharts, DataLine, Warning } from '@element-plus/icons-vue'

const appStore = useAppStore()
const loading = ref(false)
const stats = ref<DashboardStats | null>(null)
const deviceStatusData = ref<ChartData[]>([])
const orderTrendData = ref<TrendData[]>([])
const incomeTrendData = ref<TrendData[]>([])
const areaHeatData = ref<any[]>([])
const recentAlarms = ref<any[]>([])

const orderChartRef = ref<HTMLElement | null>(null)
const incomeChartRef = ref<HTMLElement | null>(null)
const deviceChartRef = ref<HTMLElement | null>(null)
const areaChartRef = ref<HTMLElement | null>(null)

let orderChart: echarts.ECharts | null = null
let incomeChart: echarts.ECharts | null = null
let deviceChart: echarts.ECharts | null = null
let areaChart: echarts.ECharts | null = null

const statCards = [
  { key: 'stationCount', label: '站点总数', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', icon: '🏪' },
  { key: 'todayOrders', label: '今日订单', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', icon: '📋' },
  { key: 'todayElectricity', label: '今日充电量', suffix: 'kWh', color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', icon: '⚡' },
  { key: 'todayIncome', label: '今日收入', prefix: '¥', color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', icon: '💰' },
  { key: 'pendingAlarms', label: '待处理告警', color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', icon: '⚠️' },
  { key: 'deviceOnlineRate', label: '设备在线率', suffix: '%', color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', icon: '📊' }
]

function getChartTheme() {
  return appStore.isDarkMode ? 'dark' : undefined
}

function initOrderChart() {
  if (!orderChartRef.value) return
  orderChart = echarts.init(orderChartRef.value, getChartTheme())
  updateOrderChart()
}

function updateOrderChart() {
  const option: echarts.EChartsOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: orderTrendData.value.map(d => d.date)
    },
    yAxis: { type: 'value' },
    series: [{
      name: '订单数',
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.3 },
      data: orderTrendData.value.map(d => d.value),
      color: '#409eff'
    }]
  }
  orderChart?.setOption(option)
}

function initIncomeChart() {
  if (!incomeChartRef.value) return
  incomeChart = echarts.init(incomeChartRef.value, getChartTheme())
  updateIncomeChart()
}

function updateIncomeChart() {
  const option: echarts.EChartsOption = {
    tooltip: { trigger: 'axis', formatter: '{b}<br/>¥{c}' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: true,
      data: incomeTrendData.value.map(d => d.date)
    },
    yAxis: { type: 'value' },
    series: [{
      name: '收入',
      type: 'bar',
      barWidth: '50%',
      data: incomeTrendData.value.map(d => d.value),
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: '#67c23a' },
        { offset: 1, color: '#95de64' }
      ])
    }]
  }
  incomeChart?.setOption(option)
}

function initDeviceChart() {
  if (!deviceChartRef.value) return
  deviceChart = echarts.init(deviceChartRef.value, getChartTheme())
  updateDeviceChart()
}

function updateDeviceChart() {
  const option: echarts.EChartsOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: deviceStatusData.value.map((d, i) => ({
        value: d.value,
        name: d.name,
        itemStyle: {
          color: ['#67c23a', '#409eff', '#909399', '#f56c6c', '#e6a23c'][i]
        }
      }))
    }]
  }
  deviceChart?.setOption(option)
}

function initAreaChart() {
  if (!areaChartRef.value) return
  areaChart = echarts.init(areaChartRef.value, getChartTheme())
  updateAreaChart()
}

function updateAreaChart() {
  const option: echarts.EChartsOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: areaHeatData.value.map(d => d.name) },
    series: [{
      type: 'bar',
      data: areaHeatData.value.map(d => d.value),
      color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
        { offset: 0, color: '#409eff' },
        { offset: 1, color: '#79bbff' }
      ])
    }]
  }
  areaChart?.setOption(option)
}

async function fetchData() {
  loading.value = true
  try {
    const [statsRes, deviceRes, orderRes, incomeRes, areaRes, alarmRes] = await Promise.all([
      getDashboardStats(),
      getDeviceStatusChart(),
      getOrderTrend(),
      getIncomeTrend(),
      getAreaHeat(),
      getRecentAlarms()
    ])

    stats.value = statsRes.data
    deviceStatusData.value = deviceRes.data
    orderTrendData.value = orderRes.data
    incomeTrendData.value = incomeRes.data
    areaHeatData.value = areaRes.data
    recentAlarms.value = alarmRes.data

    updateOrderChart()
    updateIncomeChart()
    updateDeviceChart()
    updateAreaChart()
  } finally {
    loading.value = false
  }
}

function handleResize() {
  orderChart?.resize()
  incomeChart?.resize()
  deviceChart?.resize()
  areaChart?.resize()
}

function getAlarmLevelClass(level: string) {
  return `alarm-${level}`
}

const alarmLevelMap: Record<string, string> = {
  critical: '紧急',
  major: '重要',
  minor: '次要',
  warning: '提示'
}

onMounted(() => {
  initOrderChart()
  initIncomeChart()
  initDeviceChart()
  initAreaChart()
  fetchData()
  window.addEventListener('resize', handleResize)
})
</script>

<template>
  <div class="dashboard-container">
    <div class="page-header">
      <h2 class="page-title">数据概览</h2>
      <el-button type="primary" :icon="TrendCharts" @click="fetchData" :loading="loading">
        刷新数据
      </el-button>
    </div>

    <el-row :gutter="16" class="stat-row">
      <el-col :xs="24" :sm="12" :md="8" :lg="4" v-for="card in statCards" :key="card.key">
        <div class="stat-card" :style="{ background: card.color }">
          <div class="stat-content">
            <div class="stat-icon">{{ card.icon }}</div>
            <div class="stat-label">{{ card.label }}</div>
            <div class="stat-value">
              <span v-if="card.prefix">{{ card.prefix }}</span>
              {{ (stats as any)?.[card.key] || 0 }}
              <span v-if="card.suffix">{{ card.suffix }}</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :lg="12">
        <div class="card chart-card">
          <div class="chart-header">
            <h3 class="chart-title">
              <el-icon><DataLine /></el-icon>
              近7天订单趋势
            </h3>
          </div>
          <div ref="orderChartRef" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :xs="24" :lg="12">
        <div class="card chart-card">
          <div class="chart-header">
            <h3 class="chart-title">
              <el-icon><DataLine /></el-icon>
              近7天收入变化
            </h3>
          </div>
          <div ref="incomeChartRef" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :lg="8">
        <div class="card chart-card">
          <div class="chart-header">
            <h3 class="chart-title">充电桩状态分布</h3>
          </div>
          <div ref="deviceChartRef" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :xs="24" :lg="8">
        <div class="card chart-card">
          <div class="chart-header">
            <h3 class="chart-title">区域热度分布</h3>
          </div>
          <div ref="areaChartRef" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :xs="24" :lg="8">
        <div class="card chart-card">
          <div class="chart-header">
            <h3 class="chart-title">
              <el-icon><Warning /></el-icon>
              最近告警
            </h3>
          </div>
          <div class="alarm-list">
            <div v-for="alarm in recentAlarms" :key="alarm.id" class="alarm-item">
              <el-tag size="small" :class="getAlarmLevelClass(alarm.level)">
                {{ alarmLevelMap[alarm.level] }}
              </el-tag>
              <div class="alarm-content">
                <div class="alarm-device">{{ alarm.deviceName }}</div>
                <div class="alarm-message">{{ alarm.message }}</div>
                <div class="alarm-time">{{ alarm.alarmTime }}</div>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.dashboard-container {
  padding: 20px;
}

.stat-row {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 12px;
  padding: 16px 20px;
  color: #fff;
  position: relative;
  overflow: hidden;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .stat-content {
    position: relative;
    z-index: 1;
  }

  .stat-icon {
    font-size: 28px;
    margin-bottom: 6px;
    opacity: 0.9;
  }

  .stat-label {
    font-size: 13px;
    opacity: 0.9;
    margin-bottom: 6px;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 700;
  }
}

.chart-row {
  margin-bottom: 16px;
}

.chart-card {
  height: 100%;
  min-height: 360px;
  display: flex;
  flex-direction: column;
}

.chart-header {
  margin-bottom: 16px;

  .chart-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.chart-container {
  flex: 1;
  min-height: 280px;
}

.alarm-list {
  flex: 1;
  overflow-y: auto;
}

.alarm-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-light);

  &:last-child {
    border-bottom: none;
  }
}

.alarm-content {
  flex: 1;
  min-width: 0;
}

.alarm-device {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.alarm-message {
  font-size: 13px;
  color: var(--text-regular);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alarm-time {
  font-size: 12px;
  color: var(--text-secondary);
}
</style>
