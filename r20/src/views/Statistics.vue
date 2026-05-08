<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useTransactionStore } from '@/stores/transaction'
import { useCategoryStore } from '@/stores/category'
import { useSettingsStore } from '@/stores/settings'
import * as echarts from 'echarts'

const transactionStore = useTransactionStore()
const categoryStore = useCategoryStore()
const settingsStore = useSettingsStore()

const isDark = computed(() => settingsStore.settings.darkMode)
const currency = computed(() => settingsStore.settings.currency)

const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth() + 1

const selectedYear = ref(currentYear)
const selectedMonth = ref(currentMonth)

const years = computed(() => {
  const result: number[] = []
  for (let i = currentYear - 5; i <= currentYear; i++) {
    result.push(i)
  }
  return result
})

const months = Array.from({ length: 12 }, (_, i) => i + 1)

const monthlyStats = computed(() => 
  transactionStore.getStatisticsByMonth(selectedYear.value, selectedMonth.value)
)

const yearlySummary = computed(() => 
  transactionStore.getYearlySummary(selectedYear.value)
)

const pieChartRef = ref<HTMLDivElement>()
const barChartRef = ref<HTMLDivElement>()
const yearlyChartRef = ref<HTMLDivElement>()

let pieChart: echarts.ECharts | null = null
let barChart: echarts.ECharts | null = null
let yearlyChart: echarts.ECharts | null = null

function formatAmount(amount: number) {
  return `${currency.value}${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
}

function getCategoryName(id: string) {
  return categoryStore.getCategoryById(id)?.name || id
}

function getCategoryColor(id: string) {
  return categoryStore.getCategoryById(id)?.color || '#666'
}

function initPieChart() {
  if (!pieChartRef.value) return
  
  if (pieChart) pieChart.dispose()
  pieChart = echarts.init(pieChartRef.value)
  
  const categoryStats = transactionStore.getCategoryStatsByMonth(
    selectedYear.value,
    selectedMonth.value,
    'expense'
  )
  
  const data = Object.entries(categoryStats).map(([id, value]) => ({
    name: getCategoryName(id),
    value,
    itemStyle: { color: getCategoryColor(id) }
  }))
  
  const textColor = isDark.value ? '#e5e7eb' : '#374151'
  
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: isDark.value ? '#1f2937' : '#fff',
      borderColor: isDark.value ? '#374151' : '#e5e7eb',
      textStyle: { color: textColor },
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: textColor }
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: isDark.value ? '#1f2937' : '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data.length > 0 ? data : [{ name: '暂无数据', value: 1, itemStyle: { color: '#e5e7eb' } }]
      }
    ]
  }
  
  pieChart.setOption(option)
}

function initBarChart() {
  if (!barChartRef.value) return
  
  if (barChart) barChart.dispose()
  barChart = echarts.init(barChartRef.value)
  
  const { incomeByDay, expenseByDay, daysInMonth } = transactionStore.getDailyTrendByMonth(
    selectedYear.value,
    selectedMonth.value
  )
  
  const days = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`)
  const incomeData = days.map((_, i) => incomeByDay[i + 1] || 0)
  const expenseData = days.map((_, i) => expenseByDay[i + 1] || 0)
  
  const textColor = isDark.value ? '#e5e7eb' : '#374151'
  const lineColor = isDark.value ? '#374151' : '#e5e7eb'
  
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark.value ? '#1f2937' : '#fff',
      borderColor: isDark.value ? '#374151' : '#e5e7eb',
      textStyle: { color: textColor }
    },
    legend: {
      data: ['收入', '支出'],
      textStyle: { color: textColor },
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
      top: 40
    },
    xAxis: {
      type: 'category',
      data: days,
      axisLine: { lineStyle: { color: lineColor } },
      axisLabel: { color: textColor }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: lineColor } },
      axisLabel: { color: textColor },
      splitLine: { lineStyle: { color: lineColor } }
    },
    series: [
      {
        name: '收入',
        type: 'bar',
        data: incomeData,
        itemStyle: { color: '#4CAF50' }
      },
      {
        name: '支出',
        type: 'bar',
        data: expenseData,
        itemStyle: { color: '#F44336' }
      }
    ]
  }
  
  barChart.setOption(option)
}

function initYearlyChart() {
  if (!yearlyChartRef.value) return
  
  if (yearlyChart) yearlyChart.dispose()
  yearlyChart = echarts.init(yearlyChartRef.value)
  
  const summary = yearlySummary.value
  
  const monthsLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const incomeData = summary.monthlyData.map(m => m.income)
  const expenseData = summary.monthlyData.map(m => m.expense)
  
  const textColor = isDark.value ? '#e5e7eb' : '#374151'
  const lineColor = isDark.value ? '#374151' : '#e5e7eb'
  
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark.value ? '#1f2937' : '#fff',
      borderColor: isDark.value ? '#374151' : '#e5e7eb',
      textStyle: { color: textColor }
    },
    legend: {
      data: ['收入', '支出', '结余'],
      textStyle: { color: textColor },
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
      top: 40
    },
    xAxis: {
      type: 'category',
      data: monthsLabels,
      axisLine: { lineStyle: { color: lineColor } },
      axisLabel: { color: textColor }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: lineColor } },
      axisLabel: { color: textColor },
      splitLine: { lineStyle: { color: lineColor } }
    },
    series: [
      {
        name: '收入',
        type: 'line',
        smooth: true,
        data: incomeData,
        itemStyle: { color: '#4CAF50' }
      },
      {
        name: '支出',
        type: 'line',
        smooth: true,
        data: expenseData,
        itemStyle: { color: '#F44336' }
      },
      {
        name: '结余',
        type: 'bar',
        data: incomeData.map((inc, i) => inc - expenseData[i]),
        itemStyle: { color: '#409EFF' }
      }
    ]
  }
  
  yearlyChart.setOption(option)
}

function initAllCharts() {
  initPieChart()
  initBarChart()
  initYearlyChart()
}

onMounted(() => {
  initAllCharts()
  window.addEventListener('resize', () => {
    pieChart?.resize()
    barChart?.resize()
    yearlyChart?.resize()
  })
})

watch([selectedYear, selectedMonth, isDark], () => {
  initAllCharts()
})
</script>

<template>
  <div class="statistics-page">
    <el-card class="summary-card">
      <div class="summary-header">
        <div class="summary-selectors">
          <el-select v-model="selectedYear" style="width: 120px">
            <el-option v-for="year in years" :key="year" :label="`${year}年`" :value="year" />
          </el-select>
          <el-select v-model="selectedMonth" style="width: 120px">
            <el-option v-for="month in months" :key="month" :label="`${month}月`" :value="month" />
          </el-select>
        </div>
      </div>
      
      <div class="summary-stats">
        <div class="stat-item income">
          <div class="stat-label">本月收入</div>
          <div class="stat-value">{{ formatAmount(monthlyStats.totalIncome) }}</div>
        </div>
        <div class="stat-item expense">
          <div class="stat-label">本月支出</div>
          <div class="stat-value">{{ formatAmount(monthlyStats.totalExpense) }}</div>
        </div>
        <div class="stat-item balance">
          <div class="stat-label">本月结余</div>
          <div class="stat-value" :class="monthlyStats.balance >= 0 ? 'positive' : 'negative'">
            {{ formatAmount(monthlyStats.balance) }}
          </div>
        </div>
      </div>
    </el-card>
    
    <div class="charts-grid">
      <el-card class="chart-card">
        <template #header>
          <div class="card-title">支出分类占比</div>
        </template>
        <div ref="pieChartRef" class="chart-container"></div>
      </el-card>
      
      <el-card class="chart-card">
        <template #header>
          <div class="card-title">月度收支趋势</div>
        </template>
        <div ref="barChartRef" class="chart-container"></div>
      </el-card>
    </div>
    
    <el-card class="yearly-card">
      <template #header>
        <div class="card-title">年度汇总 ({{ selectedYear }}年)</div>
      </template>
      
      <div class="yearly-summary">
        <div class="yearly-stat">
          <div class="stat-label">年度总收入</div>
          <div class="stat-value income">{{ formatAmount(yearlySummary.totalIncome) }}</div>
        </div>
        <div class="yearly-stat">
          <div class="stat-label">年度总支出</div>
          <div class="stat-value expense">{{ formatAmount(yearlySummary.totalExpense) }}</div>
        </div>
        <div class="yearly-stat">
          <div class="stat-label">年度结余</div>
          <div class="stat-value" :class="yearlySummary.balance >= 0 ? 'positive' : 'negative'">
            {{ formatAmount(yearlySummary.balance) }}
          </div>
        </div>
      </div>
      
      <div ref="yearlyChartRef" class="yearly-chart"></div>
    </el-card>
  </div>
</template>

<style scoped>
.statistics-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.summary-card {
  border: none;
  border-radius: 12px;
}

.summary-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.summary-selectors {
  display: flex;
  gap: 12px;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  border-radius: 12px;
}

.stat-item.income {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(76, 175, 80, 0.05));
}

.stat-item.expense {
  background: linear-gradient(135deg, rgba(244, 67, 54, 0.1), rgba(244, 67, 54, 0.05));
}

.stat-item.balance {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1), rgba(64, 158, 255, 0.05));
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #1f2937;
}

.stat-value.positive {
  color: #4CAF50;
}

.stat-value.negative {
  color: #F44336;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.chart-card {
  border: none;
  border-radius: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.chart-container {
  height: 350px;
  width: 100%;
}

.yearly-card {
  border: none;
  border-radius: 12px;
}

.yearly-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.yearly-stat {
  text-align: center;
  padding: 16px;
}

.yearly-stat .stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.yearly-stat .stat-value {
  font-size: 24px;
}

.yearly-stat .stat-value.income {
  color: #4CAF50;
}

.yearly-stat .stat-value.expense {
  color: #F44336;
}

.yearly-chart {
  height: 400px;
  width: 100%;
}

@media (max-width: 1024px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .summary-stats,
  .yearly-summary {
    grid-template-columns: 1fr;
  }
}
</style>
