<script setup lang="ts">
import { ref, onMounted, watchEffect, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getAlertList,
  getAlertDetail,
  handleAlert,
  batchHandle,
  batchIgnore,
  getAlertTypeDistribution,
  getAlertTrend,
  type HandleRecord,
} from '@/api/alert'
import { usePermission, useExport } from '@/hooks'
import { formatDateTime, getAlertLevelColor } from '@/utils'
import type { AlertData } from '@/types'
import FilterBar from '@/components/common/FilterBar.vue'
import MetricCard from '@/components/common/MetricCard.vue'
import LineChart from '@/components/charts/LineChart.vue'
import PieChart from '@/components/charts/PieChart.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import DetailDrawer from '@/components/common/DetailDrawer.vue'

const route = useRoute()
const { hasPermission } = usePermission()
const { exportAll, exporting } = useExport()

const loading = ref(false)
const tableLoading = ref(false)
const alertList = ref<AlertData[]>([])
const total = ref(0)
const statistics = ref<{
  pendingCount: number
  processingCount: number
  resolvedCount: number
  highCount: number
  mediumCount: number
  lowCount: number
} | null>(null)
const typeData = ref<{ name: string; value: number }[]>([])
const trendData = ref<{ date: string; high: number; medium: number; low: number }[]>([])

const selectedRows = ref<AlertData[]>([])
const selectedIds = computed(() => selectedRows.value.map((item) => item.id))

const filterForm = reactive({
  level: '',
  status: (route.query.status as string) || '',
  type: '',
  page: 1,
  pageSize: 10,
})

const alertDetailVisible = ref(false)
const selectedAlert = ref<AlertData | null>(null)
const handleRecords = ref<HandleRecord[]>([])
const suggestions = ref<string[]>([])
const detailLoading = ref(false)

const handleFormVisible = ref(false)
const handleForm = reactive({
  note: '',
})

const levelOptions = [
  { value: 'high', label: '高级' },
  { value: 'medium', label: '中级' },
  { value: 'low', label: '低级' },
]

const statusOptions = [
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已处理' },
]

const typeOptions = [
  { value: 'bed_occupancy', label: '床位使用率' },
  { value: 'drug_ratio', label: '药占比' },
  { value: 'waiting_time', label: '候诊时间' },
  { value: 'patient_satisfaction', label: '患者满意度' },
  { value: 'medical_quality', label: '医疗质量' },
]

const metricConfigs: { key: string; label: string; unit: 'number' | 'percent' | 'money' | 'time'; color: string }[] = [
  { key: 'pendingCount', label: '待处理', unit: 'number', color: '#FF9800' },
  { key: 'processingCount', label: '处理中', unit: 'number', color: '#1E88E5' },
  { key: 'resolvedCount', label: '已处理', unit: 'number', color: '#4CAF50' },
  { key: 'highCount', label: '高级预警', unit: 'number', color: '#F44336' },
  { key: 'mediumCount', label: '中级预警', unit: 'number', color: '#FF9800' },
  { key: 'lowCount', label: '低级预警', unit: 'number', color: '#4CAF50' },
]

const loadOverview = async () => {
  try {
    const [typeRes, trendRes] = await Promise.all([
      getAlertTypeDistribution(),
      getAlertTrend(),
    ])

    typeData.value = typeRes.data
    trendData.value = trendRes.data
  } catch (error) {
    console.error('Failed to load alert overview:', error)
  }
}

const loadTableData = async () => {
  tableLoading.value = true
  try {
    const res = await getAlertList({
      level: filterForm.level || undefined,
      status: filterForm.status || undefined,
      type: filterForm.type || undefined,
      page: filterForm.page,
      pageSize: filterForm.pageSize,
    })

    alertList.value = res.data.list
    total.value = res.data.total
    statistics.value = {
      pendingCount: res.data.pendingCount,
      processingCount: res.data.processingCount,
      resolvedCount: res.data.resolvedCount,
      highCount: res.data.highCount,
      mediumCount: res.data.mediumCount,
      lowCount: res.data.lowCount,
    }
  } catch (error) {
    console.error('Failed to load alert list:', error)
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

const handleViewDetail = async (alert: AlertData) => {
  selectedAlert.value = alert
  alertDetailVisible.value = true
  detailLoading.value = true

  try {
    const res = await getAlertDetail({ id: alert.id })
    handleRecords.value = res.data.handleRecords
    suggestions.value = res.data.suggestions
  } catch (error) {
    console.error('Failed to load alert detail:', error)
  } finally {
    detailLoading.value = false
  }
}

const getLevelTagType = (level: string) => {
  switch (level) {
    case 'high':
      return 'danger'
    case 'medium':
      return 'warning'
    case 'low':
      return 'success'
    default:
      return ''
  }
}

const getLevelText = (level: string) => {
  switch (level) {
    case 'high':
      return '高级'
    case 'medium':
      return '中级'
    case 'low':
      return '低级'
    default:
      return level
  }
}

const getStatusTagType = (status: string) => {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'processing':
      return 'primary'
    case 'resolved':
      return 'success'
    default:
      return ''
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return '待处理'
    case 'processing':
      return '处理中'
    case 'resolved':
      return '已处理'
    default:
      return status
  }
}

const openHandleDialog = () => {
  handleForm.note = ''
  handleFormVisible.value = true
}

const confirmHandle = async () => {
  if (!selectedAlert.value) return

  try {
    await handleAlert({
      id: selectedAlert.value.id,
      status: 'processing',
      note: handleForm.note,
    })

    ElMessage.success('处理成功')
    handleFormVisible.value = false
    loadTableData()

    if (alertDetailVisible.value) {
      handleViewDetail(selectedAlert.value)
    }
  } catch (error) {
    console.error('Failed to handle alert:', error)
    ElMessage.error('处理失败')
  }
}

const handleBatchHandle = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请选择要处理的预警')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要批量处理选中的 ${selectedIds.value.length} 条预警吗？`,
      '批量处理',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await batchHandle({
      ids: selectedIds.value,
      note: '批量处理',
    })

    ElMessage.success('批量处理成功')
    selectedRows.value = []
    loadTableData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to batch handle alerts:', error)
      ElMessage.error('批量处理失败')
    }
  }
}

const handleBatchIgnore = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请选择要忽略的预警')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要批量忽略选中的 ${selectedIds.value.length} 条预警吗？`,
      '批量忽略',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await batchIgnore({
      ids: selectedIds.value,
      note: '批量忽略',
    })

    ElMessage.success('批量忽略成功')
    selectedRows.value = []
    loadTableData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to batch ignore alerts:', error)
      ElMessage.error('批量忽略失败')
    }
  }
}

const exportColumns = [
  {
    key: 'level',
    title: '预警等级',
    formatter: (value: string) => getLevelText(value),
  },
  { key: 'type', title: '预警类型' },
  { key: 'department', title: '涉及科室' },
  { key: 'description', title: '预警描述' },
  { key: 'value', title: '当前值' },
  { key: 'threshold', title: '预警阈值' },
  { key: 'time', title: '预警时间' },
  {
    key: 'status',
    title: '处理状态',
    formatter: (value: string) => getStatusText(value),
  },
]

const handleExport = () => {
  exportAll(alertList.value, exportColumns, `预警列表_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

const handleSelectionChange = (selection: AlertData[]) => {
  selectedRows.value = selection
}

const lineXData = ref<string[]>([])
const lineSeriesData = ref<{ name: string; data: number[]; color?: string }[]>([])

watchEffect(() => {
  if (trendData.value.length > 0) {
    lineXData.value = trendData.value.map((d) => d.date)
    lineSeriesData.value = [
      {
        name: '高级',
        data: trendData.value.map((d) => d.high),
        color: '#F44336',
      },
      {
        name: '中级',
        data: trendData.value.map((d) => d.medium),
        color: '#FF9800',
      },
      {
        name: '低级',
        data: trendData.value.map((d) => d.low),
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

    <div v-loading="loading" class="alert-content">
      <div v-if="statistics" class="metrics-grid">
        <MetricCard
          v-for="config in metricConfigs"
          :key="config.key"
          :label="config.label"
          :value="statistics[config.key as keyof typeof statistics] as number"
          :unit="config.unit"
          :color="config.color"
        />
      </div>

      <div class="charts-row">
        <div class="card-wrapper chart-card">
          <div class="card-title">
            <span>预警类型分布</span>
          </div>
          <PieChart
            v-if="typeData.length > 0"
            :data="typeData"
            height="280px"
          />
          <EmptyState v-else type="loading" />
        </div>

        <div class="card-wrapper chart-card">
          <div class="card-title">
            <span>预警趋势</span>
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
      </div>

      <div class="card-wrapper table-card">
        <div class="card-title">
          <span>预警列表</span>
          <div class="card-actions">
            <el-form :inline="true" size="small">
              <el-form-item label="等级">
                <el-select
                  v-model="filterForm.level"
                  placeholder="全部"
                  clearable
                  style="width: 100px"
                  @change="handleTableFilter"
                >
                  <el-option
                    v-for="item in levelOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="状态">
                <el-select
                  v-model="filterForm.status"
                  placeholder="全部"
                  clearable
                  style="width: 100px"
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
              <el-form-item label="类型">
                <el-select
                  v-model="filterForm.type"
                  placeholder="全部"
                  clearable
                  style="width: 130px"
                  @change="handleTableFilter"
                >
                  <el-option
                    v-for="item in typeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-form>
            <el-button
              v-if="hasPermission('handle:alert')"
              type="primary"
              size="small"
              :disabled="selectedIds.length === 0"
              @click="handleBatchHandle"
            >
              <el-icon><Check /></el-icon>
              批量处理
            </el-button>
            <el-button
              v-if="hasPermission('ignore:alert')"
              type="warning"
              size="small"
              :disabled="selectedIds.length === 0"
              @click="handleBatchIgnore"
            >
              <el-icon><Close /></el-icon>
              批量忽略
            </el-button>
            <el-button
              v-if="hasPermission('export:alert')"
              type="success"
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
          :data="alertList"
          stripe
          border
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="level" label="等级" min-width="80">
            <template #default="{ row }">
              <el-tag :type="getLevelTagType(row.level)" size="small">
                {{ getLevelText(row.level) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="预警类型" min-width="120" />
          <el-table-column prop="department" label="涉及科室" min-width="100" />
          <el-table-column prop="description" label="预警描述" min-width="200" show-overflow-tooltip />
          <el-table-column prop="value" label="当前值" min-width="100">
            <template #default="{ row }">
              <span class="text-danger">{{ row.value }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="threshold" label="预警阈值" min-width="100" />
          <el-table-column prop="time" label="预警时间" min-width="160">
            <template #default="{ row }">
              {{ formatDateTime(row.time) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" min-width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="180" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleViewDetail(row)">
                查看详情
              </el-button>
              <el-button
                v-if="row.status === 'pending' && hasPermission('handle:alert')"
                type="success"
                link
                size="small"
                @click="selectedAlert = row; openHandleDialog()"
              >
                处理
              </el-button>
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

    <DetailDrawer
      v-model="alertDetailVisible"
      title="预警详情"
      size="large"
    >
      <div v-loading="detailLoading" class="alert-detail">
        <div v-if="selectedAlert" class="detail-section">
          <div class="detail-item">
            <label>预警等级</label>
            <el-tag :type="getLevelTagType(selectedAlert.level)">
              {{ getLevelText(selectedAlert.level) }}
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
            <span>{{ formatDateTime(selectedAlert.time) }}</span>
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
            <el-tag :type="getStatusTagType(selectedAlert.status)">
              {{ getStatusText(selectedAlert.status) }}
            </el-tag>
          </div>
        </div>

        <div class="detail-section">
          <h4>预警描述</h4>
          <p>{{ selectedAlert?.description }}</p>
        </div>

        <div class="detail-section">
          <h4>处理建议</h4>
          <ul>
            <li v-for="(suggestion, index) in suggestions" :key="index">
              {{ suggestion }}
            </li>
          </ul>
        </div>

        <div class="detail-section">
          <h4>处理记录</h4>
          <div v-if="handleRecords.length > 0" class="record-list">
            <div v-for="record in handleRecords" :key="record.id" class="record-item">
              <div class="record-header">
                <span class="record-action">{{ record.action }}</span>
                <span class="record-time">{{ formatDateTime(record.handleTime) }}</span>
              </div>
              <div class="record-content">
                <span class="record-handler">处理人：{{ record.handler }}</span>
                <p v-if="record.note" class="record-note">{{ record.note }}</p>
              </div>
            </div>
          </div>
          <EmptyState v-else type="empty" description="暂无处理记录" />
        </div>
      </div>
      <template #actions>
        <el-button
          v-if="selectedAlert?.status === 'pending' && hasPermission('handle:alert')"
          type="primary"
          @click="openHandleDialog"
        >
          开始处理
        </el-button>
      </template>
    </DetailDrawer>

    <el-dialog
      v-model="handleFormVisible"
      title="处理预警"
      width="500px"
    >
      <el-form :model="handleForm" label-width="80px">
        <el-form-item label="处理备注">
          <el-input
            v-model="handleForm.note"
            type="textarea"
            :rows="4"
            placeholder="请输入处理备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleFormVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmHandle">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.alert-content {
  min-height: calc(100vh - var(--header-height) - 120px);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
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

.record-list {
  border-left: 2px solid var(--color-border);
  padding-left: var(--spacing-lg);
}

.record-item {
  margin-bottom: var(--spacing-lg);
  position: relative;
}

.record-item::before {
  content: '';
  position: absolute;
  left: -26px;
  top: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-primary);
}

.record-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xs);
}

.record-action {
  font-weight: 600;
  color: var(--color-primary);
}

.record-time {
  font-size: var(--font-size-xs);
  color: var(--color-text-placeholder);
}

.record-content {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.record-handler {
  display: block;
  margin-bottom: var(--spacing-xs);
}

.record-note {
  background: var(--color-bg-tertiary);
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  margin: 0;
}

@media (max-width: 1400px) {
  .metrics-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .charts-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
