<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #409eff;">
            <Monitor :size="32" />
          </div>
          <div class="stat-value">{{ stats.totalServers }}</div>
          <div class="stat-label">服务器总数</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #67c23a;">
            <CircleCheck :size="32" />
          </div>
          <div class="stat-value">{{ stats.onlineServers }}</div>
          <div class="stat-label">在线服务器</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #e6a23c;">
            <Warning :size="32" />
          </div>
          <div class="stat-value">{{ stats.activeAlerts }}</div>
          <div class="stat-label">活跃告警</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f56c6c;">
            <CloseBold :size="32" />
          </div>
          <div class="stat-value">{{ stats.criticalAlerts }}</div>
          <div class="stat-label">严重告警</div>
        </div>
      </el-col>
    </el-row>

    <el-card class="dashboard-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>服务器列表</span>
          <el-button type="primary" @click="refreshData" :icon="Refresh">
            刷新
          </el-button>
        </div>
      </template>
      <el-table :data="servers" stripe>
        <el-table-column prop="name" label="服务器名称" width="180">
          <template #default="{ row }">
            <router-link :to="`/servers/${row.id}`" class="server-link">
              {{ row.name }}
            </router-link>
          </template>
        </el-table-column>
        <el-table-column prop="ipAddress" label="IP地址" width="150" />
        <el-table-column prop="osType" label="操作系统" width="120" />
        <el-table-column label="CPU核心/内存/磁盘" width="220">
          <template #default="{ row }">
            {{ row.cpuCores }}核 / {{ row.totalMemoryGb }}GB / {{ row.totalDiskGb }}GB
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastHeartbeat" label="最后心跳" width="200">
          <template #default="{ row }">
            {{ row.lastHeartbeat || '-' }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="dashboard-card" v-loading="loading">
          <template #header>
            <span>最近24小时 CPU 使用率趋势</span>
          </template>
          <div ref="cpuChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="dashboard-card" v-loading="loading">
          <template #header>
            <span>最近24小时 内存使用率趋势</span>
          </template>
          <div ref="memoryChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="dashboard-card" v-loading="loading">
          <template #header>
            <span>最近告警</span>
          </template>
          <el-table :data="recentAlerts" size="small">
            <el-table-column prop="serverId" label="服务器ID" width="100" />
            <el-table-column prop="metricType" label="指标类型" width="100">
              <template #default="{ row }">
                {{ getMetricTypeName(row.metricType) }}
              </template>
            </el-table-column>
            <el-table-column prop="message" label="告警信息" />
            <el-table-column label="级别" width="80">
              <template #default="{ row }">
                <el-tag :class="`alert-level-${row.alertLevel}`" size="small">
                  {{ getAlertLevelName(row.alertLevel) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="occurredAt" label="时间" width="170" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="dashboard-card" v-loading="loading">
          <template #header>
            <span>最近24小时 磁盘使用率趋势</span>
          </template>
          <div ref="diskChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { serverApi, alertApi, metricApi } from '@/api'

const loading = ref(false)
const cpuChartRef = ref(null)
const memoryChartRef = ref(null)
const diskChartRef = ref(null)

let cpuChart = null
let memoryChart = null
let diskChart = null
let refreshTimer = null

const stats = reactive({
  totalServers: 0,
  onlineServers: 0,
  activeAlerts: 0,
  criticalAlerts: 0
})

const servers = ref([])
const recentAlerts = ref([])
const selectedServerId = ref(null)

function getStatusType(status) {
  switch (status) {
    case 'ONLINE': return 'success'
    case 'OFFLINE': return 'info'
    case 'WARNING': return 'warning'
    case 'ERROR': return 'danger'
    case 'CRITICAL': return 'danger'
    default: return 'info'
  }
}

function getStatusText(status) {
  switch (status) {
    case 'ONLINE': return '在线'
    case 'OFFLINE': return '离线'
    case 'WARNING': return '警告'
    case 'ERROR': return '错误'
    case 'CRITICAL': return '严重'
    default: return status
  }
}

function getMetricTypeName(type) {
  switch (type) {
    case 'CPU': return 'CPU'
    case 'MEMORY': return '内存'
    case 'DISK': return '磁盘'
    case 'NETWORK': return '网络'
    default: return type
  }
}

function getAlertLevelName(level) {
  switch (level) {
    case 1: return '信息'
    case 2: return '警告'
    case 3: return '错误'
    case 4: return '严重'
    default: return '未知'
  }
}

async function loadStats() {
  try {
    const alertRes = await alertApi.getStats()
    stats.activeAlerts = alertRes.data.totalActive || 0
    stats.criticalAlerts = alertRes.data.critical || 0
  } catch (e) {}
}

async function loadServers() {
  try {
    const res = await serverApi.getList()
    servers.value = res.data || []
    stats.totalServers = servers.value.length
    stats.onlineServers = servers.value.filter(s => s.status === 'ONLINE').length
    
    if (servers.value.length > 0 && !selectedServerId.value) {
      selectedServerId.value = servers.value[0].id
    }
  } catch (e) {}
}

async function loadRecentAlerts() {
  try {
    const res = await alertApi.getRecent(24)
    recentAlerts.value = (res.data || []).slice(0, 5)
  } catch (e) {}
}

function initCharts() {
  if (cpuChartRef.value) {
    cpuChart = echarts.init(cpuChartRef.value)
  }
  if (memoryChartRef.value) {
    memoryChart = echarts.init(memoryChartRef.value)
  }
  if (diskChartRef.value) {
    diskChart = echarts.init(diskChartRef.value)
  }
}

function updateCharts(metrics) {
  const times = metrics.map(m => {
    const date = new Date(m.timestamp)
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  })
  
  const cpuData = metrics.map(m => m.cpuUsage || 0)
  const memoryData = metrics.map(m => m.memoryUsage || 0)
  const diskData = metrics.map(m => m.diskUsage || 0)
  
  const commonOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: times },
    yAxis: { type: 'value', max: 100 },
    series: []
  }
  
  if (cpuChart) {
    cpuChart.setOption({
      ...commonOption,
      series: [{
        type: 'line',
        data: cpuData,
        smooth: true,
        areaStyle: { color: 'rgba(64, 158, 255, 0.2)' },
        lineStyle: { color: '#409eff' },
        itemStyle: { color: '#409eff' },
        name: 'CPU使用率(%)'
      }]
    })
  }
  
  if (memoryChart) {
    memoryChart.setOption({
      ...commonOption,
      series: [{
        type: 'line',
        data: memoryData,
        smooth: true,
        areaStyle: { color: 'rgba(103, 194, 58, 0.2)' },
        lineStyle: { color: '#67c23a' },
        itemStyle: { color: '#67c23a' },
        name: '内存使用率(%)'
      }]
    })
  }
  
  if (diskChart) {
    diskChart.setOption({
      ...commonOption,
      series: [{
        type: 'line',
        data: diskData,
        smooth: true,
        areaStyle: { color: 'rgba(230, 162, 60, 0.2)' },
        lineStyle: { color: '#e6a23c' },
        itemStyle: { color: '#e6a23c' },
        name: '磁盘使用率(%)'
      }]
    })
  }
}

async function loadChartData() {
  if (!selectedServerId.value) return
  
  try {
    const res = await metricApi.getByServerAndRange(selectedServerId.value, 24)
    updateCharts(res.data || [])
  } catch (e) {
    updateCharts([])
  }
}

async function refreshData() {
  loading.value = true
  await Promise.all([
    loadStats(),
    loadServers(),
    loadRecentAlerts()
  ])
  await loadChartData()
  loading.value = false
}

function handleResize() {
  cpuChart?.resize()
  memoryChart?.resize()
  diskChart?.resize()
}

watch(selectedServerId, () => {
  loadChartData()
})

onMounted(async () => {
  await nextTick()
  initCharts()
  await refreshData()
  
  refreshTimer = setInterval(refreshData, 60000)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  window.removeEventListener('resize', handleResize)
  cpuChart?.dispose()
  memoryChart?.dispose()
  diskChart?.dispose()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stat-card {
  background: #fff;
  border-radius: 4px;
  padding: 20px;
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-right: 20px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  color: #999;
  font-size: 14px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.server-link {
  color: #409eff;
  text-decoration: none;
}

.server-link:hover {
  text-decoration: underline;
}

.chart-container {
  width: 100%;
  height: 300px;
}
</style>
