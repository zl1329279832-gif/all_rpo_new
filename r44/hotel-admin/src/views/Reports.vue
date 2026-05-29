<template>
  <PageContainer title="经营报表" description="查看酒店经营数据，分析运营状况">
    <template #actions>
      <el-radio-group v-model="compareMode" size="default" @change="handleCompareModeChange">
        <el-radio-button value="none">无对比</el-radio-button>
        <el-radio-button value="yoy">同比</el-radio-button>
        <el-radio-button value="mom">环比</el-radio-button>
      </el-radio-group>
      <el-button
        v-if="hasPermission('report:export')"
        type="success"
        :icon="Download"
        :loading="exporting"
        @click="handleExportExcel"
      >
        导出 Excel
      </el-button>
      <el-button
        v-if="hasPermission('report:export')"
        type="warning"
        :icon="Printer"
        :loading="exporting"
        @click="handleExportPdf"
      >
        导出 PDF
      </el-button>
      <el-button :icon="Refresh" @click="loadData" :loading="loading">
        刷新
      </el-button>
    </template>

    <el-card shadow="never" class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="选择月份">
          <el-date-picker
            v-model="filterForm.month"
            type="month"
            placeholder="选择月份"
            value-format="YYYY-MM"
            :clearable="false"
            style="width: 200px"
            @change="handleMonthChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">
            查询
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div v-loading="loading" element-loading-text="数据加载中..." class="report-content">
      <template v-if="error">
        <el-card class="error-card">
          <el-result icon="error" :title="error" sub-title="数据加载失败">
            <template #extra>
              <el-button type="primary" @click="loadData">重新加载</el-button>
            </template>
          </el-result>
        </el-card>
      </template>

      <template v-else>
        <el-row :gutter="16" class="kpi-row">
          <el-col :xs="12" :sm="12" :md="6" :lg="6">
            <el-card class="kpi-card" shadow="hover">
              <div class="kpi-content">
                <div class="kpi-label">总收入</div>
                <div class="kpi-value">
                  <span class="value">¥{{ formatNumber(currentReport?.totalRevenue || 0) }}</span>
                </div>
                <div class="kpi-trend" :class="getTrendClass(compareData?.revenue)">
                  <el-icon v-if="compareData?.revenue && compareData.revenue > 0"><Top /></el-icon>
                  <el-icon v-else-if="compareData?.revenue && compareData.revenue < 0"><Bottom /></el-icon>
                  <el-icon v-else><Minus /></el-icon>
                  <span>{{ compareData?.revenue ? Math.abs(compareData.revenue) : 0 }}%</span>
                  <span class="trend-label">{{ getCompareLabel() }}</span>
                </div>
              </div>
              <div class="kpi-icon icon-orange">
                <el-icon :size="32"><Money /></el-icon>
              </div>
            </el-card>
          </el-col>

          <el-col :xs="12" :sm="12" :md="6" :lg="6">
            <el-card class="kpi-card" shadow="hover">
              <div class="kpi-content">
                <div class="kpi-label">GOP</div>
                <div class="kpi-value">
                  <span class="value">¥{{ formatNumber(currentReport?.gop || 0) }}</span>
                </div>
                <div class="kpi-trend" :class="getTrendClass(compareData?.gop)">
                  <el-icon v-if="compareData?.gop && compareData.gop > 0"><Top /></el-icon>
                  <el-icon v-else-if="compareData?.gop && compareData.gop < 0"><Bottom /></el-icon>
                  <el-icon v-else><Minus /></el-icon>
                  <span>{{ compareData?.gop ? Math.abs(compareData.gop) : 0 }}%</span>
                  <span class="trend-label">{{ getCompareLabel() }}</span>
                </div>
              </div>
              <div class="kpi-icon icon-green">
                <el-icon :size="32"><TrendCharts /></el-icon>
              </div>
            </el-card>
          </el-col>

          <el-col :xs="12" :sm="12" :md="6" :lg="6">
            <el-card class="kpi-card" shadow="hover">
              <div class="kpi-content">
                <div class="kpi-label">入住率</div>
                <div class="kpi-value">
                  <span class="value">{{ currentReport?.occupancyRate?.toFixed(2) || '0.00' }}%</span>
                </div>
                <div class="kpi-trend" :class="getTrendClass(compareData?.occupancy)">
                  <el-icon v-if="compareData?.occupancy && compareData.occupancy > 0"><Top /></el-icon>
                  <el-icon v-else-if="compareData?.occupancy && compareData.occupancy < 0"><Bottom /></el-icon>
                  <el-icon v-else><Minus /></el-icon>
                  <span>{{ compareData?.occupancy ? Math.abs(compareData.occupancy) : 0 }}%</span>
                  <span class="trend-label">{{ getCompareLabel() }}</span>
                </div>
              </div>
              <div class="kpi-icon icon-blue">
                <el-icon :size="32"><DataLine /></el-icon>
              </div>
            </el-card>
          </el-col>

          <el-col :xs="12" :sm="12" :md="6" :lg="6">
            <el-card class="kpi-card" shadow="hover">
              <div class="kpi-content">
                <div class="kpi-label">ADR</div>
                <div class="kpi-value">
                  <span class="value">¥{{ currentReport?.adr?.toFixed(2) || '0.00' }}</span>
                </div>
                <div class="kpi-trend" :class="getTrendClass(compareData?.adr)">
                  <el-icon v-if="compareData?.adr && compareData.adr > 0"><Top /></el-icon>
                  <el-icon v-else-if="compareData?.adr && compareData.adr < 0"><Bottom /></el-icon>
                  <el-icon v-else><Minus /></el-icon>
                  <span>{{ compareData?.adr ? Math.abs(compareData.adr) : 0 }}%</span>
                  <span class="trend-label">{{ getCompareLabel() }}</span>
                </div>
              </div>
              <div class="kpi-icon icon-purple">
                <el-icon :size="32"><PriceTag /></el-icon>
              </div>
            </el-card>
          </el-col>

          <el-col :xs="12" :sm="12" :md="6" :lg="6">
            <el-card class="kpi-card" shadow="hover">
              <div class="kpi-content">
                <div class="kpi-label">RevPAR</div>
                <div class="kpi-value">
                  <span class="value">¥{{ currentReport?.revpar?.toFixed(2) || '0.00' }}</span>
                </div>
                <div class="kpi-trend" :class="getTrendClass(compareData?.revpar)">
                  <el-icon v-if="compareData?.revpar && compareData.revpar > 0"><Top /></el-icon>
                  <el-icon v-else-if="compareData?.revpar && compareData.revpar < 0"><Bottom /></el-icon>
                  <el-icon v-else><Minus /></el-icon>
                  <span>{{ compareData?.revpar ? Math.abs(compareData.revpar) : 0 }}%</span>
                  <span class="trend-label">{{ getCompareLabel() }}</span>
                </div>
              </div>
              <div class="kpi-icon icon-cyan">
                <el-icon :size="32"><Histogram /></el-icon>
              </div>
            </el-card>
          </el-col>

          <el-col :xs="12" :sm="12" :md="6" :lg="6">
            <el-card class="kpi-card" shadow="hover">
              <div class="kpi-content">
                <div class="kpi-label">GOP率</div>
                <div class="kpi-value">
                  <span class="value">{{ currentReport?.gopMargin?.toFixed(1) || '0.0' }}%</span>
                </div>
                <div class="kpi-trend" :class="getTrendClass(compareData?.gopMargin)">
                  <el-icon v-if="compareData?.gopMargin && compareData.gopMargin > 0"><Top /></el-icon>
                  <el-icon v-else-if="compareData?.gopMargin && compareData.gopMargin < 0"><Bottom /></el-icon>
                  <el-icon v-else><Minus /></el-icon>
                  <span>{{ compareData?.gopMargin ? Math.abs(compareData.gopMargin) : 0 }}%</span>
                  <span class="trend-label">{{ getCompareLabel() }}</span>
                </div>
              </div>
              <div class="kpi-icon icon-indigo">
                <el-icon :size="32"><PieChart /></el-icon>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-empty v-if="!currentReport && reportList.length === 0" description="暂无数据" class="empty-state" />

        <template v-else>
          <el-row :gutter="16" class="chart-row">
            <el-col :xs="24" :sm="24" :md="12" :lg="12">
              <el-card class="chart-card" shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span class="card-title">收入与成本对比</span>
                    <el-tag size="small" type="primary">{{ filterForm.month }}</el-tag>
                  </div>
                </template>
                <div ref="revenueCostChartRef" class="chart-container"></div>
              </el-card>
            </el-col>

            <el-col :xs="24" :sm="24" :md="12" :lg="12">
              <el-card class="chart-card" shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span class="card-title">月度趋势</span>
                    <el-tag size="small" type="warning">近12个月</el-tag>
                  </div>
                </template>
                <div ref="trendChartRef" class="chart-container"></div>
              </el-card>
            </el-col>

            <el-col :xs="24" :sm="24" :md="12" :lg="12">
              <el-card class="chart-card" shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span class="card-title">房型收入占比</span>
                    <el-tag size="small" type="success">{{ filterForm.month }}</el-tag>
                  </div>
                </template>
                <div ref="roomTypeChartRef" class="chart-container"></div>
              </el-card>
            </el-col>

            <el-col :xs="24" :sm="24" :md="12" :lg="12">
              <el-card class="chart-card" shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span class="card-title">渠道收入排名</span>
                    <el-tag size="small" type="info">{{ filterForm.month }}</el-tag>
                  </div>
                </template>
                <div ref="channelChartRef" class="chart-container"></div>
              </el-card>
            </el-col>
          </el-row>

          <el-card shadow="never" class="table-card">
            <template #header>
              <div class="card-header">
                <span class="card-title">月度明细</span>
                <span class="card-subtitle">共 {{ reportList.length }} 条记录</span>
              </div>
            </template>
            <el-table :data="reportList" style="width: 100%" max-height="400" stripe>
              <el-table-column prop="monthName" label="月份" min-width="100" fixed="left" />
              <el-table-column prop="occupancyRate" label="入住率" min-width="100" align="right">
                <template #default="{ row }">
                  <span class="highlight">{{ row.occupancyRate?.toFixed(2) }}%</span>
                </template>
              </el-table-column>
              <el-table-column prop="adr" label="ADR" min-width="110" align="right">
                <template #default="{ row }">
                  <span>¥{{ row.adr?.toFixed(2) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="revpar" label="RevPAR" min-width="110" align="right">
                <template #default="{ row }">
                  <span class="highlight">¥{{ row.revpar?.toFixed(2) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="totalRevenue" label="总收入" min-width="130" align="right">
                <template #default="{ row }">
                  <span class="amount">¥{{ formatNumber(row.totalRevenue) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="roomRevenue" label="客房收入" min-width="130" align="right">
                <template #default="{ row }">
                  <span>¥{{ formatNumber(row.roomRevenue) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="fnbRevenue" label="餐饮收入" min-width="130" align="right">
                <template #default="{ row }">
                  <span>¥{{ formatNumber(row.fnbRevenue) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="totalCost" label="总成本" min-width="130" align="right">
                <template #default="{ row }">
                  <span>¥{{ formatNumber(row.totalCost) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="gop" label="GOP" min-width="130" align="right">
                <template #default="{ row }">
                  <span class="amount">¥{{ formatNumber(row.gop) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="gopMargin" label="GOP率" min-width="100" align="right">
                <template #default="{ row }">
                  <el-tag :type="row.gopMargin >= 45 ? 'success' : row.gopMargin >= 40 ? 'warning' : 'danger'" effect="light" size="small">
                    {{ row.gopMargin?.toFixed(1) }}%
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="totalOrders" label="订单数" min-width="90" align="center" />
              <el-table-column prop="status" label="状态" min-width="90" align="center">
                <template #default="{ row }">
                  <el-tag :type="getReportStatusType(row.status)" effect="light" size="small">
                    {{ getReportStatusLabel(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </template>
      </template>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { Download, Refresh, Printer, Money, TrendCharts, DataLine, PriceTag, Histogram, PieChart, Top, Bottom, Minus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { EChartsOption } from 'echarts'
import { PageContainer } from '../components/common'
import { usePermission } from '../hooks/usePermission'
import { useExport } from '../hooks/useExport'
import { useChart } from '../hooks/useChart'
import { useTheme } from '../composables/useTheme'
import { reportApi } from '../api/report'
import type { ReportData } from '../mock'

interface MonthlyReport {
  id: string
  month: string
  year: number
  monthNumber: number
  monthName: string
  totalRooms: number
  availableRoomNights: number
  occupiedRoomNights: number
  occupancyRate: number
  adr: number
  revpar: number
  totalRevenue: number
  roomRevenue: number
  fnbRevenue: number
  otherRevenue: number
  totalCost: number
  roomCost: number
  fnbCost: number
  otherCost: number
  gop: number
  gopMargin: number
  totalOrders: number
  averageNights: number
  cancellations: number
  cancellationRate: number
  noShows: number
  noShowRate: number
  channelBreakdown: {
    ota: { orders: number; revenue: number }
    direct: { orders: number; revenue: number }
  }
  memberBreakdown: {
    newMembers: number
    renewedMembers: number
    memberRevenue: number
  }
  expenseBreakdown: {
    payroll: number
    operating: number
    maintenance: number
    marketing: number
    other: number
  }
  notes: string
  createdAt: string
  status: 'draft' | 'current' | 'final'
}

const { hasPermission } = usePermission()
const { exporting, exportData } = useExport()
const { themeMode } = useTheme()

const revenueCostChartRef = ref<HTMLElement | null>(null)
const trendChartRef = ref<HTMLElement | null>(null)
const roomTypeChartRef = ref<HTMLElement | null>(null)
const channelChartRef = ref<HTMLElement | null>(null)

const revenueCostChart = useChart({}, themeMode)
const trendChart = useChart({}, themeMode)
const roomTypeChart = useChart({}, themeMode)
const channelChart = useChart({}, themeMode)

const loading = ref(false)
const error = ref<string | null>(null)
const currentReport = ref<MonthlyReport | null>(null)
const compareReport = ref<MonthlyReport | null>(null)
const reportList = ref<MonthlyReport[]>([])

const compareMode = ref<'none' | 'yoy' | 'mom'>('none')

const filterForm = reactive({
  month: '2026-05'
})

const compareData = computed(() => {
  if (!currentReport.value || !compareReport.value || compareMode.value === 'none') {
    return null
  }
  const calcChange = (current: number, previous: number) => {
    if (previous === 0) return 0
    return Math.round(((current - previous) / previous) * 100 * 10) / 10
  }
  return {
    revenue: calcChange(currentReport.value.totalRevenue, compareReport.value.totalRevenue),
    gop: calcChange(currentReport.value.gop, compareReport.value.gop),
    occupancy: calcChange(currentReport.value.occupancyRate, compareReport.value.occupancyRate),
    adr: calcChange(currentReport.value.adr, compareReport.value.adr),
    revpar: calcChange(currentReport.value.revpar, compareReport.value.revpar),
    gopMargin: calcChange(currentReport.value.gopMargin, compareReport.value.gopMargin)
  }
})

const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toFixed(0)
}

const getTrendClass = (value: number | undefined): string => {
  if (!value) return 'flat'
  return value > 0 ? 'up' : value < 0 ? 'down' : 'flat'
}

const getCompareLabel = (): string => {
  if (compareMode.value === 'yoy') return '同比'
  if (compareMode.value === 'mom') return '环比'
  return '较上期'
}

const getReportStatusType = (status: string): 'success' | 'warning' | 'info' | 'danger' | 'primary' => {
  const map: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'primary'> = {
    draft: 'info',
    current: 'primary',
    final: 'success'
  }
  return map[status] || 'info'
}

const getReportStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    draft: '草稿',
    current: '当期',
    final: '已确认'
  }
  return map[status] || status
}

const loadReportList = async () => {
  try {
    const response = await fetch('/src/mock/reports.json')
    const data = await response.json()
    reportList.value = data.sort((a: MonthlyReport, b: MonthlyReport) => 
      new Date(b.month).getTime() - new Date(a.month).getTime()
    )
  } catch (err) {
    console.error('加载报表列表失败:', err)
  }
}

const getCompareMonth = (month: string, mode: 'yoy' | 'mom'): string => {
  const [year, monthNum] = month.split('-').map(Number)
  if (mode === 'yoy') {
    return `${year - 1}-${String(monthNum).padStart(2, '0')}`
  } else {
    const d = new Date(year, monthNum - 2, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }
}

const loadData = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await fetch('/src/mock/reports.json')
    const data: MonthlyReport[] = await response.json()
    
    reportList.value = data.sort((a, b) => 
      new Date(b.month).getTime() - new Date(a.month).getTime()
    )
    
    currentReport.value = data.find(r => r.month === filterForm.month) || null
    
    if (compareMode.value !== 'none' && currentReport.value) {
      const compareMonth = getCompareMonth(filterForm.month, compareMode.value)
      compareReport.value = data.find(r => r.month === compareMonth) || null
    } else {
      compareReport.value = null
    }
    
    await nextTick()
    renderCharts()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载数据失败'
    ElMessage.error(error.value)
  } finally {
    loading.value = false
  }
}

const handleMonthChange = () => {
  loadData()
}

const handleCompareModeChange = () => {
  loadData()
}

const renderRevenueCostChart = () => {
  if (!currentReport.value) return
  
  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        let result = `${params[0].name}<br/>`
        params.forEach((param: any) => {
          result += `${param.marker}${param.seriesName}: ¥${formatNumber(param.value)}<br/>`
        })
        return result
      }
    },
    legend: {
      data: ['总收入', '总成本', 'GOP'],
      textStyle: { color: 'var(--el-text-color-secondary)' },
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['客房', '餐饮', '其他'],
      axisLine: { lineStyle: { color: 'var(--el-border-color-base)' } },
      axisLabel: { color: 'var(--el-text-color-secondary)' }
    },
    yAxis: {
      type: 'value',
      name: '金额(万)',
      axisLine: { lineStyle: { color: 'var(--el-border-color-base)' } },
      axisLabel: {
        color: 'var(--el-text-color-secondary)',
        formatter: (value: number) => (value / 10000).toFixed(0)
      },
      splitLine: { lineStyle: { color: 'var(--el-border-color-lighter)' } }
    },
    series: [
      {
        name: '总收入',
        type: 'bar',
        data: [
          currentReport.value.roomRevenue,
          currentReport.value.fnbRevenue,
          currentReport.value.otherRevenue
        ],
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#409EFF' },
              { offset: 1, color: '#79bbff' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '25%'
      },
      {
        name: '总成本',
        type: 'bar',
        data: [
          currentReport.value.roomCost,
          currentReport.value.fnbCost,
          currentReport.value.otherCost
        ],
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#F56C6C' },
              { offset: 1, color: '#f89898' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '25%'
      },
      {
        name: 'GOP',
        type: 'bar',
        data: [
          currentReport.value.roomRevenue - currentReport.value.roomCost,
          currentReport.value.fnbRevenue - currentReport.value.fnbCost,
          currentReport.value.otherRevenue - currentReport.value.otherCost
        ],
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#67C23A' },
              { offset: 1, color: '#95d475' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '25%'
      }
    ]
  }
  revenueCostChart.setOption(option, { notMerge: true })
}

const renderTrendChart = () => {
  if (reportList.value.length === 0) return
  
  const last12Months = [...reportList.value].reverse().slice(-12)
  
  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: (params: any) => {
        let result = `${params[0].name}<br/>`
        params.forEach((param: any) => {
          const unit = param.seriesName === '入住率' ? '%' : '元'
          const value = param.seriesName === '入住率' ? param.value : `¥${formatNumber(param.value)}`
          result += `${param.marker}${param.seriesName}: ${value}${unit}<br/>`
        })
        return result
      }
    },
    legend: {
      data: ['总收入', '入住率', 'RevPAR'],
      textStyle: { color: 'var(--el-text-color-secondary)' },
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: last12Months.map(r => r.monthName),
      axisLine: { lineStyle: { color: 'var(--el-border-color-base)' } },
      axisLabel: { color: 'var(--el-text-color-secondary)' }
    },
    yAxis: [
      {
        type: 'value',
        name: '金额(万)',
        axisLine: { lineStyle: { color: 'var(--el-border-color-base)' } },
        axisLabel: {
          color: 'var(--el-text-color-secondary)',
          formatter: (value: number) => (value / 10000).toFixed(0)
        },
        splitLine: { lineStyle: { color: 'var(--el-border-color-lighter)' } }
      },
      {
        type: 'value',
        name: '率(%)',
        max: 100,
        axisLine: { lineStyle: { color: 'var(--el-border-color-base)' } },
        axisLabel: {
          color: 'var(--el-text-color-secondary)',
          formatter: '{value}%'
        },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '总收入',
        type: 'line',
        data: last12Months.map(r => r.totalRevenue),
        itemStyle: { color: '#F56C6C' },
        lineStyle: { width: 3 },
        smooth: true,
        symbol: 'circle',
        symbolSize: 8
      },
      {
        name: '入住率',
        type: 'line',
        yAxisIndex: 1,
        data: last12Months.map(r => r.occupancyRate),
        itemStyle: { color: '#67C23A' },
        lineStyle: { width: 2 },
        smooth: true,
        symbol: 'circle',
        symbolSize: 6
      },
      {
        name: 'RevPAR',
        type: 'line',
        data: last12Months.map(r => r.revpar),
        itemStyle: { color: '#409EFF' },
        lineStyle: { width: 2 },
        smooth: true,
        symbol: 'circle',
        symbolSize: 6
      }
    ]
  }
  trendChart.setOption(option, { notMerge: true })
}

const renderRoomTypeChart = () => {
  if (!currentReport.value) return
  
  const roomTypeData = [
    { name: '标准大床房', value: 35, revenue: currentReport.value.roomRevenue * 0.35 },
    { name: '豪华双床房', value: 30, revenue: currentReport.value.roomRevenue * 0.30 },
    { name: '行政套房', value: 20, revenue: currentReport.value.roomRevenue * 0.20 },
    { name: '家庭房', value: 10, revenue: currentReport.value.roomRevenue * 0.10 },
    { name: '总统套房', value: 5, revenue: currentReport.value.roomRevenue * 0.05 }
  ]
  
  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `${params.name}<br/>收入占比: ${params.percent}%<br/>预估收入: ¥${formatNumber(params.data.revenue)}`
      }
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center',
      textStyle: { color: 'var(--el-text-color-secondary)' }
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['65%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 8,
        borderColor: 'var(--el-bg-color)',
        borderWidth: 2
      },
      label: {
        show: false
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: roomTypeData
    }],
    color: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#9b59b6']
  }
  roomTypeChart.setOption(option, { notMerge: true })
}

const renderChannelChart = () => {
  if (!currentReport.value) return
  
  const channelData = [
    { name: 'OTA渠道', value: currentReport.value.channelBreakdown.ota.revenue, orders: currentReport.value.channelBreakdown.ota.orders },
    { name: '直销渠道', value: currentReport.value.channelBreakdown.direct.revenue, orders: currentReport.value.channelBreakdown.direct.orders }
  ].sort((a, b) => b.value - a.value)
  
  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const item = params[0]
        const data = channelData.find(d => d.name === item.name)
        return `${item.name}<br/>收入: ¥${formatNumber(item.value)}<br/>订单数: ${data?.orders || 0}`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '收入(万)',
      axisLine: { lineStyle: { color: 'var(--el-border-color-base)' } },
      axisLabel: {
        color: 'var(--el-text-color-secondary)',
        formatter: (value: number) => (value / 10000).toFixed(0)
      },
      splitLine: { lineStyle: { color: 'var(--el-border-color-lighter)' } }
    },
    yAxis: {
      type: 'category',
      data: channelData.map(d => d.name),
      axisLine: { lineStyle: { color: 'var(--el-border-color-base)' } },
      axisLabel: { color: 'var(--el-text-color-secondary)' }
    },
    series: [{
      name: '收入',
      type: 'bar',
      data: channelData.map(d => d.value),
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#409EFF' },
            { offset: 1, color: '#79bbff' }
          ]
        },
        borderRadius: [0, 4, 4, 0]
      },
      barWidth: '50%'
    }]
  }
  channelChart.setOption(option, { notMerge: true })
}

const renderCharts = () => {
  renderRevenueCostChart()
  renderTrendChart()
  renderRoomTypeChart()
  renderChannelChart()
}

const handleExportExcel = async () => {
  if (reportList.value.length === 0) {
    ElMessage.warning('没有可导出的数据')
    return
  }
  const exportColumns = [
    { key: 'monthName', title: '月份' },
    { key: 'occupancyRate', title: '入住率(%)', formatter: (val: number) => val?.toFixed(2) || '0.00' },
    { key: 'adr', title: 'ADR(元)', formatter: (val: number) => val?.toFixed(2) || '0.00' },
    { key: 'revpar', title: 'RevPAR(元)', formatter: (val: number) => val?.toFixed(2) || '0.00' },
    { key: 'totalRevenue', title: '总收入(元)', formatter: (val: number) => val?.toFixed(2) || '0.00' },
    { key: 'roomRevenue', title: '客房收入(元)', formatter: (val: number) => val?.toFixed(2) || '0.00' },
    { key: 'fnbRevenue', title: '餐饮收入(元)', formatter: (val: number) => val?.toFixed(2) || '0.00' },
    { key: 'totalCost', title: '总成本(元)', formatter: (val: number) => val?.toFixed(2) || '0.00' },
    { key: 'gop', title: 'GOP(元)', formatter: (val: number) => val?.toFixed(2) || '0.00' },
    { key: 'gopMargin', title: 'GOP率(%)', formatter: (val: number) => val?.toFixed(1) || '0.0' },
    { key: 'totalOrders', title: '订单数' },
    { key: 'status', title: '状态', formatter: (val: string) => getReportStatusLabel(val) }
  ]
  try {
    await exportData(reportList.value as any, exportColumns, {
      filename: `经营报表_${filterForm.month}`,
      format: 'excel'
    })
  } catch (error) {
    console.error('导出失败:', error)
  }
}

const handleExportPdf = async () => {
  if (!currentReport.value) {
    ElMessage.warning('没有可导出的数据')
    return
  }
  try {
    const content = `
酒店经营报表
=====================================
月份: ${currentReport.value.monthName} ${currentReport.value.year}年

一、核心指标
-------------------------------------
总收入: ¥${currentReport.value.totalRevenue.toLocaleString('zh-CN')}
GOP: ¥${currentReport.value.gop.toLocaleString('zh-CN')}
GOP率: ${currentReport.value.gopMargin.toFixed(1)}%
入住率: ${currentReport.value.occupancyRate.toFixed(2)}%
ADR: ¥${currentReport.value.adr.toFixed(2)}
RevPAR: ¥${currentReport.value.revpar.toFixed(2)}

二、收入明细
-------------------------------------
客房收入: ¥${currentReport.value.roomRevenue.toLocaleString('zh-CN')}
餐饮收入: ¥${currentReport.value.fnbRevenue.toLocaleString('zh-CN')}
其他收入: ¥${currentReport.value.otherRevenue.toLocaleString('zh-CN')}

三、成本明细
-------------------------------------
客房成本: ¥${currentReport.value.roomCost.toLocaleString('zh-CN')}
餐饮成本: ¥${currentReport.value.fnbCost.toLocaleString('zh-CN')}
其他成本: ¥${currentReport.value.otherCost.toLocaleString('zh-CN')}
总成本: ¥${currentReport.value.totalCost.toLocaleString('zh-CN')}

四、运营数据
-------------------------------------
总订单数: ${currentReport.value.totalOrders}
平均入住晚数: ${currentReport.value.averageNights}
取消订单: ${currentReport.value.cancellations} (${currentReport.value.cancellationRate.toFixed(2)}%)
未入住: ${currentReport.value.noShows} (${currentReport.value.noShowRate.toFixed(2)}%)

五、渠道分析
-------------------------------------
OTA渠道: ${currentReport.value.channelBreakdown.ota.orders}单, ¥${currentReport.value.channelBreakdown.ota.revenue.toLocaleString('zh-CN')}
直销渠道: ${currentReport.value.channelBreakdown.direct.orders}单, ¥${currentReport.value.channelBreakdown.direct.revenue.toLocaleString('zh-CN')}

六、备注
-------------------------------------
${currentReport.value.notes || '无'}

报表生成时间: ${new Date().toLocaleString('zh-CN')}
=====================================
    `
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `经营报表_${filterForm.month}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  }
}

watch([revenueCostChartRef, trendChartRef, roomTypeChartRef, channelChartRef], ([revRef, trendRef, roomRef, channelRef]) => {
  if (revRef) {
    revenueCostChart.chartRef.value = revRef
    revenueCostChart.initChart()
  }
  if (trendRef) {
    trendChart.chartRef.value = trendRef
    trendChart.initChart()
  }
  if (roomRef) {
    roomTypeChart.chartRef.value = roomRef
    roomTypeChart.initChart()
  }
  if (channelRef) {
    channelChart.chartRef.value = channelRef
    channelChart.initChart()
  }
}, { immediate: true })

watch(themeMode, () => {
  if (revenueCostChart.chartInstance.value) {
    const option = revenueCostChart.chartInstance.value.getOption()
    revenueCostChart.dispose()
    revenueCostChart.initChart()
    revenueCostChart.setOption(option as EChartsOption, { notMerge: true })
  }
  if (trendChart.chartInstance.value) {
    const option = trendChart.chartInstance.value.getOption()
    trendChart.dispose()
    trendChart.initChart()
    trendChart.setOption(option as EChartsOption, { notMerge: true })
  }
  if (roomTypeChart.chartInstance.value) {
    const option = roomTypeChart.chartInstance.value.getOption()
    roomTypeChart.dispose()
    roomTypeChart.initChart()
    roomTypeChart.setOption(option as EChartsOption, { notMerge: true })
  }
  if (channelChart.chartInstance.value) {
    const option = channelChart.chartInstance.value.getOption()
    channelChart.dispose()
    channelChart.initChart()
    channelChart.setOption(option as EChartsOption, { notMerge: true })
  }
})

onMounted(() => {
  if (hasPermission('report:view')) {
    loadData()
  }
})
</script>

<style lang="scss" scoped>
.filter-card {
  margin-bottom: 16px;

  :deep(.el-card__body) {
    padding: 16px;
  }
}

.report-content {
  min-height: calc(100vh - 280px);
}

.error-card {
  margin-bottom: 16px;
}

.kpi-row {
  margin-bottom: 16px;
}

.kpi-card {
  position: relative;
  overflow: hidden;
  margin-bottom: 16px;

  :deep(.el-card__body) {
    padding: 20px;
  }

  .kpi-content {
    position: relative;
    z-index: 1;

    .kpi-label {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      margin-bottom: 8px;
    }

    .kpi-value {
      margin-bottom: 8px;

      .value {
        font-size: 26px;
        font-weight: 700;
        color: var(--el-text-color-primary);
        line-height: 1.2;
      }
    }

    .kpi-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;

      &.up {
        color: var(--el-color-success);
      }

      &.down {
        color: var(--el-color-danger);
      }

      &.flat {
        color: var(--el-text-color-secondary);
      }

      .trend-label {
        color: var(--el-text-color-secondary);
        margin-left: 4px;
      }
    }
  }

  .kpi-icon {
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.9;

    &.icon-blue {
      background: linear-gradient(135deg, rgba(64, 158, 255, 0.2), rgba(64, 158, 255, 0.05));
      color: var(--el-color-primary);
    }

    &.icon-green {
      background: linear-gradient(135deg, rgba(103, 194, 58, 0.2), rgba(103, 194, 58, 0.05));
      color: var(--el-color-success);
    }

    &.icon-orange {
      background: linear-gradient(135deg, rgba(230, 162, 60, 0.2), rgba(230, 162, 60, 0.05));
      color: var(--el-color-warning);
    }

    &.icon-purple {
      background: linear-gradient(135deg, rgba(155, 89, 182, 0.2), rgba(155, 89, 182, 0.05));
      color: #9b59b6;
    }

    &.icon-cyan {
      background: linear-gradient(135deg, rgba(26, 188, 156, 0.2), rgba(26, 188, 156, 0.05));
      color: #1abc9c;
    }

    &.icon-indigo {
      background: linear-gradient(135deg, rgba(75, 0, 130, 0.2), rgba(75, 0, 130, 0.05));
      color: #4b0082;
    }
  }
}

.chart-row {
  margin-bottom: 16px;
}

.chart-card {
  margin-bottom: 16px;

  :deep(.el-card__body) {
    padding: 16px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    color: var(--el-text-color-primary);

    .card-title {
      font-size: 15px;
    }

    .card-subtitle {
      font-size: 13px;
      font-weight: normal;
      color: var(--el-text-color-secondary);
    }
  }

  .chart-container {
    height: 280px;
    width: 100%;
  }
}

.table-card {
  margin-bottom: 16px;

  .highlight {
    color: var(--el-color-primary);
    font-weight: 600;
  }

  .amount {
    color: var(--el-color-success);
    font-weight: 600;
  }
}

.empty-state {
  padding: 60px 0;
}

@media (max-width: 768px) {
  .kpi-card {
    :deep(.el-card__body) {
      padding: 16px;
    }

    .kpi-content {
      .kpi-value {
        .value {
          font-size: 20px;
        }
      }
    }

    .kpi-icon {
      right: 12px;
      width: 44px;
      height: 44px;

      :deep(svg) {
        width: 20px !important;
        height: 20px !important;
      }
    }
  }

  .chart-card {
    .chart-container {
      height: 220px;
    }
  }
}
</style>
