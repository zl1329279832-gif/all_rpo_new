<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTransactionStore } from '@/stores/transaction'
import { useCategoryStore } from '@/stores/category'
import { useBudgetStore } from '@/stores/budget'
import { useSettingsStore } from '@/stores/settings'
import * as echarts from 'echarts'
import { Plus, TrendUp, Wallet, PiggyBank } from '@element-plus/icons-vue'

const router = useRouter()
const transactionStore = useTransactionStore()
const categoryStore = useCategoryStore()
const budgetStore = useBudgetStore()
const settingsStore = useSettingsStore()

const isDark = computed(() => settingsStore.settings.darkMode)
const currency = computed(() => settingsStore.settings.currency)

const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth() + 1

const monthStats = computed(() => 
  transactionStore.getStatisticsByMonth(currentYear, currentMonth)
)

const recentTransactions = computed(() => 
  transactionStore.sortedTransactions.slice(0, 5)
)

const budgetStatus = computed(() => {
  const monthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
  const budgets = budgetStore.getBudgetsByMonth(monthStr)
  const categoryStats = transactionStore.getCategoryStatsByMonth(currentYear, currentMonth, 'expense')
  
  return budgets.map(budget => {
    const category = categoryStore.getCategoryById(budget.categoryId)
    const spent = categoryStats[budget.categoryId] || 0
    const percentage = Math.min((spent / budget.amount) * 100, 100)
    return {
      ...budget,
      category,
      spent,
      percentage
    }
  })
})

const trendChartRef = ref<HTMLDivElement>()
let trendChart: echarts.ECharts | null = null

function getCategoryById(id: string) {
  return categoryStore.getCategoryById(id)
}

function formatAmount(amount: number) {
  return `${currency.value}${amount.toFixed(2)}`
}

function goToAddTransaction() {
  router.push('/add-transaction')
}

function initTrendChart() {
  if (!trendChartRef.value) return
  
  if (trendChart) {
    trendChart.dispose()
  }
  
  trendChart = echarts.init(trendChartRef.value)
  
  const { incomeByDay, expenseByDay, daysInMonth } = transactionStore.getDailyTrendByMonth(
    currentYear,
    currentMonth
  )
  
  const days = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}日`)
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
      boundaryGap: false,
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
        type: 'line',
        smooth: true,
        data: incomeData,
        areaStyle: { color: 'rgba(76, 175, 80, 0.2)' },
        lineStyle: { color: '#4CAF50' },
        itemStyle: { color: '#4CAF50' }
      },
      {
        name: '支出',
        type: 'line',
        smooth: true,
        data: expenseData,
        areaStyle: { color: 'rgba(244, 67, 54, 0.2)' },
        lineStyle: { color: '#F44336' },
        itemStyle: { color: '#F44336' }
      }
    ]
  }
  
  trendChart.setOption(option)
}

onMounted(() => {
  initTrendChart()
  window.addEventListener('resize', () => trendChart?.resize())
})

watch(isDark, () => {
  initTrendChart()
})
</script>

<template>
  <div class="dashboard">
    <div class="stats-cards">
      <el-card class="stat-card income-card" shadow="hover">
        <div class="stat-icon" style="background: rgba(76, 175, 80, 0.1)">
          <el-icon size="24"><TrendUp /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-label">本月收入</div>
          <div class="stat-value income">{{ formatAmount(monthStats.totalIncome) }}</div>
        </div>
      </el-card>
      
      <el-card class="stat-card expense-card" shadow="hover">
        <div class="stat-icon" style="background: rgba(244, 67, 54, 0.1)">
          <el-icon size="24"><Wallet /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-label">本月支出</div>
          <div class="stat-value expense">{{ formatAmount(monthStats.totalExpense) }}</div>
        </div>
      </el-card>
      
      <el-card class="stat-card balance-card" shadow="hover">
        <div class="stat-icon" style="background: rgba(64, 158, 255, 0.1)">
          <el-icon size="24"><PiggyBank /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-label">本月结余</div>
          <div class="stat-value" :class="monthStats.balance >= 0 ? 'income' : 'expense'">
            {{ formatAmount(monthStats.balance) }}
          </div>
        </div>
      </el-card>
      
      <el-card class="stat-card action-card" shadow="hover" @click="goToAddTransaction">
        <div class="action-content">
          <el-icon size="32" class="action-icon"><Plus /></el-icon>
          <div class="action-text">记一笔</div>
        </div>
      </el-card>
    </div>
    
    <div class="content-grid">
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">收支趋势</div>
        </template>
        <div ref="trendChartRef" class="trend-chart"></div>
      </el-card>
      
      <el-card class="budget-card">
        <template #header>
          <div class="card-header">预算状态</div>
        </template>
        <div v-if="budgetStatus.length > 0" class="budget-list">
          <div v-for="item in budgetStatus" :key="item.id" class="budget-item">
            <div class="budget-header">
              <span class="budget-category">
                {{ item.category?.icon }} {{ item.category?.name }}
              </span>
              <span class="budget-amount">
                {{ formatAmount(item.spent) }} / {{ formatAmount(item.amount) }}
              </span>
            </div>
            <el-progress
              :percentage="Math.round(item.percentage)"
              :color="item.percentage > 90 ? '#F44336' : item.percentage > 70 ? '#FF9800' : '#4CAF50'"
            />
          </div>
        </div>
        <el-empty v-else description="暂无预算设置" />
      </el-card>
    </div>
    
    <el-card class="recent-card">
      <template #header>
        <div class="card-header">最近交易</div>
      </template>
      <el-table :data="recentTransactions" style="width: 100%" :stripe="!isDark">
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column label="分类" width="150">
          <template #default="{ row }">
            <span>
              {{ getCategoryById(row.categoryId)?.icon }}
              {{ getCategoryById(row.categoryId)?.name }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column label="金额" width="150" align="right">
          <template #default="{ row }">
            <span :class="row.type === 'income' ? 'income-text' : 'expense-text'">
              {{ row.type === 'income' ? '+' : '-' }}{{ formatAmount(row.amount) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-card {
  border: none;
  border-radius: 12px;
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409EFF;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

.stat-value.income {
  color: #4CAF50;
}

.stat-value.expense {
  color: #F44336;
}

.action-card {
  cursor: pointer;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.action-card :deep(.el-card__body) {
  padding: 20px;
}

.action-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.action-icon {
  opacity: 0.9;
}

.action-text {
  font-size: 16px;
  font-weight: 500;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.card-header {
  font-size: 16px;
  font-weight: 600;
}

.trend-chart {
  height: 300px;
  width: 100%;
}

.budget-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.budget-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.budget-header {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.budget-category {
  color: #374151;
  font-weight: 500;
}

.budget-amount {
  color: #6b7280;
}

.income-text {
  color: #4CAF50;
  font-weight: 500;
}

.expense-text {
  color: #F44336;
  font-weight: 500;
}

@media (max-width: 1024px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
}
</style>
