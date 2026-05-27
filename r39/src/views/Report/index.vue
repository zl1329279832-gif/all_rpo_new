<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { Download, Refresh } from '@element-plus/icons-vue'
import { getReportOverview, exportReport } from '../../api/report'
import { useAppStore } from '../../stores/app'

const appStore = useAppStore()
const loading = ref(false)
const period = ref<'week' | 'month' | 'quarter'>('week')
const reportData = ref<any>(null)

const orderChartRef = ref<HTMLElement | null>(null)
const incomeChartRef = ref<HTMLElement | null>(null)
const electricityChartRef = ref<HTMLElement | null>(null)

let orderChart: echarts.ECharts | null = null
let incomeChart: echarts.ECharts | null = null
let electricityChart: echarts.ECharts | null = null

function getChartTheme() {
  return appStore.isDarkMode ? 'dark' : undefined
}

function initCharts() {
  if (orderChartRef.value) {
    orderChart = echarts.init(orderChartRef.value, getChartTheme())
  }
  if (incomeChartRef.value) {
    incomeChart = echarts.init(incomeChartRef.value, getChartTheme())
  }
  if (electricityChartRef.value) {
    electricityChart = echarts.init(electricityChartRef.value, getChartTheme())
  }
}

function updateCharts() {
  if (!reportData.value) return

  const data = reportData.value.list

  const orderOption: echarts.EChartsOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: data.map((d: any) => d.date) },
    yAxis: { type: 'value' },
    series: [{
      name: '订单数',
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.3 },
      data: data.map((d: any) => d.orders),
      color: '#409eff'
    }]
  }
  orderChart?.setOption(orderOption)

  const incomeOption: echarts.EChartsOption = {
    tooltip: { trigger: 'axis', formatter: '{b}<br/>¥{c}' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: data.map((d: any) => d.date) },
    yAxis: { type: 'value' },
    series: [{
      name: '收入',
      type: 'bar',
      data: data.map((d: any) => d.income),
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: '#67c23a' },
        { offset: 1, color: '#95de64' }
      ])
    }]
  }
  incomeChart?.setOption(incomeOption)

  const electricityOption: echarts.EChartsOption = {
    tooltip: { trigger: 'axis', formatter: '{b}<br/>{c}kWh' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: data.map((d: any) => d.date) },
    yAxis: { type: 'value' },
    series: [{
      name: '充电量',
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.3, color: '#e6a23c' },
      data: data.map((d: any) => d.electricity),
      color: '#e6a23c',
      lineStyle: { color: '#e6a23c' }
    }]
  }
  electricityChart?.setOption(electricityOption)
}

async function fetchData() {
  loading.value = true
  try {
    const res = await getReportOverview(period.value)
    reportData.value = res.data
    updateCharts()
  } finally {
    loading.value = false
  }
}

async function handleExport() {
  loading.value = true
  try {
    await exportReport(period.value)
    ElMessage.success('导出成功，文件已开始下载')
  } finally {
    loading.value = false
  }
}

function handleResize() {
  orderChart?.resize()
  incomeChart?.resize()
  electricityChart?.resize()
}

watch(period, () => {
  fetchData()
})

watch(() => appStore.isDarkMode, () => {
  orderChart?.dispose()
  incomeChart?.dispose()
  electricityChart?.dispose()
  initCharts()
  updateCharts()
})

onMounted(() => {
  initCharts()
  fetchData()
  window.addEventListener('resize', handleResize)
})
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">运营报表</h2>
      <div class="header-actions">
        <el-radio-group v-model="period" size="small">
          <el-radio-button value="week">本周</el-radio-button>
          <el-radio-button value="month">本月</el-radio-button>
          <el-radio-button value="quarter">本季度</el-radio-button>
        </el-radio-group>
        <el-button :icon="Refresh" @click="fetchData" :loading="loading">刷新</el-button>
        <el-button type="primary" :icon="Download" @click="handleExport" :loading="loading">
          导出报表
        </el-button>
      </div>
    </div>

    <div class="summary-cards">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :lg="6">
          <div class="summary-card">
            <div class="summary-label">总订单数</div>
            <div class="summary-value">{{ reportData?.summary?.totalOrders || 0 }}</div>
            <div class="summary-trend up">↑ 12.5%</div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <div class="summary-card">
            <div class="summary-label">总充电量</div>
            <div class="summary-value">{{ (reportData?.summary?.totalElectricity || 0).toFixed(2) }}</div>
            <div class="summary-unit">kWh</div>
            <div class="summary-trend up">↑ 8.3%</div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <div class="summary-card">
            <div class="summary-label">总收入</div>
            <div class="summary-value">¥{{ (reportData?.summary?.totalIncome || 0).toFixed(2) }}</div>
            <div class="summary-trend up">↑ 15.7%</div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <div class="summary-card">
            <div class="summary-label">平均设备利用率</div>
            <div class="summary-value">{{ reportData?.summary?.avgUtilization || 0 }}%</div>
            <div class="summary-trend down">↓ 2.1%</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-row :gutter="16" class="chart-row">
      <el-col :xs="24" :lg="12">
        <div class="card chart-card">
          <div class="chart-header">
            <h3 class="chart-title">订单趋势</h3>
          </div>
          <div ref="orderChartRef" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :xs="24" :lg="12">
        <div class="card chart-card">
          <div class="chart-header">
            <h3 class="chart-title">收入统计</h3>
          </div>
          <div ref="incomeChartRef" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <el-col :span="24">
        <div class="card chart-card">
          <div class="chart-header">
            <h3 class="chart-title">充电量趋势</h3>
          </div>
          <div ref="electricityChartRef" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.summary-cards {
  margin-bottom: 16px;
}

.summary-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.summary-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.summary-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.summary-unit {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.summary-trend {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 13px;
  padding: 2px 8px;
  border-radius: 4px;

  &.up {
    background: rgba(103, 194, 58, 0.1);
    color: #67c23a;
  }

  &.down {
    background: rgba(245, 108, 108, 0.1);
    color: #f56c6c;
  }
}

.chart-row {
  margin-bottom: 16px;
}

.chart-card {
  height: 100%;
  min-height: 320px;
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
  }
}

.chart-container {
  flex: 1;
  min-height: 260px;
}
</style>
