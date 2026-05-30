<script setup lang="ts">
import { ref, onMounted, watchEffect } from 'vue'
import { useFilterStore } from '@/stores'
import { getDepartmentList, getDepartmentRank, getDepartmentDetail } from '@/api'
import { useExport, usePermission } from '@/hooks'
import type { DepartmentData } from '@/types'
import { formatNumber, formatPercent, formatMoney } from '@/utils'
import FilterBar from '@/components/common/FilterBar.vue'
import BarChart from '@/components/charts/BarChart.vue'
import PieChart from '@/components/charts/PieChart.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import DetailDrawer from '@/components/common/DetailDrawer.vue'

const filterStore = useFilterStore()
const { hasPermission, vPermission } = usePermission()
const { exportSelected, exportAll, exporting } = useExport()

const loading = ref(false)
const departmentList = ref<DepartmentData[]>([])
const rankData = ref<DepartmentData[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const searchKeyword = ref('')
const selectedIds = ref<string[]>([])
const detailVisible = ref(false)
const selectedDepartment = ref<DepartmentData | null>(null)
const detailLoading = ref(false)

const barXData = ref<string[]>([])
const barSeriesData = ref<{ name: string; data: number[]; color?: string }[]>([])
const pieData = ref<{ name: string; value: number }[]>([])

const tableColumns = [
  { key: 'name', title: '科室名称' },
  { key: 'outpatientVolume', title: '门诊量', formatter: (v: number) => formatNumber(v) },
  { key: 'inpatientCount', title: '住院量', formatter: (v: number) => formatNumber(v) },
  { key: 'bedOccupancyRate', title: '床位使用率', formatter: (v: number) => formatPercent(v) },
  { key: 'income', title: '收入(元)', formatter: (v: number) => formatMoney(v) },
  { key: 'drugRatio', title: '药占比', formatter: (v: number) => formatPercent(v) },
]

const exportColumns = [
  { key: 'name', title: '科室名称' },
  { key: 'outpatientVolume', title: '门诊量', formatter: (v: number) => formatNumber(v) },
  { key: 'inpatientCount', title: '住院量', formatter: (v: number) => formatNumber(v) },
  { key: 'bedOccupancyRate', title: '床位使用率', formatter: (v: number) => formatPercent(v) },
  { key: 'income', title: '收入', formatter: (v: number) => formatMoney(v) },
  { key: 'drugRatio', title: '药占比', formatter: (v: number) => formatPercent(v) },
  { key: 'avgWaitingTime', title: '平均候诊时间(分钟)', formatter: (v: number) => v + '分钟' },
  { key: 'satisfaction', title: '满意度', formatter: (v: number) => formatPercent(v) },
]

const loadData = async () => {
  loading.value = true
  try {
    const [listRes, rankRes] = await Promise.all([
      getDepartmentList({
        dateRange: filterStore.filterParams.dateRange,
        department: filterStore.filterParams.department,
        page: page.value,
        pageSize: pageSize.value,
      }),
      getDepartmentRank(),
    ])

    departmentList.value = listRes.data.list
    total.value = listRes.data.total
    rankData.value = rankRes.data
  } catch (error) {
    console.error('Failed to load department data:', error)
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  page.value = 1
  loadData()
}

const handleSearch = () => {
  page.value = 1
  loadData()
}

const handlePageChange = (val: number) => {
  page.value = val
  loadData()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  page.value = 1
  loadData()
}

const handleSelectionChange = (val: DepartmentData[]) => {
  selectedIds.value = val.map((item) => item.id)
}

const handleBarClick = (params: any) => {
  const dept = rankData.value.find((d) => d.name === params.name)
  if (dept) {
    handleViewDetail(dept)
  }
}

const handlePieClick = (params: any) => {
  const dept = rankData.value.find((d) => d.name === params.name)
  if (dept) {
    handleViewDetail(dept)
  }
}

const handleViewDetail = async (dept: DepartmentData) => {
  if (!hasPermission('view:department_detail')) return

  detailVisible.value = true
  detailLoading.value = true
  try {
    const res = await getDepartmentDetail({ id: dept.id })
    selectedDepartment.value = res.data
  } catch (error) {
    console.error('Failed to load department detail:', error)
  } finally {
    detailLoading.value = false
  }
}

const handleExportSelected = () => {
  exportSelected(
    selectedIds.value,
    departmentList.value,
    exportColumns,
    `科室数据_${new Date().toLocaleDateString()}.xlsx`
  )
}

const handleExportAll = () => {
  exportAll(
    departmentList.value,
    exportColumns,
    `全部科室数据_${new Date().toLocaleDateString()}.xlsx`
  )
}

const filteredList = () => {
  if (!searchKeyword.value) return departmentList.value
  return departmentList.value.filter((item) =>
    item.name.includes(searchKeyword.value)
  )
}

watchEffect(() => {
  if (rankData.value.length > 0) {
    const sortedData = [...rankData.value].sort((a, b) => b.income - a.income)
    barXData.value = sortedData.map((d) => d.name)
    barSeriesData.value = [
      {
        name: '科室收入',
        data: sortedData.map((d) => d.income),
        color: '#1E88E5',
      },
    ]

    pieData.value = sortedData.slice(0, 8).map((d) => ({
      name: d.name,
      value: d.income,
    }))
  }
})

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="page-container">
    <FilterBar @change="handleFilterChange" />

    <div v-loading="loading" class="department-content">
      <div class="charts-row">
        <div class="card-wrapper chart-card">
          <div class="card-title">
            <span>科室收入排名</span>
            <span class="card-subtitle">点击查看详情</span>
          </div>
          <BarChart
            v-if="barXData.length > 0"
            :x-data="barXData"
            :series-data="barSeriesData"
            height="280px"
            @click="handleBarClick"
          />
          <EmptyState v-else type="loading" />
        </div>

        <div class="card-wrapper chart-card">
          <div class="card-title">
            <span>科室收入占比</span>
            <span class="card-subtitle">点击查看详情</span>
          </div>
          <PieChart
            v-if="pieData.length > 0"
            :data="pieData"
            height="280px"
            @click="handlePieClick"
          />
          <EmptyState v-else type="loading" />
        </div>
      </div>

      <div class="card-wrapper table-card">
        <div class="table-header">
          <div class="table-title">
            <h3>科室列表</h3>
            <span class="data-count">共 {{ total }} 条数据</span>
          </div>
          <div class="table-actions">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索科室名称"
              clearable
              style="width: 200px"
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button
              v-permission="'export:department'"
              type="primary"
              :disabled="selectedIds.length === 0"
              :loading="exporting"
              @click="handleExportSelected"
            >
              <el-icon><Download /></el-icon>
              导出选中
            </el-button>
            <el-button
              v-permission="'export:department'"
              :loading="exporting"
              @click="handleExportAll"
            >
              <el-icon><Download /></el-icon>
              导出全部
            </el-button>
          </div>
        </div>

        <div v-if="filteredList().length > 0" class="table-content">
          <el-table
            :data="filteredList()"
            border
            stripe
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="name" label="科室名称" min-width="120" />
            <el-table-column prop="outpatientVolume" label="门诊量" width="100">
              <template #default="{ row }">
                {{ formatNumber(row.outpatientVolume) }}
              </template>
            </el-table-column>
            <el-table-column prop="inpatientCount" label="住院量" width="100">
              <template #default="{ row }">
                {{ formatNumber(row.inpatientCount) }}
              </template>
            </el-table-column>
            <el-table-column prop="bedOccupancyRate" label="床位使用率" width="110">
              <template #default="{ row }">
                <el-tag
                  :type="row.bedOccupancyRate >= 90 ? 'success' : row.bedOccupancyRate >= 70 ? 'warning' : 'info'"
                  size="small"
                >
                  {{ formatPercent(row.bedOccupancyRate) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="income" label="收入" width="130">
              <template #default="{ row }">
                <span class="text-primary font-medium">{{ formatMoney(row.income) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="drugRatio" label="药占比" width="100">
              <template #default="{ row }">
                <el-tag
                  :type="row.drugRatio > 30 ? 'danger' : row.drugRatio > 20 ? 'warning' : 'success'"
                  size="small"
                >
                  {{ formatPercent(row.drugRatio) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-permission="'view:department_detail'"
                  type="primary"
                  link
                  @click="handleViewDetail(row)"
                >
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="page"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </div>

        <EmptyState
          v-else
          type="empty"
          description="暂无科室数据"
        >
          <template #action>
            <el-button type="primary" @click="loadData">刷新</el-button>
          </template>
        </EmptyState>
      </div>
    </div>

    <DetailDrawer
      v-model="detailVisible"
      title="科室详情"
      size="default"
    >
      <div v-loading="detailLoading" class="department-detail">
        <div v-if="selectedDepartment" class="detail-content">
          <div class="detail-header">
            <h3>{{ selectedDepartment.name }}</h3>
            <el-tag size="large" type="primary">
              排名第 {{ selectedDepartment.rank }} 位
            </el-tag>
          </div>

          <div class="detail-metrics">
            <div class="metric-item">
              <span class="metric-label">门诊量</span>
              <span class="metric-value">{{ formatNumber(selectedDepartment.outpatientVolume) }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">住院量</span>
              <span class="metric-value">{{ formatNumber(selectedDepartment.inpatientCount) }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">床位使用率</span>
              <span class="metric-value text-success">{{ formatPercent(selectedDepartment.bedOccupancyRate) }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">收入</span>
              <span class="metric-value text-primary">{{ formatMoney(selectedDepartment.income) }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">药占比</span>
              <span class="metric-value" :class="selectedDepartment.drugRatio > 30 ? 'text-danger' : 'text-success'">
                {{ formatPercent(selectedDepartment.drugRatio) }}
              </span>
            </div>
            <div class="metric-item">
              <span class="metric-label">满意度</span>
              <span class="metric-value text-success">{{ formatPercent(selectedDepartment.satisfaction) }}</span>
            </div>
          </div>

          <div class="detail-section">
            <h4>科室概况</h4>
            <p>
              {{ selectedDepartment.name }}是医院重点科室之一，拥有先进的医疗设备和专业的医疗团队。
              本科室在{{ filterStore.filterParams.dateRange === 'week' ? '近一周' : filterStore.filterParams.dateRange === 'month' ? '近一月' : '本周期' }}内，
              门诊量达到{{ formatNumber(selectedDepartment.outpatientVolume) }}人次，
              住院量{{ formatNumber(selectedDepartment.inpatientCount) }}人次，
              床位使用率{{ formatPercent(selectedDepartment.bedOccupancyRate) }}，
              总收入{{ formatMoney(selectedDepartment.income) }}，
              药占比{{ formatPercent(selectedDepartment.drugRatio) }}，
              患者满意度{{ formatPercent(selectedDepartment.satisfaction) }}。
            </p>
          </div>

          <div class="detail-section">
            <h4>核心指标分析</h4>
            <div class="analysis-list">
              <div class="analysis-item">
                <span class="analysis-label">床位使用率</span>
                <div class="analysis-bar">
                  <div
                    class="analysis-fill"
                    :style="{ width: Math.min(selectedDepartment.bedOccupancyRate, 100) + '%' }"
                    :class="{
                      'bg-success': selectedDepartment.bedOccupancyRate >= 85,
                      'bg-warning': selectedDepartment.bedOccupancyRate >= 60 && selectedDepartment.bedOccupancyRate < 85,
                      'bg-info': selectedDepartment.bedOccupancyRate < 60
                    }"
                  ></div>
                </div>
                <span class="analysis-value">{{ formatPercent(selectedDepartment.bedOccupancyRate) }}</span>
              </div>
              <div class="analysis-item">
                <span class="analysis-label">药占比</span>
                <div class="analysis-bar">
                  <div
                    class="analysis-fill"
                    :style="{ width: Math.min(selectedDepartment.drugRatio, 100) + '%' }"
                    :class="{
                      'bg-success': selectedDepartment.drugRatio <= 25,
                      'bg-warning': selectedDepartment.drugRatio > 25 && selectedDepartment.drugRatio <= 35,
                      'bg-danger': selectedDepartment.drugRatio > 35
                    }"
                  ></div>
                </div>
                <span class="analysis-value">{{ formatPercent(selectedDepartment.drugRatio) }}</span>
              </div>
              <div class="analysis-item">
                <span class="analysis-label">满意度</span>
                <div class="analysis-bar">
                  <div
                    class="analysis-fill bg-success"
                    :style="{ width: Math.min(selectedDepartment.satisfaction, 100) + '%' }"
                  ></div>
                </div>
                <span class="analysis-value">{{ formatPercent(selectedDepartment.satisfaction) }}</span>
              </div>
            </div>
          </div>
        </div>
        <EmptyState v-else type="loading" />
      </div>
    </DetailDrawer>
  </div>
</template>

<style scoped>
.department-content {
  min-height: calc(100vh - var(--header-height) - 120px);
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

.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text-primary);
}

.card-subtitle {
  font-size: var(--font-size-xs);
  font-weight: normal;
  color: var(--color-text-placeholder);
}

.table-card {
  min-height: 500px;
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.table-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.table-title h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
}

.data-count {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.table-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.table-content {
  width: 100%;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding-top: var(--spacing-md);
}

.department-detail {
  padding: var(--spacing-md);
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.detail-header h3 {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text-primary);
}

.detail-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background: var(--color-bg-tertiary);
  border-radius: var(--border-radius-md);
}

.metric-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.metric-value {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text-primary);
}

.detail-section {
  margin-bottom: var(--spacing-lg);
}

.detail-section h4 {
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text-primary);
}

.detail-section p {
  line-height: 1.8;
  color: var(--color-text-secondary);
}

.analysis-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.analysis-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.analysis-label {
  width: 80px;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.analysis-bar {
  flex: 1;
  height: 8px;
  background: var(--color-bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.analysis-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.analysis-value {
  width: 80px;
  text-align: right;
  font-size: var(--font-size-sm);
  font-weight: 500;
  flex-shrink: 0;
}

.bg-success {
  background: var(--color-success);
}

.bg-warning {
  background: var(--color-warning);
}

.bg-info {
  background: var(--color-info);
}

.bg-danger {
  background: var(--color-danger);
}

@media (max-width: 1400px) {
  .charts-row {
    grid-template-columns: 1fr;
  }

  .detail-metrics {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
