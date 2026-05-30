<script setup lang="ts">
import { ref, onMounted, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useFilterStore } from '@/stores'
import { getCoreMetrics, getTrendData, getOverviewAlerts } from '@/api'
import { useDate, usePermission } from '@/hooks'
import type { CoreMetrics, AlertData, TrendData, MetricUnit } from '@/types'
import { getAlertLevelColor, formatDate } from '@/utils'
import FilterBar from '@/components/common/FilterBar.vue'
import MetricCard from '@/components/common/MetricCard.vue'
import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import DetailDrawer from '@/components/common/DetailDrawer.vue'

const router = useRouter()
const filterStore = useFilterStore()
const { hasPermission } = usePermission()
const { generateDateArray } = useDate()

const loading = ref(false)
const metrics = ref<CoreMetrics | null>(null)
const trendData = ref<TrendData[]>([])
const alerts = ref<AlertData[]>([])
const alertDetailVisible = ref(false)
const selectedAlert = ref<AlertData | null>(null)

const metricConfigs: { key: string; label: string; unit: MetricUnit; color: string; trendKey: string; isPositiveGood: boolean }[] = [
  { key: 'outpatientVolume', label: '门诊量', unit: 'number', color: '#1E88E5', trendKey: 'outpatientVolumeYoY', isPositiveGood: true },
  { key: 'inpatientCount', label: '住院人数', unit: 'number', color: '#4CAF50', trendKey: 'inpatientCountYoY', isPositiveGood: true },
  { key: 'bedOccupancyRate', label: '床位使用率', unit: 'percent', color: '#9C27B0', trendKey: 'bedOccupancyRateYoY', isPositiveGood: true },
  { key: 'departmentIncome', label: '科室收入', unit: 'money', color: '#FF9800', trendKey: 'departmentIncomeYoY', isPositiveGood: true },
  { key: 'drugRatio', label: '药占比', unit: 'percent', color: '#F44336', trendKey: 'drugRatioYoY', isPositiveGood: false },
  { key: 'avgWaitingTime', label: '平均候诊时间', unit: 'time', color: '#00BCD4', trendKey: 'avgWaitingTimeYoY', isPositiveGood: false },
  { key: 'examAppointments', label: '检查预约量', unit: 'number', color: '#3F51B5', trendKey: 'examAppointmentsYoY', isPositiveGood: true },
  { key: 'alertCount', label: '异常预警', unit: 'number', color: '#E91E63', trendKey: 'alertCountYoY', isPositiveGood: false },
]

const loadData = async () => {
  loading.value = true
  try {
    const [metricsRes, trendRes, alertsRes] = await Promise.all([
      getCoreMetrics({
        department: filterStore.filterParams.department,
        dateRange: filterStore.filterParams.dateRange,
      }),
      getTrendData({ type: 'outpatient', days: generateDateArray().length }),
      getOverviewAlerts(),
    ])

    metrics.value = metricsRes.data
    trendData.value = trendRes.data
    alerts.value = alertsRes.data
  } catch (error) {
    console.error('Failed to load overview data:', error)
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  loadData()
}

const handleMetricClick = (key: string) => {
  const routeMap: Record<string, string> = {
    outpatientVolume: '/department',
    inpatientCount: '/department',
    bedOccupancyRate: '/bed',
    departmentIncome: '/department',
    drugRatio: '/cost',
    avgWaitingTime: '/appointment',
    examAppointments: '/appointment',
    alertCount: '/alert',
  }
  const route = routeMap[key]
  if (route && hasPermission(route.replace('/', '') + ':view')) {
    router.push(route)
  }
}

const handleAlertClick = (alert: AlertData) => {
  selectedAlert.value = alert
  alertDetailVisible.value = true
}

const handleAlertStatusClick = (status: string) => {
  router.push({ path: '/alert', query: { status } })
}

const lineXData = ref<string[]>([])
const lineSeriesData = ref<{ name: string; data: number[]; color?: string }[]>([])

const barXData = ref<string[]>([])
const barSeriesData = ref<{ name: string; data: number[]; color?: string }[]>([])

watchEffect(() => {
  if (trendData.value.length > 0) {
    lineXData.value = trendData.value.map((d) => d.date)
    lineSeriesData.value = [
      {
        name: '门诊量',
        data: trendData.value.map((d) => d.value),
        color: '#1E88E5',
      },
    ]

    const departments = ['内科', '外科', '妇产科', '儿科', '骨科', '眼科']
    barXData.value = departments
    barSeriesData.value = [
      {
        name: '门诊量',
        data: departments.map(() => Math.floor(Math.random() * 3000 + 1000)),
        color: '#1E88E5',
      },
      {
        name: '住院量',
        data: departments.map(() => Math.floor(Math.random() * 500 + 200)),
        color: '#4CAF50',
      },
    ]
  }
})

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="page-container">
    <FilterBar @change="handleFilterChange" />

    <div v-loading="loading" class="overview-content">
      <div v-if="!metrics && !loading" class="empty-wrapper">
        <EmptyState type="error" description="数据加载失败，请稍后重试" />
      </div>

      <div v-if="metrics" class="metrics-grid">
        <MetricCard
          v-for="config in metricConfigs"
          :key="config.key"
          :label="config.label"
          :value="metrics[config.key as keyof CoreMetrics] as number"
          :trend="metrics[config.trendKey as keyof CoreMetrics] as number"
          :unit="config.unit"
          :color="config.color"
          :is-positive-good="config.isPositiveGood"
          :show-trend="true"
          @click="handleMetricClick(config.key)"
        />
      </div>

      <div class="charts-row">
        <div class="card-wrapper chart-card">
          <div class="card-title">
            <span>门诊量趋势</span>
            <el-radio-group size="small">
              <el-radio-button value="week">近7天</el-radio-button>
              <el-radio-button value="month">近30天</el-radio-button>
            </el-radio-group>
          </div>
          <LineChart
            v-if="lineXData.length > 0"
            :x-data="lineXData"
            :series-data="lineSeriesData"
            height="280px"
          />
          <EmptyState v-else type="loading" />
        </div>

        <div class="card-wrapper chart-card">
          <div class="card-title">
            <span>科室对比</span>
          </div>
          <BarChart
            v-if="barXData.length > 0"
            :x-data="barXData"
            :series-data="barSeriesData"
            height="280px"
          />
          <EmptyState v-else type="loading" />
        </div>
      </div>

      <div class="bottom-row">
        <div class="card-wrapper alert-card">
          <div class="card-title">
            <span>异常预警</span>
            <el-button type="primary" link @click="router.push('/alert')">查看全部</el-button>
          </div>
          <div v-if="alerts.length > 0" class="alert-list">
            <div
              v-for="alert in alerts"
              :key="alert.id"
              class="alert-item"
              :class="alert.level"
              @click="handleAlertClick(alert)"
            >
              <div class="alert-header">
                <el-tag :type="alert.level === 'high' ? 'danger' : alert.level === 'medium' ? 'warning' : 'success'" size="small">
                  {{ alert.level === 'high' ? '高' : alert.level === 'medium' ? '中' : '低' }}
                </el-tag>
                <span class="alert-type">{{ alert.type }}</span>
                <span class="alert-time">{{ alert.time }}</span>
              </div>
              <div class="alert-description">{{ alert.description }}</div>
              <div class="alert-footer">
                <span class="alert-dept">{{ alert.department }}</span>
                <el-tag size="small" :type="alert.status === 'resolved' ? 'success' : alert.status === 'processing' ? 'warning' : 'info'">
                  {{ alert.status === 'resolved' ? '已处理' : alert.status === 'processing' ? '处理中' : '待处理' }}
                </el-tag>
              </div>
            </div>
          </div>
          <EmptyState v-else type="empty" description="暂无预警信息" />
        </div>

        <div class="card-wrapper quick-card">
          <div class="card-title">
            <span>快捷入口</span>
          </div>
          <div class="quick-grid">
            <div
              v-if="hasPermission('department:view')"
              class="quick-item"
              @click="router.push('/department')"
            >
              <el-icon :size="32" color="#1E88E5"><OfficeBuilding /></el-icon>
              <span>科室分析</span>
            </div>
            <div
              v-if="hasPermission('doctor:view')"
              class="quick-item"
              @click="router.push('/doctor')"
            >
              <el-icon :size="32" color="#4CAF50"><User /></el-icon>
              <span>医生绩效</span>
            </div>
            <div
              v-if="hasPermission('bed:view')"
              class="quick-item"
              @click="router.push('/bed')"
            >
              <el-icon :size="32" color="#9C27B0"><Bed /></el-icon>
              <span>床位看板</span>
            </div>
            <div
              v-if="hasPermission('report:view')"
              class="quick-item"
              @click="router.push('/report')"
            >
              <el-icon :size="32" color="#FF9800"><Document /></el-icon>
              <span>报表查询</span>
            </div>
          </div>

          <div class="status-summary">
            <div class="status-item" @click="handleAlertStatusClick('pending')">
              <span class="status-count text-danger">{{ alerts.filter(a => a.status === 'pending').length }}</span>
              <span class="status-label">待处理预警</span>
            </div>
            <div class="status-item" @click="handleAlertStatusClick('processing')">
              <span class="status-count text-warning">{{ alerts.filter(a => a.status === 'processing').length }}</span>
              <span class="status-label">处理中</span>
            </div>
            <div class="status-item" @click="handleAlertStatusClick('resolved')">
              <span class="status-count text-success">{{ alerts.filter(a => a.status === 'resolved').length }}</span>
              <span class="status-label">已处理</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <DetailDrawer
      v-model="alertDetailVisible"
      title="预警详情"
      size="default"
    >
      <div v-if="selectedAlert" class="alert-detail">
        <div class="detail-section">
          <div class="detail-item">
            <label>预警等级</label>
            <el-tag :type="selectedAlert.level === 'high' ? 'danger' : selectedAlert.level === 'medium' ? 'warning' : 'success'">
              {{ selectedAlert.level === 'high' ? '高级' : selectedAlert.level === 'medium' ? '中级' : '低级' }}
            </el-tag>
          </div>
          <div class="detail-item">
            <label>预警类型</label>
            <span>{{ selectedAlert.type }}</span>
          </div>
          <div class="detail-item">
            <label>涉及科室</label>
            <span>{{ selectedAlert.department }}</span>
          </div>
          <div class="detail-item">
            <label>预警时间</label>
            <span>{{ selectedAlert.time }}</span>
          </div>
          <div class="detail-item">
            <label>当前值</label>
            <span class="text-danger">{{ selectedAlert.value }}</span>
          </div>
          <div class="detail-item">
            <label>预警阈值</label>
            <span>{{ selectedAlert.threshold }}</span>
          </div>
          <div class="detail-item">
            <label>处理状态</label>
            <el-tag :type="selectedAlert.status === 'resolved' ? 'success' : selectedAlert.status === 'processing' ? 'warning' : 'info'">
              {{ selectedAlert.status === 'resolved' ? '已处理' : selectedAlert.status === 'processing' ? '处理中' : '待处理' }}
            </el-tag>
          </div>
        </div>
        <div class="detail-section">
          <h4>预警描述</h4>
          <p>{{ selectedAlert.description }}</p>
        </div>
        <div class="detail-section">
          <h4>处理建议</h4>
          <ul>
            <li>建议立即核实情况，分析原因</li>
            <li>制定针对性改进措施</li>
            <li>持续跟踪指标变化趋势</li>
            <li>定期复盘评估处理效果</li>
          </ul>
        </div>
      </div>
      <template #actions>
        <el-button
          v-if="selectedAlert?.status === 'pending' && hasPermission('alert:handle')"
          type="primary"
        >
          开始处理
        </el-button>
      </template>
    </DetailDrawer>
  </div>
</template>

<style scoped>
.overview-content {
  min-height: calc(100vh - var(--header-height) - 120px);
}

.empty-wrapper {
  padding: var(--spacing-xl);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.chart-card {
  min-height: 380px;
}

.bottom-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--spacing-lg);
}

.alert-list {
  max-height: 400px;
  overflow-y: auto;
}

.alert-item {
  cursor: pointer;
  transition: all var(--transition-fast);
}

.alert-item:hover {
  transform: translateX(4px);
}

.alert-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.alert-type {
  font-weight: 500;
  color: var(--color-text-primary);
}

.alert-time {
  margin-left: auto;
  font-size: var(--font-size-xs);
  color: var(--color-text-placeholder);
}

.alert-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.alert-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--font-size-xs);
}

.alert-dept {
  color: var(--color-text-secondary);
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  background: var(--color-bg-tertiary);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  gap: var(--spacing-sm);
}

.quick-item:hover {
  background: var(--color-primary);
  color: #fff;
}

.quick-item:hover el-icon {
  color: #fff !important;
}

.status-summary {
  display: flex;
  justify-content: space-around;
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.status-item {
  text-align: center;
  cursor: pointer;
}

.status-count {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  display: block;
  margin-bottom: var(--spacing-xs);
}

.status-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.alert-detail {
  padding: var(--spacing-md);
}

.detail-section {
  margin-bottom: var(--spacing-lg);
}

.detail-section h4 {
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-base);
  font-weight: 600;
}

.detail-section ul {
  padding-left: var(--spacing-lg);
  line-height: 2;
}

.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.detail-item label {
  width: 100px;
  color: var(--color-text-secondary);
  margin-right: var(--spacing-md);
}

@media (max-width: 1400px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-row {
    grid-template-columns: 1fr;
  }

  .bottom-row {
    grid-template-columns: 1fr;
  }
}
</style>
