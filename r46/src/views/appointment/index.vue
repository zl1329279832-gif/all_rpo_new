<script setup lang="ts">
import { ref, onMounted, watchEffect, reactive } from 'vue'
import { useFilterStore } from '@/stores'
import {
  getAppointmentList,
  getAppointmentTrend,
  getWaitingTime,
  getAppointmentByDepartment,
  getExaminationAppointment,
  getAppointmentOverview,
  type AppointmentListItem,
} from '@/api/appointment'
import { useExport, usePermission } from '@/hooks'
import { useDate } from '@/hooks'
import { formatDateTime, randomRange, randomFloat } from '@/utils'
import { DEPARTMENTS } from '@/types'
import FilterBar from '@/components/common/FilterBar.vue'
import MetricCard from '@/components/common/MetricCard.vue'
import LineChart from '@/components/charts/LineChart.vue'
import PieChart from '@/components/charts/PieChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import GaugeChart from '@/components/charts/GaugeChart.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import DetailDrawer from '@/components/common/DetailDrawer.vue'

const filterStore = useFilterStore()
const { exportAll, exporting } = useExport()
const { hasPermission } = usePermission()
const { generateDateArray } = useDate()

const loading = ref(false)
const tableLoading = ref(false)
const overview = ref<{
  todayCount: number
  pendingCount: number
  completedCount: number
  cancelledCount: number
} | null>(null)
const avgWaitingTime = ref(0)
const trendData = ref<any[]>([])
const deptData = ref<{ department: string; count: number }[]>([])
const examData = ref<{ name: string; value: number }[]>([])
const appointmentList = ref<AppointmentListItem[]>([])
const total = ref(0)
const detailVisible = ref(false)
const selectedAppointment = ref<AppointmentListItem | null>(null)

const filterForm = reactive({
  status: '',
  department: '',
  page: 1,
  pageSize: 10,
})

const statusOptions = [
  { value: 'pending', label: '待就诊' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '取消预约' },
  { value: 'no_show', label: '未就诊' },
]

const metricConfigs: { key: string; label: string; unit: 'number' | 'percent' | 'money' | 'time'; color: string }[] = [
  { key: 'todayCount', label: '今日预约量', unit: 'number', color: '#1E88E5' },
  { key: 'pendingCount', label: '待就诊', unit: 'number', color: '#FF9800' },
  { key: 'completedCount', label: '已完成', unit: 'number', color: '#4CAF50' },
  { key: 'cancelledCount', label: '取消预约', unit: 'number', color: '#F44336' },
]

const loadOverview = async () => {
  try {
    const [overviewRes, waitingRes, trendRes, deptRes, examRes] = await Promise.all([
      getAppointmentOverview(),
      getWaitingTime(),
      getAppointmentTrend(),
      getAppointmentByDepartment(),
      getExaminationAppointment(),
    ])

    overview.value = overviewRes.data
    avgWaitingTime.value = waitingRes.data.avgWaitingTime
    trendData.value = trendRes.data
    deptData.value = deptRes.data
    examData.value = examRes.data
  } catch (error) {
    console.error('Failed to load appointment overview:', error)
  }
}

const loadTableData = async () => {
  tableLoading.value = true
  try {
    const res = await getAppointmentList({
      status: filterForm.status || undefined,
      department: filterForm.department || undefined,
      startDate: filterStore.filterParams.startDate,
      endDate: filterStore.filterParams.endDate,
      page: filterForm.page,
      pageSize: filterForm.pageSize,
    })

    appointmentList.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error('Failed to load appointment list:', error)
  } finally {
    tableLoading.value = false
  }
}

const loadData = async () => {
  loading.value = true
  try {
    await loadOverview()
    await loadTableData()
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  filterForm.page = 1
  loadData()
}

const handleTableFilter = () => {
  filterForm.page = 1
  loadTableData()
}

const handlePageChange = (page: number) => {
  filterForm.page = page
  loadTableData()
}

const handleSizeChange = (size: number) => {
  filterForm.pageSize = size
  filterForm.page = 1
  loadTableData()
}

const getStatusTagType = (status: string) => {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'completed':
      return 'success'
    case 'cancelled':
      return 'danger'
    case 'no_show':
      return 'info'
    default:
      return ''
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return '待就诊'
    case 'completed':
      return '已完成'
    case 'cancelled':
      return '取消预约'
    case 'no_show':
      return '未就诊'
    default:
      return status
  }
}

const exportColumns = [
  { key: 'patientName', title: '患者姓名' },
  { key: 'phone', title: '联系电话' },
  { key: 'department', title: '科室' },
  { key: 'doctor', title: '医生' },
  { key: 'appointmentTime', title: '预约时间' },
  { key: 'type', title: '预约类型' },
  {
    key: 'status',
    title: '状态',
    formatter: (value: string) => getStatusText(value),
  },
  { key: 'createTime', title: '创建时间' },
]

const handleViewDetail = (row: AppointmentListItem) => {
  selectedAppointment.value = row
  detailVisible.value = true
}

const handleExport = () => {
  exportAll(appointmentList.value, exportColumns, `预约列表_${new Date().toISOString().slice(0, 10)}.xlsx`)
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
        name: '门诊预约',
        data: trendData.value.map((d) => d.outpatient),
        color: '#1E88E5',
      },
      {
        name: '检查预约',
        data: trendData.value.map((d) => d.examination),
        color: '#4CAF50',
      },
    ]
  }

  if (deptData.value.length > 0) {
    const sortedDepts = [...deptData.value].sort((a, b) => b.count - a.count).slice(0, 10)
    barXData.value = sortedDepts.map((d) => d.department)
    barSeriesData.value = [
      {
        name: '预约量',
        data: sortedDepts.map((d) => d.count),
        color: '#1E88E5',
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

    <div v-loading="loading" class="appointment-content">
      <div v-if="overview" class="metrics-grid">
        <MetricCard
          v-for="config in metricConfigs"
          :key="config.key"
          :label="config.label"
          :value="overview[config.key as keyof typeof overview] as number"
          :unit="config.unit"
          :color="config.color"
        />
      </div>

      <div class="charts-row">
        <div class="card-wrapper chart-card">
          <div class="card-title">
            <span>预约趋势</span>
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
            <span>平均候诊时间</span>
          </div>
          <GaugeChart
            :value="Math.min(avgWaitingTime, 120)"
            title="分钟"
            :max="120"
            height="280px"
          />
        </div>
      </div>

      <div class="charts-row">
        <div class="card-wrapper chart-card">
          <div class="card-title">
            <span>检查类型预约分布</span>
          </div>
          <PieChart
            v-if="examData.length > 0"
            :data="examData"
            height="280px"
          />
          <EmptyState v-else type="loading" />
        </div>

        <div class="card-wrapper chart-card">
          <div class="card-title">
            <span>科室预约量排名</span>
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

      <div class="card-wrapper table-card">
        <div class="card-title">
          <span>预约列表</span>
          <div class="card-actions">
            <el-form :inline="true" size="small">
              <el-form-item label="状态">
                <el-select
                  v-model="filterForm.status"
                  placeholder="全部"
                  clearable
                  style="width: 120px"
                  @change="handleTableFilter"
                >
                  <el-option
                    v-for="item in statusOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="科室">
                <el-select
                  v-model="filterForm.department"
                  placeholder="全部"
                  clearable
                  style="width: 150px"
                  @change="handleTableFilter"
                >
                  <el-option
                    v-for="dept in DEPARTMENTS.filter(d => d.id !== 'all')"
                    :key="dept.id"
                    :label="dept.name"
                    :value="dept.id"
                  />
                </el-select>
              </el-form-item>
            </el-form>
            <el-button
              v-if="hasPermission('export:appointment')"
              type="primary"
              size="small"
              :loading="exporting"
              @click="handleExport"
            >
              <el-icon><Download /></el-icon>
              导出
            </el-button>
          </div>
        </div>

        <el-table
          v-loading="tableLoading"
          :data="appointmentList"
          stripe
          border
          style="width: 100%"
        >
          <el-table-column prop="patientName" label="患者姓名" min-width="100" />
          <el-table-column prop="phone" label="联系电话" min-width="130" />
          <el-table-column prop="department" label="科室" min-width="100" />
          <el-table-column prop="doctor" label="医生" min-width="100" />
          <el-table-column prop="appointmentTime" label="预约时间" min-width="160" />
          <el-table-column prop="type" label="预约类型" min-width="100" />
          <el-table-column prop="status" label="状态" min-width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" min-width="160">
            <template #default="{ row }">
              {{ formatDateTime(row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="100" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleViewDetail(row)">查看详情</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="filterForm.page"
            v-model:page-size="filterForm.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>

    <DetailDrawer v-model="detailVisible" title="预约详情" size="default">
      <div v-if="selectedAppointment" class="appointment-detail">
        <div class="detail-section">
          <div class="detail-item">
            <label>患者姓名</label>
            <span>{{ selectedAppointment.patientName }}</span>
          </div>
          <div class="detail-item">
            <label>联系电话</label>
            <span>{{ selectedAppointment.phone }}</span>
          </div>
          <div class="detail-item">
            <label>科室</label>
            <span>{{ selectedAppointment.department }}</span>
          </div>
          <div class="detail-item">
            <label>医生</label>
            <span>{{ selectedAppointment.doctor }}</span>
          </div>
          <div class="detail-item">
            <label>预约时间</label>
            <span>{{ selectedAppointment.appointmentTime }}</span>
          </div>
          <div class="detail-item">
            <label>预约类型</label>
            <span>{{ selectedAppointment.type }}</span>
          </div>
          <div class="detail-item">
            <label>状态</label>
            <el-tag :type="getStatusTagType(selectedAppointment.status)" size="small">
              {{ getStatusText(selectedAppointment.status) }}
            </el-tag>
          </div>
          <div class="detail-item">
            <label>创建时间</label>
            <span>{{ selectedAppointment.createTime }}</span>
          </div>
        </div>
      </div>
    </DetailDrawer>
  </div>
</template>

<style scoped>
.appointment-content {
  min-height: calc(100vh - var(--header-height) - 120px);
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

.card-wrapper {
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
}

.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text-primary);
}

.card-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.table-card {
  padding: var(--spacing-lg);
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--spacing-md);
}

@media (max-width: 1400px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-row {
    grid-template-columns: 1fr;
  }
}

.appointment-detail {
  padding: var(--spacing-sm);
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.detail-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.detail-item label {
  flex-shrink: 0;
  width: 80px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.detail-item span {
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
}
</style>
