<template>
  <div class="server-detail" v-loading="loading">
    <el-card v-if="server">
      <template #header>
        <div class="card-header">
          <div>
            <span class="server-name">{{ server.name }}</span>
            <el-tag :type="getStatusType(server.status)" effect="light" style="margin-left: 10px;">
              {{ getStatusText(server.status) }}
            </el-tag>
          </div>
          <el-button @click="goBack" :icon="ArrowLeft">
            返回列表
          </el-button>
        </div>
      </template>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="服务器ID">{{ server.id }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ server.ipAddress }}</el-descriptions-item>
        <el-descriptions-item label="主机名">{{ server.hostname || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作系统">{{ server.osType || '-' }}</el-descriptions-item>
        <el-descriptions-item label="系统版本">{{ server.osVersion || '-' }}</el-descriptions-item>
        <el-descriptions-item label="CPU核心">{{ server.cpuCores || '-' }}</el-descriptions-item>
        <el-descriptions-item label="总内存">{{ server.totalMemoryGb ? server.totalMemoryGb + ' GB' : '-' }}</el-descriptions-item>
        <el-descriptions-item label="总磁盘">{{ server.totalDiskGb ? server.totalDiskGb + ' GB' : '-' }}</el-descriptions-item>
        <el-descriptions-item label="最后心跳">{{ server.lastHeartbeat || '-' }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="3">{{ server.description || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card v-if="latestMetric" class="dashboard-card">
      <template #header>
        <span>最新指标数据</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="metric-card">
            <div class="metric-label">CPU使用率</div>
            <el-progress
              :percentage="Number(latestMetric.cpuUsage || 0)"
              :color="getProgressColor(latestMetric.cpuUsage)"
            />
            <div class="metric-value">{{ latestMetric.cpuUsage || 0 }}%</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="metric-card">
            <div class="metric-label">内存使用率</div>
            <el-progress
              :percentage="Number(latestMetric.memoryUsage || 0)"
              :color="getProgressColor(latestMetric.memoryUsage)"
            />
            <div class="metric-value">{{ latestMetric.memoryUsage || 0 }}% ({{ latestMetric.memoryUsedGb || 0 }}GB)</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="metric-card">
            <div class="metric-label">磁盘使用率</div>
            <el-progress
              :percentage="Number(latestMetric.diskUsage || 0)"
              :color="getProgressColor(latestMetric.diskUsage)"
            />
            <div class="metric-value">{{ latestMetric.diskUsage || 0 }}% ({{ latestMetric.diskUsedGb || 0 }}GB)</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="metric-card">
            <div class="metric-label">网络带宽</div>
            <div style="margin: 10px 0;">
              <el-tag type="primary">入站: {{ latestMetric.networkInMbps || 0 }} Mbps</el-tag>
            </div>
            <el-tag type="success">出站: {{ latestMetric.networkOutMbps || 0 }} Mbps</el-tag>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="dashboard-card">
          <template #header>
            <span>最近24小时 CPU 使用率趋势</span>
          </template>
          <div ref="cpuChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="dashboard-card">
          <template #header>
            <span>最近24小时 内存使用率趋势</span>
          </template>
          <div ref="memoryChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="dashboard-card">
          <template #header>
            <span>最近24小时 磁盘使用率趋势</span>
          </template>
          <div ref="diskChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="dashboard-card">
          <template #header>
            <span>该服务器最近告警</span>
          </template>
          <el-table :data="serverAlerts" size="small">
            <el-table-column prop="metricType" label="类型" width="80">
              <template #default="{ row }">{{ getMetricTypeName(row.metricType) }}</template>
            </el-table-column>
            <el-table-column label="级别" width="80">
              <template #default="{ row }">
                <el-tag :class="`alert-level-${row.alertLevel}`" size="small">
                  {{ getAlertLevelName(row.alertLevel) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="message" label="信息" />
            <el-table-column prop="occurredAt" label="时间" width="160" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { serverApi, metricApi, alertApi } from '@/api'

const route = useRoute()
const router = useRouter()
const serverId = route.params.id

const loading = ref(true)
const server = ref(null)
const latestMetric = ref(null)
const serverAlerts = ref([])
const metrics = ref([])

const cpuChartRef = ref(null)
const memoryChartRef = ref(null)
const diskChartRef = ref(null)

let cpuChart = null
let memoryChart = null
let diskChart = null
let refreshTimer = null

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

function getProgressColor(value) {
  const v = Number(value) || 0
  if (v >= 90) return '#f56c6c'
  if (v >= 70) return '#e6a23c'
  return '#67c23a'
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

function goBack() {
  router.push('/servers')
}

async function loadData() {
  loading.value = true
  try {
    const [serverRes, latestRes, alertsRes, metricsRes] = await Promise.all([
      serverApi.getById(serverId),
      metricApi.getLatest(serverId).catch(() => ({ data: null })),
      alertApi.getByServer(serverId).catch(() => ({ data: [] })),
      metricApi.getByServerAndRange(serverId, 24).catch(() => ({ data: [] }))
    ])
    
    server.value = serverRes.data
    latestMetric.value = latestRes.data
    serverAlerts.value = (alertsRes.data || []).slice(0, 10)
    metrics.value = metricsRes.data || []
    
    updateCharts()
  } catch (e) {
  } finally {
    loading.value = false
  }
}

function initCharts() {
  if (cpuChartRef.value) cpuChart = echarts.init(cpuChartRef.value)
  if (memoryChartRef.value) memoryChart = echarts.init(memoryChartRef.value)
  if (diskChartRef.value) diskChart = echarts.init(diskChartRef.value)
}

function updateCharts() {
  const times = metrics.value.map(m => {
    const date = new Date(m.timestamp)
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  })
  
  const cpuData = metrics.value.map(m => m.cpuUsage || 0)
  const memoryData = metrics.value.map(m => m.memoryUsage || 0)
  const diskData = metrics.value.map(m => m.diskUsage || 0)
  
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
      series: [{ type: 'line', data: cpuData, smooth: true, name: 'CPU使用率(%)' }]
    })
  }
  if (memoryChart) {
    memoryChart.setOption({
      ...commonOption,
      series: [{ type: 'line', data: memoryData, smooth: true, name: '内存使用率(%)' }]
    })
  }
  if (diskChart) {
    diskChart.setOption({
      ...commonOption,
      series: [{ type: 'line', data: diskData, smooth: true, name: '磁盘使用率(%)' }]
    })
  }
}

function handleResize() {
  cpuChart?.resize()
  memoryChart?.resize()
  diskChart?.resize()
}

onMounted(async () => {
  await nextTick()
  initCharts()
  await loadData()
  refreshTimer = setInterval(loadData, 60000)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  window.removeEventListener('resize', handleResize)
  cpuChart?.dispose()
  memoryChart?.dispose()
  diskChart?.dispose()
})
</script>

<style scoped>
.server-detail {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.server-name {
  font-size: 18px;
  font-weight: bold;
}

.dashboard-card {
  margin-top: 20px;
}

.metric-card {
  text-align: center;
  padding: 15px;
}

.metric-label {
  color: #909399;
  font-size: 14px;
  margin-bottom: 10px;
}

.metric-value {
  margin-top: 8px;
  font-size: 14px;
  color: #606266;
}

.chart-container {
  width: 100%;
  height: 300px;
}
</style>
