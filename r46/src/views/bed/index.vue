<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useFilterStore } from '@/stores'
import { getBedList, getBedByDepartment } from '@/api'
import { usePermission } from '@/hooks'
import type { BedData } from '@/types'
import { DEPARTMENTS } from '@/types'
import FilterBar from '@/components/common/FilterBar.vue'
import MetricCard from '@/components/common/MetricCard.vue'
import PieChart from '@/components/charts/PieChart.vue'
import GaugeChart from '@/components/charts/GaugeChart.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import DetailDrawer from '@/components/common/DetailDrawer.vue'

const filterStore = useFilterStore()
const { hasPermission } = usePermission()

const loading = ref(false)
const bedList = ref<BedData[]>([])
const totalBeds = ref(0)
const occupiedBeds = ref(0)
const emptyBeds = ref(0)
const reservedBeds = ref(0)
const cleaningBeds = ref(0)
const occupancyRate = ref(0)
const departmentDistribution = ref<{ name: string; value: number }[]>([])

const statusFilter = ref('all')
const departmentFilter = ref('all')

const detailVisible = ref(false)
const selectedBed = ref<BedData | null>(null)

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'occupied', label: '已占用' },
  { value: 'empty', label: '空床' },
  { value: 'cleaning', label: '清洁中' },
  { value: 'reserved', label: '预约中' },
]

const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
  occupied: { label: '已占用', color: '#F44336', bgColor: 'rgba(244, 67, 54, 0.1)' },
  empty: { label: '空床', color: '#4CAF50', bgColor: 'rgba(76, 175, 80, 0.1)' },
  cleaning: { label: '清洁中', color: '#FF9800', bgColor: 'rgba(255, 152, 0, 0.1)' },
  reserved: { label: '预约中', color: '#1E88E5', bgColor: 'rgba(30, 136, 229, 0.1)' },
}

interface MetricConfig {
  key: string
  label: string
  valueKey: string
  unit: 'number' | 'percent' | 'money' | 'time'
  color: string
}

const metricConfigs: MetricConfig[] = [
  { key: 'total', label: '总床位数', valueKey: 'totalBeds', unit: 'number', color: '#1E88E5' },
  { key: 'occupied', label: '已占用', valueKey: 'occupiedBeds', unit: 'number', color: '#F44336' },
  { key: 'empty', label: '空床', valueKey: 'emptyBeds', unit: 'number', color: '#4CAF50' },
  { key: 'cleaning', label: '清洁中', valueKey: 'cleaningBeds', unit: 'number', color: '#FF9800' },
  { key: 'reserved', label: '预约中', valueKey: 'reservedBeds', unit: 'number', color: '#1E88E5' },
]

const getMetricValue = (valueKey: string): number => {
  const valueMap: Record<string, number> = {
    totalBeds: totalBeds.value,
    occupiedBeds: occupiedBeds.value,
    emptyBeds: emptyBeds.value,
    cleaningBeds: cleaningBeds.value,
    reservedBeds: reservedBeds.value,
  }
  return valueMap[valueKey] || 0
}

const filteredBedList = computed(() => {
  return bedList.value.filter((bed) => {
    const statusMatch = statusFilter.value === 'all' || bed.status === statusFilter.value
    const deptMatch = departmentFilter.value === 'all' || bed.department === departmentFilter.value
    return statusMatch && deptMatch
  })
})

const isBedTension = computed(() => {
  return occupancyRate.value >= 90
})

const getDepartmentName = (deptId: string) => {
  const dept = DEPARTMENTS.find((d) => d.id === deptId)
  return dept?.name || deptId
}

const loadData = async () => {
  loading.value = true
  try {
    const [bedListRes, deptRes] = await Promise.all([
      getBedList({
        department: filterStore.filterParams.department,
      }),
      getBedByDepartment(),
    ])

    const bedData = bedListRes.data
    bedList.value = bedData.list
    totalBeds.value = bedData.total
    occupiedBeds.value = bedData.occupied
    emptyBeds.value = bedData.empty
    reservedBeds.value = bedData.reserved
    cleaningBeds.value = bedData.cleaning
    occupancyRate.value = bedData.occupancyRate

    if (deptRes.data && deptRes.data.length > 0) {
      departmentDistribution.value = deptRes.data.map((item: any) => ({
        name: getDepartmentName(item.department),
        value: item.count,
      }))
    }
  } catch (error) {
    console.error('Failed to load bed data:', error)
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  loadData()
}

const handleBedClick = (bed: BedData) => {
  selectedBed.value = bed
  detailVisible.value = true
}

const handlePieClick = (params: any) => {
  const dept = DEPARTMENTS.find((d) => d.name === params.name)
  if (dept) {
    departmentFilter.value = dept.id
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="page-container">
    <FilterBar @change="handleFilterChange" />

    <div v-loading="loading" class="bed-content">
      <div v-if="loading" class="empty-wrapper">
        <EmptyState type="loading" />
      </div>

      <template v-else>
        <div v-if="isBedTension" class="tension-warning">
          <el-icon :size="20" color="#F44336"><Warning /></el-icon>
          <span>床位紧张预警：当前床位使用率已达 {{ occupancyRate.toFixed(1) }}%，建议及时调配床位资源</span>
        </div>

        <div class="metrics-grid">
          <MetricCard
            v-for="config in metricConfigs"
            :key="config.key"
            :label="config.label"
            :value="getMetricValue(config.valueKey)"
            :unit="config.unit"
            :color="config.color"
          />
        </div>

        <div class="charts-row">
          <div class="card-wrapper chart-card">
            <div class="card-title">
              <span>床位使用率</span>
            </div>
            <GaugeChart
              v-if="totalBeds > 0"
              :value="occupancyRate"
              title="使用率"
              :max="100"
              height="280px"
            />
            <EmptyState v-else type="empty" description="暂无床位数据" />
          </div>

          <div class="card-wrapper chart-card">
            <div class="card-title">
              <span>科室床位分布</span>
            </div>
            <PieChart
              v-if="departmentDistribution.length > 0"
              :data="departmentDistribution"
              height="280px"
              @click="handlePieClick"
            />
            <EmptyState v-else type="empty" description="暂无分布数据" />
          </div>
        </div>

        <div class="card-wrapper filter-card">
          <div class="filter-row">
            <div class="filter-item">
              <span class="filter-label">状态筛选：</span>
              <el-radio-group v-model="statusFilter" size="default">
                <el-radio-button
                  v-for="status in statusOptions"
                  :key="status.value"
                  :value="status.value"
                >
                  {{ status.label }}
                </el-radio-button>
              </el-radio-group>
            </div>
            <div class="filter-item">
              <span class="filter-label">科室筛选：</span>
              <el-select v-model="departmentFilter" placeholder="请选择科室" style="width: 200px">
                <el-option
                  v-for="dept in DEPARTMENTS"
                  :key="dept.id"
                  :label="dept.name"
                  :value="dept.id"
                />
              </el-select>
            </div>
          </div>
        </div>

        <div class="card-wrapper bed-grid-card">
          <div class="card-title">
            <span>床位列表</span>
            <span class="bed-count">共 {{ filteredBedList.length }} 张床位</span>
          </div>

          <div v-if="filteredBedList.length > 0" class="bed-grid">
            <div
              v-for="bed in filteredBedList"
              :key="bed.id"
              class="bed-card"
              :class="bed.status"
              :style="{ borderColor: statusMap[bed.status].color }"
              @click="handleBedClick(bed)"
            >
              <div class="bed-header">
                <span class="bed-no">{{ bed.bedNo }}</span>
                <el-tag
                  size="small"
                  :style="{
                    backgroundColor: statusMap[bed.status].bgColor,
                    color: statusMap[bed.status].color,
                    borderColor: statusMap[bed.status].color,
                  }"
                >
                  {{ statusMap[bed.status].label }}
                </el-tag>
              </div>
              <div class="bed-ward">{{ bed.ward }}</div>
              <div class="bed-dept">{{ getDepartmentName(bed.department) }}</div>
              <div v-if="bed.patientName" class="bed-patient">
                <el-icon :size="14"><User /></el-icon>
                {{ bed.patientName }}
              </div>
            </div>
          </div>

          <EmptyState v-else type="empty" description="暂无符合条件的床位" />
        </div>
      </template>
    </div>

    <DetailDrawer
      v-model="detailVisible"
      title="床位详情"
      size="default"
    >
      <div v-if="selectedBed" class="bed-detail">
        <div class="detail-section">
          <div class="detail-item">
            <label>床位编号</label>
            <span>{{ selectedBed.bedNo }}</span>
          </div>
          <div class="detail-item">
            <label>所属病区</label>
            <span>{{ selectedBed.ward }}</span>
          </div>
          <div class="detail-item">
            <label>所属科室</label>
            <span>{{ getDepartmentName(selectedBed.department) }}</span>
          </div>
          <div class="detail-item">
            <label>床位状态</label>
            <el-tag
              :style="{
                backgroundColor: statusMap[selectedBed.status].bgColor,
                color: statusMap[selectedBed.status].color,
                borderColor: statusMap[selectedBed.status].color,
              }"
            >
              {{ statusMap[selectedBed.status].label }}
            </el-tag>
          </div>
        </div>

        <div v-if="selectedBed.patientName" class="detail-section">
          <h4>患者信息</h4>
          <div class="detail-item">
            <label>患者姓名</label>
            <span>{{ selectedBed.patientName }}</span>
          </div>
          <div class="detail-item">
            <label>入院时间</label>
            <span>{{ selectedBed.admissionDate }}</span>
          </div>
          <div class="detail-item">
            <label>预计出院时间</label>
            <span>{{ selectedBed.expectedDischargeDate }}</span>
          </div>
        </div>

        <div class="detail-section">
          <h4>床位历史</h4>
          <el-timeline>
            <el-timeline-item
              v-if="selectedBed.admissionDate"
              :timestamp="selectedBed.admissionDate"
              placement="top"
            >
              患者入住
            </el-timeline-item>
            <el-timeline-item
              v-if="selectedBed.status === 'cleaning'"
              timestamp="今日"
              placement="top"
              type="warning"
            >
              开始清洁消毒
            </el-timeline-item>
            <el-timeline-item
              v-if="selectedBed.status === 'reserved'"
              timestamp="今日"
              placement="top"
              type="primary"
            >
              预约登记
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </DetailDrawer>
  </div>
</template>

<style scoped>
.bed-content {
  min-height: calc(100vh - var(--header-height) - 120px);
}

.empty-wrapper {
  padding: var(--spacing-xl);
}

.tension-warning {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.3);
  border-radius: var(--border-radius-md);
  color: #F44336;
  margin-bottom: var(--spacing-lg);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
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

.filter-card {
  margin-bottom: var(--spacing-lg);
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
  align-items: center;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.filter-label {
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.bed-grid-card {
  min-height: 400px;
}

.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
}

.bed-count {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.bed-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--spacing-md);
}

.bed-card {
  padding: var(--spacing-md);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  background: var(--color-bg-secondary);
}

.bed-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.bed-card.occupied {
  background: rgba(244, 67, 54, 0.05);
}

.bed-card.empty {
  background: rgba(76, 175, 80, 0.05);
}

.bed-card.cleaning {
  background: rgba(255, 152, 0, 0.05);
}

.bed-card.reserved {
  background: rgba(30, 136, 229, 0.05);
}

.bed-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.bed-no {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
}

.bed-ward {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.bed-dept {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.bed-patient {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.bed-detail {
  padding: var(--spacing-md);
}

.detail-section {
  margin-bottom: var(--spacing-xl);
}

.detail-section h4 {
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-base);
  font-weight: 600;
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
}
</style>
