<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useFilterStore } from '@/stores'
import {
  getReportList,
  getReportHistory,
  exportReport,
  toggleFavorite,
  type ReportHistoryItem,
} from '@/api/report'
import { usePermission, useExport } from '@/hooks'
import { formatDateTime, formatNumber, formatMoney, formatPercent } from '@/utils'
import { DEPARTMENTS } from '@/types'
import type { ReportData } from '@/types'
import FilterBar from '@/components/common/FilterBar.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const filterStore = useFilterStore()
const { hasPermission } = usePermission()
const { exporting } = useExport()

const loading = ref(false)
const tableLoading = ref(false)
const historyLoading = ref(false)
const activeTab = ref('preview')
const reportList = ref<ReportData[]>([])
const reportTotal = ref(0)
const historyList = ref<ReportHistoryItem[]>([])
const historyTotal = ref(0)

const reportType = ref('daily')
const reportForm = reactive({
  period: 'week',
  department: 'all',
  metrics: [] as string[],
  page: 1,
  pageSize: 10,
})

const historyPage = reactive({
  page: 1,
  pageSize: 10,
})

const reportTypeOptions = [
  { value: 'daily', label: '运营日报', icon: 'Document' },
  { value: 'monthly', label: '科室月报', icon: 'Calendar' },
  { value: 'performance', label: '医生绩效', icon: 'User' },
  { value: 'finance', label: '财务报表', icon: 'Money' },
  { value: 'bed', label: '床位报表', icon: 'Bed' },
]

const periodOptions = [
  { value: 'day', label: '日报' },
  { value: 'week', label: '周报' },
  { value: 'month', label: '月报' },
  { value: 'quarter', label: '季报' },
  { value: 'year', label: '年报' },
]

const metricOptions = [
  { value: 'outpatientVolume', label: '门诊量' },
  { value: 'inpatientCount', label: '住院人数' },
  { value: 'income', label: '收入' },
  { value: 'drugRatio', label: '药占比' },
  { value: 'bedOccupancyRate', label: '床位使用率' },
  { value: 'avgWaitingTime', label: '平均候诊时间' },
]

const exportFormat = ref('xlsx')
const exportLoading = ref(false)

const loadReportData = async () => {
  tableLoading.value = true
  try {
    const res = await getReportList({
      type: reportType.value,
      department: reportForm.department === 'all' ? undefined : reportForm.department,
      startDate: filterStore.filterParams.startDate,
      endDate: filterStore.filterParams.endDate,
      period: reportForm.period,
      metrics: reportForm.metrics.length > 0 ? reportForm.metrics : undefined,
      page: reportForm.page,
      pageSize: reportForm.pageSize,
    })

    reportList.value = res.data.list
    reportTotal.value = res.data.total
  } catch (error) {
    console.error('Failed to load report data:', error)
  } finally {
    tableLoading.value = false
  }
}

const loadHistoryData = async () => {
  historyLoading.value = true
  try {
    const res = await getReportHistory({
      page: historyPage.page,
      pageSize: historyPage.pageSize,
    })

    historyList.value = res.data.list
    historyTotal.value = res.data.total
  } catch (error) {
    console.error('Failed to load report history:', error)
  } finally {
    historyLoading.value = false
  }
}

const loadData = async () => {
  loading.value = true
  try {
    await loadReportData()
    await loadHistoryData()
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  reportForm.page = 1
  loadReportData()
}

const handleReportTypeChange = () => {
  reportForm.page = 1
  loadReportData()
}

const handleQuery = () => {
  reportForm.page = 1
  loadReportData()
}

const handlePageChange = (page: number) => {
  reportForm.page = page
  loadReportData()
}

const handleSizeChange = (size: number) => {
  reportForm.pageSize = size
  reportForm.page = 1
  loadReportData()
}

const handleHistoryPageChange = (page: number) => {
  historyPage.page = page
  loadHistoryData()
}

const handleHistorySizeChange = (size: number) => {
  historyPage.pageSize = size
  historyPage.page = 1
  loadHistoryData()
}

const handleTabChange = (tab: string) => {
  activeTab.value = tab
  if (tab === 'history') {
    loadHistoryData()
  }
}

const handleExport = async () => {
  if (!hasPermission('export:report')) {
    ElMessage.warning('暂无导出权限')
    return
  }

  exportLoading.value = true
  try {
    const res = await exportReport({
      format: exportFormat.value,
      type: reportType.value,
      department: reportForm.department === 'all' ? undefined : reportForm.department,
      startDate: filterStore.filterParams.startDate,
      endDate: filterStore.filterParams.endDate,
      period: reportForm.period,
      metrics: reportForm.metrics.length > 0 ? reportForm.metrics : undefined,
    })

    ElMessage.success(`导出成功，共 ${res.data.totalCount} 条记录`)

    if (res.data.downloadUrl) {
      const link = document.createElement('a')
      link.href = res.data.downloadUrl
      link.download = res.data.filename
      link.click()
    }

    loadHistoryData()
  } catch (error) {
    console.error('Failed to export report:', error)
    ElMessage.error('导出失败')
  } finally {
    exportLoading.value = false
  }
}

const handleCreateReport = async () => {
  if (!hasPermission('create:report')) {
    ElMessage.warning('暂无创建报表权限')
    return
  }

  try {
    await ElMessageBox.confirm(
      '确定要生成该报表吗？生成后可在历史记录中查看。',
      '生成报表',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info',
      }
    )

    ElMessage.success('报表生成任务已提交，请在历史记录中查看')
    loadHistoryData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to create report:', error)
    }
  }
}

const handleToggleFavorite = async (item: ReportHistoryItem) => {
  try {
    await toggleFavorite({
      id: item.id,
      isFavorite: !item.isFavorite,
    })

    item.isFavorite = !item.isFavorite
    ElMessage.success(item.isFavorite ? '已收藏' : '已取消收藏')
  } catch (error) {
    console.error('Failed to toggle favorite:', error)
    ElMessage.error('操作失败')
  }
}

const getReportTypeName = (type: string) => {
  const option = reportTypeOptions.find((o) => o.value === type)
  return option?.label || type
}

const getStatusTagType = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'generating':
      return 'warning'
    case 'failed':
      return 'danger'
    default:
      return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return '已完成'
    case 'generating':
      return '生成中'
    case 'failed':
      return '失败'
    default:
      return status
  }
}

const formatValue = (key: string, value: number) => {
  if (key === 'income') {
    return formatMoney(value)
  } else if (key === 'drugRatio' || key === 'bedOccupancyRate') {
    return formatPercent(value)
  } else if (key === 'avgWaitingTime') {
    return `${value}分钟`
  } else {
    return formatNumber(value)
  }
}

const visibleColumns = computed(() => {
  if (reportForm.metrics.length > 0) {
    return ['department', 'date', ...reportForm.metrics]
  }
  return ['department', 'date', 'outpatientVolume', 'inpatientCount', 'income', 'drugRatio', 'bedOccupancyRate', 'avgWaitingTime']
})

const columnLabels: Record<string, string> = {
  department: '科室',
  date: '日期',
  outpatientVolume: '门诊量',
  inpatientCount: '住院人数',
  income: '收入',
  drugRatio: '药占比',
  bedOccupancyRate: '床位使用率',
  avgWaitingTime: '平均候诊时间',
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="page-container">
    <FilterBar @change="handleFilterChange" />

    <div v-loading="loading" class="report-content">
      <div class="card-wrapper">
        <div class="report-type-tabs">
          <div
            v-for="type in reportTypeOptions"
            :key="type.value"
            class="type-tab"
            :class="{ active: reportType === type.value }"
            @click="reportType = type.value; handleReportTypeChange()"
          >
            <el-icon :size="20">
              <component :is="type.icon" />
            </el-icon>
            <span>{{ type.label }}</span>
          </div>
        </div>

        <el-form :inline="true" class="filter-form" size="default">
          <el-form-item label="报表周期">
            <el-select v-model="reportForm.period" style="width: 120px">
              <el-option
                v-for="item in periodOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="科室范围">
            <el-select v-model="reportForm.department" style="width: 150px">
              <el-option
                v-for="dept in DEPARTMENTS"
                :key="dept.id"
                :label="dept.name"
                :value="dept.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="指标类型">
            <el-select
              v-model="reportForm.metrics"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="全部指标"
              style="width: 300px"
            >
              <el-option
                v-for="item in metricOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">
              <el-icon><Search /></el-icon>
              查询
            </el-button>
            <el-button
              v-if="hasPermission('create:report')"
              type="success"
              @click="handleCreateReport"
            >
              <el-icon><Plus /></el-icon>
              生成报表
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="card-wrapper">
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          <el-tab-pane label="报表预览" name="preview">
            <div class="tab-actions">
              <div class="export-section">
                <span class="export-label">导出格式：</span>
                <el-radio-group v-model="exportFormat" size="small">
                  <el-radio-button value="xlsx">Excel</el-radio-button>
                  <el-radio-button value="pdf">PDF</el-radio-button>
                </el-radio-group>
                <el-button
                  v-if="hasPermission('export:report')"
                  type="primary"
                  size="small"
                  :loading="exportLoading"
                  @click="handleExport"
                >
                  <el-icon><Download /></el-icon>
                  导出报表
                </el-button>
              </div>
            </div>

            <el-table
              v-loading="tableLoading"
              :data="reportList"
              stripe
              border
              style="width: 100%"
            >
              <el-table-column
                v-for="col in visibleColumns"
                :key="col"
                :prop="col"
                :label="columnLabels[col]"
                min-width="120"
              >
                <template #default="{ row }">
                  <span v-if="col === 'date'">{{ row.date }}</span>
                  <span v-else-if="col === 'department'">{{ row.department }}</span>
                  <span v-else>{{ formatValue(col, row[col as keyof ReportData] as number) }}</span>
                </template>
              </el-table-column>
            </el-table>

            <div class="pagination-wrapper">
              <el-pagination
                v-model:current-page="reportForm.page"
                v-model:page-size="reportForm.pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="reportTotal"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange"
                @current-change="handlePageChange"
              />
            </div>
          </el-tab-pane>

          <el-tab-pane label="历史记录" name="history">
            <el-table
              v-loading="historyLoading"
              :data="historyList"
              stripe
              border
              style="width: 100%"
            >
              <el-table-column prop="name" label="报表名称" min-width="150" />
              <el-table-column prop="type" label="报表类型" min-width="120">
                <template #default="{ row }">
                  {{ getReportTypeName(row.type) }}
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="创建时间" min-width="160">
                <template #default="{ row }">
                  {{ formatDateTime(row.createTime) }}
                </template>
              </el-table-column>
              <el-table-column prop="creator" label="创建人" min-width="100" />
              <el-table-column prop="status" label="状态" min-width="100">
                <template #default="{ row }">
                  <el-tag :type="getStatusTagType(row.status)" size="small">
                    {{ getStatusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" min-width="200" fixed="right">
                <template #default="{ row }">
                  <el-button
                    type="primary"
                    link
                    size="small"
                    :disabled="row.status !== 'completed'"
                  >
                    下载
                  </el-button>
                  <el-button
                    :type="row.isFavorite ? 'warning' : 'primary'"
                    link
                    size="small"
                    @click="handleToggleFavorite(row)"
                  >
                    <el-icon>
                      <Star v-if="row.isFavorite" :fill="'#F59E0B'" />
                      <Star v-else />
                    </el-icon>
                    {{ row.isFavorite ? '取消收藏' : '收藏' }}
                  </el-button>
                  <el-button type="primary" link size="small">
                    查看详情
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="pagination-wrapper">
              <el-pagination
                v-model:current-page="historyPage.page"
                v-model:page-size="historyPage.pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="historyTotal"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleHistorySizeChange"
                @current-change="handleHistoryPageChange"
              />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<style scoped>
.report-content {
  min-height: calc(100vh - var(--header-height) - 120px);
}

.card-wrapper {
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.report-type-tabs {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.type-tab {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-bg-tertiary);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  color: var(--color-text-secondary);
  border: 2px solid transparent;
}

.type-tab:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-primary);
}

.type-tab.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  margin: 0;
}

.tab-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--spacing-md);
}

.export-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.export-label {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--spacing-md);
}

@media (max-width: 768px) {
  .report-type-tabs {
    flex-wrap: wrap;
  }

  .type-tab {
    flex: 1;
    min-width: calc(50% - var(--spacing-md));
    justify-content: center;
  }

  .export-section {
    flex-wrap: wrap;
    justify-content: flex-start;
  }
}
</style>
