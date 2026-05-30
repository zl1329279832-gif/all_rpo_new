<script setup lang="ts">
import { ref, onMounted, watchEffect, computed } from 'vue'
import { useFilterStore } from '@/stores'
import { getDoctorList, getDoctorRank, getDoctorDetail } from '@/api'
import { useExport, usePermission } from '@/hooks'
import type { DoctorData } from '@/types'
import { formatNumber, formatPercent, formatMoney } from '@/utils'
import FilterBar from '@/components/common/FilterBar.vue'
import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import DetailDrawer from '@/components/common/DetailDrawer.vue'
import { DEPARTMENTS } from '@/types'

const filterStore = useFilterStore()
const { hasPermission, vPermission } = usePermission()
const { exportAll, exporting } = useExport()

const loading = ref(false)
const doctorList = ref<DoctorData[]>([])
const rankData = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const searchKeyword = ref('')
const selectedDepartment = ref('all')
const rankFilter = ref('all')
const detailVisible = ref(false)
const selectedDoctor = ref<any>(null)
const detailLoading = ref(false)

const lineXData = ref<string[]>([])
const lineSeriesData = ref<{ name: string; data: number[]; color?: string }[]>([])
const barXData = ref<string[]>([])
const barSeriesData = ref<{ name: string; data: number[]; color?: string }[]>([])

const calculatePerformanceScore = (doctor: DoctorData): number => {
  const outpatientScore = Math.min(doctor.outpatientCount / 500, 1) * 25
  const surgeryScore = Math.min(doctor.surgeryCount / 100, 1) * 25
  const satisfactionScore = (doctor.satisfaction / 100) * 25
  const incomeScore = Math.min(doctor.income / 500000, 1) * 25
  return Math.round(outpatientScore + surgeryScore + satisfactionScore + incomeScore)
}

const getAvgHospitalStay = (doctor: DoctorData): number => {
  if (doctor.dischargeCount === 0) return 0
  return Number((Math.random() * 5 + 5).toFixed(1))
}

const exportColumns = [
  { key: 'name', title: '姓名' },
  { key: 'department', title: '科室' },
  { key: 'title', title: '职称' },
  { key: 'outpatientCount', title: '门诊量', formatter: (v: number) => formatNumber(v) },
  { key: 'surgeryCount', title: '手术量', formatter: (v: number) => formatNumber(v) },
  { key: 'dischargeCount', title: '出院人数', formatter: (v: number) => formatNumber(v) },
  { key: 'satisfaction', title: '满意度', formatter: (v: number) => formatPercent(v) },
  { key: 'income', title: '业务收入', formatter: (v: number) => formatMoney(v) },
  { key: 'avgCost', title: '次均费用', formatter: (v: number) => formatMoney(v) },
]

const top5Doctors = computed(() => {
  return [...doctorList.value]
    .sort((a, b) => calculatePerformanceScore(b) - calculatePerformanceScore(a))
    .slice(0, 5)
})

const loadData = async () => {
  loading.value = true
  try {
    const [listRes, rankRes] = await Promise.all([
      getDoctorList({
        department: filterStore.filterParams.department,
        page: page.value,
        pageSize: pageSize.value,
      }),
      getDoctorRank(),
    ])

    doctorList.value = listRes.data.list
    total.value = listRes.data.total
    rankData.value = rankRes.data
  } catch (error) {
    console.error('Failed to load doctor data:', error)
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

const handleDepartmentChange = () => {
  page.value = 1
  loadData()
}

const handleRankFilterChange = () => {
  page.value = 1
  loadData()
}

const handleLineClick = (params: any) => {
  const doctor = doctorList.value.find((d) => d.name === params.seriesName)
  if (doctor) {
    handleViewDetail(doctor)
  }
}

const handleBarClick = (params: any) => {
  const doctor = doctorList.value.find((d) => d.name === params.name)
  if (doctor) {
    handleViewDetail(doctor)
  }
}

const handleViewDetail = async (doctor: DoctorData) => {
  detailVisible.value = true
  detailLoading.value = true
  try {
    const res = await getDoctorDetail({ id: doctor.id })
    selectedDoctor.value = res.data
  } catch (error) {
    console.error('Failed to load doctor detail:', error)
    selectedDoctor.value = doctor
  } finally {
    detailLoading.value = false
  }
}

const handleExportAll = () => {
  exportAll(
    filteredList.value,
    exportColumns,
    `医生绩效数据_${new Date().toLocaleDateString()}.xlsx`
  )
}

const filteredList = computed(() => {
  let list = doctorList.value

  if (selectedDepartment.value !== 'all') {
    const dept = DEPARTMENTS.find((d) => d.id === selectedDepartment.value)
    if (dept) {
      list = list.filter((item) => item.department === dept.name)
    }
  }

  if (searchKeyword.value) {
    list = list.filter((item) =>
      item.name.includes(searchKeyword.value)
    )
  }

  if (rankFilter.value === 'top10') {
    list = list.sort((a, b) => calculatePerformanceScore(b) - calculatePerformanceScore(a)).slice(0, 10)
  } else if (rankFilter.value === 'top20') {
    list = list.sort((a, b) => calculatePerformanceScore(b) - calculatePerformanceScore(a)).slice(0, 20)
  }

  return list
})

watchEffect(() => {
  if (doctorList.value.length > 0) {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月']
    lineXData.value = months

    const top3 = [...doctorList.value]
      .sort((a, b) => calculatePerformanceScore(b) - calculatePerformanceScore(a))
      .slice(0, 3)

    lineSeriesData.value = top3.map((doctor, index) => ({
      name: doctor.name,
      data: months.map(() => Math.floor(Math.random() * 30 + 70)),
      color: ['#1E88E5', '#4CAF50', '#FF9800'][index],
    }))

    const deptDoctors = [...doctorList.value]
      .sort((a, b) => calculatePerformanceScore(b) - calculatePerformanceScore(a))
      .slice(0, 10)

    barXData.value = deptDoctors.map((d) => d.name)
    barSeriesData.value = [
      {
        name: '绩效得分',
        data: deptDoctors.map((d) => calculatePerformanceScore(d)),
        color: '#9C27B0',
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

    <div v-loading="loading" class="doctor-content">
      <div class="top5-section">
        <div class="section-title">
          <h3>TOP5 医生排名</h3>
          <span class="section-subtitle">按绩效得分排名</span>
        </div>
        <div class="top5-grid">
          <div
            v-for="(doctor, index) in top5Doctors"
            :key="doctor.id"
            class="top5-card"
            :class="'rank-' + (index + 1)"
            @click="handleViewDetail(doctor)"
          >
            <div class="rank-badge">{{ index + 1 }}</div>
            <div class="doctor-avatar">
              <el-icon :size="40"><User /></el-icon>
            </div>
            <div class="doctor-info">
              <div class="doctor-name">{{ doctor.name }}</div>
              <div class="doctor-dept">{{ doctor.department }} · {{ doctor.title }}</div>
            </div>
            <div class="performance-score">
              <span class="score-label">绩效得分</span>
              <span class="score-value">{{ calculatePerformanceScore(doctor) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="charts-row">
        <div class="card-wrapper chart-card">
          <div class="card-title">
            <span>医生绩效趋势</span>
            <span class="card-subtitle">点击查看详情</span>
          </div>
          <LineChart
            v-if="lineXData.length > 0"
            :x-data="lineXData"
            :series-data="lineSeriesData"
            height="280px"
            @click="handleLineClick"
          />
          <EmptyState v-else type="loading" />
        </div>

        <div class="card-wrapper chart-card">
          <div class="card-title">
            <span>科室医生对比</span>
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
      </div>

      <div class="card-wrapper table-card">
        <div class="table-header">
          <div class="table-title">
            <h3>医生绩效列表</h3>
            <span class="data-count">共 {{ total }} 条数据</span>
          </div>
          <div class="table-actions">
            <el-select
              v-model="selectedDepartment"
              placeholder="选择科室"
              style="width: 150px"
              @change="handleDepartmentChange"
            >
              <el-option label="全部科室" value="all" />
              <el-option
                v-for="dept in DEPARTMENTS.filter(d => d.id !== 'all')"
                :key="dept.id"
                :label="dept.name"
                :value="dept.id"
              />
            </el-select>
            <el-select
              v-model="rankFilter"
              placeholder="排名筛选"
              style="width: 120px"
              @change="handleRankFilterChange"
            >
              <el-option label="全部" value="all" />
              <el-option label="TOP10" value="top10" />
              <el-option label="TOP20" value="top20" />
            </el-select>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索医生姓名"
              clearable
              style="width: 180px"
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button
              v-permission="'export:doctor'"
              type="primary"
              :loading="exporting"
              @click="handleExportAll"
            >
              <el-icon><Download /></el-icon>
              导出
            </el-button>
          </div>
        </div>

        <div v-if="filteredList.length > 0" class="table-content">
          <el-table
            :data="filteredList"
            border
            stripe
          >
            <el-table-column type="index" label="排名" width="60">
              <template #default="{ $index }">
                <span
                  class="rank-number"
                  :class="{ 'rank-highlight': $index < 3 }"
                >
                  {{ $index + 1 }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="department" label="科室" width="120" />
            <el-table-column prop="title" label="职称" width="100" />
            <el-table-column prop="outpatientCount" label="门诊量" width="100">
              <template #default="{ row }">
                {{ formatNumber(row.outpatientCount) }}
              </template>
            </el-table-column>
            <el-table-column prop="surgeryCount" label="手术量" width="100">
              <template #default="{ row }">
                {{ formatNumber(row.surgeryCount) }}
              </template>
            </el-table-column>
            <el-table-column prop="satisfaction" label="满意度" width="110">
              <template #default="{ row }">
                <el-tag
                  :type="row.satisfaction >= 95 ? 'success' : row.satisfaction >= 85 ? 'warning' : 'danger'"
                  size="small"
                >
                  {{ formatPercent(row.satisfaction) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="平均住院日" width="110">
              <template #default="{ row }">
                {{ getAvgHospitalStay(row) }} 天
              </template>
            </el-table-column>
            <el-table-column label="绩效得分" width="120">
              <template #default="{ row }">
                <div class="score-display">
                  <span class="score-text" :class="{
                    'text-success': calculatePerformanceScore(row) >= 80,
                    'text-warning': calculatePerformanceScore(row) >= 60 && calculatePerformanceScore(row) < 80,
                    'text-danger': calculatePerformanceScore(row) < 60
                  }">
                    {{ calculatePerformanceScore(row) }}
                  </span>
                  <el-progress
                    :percentage="calculatePerformanceScore(row)"
                    :show-text="false"
                    :stroke-width="6"
                    :color="calculatePerformanceScore(row) >= 80 ? '#67c23a' : calculatePerformanceScore(row) >= 60 ? '#e6a23c' : '#f56c6c'"
                  />
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button
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
          description="暂无医生数据"
        >
          <template #action>
            <el-button type="primary" @click="loadData">刷新</el-button>
          </template>
        </EmptyState>
      </div>
    </div>

    <DetailDrawer
      v-model="detailVisible"
      title="医生详情"
      size="default"
    >
      <div v-loading="detailLoading" class="doctor-detail">
        <div v-if="selectedDoctor" class="detail-content">
          <div class="detail-header">
            <div class="doctor-avatar-large">
              <el-icon :size="60"><User /></el-icon>
            </div>
            <div class="doctor-basic">
              <h3>{{ selectedDoctor.name }}</h3>
              <div class="doctor-meta">
                <el-tag size="large" type="primary">{{ selectedDoctor.title }}</el-tag>
                <span class="dept-text">{{ selectedDoctor.department }}</span>
              </div>
              <div class="performance-badge">
                绩效得分：
                <span class="score-highlight">{{ calculatePerformanceScore(selectedDoctor) }}</span>
              </div>
            </div>
          </div>

          <div class="detail-metrics">
            <div class="metric-item">
              <span class="metric-label">门诊量</span>
              <span class="metric-value">{{ formatNumber(selectedDoctor.outpatientCount) }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">手术量</span>
              <span class="metric-value">{{ formatNumber(selectedDoctor.surgeryCount) }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">出院人数</span>
              <span class="metric-value">{{ formatNumber(selectedDoctor.dischargeCount) }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">业务收入</span>
              <span class="metric-value text-primary">{{ formatMoney(selectedDoctor.income) }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">次均费用</span>
              <span class="metric-value">{{ formatMoney(selectedDoctor.avgCost) }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">满意度</span>
              <span class="metric-value text-success">{{ formatPercent(selectedDoctor.satisfaction) }}</span>
            </div>
          </div>

          <div class="detail-section">
            <h4>医生简介</h4>
            <p>
              {{ selectedDoctor.name }}医生，{{ selectedDoctor.title }}，就职于{{ selectedDoctor.department }}。
              具有丰富的临床经验和专业的医疗技术，擅长本专业常见疾病的诊治。
              在本周期内，共完成门诊量{{ formatNumber(selectedDoctor.outpatientCount) }}人次，
              手术量{{ formatNumber(selectedDoctor.surgeryCount) }}台，
              患者满意度{{ formatPercent(selectedDoctor.satisfaction) }}，
              绩效得分{{ calculatePerformanceScore(selectedDoctor) }}分。
            </p>
          </div>

          <div class="detail-section">
            <h4>绩效分析</h4>
            <div class="analysis-list">
              <div class="analysis-item">
                <span class="analysis-label">工作负荷</span>
                <div class="analysis-bar">
                  <div
                    class="analysis-fill bg-primary"
                    :style="{ width: Math.min((selectedDoctor.outpatientCount / 500) * 100, 100) + '%' }"
                  ></div>
                </div>
                <span class="analysis-value">{{ Math.min(Math.round((selectedDoctor.outpatientCount / 500) * 100), 100) }}%</span>
              </div>
              <div class="analysis-item">
                <span class="analysis-label">医疗质量</span>
                <div class="analysis-bar">
                  <div
                    class="analysis-fill bg-success"
                    :style="{ width: selectedDoctor.satisfaction + '%' }"
                  ></div>
                </div>
                <span class="analysis-value">{{ formatPercent(selectedDoctor.satisfaction) }}</span>
              </div>
              <div class="analysis-item">
                <span class="analysis-label">经济效益</span>
                <div class="analysis-bar">
                  <div
                    class="analysis-fill bg-warning"
                    :style="{ width: Math.min((selectedDoctor.income / 500000) * 100, 100) + '%' }"
                  ></div>
                </div>
                <span class="analysis-value">{{ Math.min(Math.round((selectedDoctor.income / 500000) * 100), 100) }}%</span>
              </div>
              <div class="analysis-item">
                <span class="analysis-label">业务能力</span>
                <div class="analysis-bar">
                  <div
                    class="analysis-fill bg-info"
                    :style="{ width: Math.min((selectedDoctor.surgeryCount / 100) * 100, 100) + '%' }"
                  ></div>
                </div>
                <span class="analysis-value">{{ Math.min(Math.round((selectedDoctor.surgeryCount / 100) * 100), 100) }}%</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h4>绩效趋势</h4>
            <div class="trend-chart">
              <LineChart
                :x-data="['1月', '2月', '3月', '4月', '5月', '6月']"
                :series-data="[{
                  name: selectedDoctor.name,
                  data: [72, 78, 85, 82, 88, calculatePerformanceScore(selectedDoctor)],
                  color: '#1E88E5'
                }]"
                height="200px"
              />
            </div>
          </div>
        </div>
        <EmptyState v-else type="loading" />
      </div>
    </DetailDrawer>
  </div>
</template>

<style scoped>
.doctor-content {
  min-height: calc(100vh - var(--header-height) - 120px);
}

.top5-section {
  margin-bottom: var(--spacing-lg);
}

.section-title {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.section-title h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
}

.section-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.top5-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--spacing-md);
}

.top5-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 2px solid transparent;
}

.top5-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.top5-card.rank-1 {
  border-color: #FFD700;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), var(--color-bg-secondary));
}

.top5-card.rank-2 {
  border-color: #C0C0C0;
  background: linear-gradient(135deg, rgba(192, 192, 192, 0.1), var(--color-bg-secondary));
}

.top5-card.rank-3 {
  border-color: #CD7F32;
  background: linear-gradient(135deg, rgba(205, 127, 50, 0.1), var(--color-bg-secondary));
}

.rank-badge {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: var(--font-size-sm);
}

.top5-card.rank-1 .rank-badge {
  background: #FFD700;
  color: #333;
}

.top5-card.rank-2 .rank-badge {
  background: #C0C0C0;
  color: #333;
}

.top5-card.rank-3 .rank-badge {
  background: #CD7F32;
}

.doctor-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--color-primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  margin-bottom: var(--spacing-sm);
}

.doctor-info {
  text-align: center;
  margin-bottom: var(--spacing-sm);
}

.doctor-name {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.doctor-dept {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.performance-score {
  text-align: center;
}

.score-label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-placeholder);
  margin-bottom: var(--spacing-xs);
}

.score-value {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-primary);
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
  flex-wrap: wrap;
  gap: var(--spacing-sm);
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
  flex-wrap: wrap;
}

.table-content {
  width: 100%;
}

.rank-number {
  font-weight: 600;
  color: var(--color-text-secondary);
}

.rank-number.rank-highlight {
  color: var(--color-primary);
  font-size: var(--font-size-lg);
}

.score-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.score-text {
  font-weight: 600;
  min-width: 36px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding-top: var(--spacing-md);
}

.doctor-detail {
  padding: var(--spacing-md);
}

.detail-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.doctor-avatar-large {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: var(--color-primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  flex-shrink: 0;
}

.doctor-basic h3 {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text-primary);
}

.doctor-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.dept-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.performance-badge {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
}

.score-highlight {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-primary);
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
  width: 60px;
  text-align: right;
  font-size: var(--font-size-sm);
  font-weight: 500;
  flex-shrink: 0;
}

.bg-primary {
  background: var(--color-primary);
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

.trend-chart {
  width: 100%;
}

@media (max-width: 1400px) {
  .top5-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-row {
    grid-template-columns: 1fr;
  }

  .detail-metrics {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
