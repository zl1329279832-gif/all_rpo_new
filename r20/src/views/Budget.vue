<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useBudgetStore } from '@/stores/budget'
import { useCategoryStore } from '@/stores/category'
import { useTransactionStore } from '@/stores/transaction'
import { useSettingsStore } from '@/stores/settings'
import { Edit, Delete, Plus, Wallet } from '@element-plus/icons-vue'

const budgetStore = useBudgetStore()
const categoryStore = useCategoryStore()
const transactionStore = useTransactionStore()
const settingsStore = useSettingsStore()

const currency = computed(() => settingsStore.settings.currency)

const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth() + 1

const selectedYear = ref(currentYear)
const selectedMonth = ref(currentMonth)

const years = computed(() => {
  const result: number[] = []
  for (let i = currentYear - 2; i <= currentYear + 1; i++) {
    result.push(i)
  }
  return result
})

const months = Array.from({ length: 12 }, (_, i) => i + 1)

const currentMonthStr = computed(() => 
  `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}`
)

const budgetList = computed(() => 
  budgetStore.getBudgetsByMonth(currentMonthStr.value)
)

const categoryStats = computed(() => 
  transactionStore.getCategoryStatsByMonth(
    selectedYear.value, 
    selectedMonth.value, 
    'expense'
  )
)

const budgetWithProgress = computed(() => {
  return budgetList.value.map(budget => {
    const category = categoryStore.getCategoryById(budget.categoryId)
    const spent = categoryStats.value[budget.categoryId] || 0
    const remaining = Math.max(budget.amount - spent, 0)
    const percentage = Math.min((spent / budget.amount) * 100, 100)
    const status = percentage > 90 ? 'danger' : percentage > 70 ? 'warning' : 'success'
    
    return {
      ...budget,
      category,
      spent,
      remaining,
      percentage,
      status
    }
  })
})

const totalBudget = computed(() => 
  budgetList.value.reduce((sum, b) => sum + b.amount, 0)
)

const totalSpent = computed(() => 
  budgetWithProgress.value.reduce((sum, b) => sum + b.spent, 0)
)

const dialogVisible = ref(false)
const editingBudget = ref<{ id?: string; categoryId: string; amount: number } | null>(null)

const formData = reactive({
  categoryId: '',
  amount: 0
})

const availableCategories = computed(() => {
  const budgetedCategoryIds = new Set(budgetList.value.map(b => b.categoryId))
  return categoryStore.expenseCategories.filter(
    c => !budgetedCategoryIds.has(c.id) || editingBudget.value?.categoryId === c.id
  )
})

function openAddDialog() {
  editingBudget.value = null
  formData.categoryId = ''
  formData.amount = 0
  dialogVisible.value = true
}

function openEditDialog(budget: { id: string; categoryId: string; amount: number }) {
  editingBudget.value = { id: budget.id, categoryId: budget.categoryId, amount: budget.amount }
  formData.categoryId = budget.categoryId
  formData.amount = budget.amount
  dialogVisible.value = true
}

function handleSubmit() {
  if (!formData.categoryId) {
    ElMessage.warning('请选择分类')
    return
  }
  if (formData.amount <= 0) {
    ElMessage.warning('预算金额必须大于0')
    return
  }
  
  if (editingBudget.value?.id) {
    budgetStore.updateBudget(editingBudget.value.id, formData.amount)
    ElMessage.success('预算已更新')
  } else {
    budgetStore.addBudget(formData.categoryId, formData.amount, currentMonthStr.value)
    ElMessage.success('预算已添加')
  }
  
  dialogVisible.value = false
}

async function handleDelete(budget: { id: string; categoryId: string }) {
  const category = categoryStore.getCategoryById(budget.categoryId)
  try {
    await ElMessageBox.confirm(
      `确定要删除"${category?.icon} ${category?.name}"的预算吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    budgetStore.deleteBudget(budget.id)
    ElMessage.success('预算已删除')
  } catch {
    // 用户取消
  }
}

function formatAmount(amount: number) {
  return `${currency.value}${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getProgressColor(percentage: number) {
  if (percentage > 90) return '#F44336'
  if (percentage > 70) return '#FF9800'
  return '#4CAF50'
}
</script>

<template>
  <div class="budget-page">
    <el-card class="summary-card">
      <template #header>
        <div class="card-header">
          <span>月度预算概览</span>
          <div class="month-selector">
            <el-select v-model="selectedYear" style="width: 110px">
              <el-option v-for="year in years" :key="year" :label="`${year}年`" :value="year" />
            </el-select>
            <el-select v-model="selectedMonth" style="width: 90px">
              <el-option v-for="month in months" :key="month" :label="`${month}月`" :value="month" />
            </el-select>
          </div>
        </div>
      </template>
      
      <div class="summary-stats">
        <div class="stat-item total">
          <div class="stat-icon" style="background: rgba(64, 158, 255, 0.1); color: #409EFF">
            <el-icon size="28"><Wallet /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">月度总预算</div>
            <div class="stat-value">{{ formatAmount(totalBudget) }}</div>
          </div>
        </div>
        <div class="stat-item spent">
          <div class="stat-icon" style="background: rgba(244, 67, 54, 0.1); color: #F44336">
            <el-icon size="28"><Wallet /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">已支出</div>
            <div class="stat-value">{{ formatAmount(totalSpent) }}</div>
          </div>
        </div>
        <div class="stat-item remaining">
          <div class="stat-icon" style="background: rgba(76, 175, 80, 0.1); color: #4CAF50">
            <el-icon size="28"><Wallet /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">剩余预算</div>
            <div class="stat-value" :class="totalBudget - totalSpent < 0 ? 'negative' : ''">
              {{ formatAmount(totalBudget - totalSpent) }}
            </div>
          </div>
        </div>
        <div class="stat-item action">
          <el-button type="primary" :icon="Plus" @click="openAddDialog" style="width: 100%; height: 50px">
            添加预算
          </el-button>
        </div>
      </div>
    </el-card>
    
    <el-card class="budget-list-card">
      <template #header>
        <div class="card-header">
          <span>预算详情</span>
          <span class="count">共 {{ budgetWithProgress.length }} 个分类预算</span>
        </div>
      </template>
      
      <div v-if="budgetWithProgress.length > 0" class="budget-grid">
        <div v-for="item in budgetWithProgress" :key="item.id" class="budget-item">
          <div class="budget-header">
            <div class="category-info">
              <div 
                class="category-icon" 
                :style="{ backgroundColor: (item.category?.color || '#409EFF') + '20', color: item.category?.color || '#409EFF' }"
              >
                {{ item.category?.icon || '📦' }}
              </div>
              <div class="category-detail">
                <div class="category-name">{{ item.category?.name || '未知分类' }}</div>
                <div class="budget-amount">预算: {{ formatAmount(item.amount) }}</div>
              </div>
            </div>
            <div class="budget-actions">
              <el-button 
                type="primary" 
                link 
                :icon="Edit" 
                @click="openEditDialog(item)"
              >
                编辑
              </el-button>
              <el-button 
                type="danger" 
                link 
                :icon="Delete" 
                @click="handleDelete(item)"
              >
                删除
              </el-button>
            </div>
          </div>
          
          <div class="progress-section">
            <div class="progress-labels">
              <span class="spent">已花: {{ formatAmount(item.spent) }}</span>
              <span class="remaining">剩余: {{ formatAmount(item.remaining) }}</span>
            </div>
            <el-progress
              :percentage="Math.round(item.percentage)"
              :color="getProgressColor(item.percentage)"
              :stroke-width="12"
            />
            <div class="progress-status">
              <el-tag :type="item.status" effect="light" size="small">
                {{ item.percentage.toFixed(1) }}% 已使用
              </el-tag>
              <span v-if="item.percentage > 90" class="warning-text">
                ⚠️ 预算即将用完
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <el-empty v-else description="暂无预算设置，点击上方按钮添加">
        <el-button type="primary" :icon="Plus" @click="openAddDialog">
          添加第一个预算
        </el-button>
      </el-empty>
    </el-card>
    
    <el-card class="tips-card" v-if="availableCategories.length > 0 && !editingBudget">
      <template #header>
        <div class="card-title">可添加预算的分类</div>
      </template>
      <div class="available-categories">
        <div 
          v-for="cat in availableCategories" 
          :key="cat.id" 
          class="available-category"
          @click="formData.categoryId = cat.id; formData.amount = 0; dialogVisible = true"
        >
          <div 
            class="category-icon-small"
            :style="{ backgroundColor: cat.color + '20', color: cat.color }"
          >
            {{ cat.icon }}
          </div>
          <span>{{ cat.name }}</span>
          <el-icon size="16" class="plus-icon"><Plus /></el-icon>
        </div>
      </div>
    </el-card>
    
    <el-dialog 
      v-model="dialogVisible" 
      :title="editingBudget ? '编辑预算' : '添加预算'" 
      width="450px"
    >
      <el-form label-width="80px">
        <el-form-item label="月份">
          <el-tag>{{ selectedYear }}年{{ selectedMonth }}月</el-tag>
        </el-form-item>
        <el-form-item label="分类">
          <el-select 
            v-model="formData.categoryId" 
            placeholder="请选择分类" 
            style="width: 100%"
            :disabled="!!editingBudget"
          >
            <el-option
              v-for="cat in availableCategories"
              :key="cat.id"
              :label="`${cat.icon} ${cat.name}`"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="预算金额">
          <el-input-number
            v-model="formData.amount"
            :min="0"
            :precision="2"
            :step="100"
            style="width: 100%"
            controls-position="right"
            placeholder="请输入预算金额"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.budget-page {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.summary-card {
  border: none;
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.month-selector {
  display: flex;
  gap: 10px;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
}

.stat-item.action {
  background: transparent;
  padding: 0;
  align-items: stretch;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 22px;
  font-weight: bold;
  color: #1f2937;
}

.stat-value.negative {
  color: #F44336;
}

.budget-list-card {
  border: none;
  border-radius: 12px;
}

.count {
  font-size: 14px;
  font-weight: normal;
  color: #6b7280;
}

.budget-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.budget-item {
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.budget-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.category-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.category-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.budget-amount {
  font-size: 13px;
  color: #6b7280;
}

.budget-actions {
  display: flex;
  gap: 8px;
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.spent {
  color: #F44336;
  font-weight: 500;
}

.remaining {
  color: #4CAF50;
  font-weight: 500;
}

.progress-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.warning-text {
  font-size: 12px;
  color: #F44336;
}

.tips-card {
  border: none;
  border-radius: 12px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
}

.available-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.available-category {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #f8fafc;
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.available-category:hover {
  background: #eef2ff;
  border-color: #409EFF;
}

.category-icon-small {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.plus-icon {
  color: #409EFF;
  margin-left: auto;
}

@media (max-width: 768px) {
  .summary-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .budget-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .summary-stats {
    grid-template-columns: 1fr;
  }
  
  .month-selector {
    flex-direction: column;
  }
}
</style>
