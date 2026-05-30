<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useFilterStore } from '@/stores'
import { getCostStructure, getDrugRatioTrend, getPaymentType, getCostByDepartment } from '@/api'
import { usePermission, useExport, useDate } from '@/hooks'
import type { CostData } from '@/types'
import { DEPARTMENTS } from '@/types'
import FilterBar from '@/components/common/FilterBar.vue'
import MetricCard from '@/components/common/MetricCard.vue'
import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import PieChart from '@/components/charts/PieChart.vue'
import GaugeChart from '@/components/charts/GaugeChart.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import DetailDrawer from '@/components/common/DetailDrawer.vue'

const filterStore = useFilterStore()
const { hasPermission } = usePermission()
const { exportAll, exporting } = useExport()
const { generateDateArray } = useDate()

const loading = ref(false)
const costStructure = ref<CostData[]>([])
const drugRatioTrend = ref<any[]>([])
const paymentTypeData = ref<{ name: string; value: number }[]>([])
const costByDepartment = ref<any[]>([])

const totalIncome = ref(0)
const drugIncome = ref(0)
const examIncome = ref(0)
const treatmentIncome = ref(0)
const materialIncome = ref(0)
const drugRatio = ref(0)

const detailVisible = ref(false)
const detailTitle = ref('')
const detailType = ref('')
const selectedData = ref<any>(null)

interface MetricConfig {
  key: string
  label: string
  valueKey: string
  unit: 'number' | 'percent' | 'money' | 'time'
  color: string
  trendKey: string
}

const metricConfigs: MetricConfig[] = [
  { key: 'total', label: '总收入', valueKey: 'totalIncome', unit: 'money', color: '#1E88E5', trendKey: 'totalYoY' },
  { key: 'drug', label: '药品收入', valueKey: 'drugIncome', unit: 'money', color: '#F44336', trendKey: 'drugYoY' },
  { key: 'exam', label: '检查收入', valueKey: 'examIncome', unit: 'money', color: '#4CAF50', trendKey: 'examYoY' },
  { key: 'treatment', label: '治疗收入', valueKey: 'treatmentIncome', unit: 'money', color: '#9C27B0', trendKey: 'treatmentYoY' },
  { key: 'material', label: '耗材收入', valueKey: 'materialIncome', unit: 'money', color: '#FF9800', trendKey: 'materialYoY' },
]

const getMetricValue = (valueKey: string): number => {
  const valueMap: Record<string, number> = {
    totalIncome: totalIncome.value,
    drugIncome: drugIncome.value,
    examIncome: examIncome.value,
    treatmentIncome: treatmentIncome.value,
    materialIncome: materialIncome.value,
  }
  return valueMap[valueKey] || 0
}

const costPieData = computed(() => {
  return costStructure.value.map((item) => ({
    name: item.category,
    value: item.amount,
  }))
})

const lineXData = computed(() => {
  return drugRatioTrend.value.map((d) => d.date)
})

const lineSeriesData = computed(() => {
  return [
    {
      name: '药占比',
      data: drugRatioTrend.value.map((d) => d.ratio),
      color: '#F44336',
    },
    {
      name: '总收入',
      data: drugRatioTrend.value.map((d) => d.total),
      color: '#1E88E5',
    },
  ]
})

const barXData = computed(() => {
  return costByDepartment.value.map((d) => getDepartmentName(d.department))
})

const barSeriesData = computed(() => {
  return [
    {
      name: '总收入',
      data: costByDepartment.value.map((d) => d.total),
      color: '#1E88E5',
    },
    {
      name: '药品收入',
      data: costByDepartment.value.map((d) => d.drug),
      color: '#F44336',
    },
  ]
})

const exportColumns = [
  { key: 'category', title: '费用类型' },
  { key: 'amount', title: '金额(元)', formatter: (v: number) => `¥${v.toLocaleString()}` },
  { key: 'ratio', title: '占比(%)', formatter: (v: number) => `${v.toFixed(2)}%` },
  { key: 'yoy', title: '同比(%)', formatter: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` },
]

const getDepartmentName = (deptId: string) => {
  const dept = DEPARTMENTS.find((d) => d.id === deptId)
  return dept?.name || deptId
}

const loadData = async () => {
  loading.value = true
  try {
    const [structureRes, trendRes, paymentRes, deptRes] = await Promise.all([
      getCostStructure(),
      getDrugRatioTrend(),
      getPaymentType(),
      getCostByDepartment(),
    ])

    costStructure.value = structureRes.data
    drugRatioTrend.value = trendRes.data
    paymentTypeData.value = paymentRes.data.map((item: any) => ({
      name: item.name,
      value: item.amount,
    }))
    costByDepartment.value = deptRes.data

    totalIncome.value = costStructure.value.reduce((sum, item) => sum + item.amount, 0)
    drugIncome.value = costStructure.value.find((item) => item.category === '药品')?.amount || 0
    examIncome.value = costStructure.value.find((item) => item.category === '检查')?.amount || 0
    treatmentIncome.value = costStructure.value.find((item) => item.category === '治疗')?.amount || 0
    materialIncome.value = costStructure.value.find((item) => item.category === '耗材')?.amount || 0
    drugRatio.value = totalIncome.value > 0 ? (drugIncome.value / totalIncome.value) * 100 : 0
  } catch (error) {
    console.error('Failed to load cost data:', error)
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  loadData()
}

const handlePieClick = (params: any, type: string) => {
  detailType.value = type
  detailTitle.value = `${params.name} - 详情`
  selectedData.value = {
    name: params.name,
    value: params.value,
    percent: params.percent,
  }
  detailVisible.value = true
}

const handleLineClick = (params: any) => {
  detailType.value = 'trend'
  detailTitle.value = `${params.seriesName} - ${params.name}`
  selectedData.value = {
    date: params.name,
    type: params.seriesName,
    value: params.value,
  }
  detailVisible.value = true
}

const handleBarClick = (params: any) => {
  detailType.value = 'department'
  detailTitle.value = `${params.seriesName} - ${params.name}`
  selectedData.value = {
    department: params.name,
    type: params.seriesName,
    value: params.value,
  }
  detailVisible.value = true
}

const handleExport = () => {
  if (!hasPermission('export:cost')) return
  exportAll(costStructure.value, exportColumns, `费用结构_${new Date().toLocaleDateString()}.xlsx`)
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="page-container">
    <FilterBar @change="handleFilterChange" />

    <div v-loading="loading" class="cost-content">
      <div v-if="loading" class="empty-wrapper">
        <EmptyState type="loading" />
      </div>

      <template v-else>
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
              <span>药占比</span>
              <el-tag type="warning" size="small">目标值 ≤ 30%</el-tag>
            </div>
            <GaugeChart
              v-if="totalIncome > 0"
              :value="drugRatio"
              title="药占比"
              :max="100"
              height="280px"
            />
            <EmptyState v-else type="empty" description="暂无费用数据" />
          </div>

          <div class="card-wrapper chart-card">
            <div class="card-title">
              <span>费用结构</span>
            </div>
            <PieChart
              v-if="costPieData.length > 0"
              :data="costPieData"
              height="280px"
              @click="(params) => handlePieClick(params, 'structure')"
            />
            <EmptyState v-else type="empty" description="暂无费用数据" />
          </div>
        </div>

        <div class="charts-row">
          <div class="card-wrapper chart-card">
            <div class="card-title">
              <span>支付方式分布</span>
            </div>
            <PieChart
              v-if="paymentTypeData.length > 0"
              :data="paymentTypeData"
              height="280px"
              @click="(params) => handlePieClick(params, 'payment')"
            />
            <EmptyState v-else type="empty" description="暂无支付数据" />
          </div>

          <div class="card-wrapper chart-card">
            <div class="card-title">
              <span>费用趋势</span>
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
              @click="handleLineClick"
            />
            <EmptyState v-else type="empty" description="暂无趋势数据" />
          </div>
        </div>

        <div class="card-wrapper chart-card">
          <div class="card-title">
            <span>科室费用排名</span>
            <div class="card-actions">
              <el-button
                v-if="hasPermission('export:cost')"
                type="primary"
                size="small"
                :loading="exporting"
                @click="handleExport"
              >
                <el-icon><Download /></el-icon>
                导出数据
              </el-button>
            </div>
          </div>
          <BarChart
            v-if="barXData.length > 0"
            :x-data="barXData"
            :series-data="barSeriesData"
            height="350px"
            @click="handleBarClick"
          />
          <EmptyState v-else type="empty" description="暂无科室数据" />
        </div>
      </template>
    </div>

    <DetailDrawer
      v-model="detailVisible"
      :title="detailTitle"
      size="default"
    >
      <div v-if="selectedData" class="cost-detail">
        <div v-if="detailType === 'structure'" class="detail-section">
          <div class="detail-item">
            <label>费用类型</label>
            <span>{{ selectedData.name }}</span>
          </div>
          <div class="detail-item">
            <label>收入金额</label>
            <span class="text-primary">¥{{ selectedData.value.toLocaleString() }}</span>
          </div>
          <div class="detail-item">
            <label>占比</label>
            <span>{{ (selectedData.percent * 100).toFixed(2) }}%</span>
          </div>
        </div>

        <div v-else-if="detailType === 'payment'" class="detail-section">
          <div class="detail-item">
            <label>支付方式</label>
            <span>{{ selectedData.name }}</span>
          </div>
          <div class="detail-item">
            <label>支付金额</label>
            <span class="text-primary">¥{{ selectedData.value.toLocaleString() }}</span>
          </div>
          <div class="detail-item">
            <label>占比</label>
            <span>{{ (selectedData.percent * 100).toFixed(2) }}%</span>
          </div>
        </div>

        <div v-else-if="detailType === 'trend'" class="detail-section">
          <div class="detail-item">
            <label>日期</label>
            <span>{{ selectedData.date }}</span>
          </div>
          <div class="detail-item">
            <label>指标类型</label>
            <span>{{ selectedData.type }}</span>
          </div>
          <div class="detail-item">
            <label>数值</label>
            <span class="text-primary">
              {{ selectedData.type === '药占比' ? selectedData.value + '%' : '¥' + selectedData.value.toLocaleString() }}
            </span>
          </div>
        </div>

        <div v-else-if="detailType === 'department'" class="detail-section">
          <div class="detail-item">
            <label>科室</label>
            <span>{{ selectedData.department }}</span>
          </div>
          <div class="detail-item">
            <label>收入类型</label>
            <span>{{ selectedData.type }}</span>
          </div>
          <div class="detail-item">
            <label>收入金额</label>
            <span class="text-primary">¥{{ selectedData.value.toLocaleString() }}</span>
          </div>
        </div>

        <div class="detail-section">
          <h4>数据分析</h4>
          <div class="analysis-item">
            <el-icon :size="16" color="#4CAF50"><CircleCheck /></el-icon>
            <span>数据统计正常，无异常波动</span>
          </div>
          <div class="analysis-item">
            <el-icon :size="16" color="#1E88E5"><TrendCharts /></el-icon>
            <span>建议持续关注该指标变化趋势</span>
          </div>
          <div class="analysis-item">
            <el-icon :size="16" color="#FF9800"><Tips /></el-icon>
            <span>可结合其他指标进行综合分析</span>
          </div>
        </div>

        <div class="detail-section">
          <h4>详细数据</h4>
          <el-table :data="[selectedData]" border size="small">
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="value" label="数值">
              <template #default="{ row }">
                {{ typeof row.value === 'number' ? '¥' + row.value.toLocaleString() : row.value }}
              </template>
            </el-table-column>
            <el-table-column prop="percent" label="占比" v-if="selectedData.percent">
              <template #default="{ row }">
                {{ (row.percent * 100).toFixed(2) }}%
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <template #actions>
        <el-button
          v-if="hasPermission('export:cost')"
          type="primary"
          :loading="exporting"
          @click="handleExport"
        >
          导出当前数据
        </el-button>
      </template>
    </DetailDrawer>
  </div>
</template>

<style scoped>
.cost-content {
  min-height: calc(100vh - var(--header-height) - 120px);
}

.empty-wrapper {
  padding: var(--spacing-xl);
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

.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
}

.card-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.cost-detail {
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

.analysis-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
  color: var(--color-text-secondary);
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
