<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useSettingsStore } from '@/stores/settings'
import { useTransactionStore } from '@/stores/transaction'
import { useCategoryStore } from '@/stores/category'
import { useBudgetStore } from '@/stores/budget'
import { useRouter } from 'vue-router'
import { defaultCategories, defaultTransactions, defaultBudgets } from '@/utils/mockData'

const router = useRouter()
const settingsStore = useSettingsStore()
const transactionStore = useTransactionStore()
const categoryStore = useCategoryStore()
const budgetStore = useBudgetStore()

const settings = computed(() => settingsStore.settings)

const currencyOptions = [
  { label: '人民币 (¥)', value: '¥' },
  { label: '美元 ($)', value: '$' },
  { label: '欧元 (€)', value: '€' },
  { label: '英镑 (£)', value: '£' }
]

function handleDarkModeChange(value: boolean) {
  settingsStore.updateSettings({ darkMode: value })
}

function handleCurrencyChange(value: string) {
  settingsStore.updateSettings({ currency: value })
  ElMessage.success('货币设置已保存')
}

async function handleResetData() {
  try {
    await ElMessageBox.confirm(
      '确定要重置所有数据吗？此操作不可恢复！',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    localStorage.removeItem('finance_transactions')
    localStorage.removeItem('finance_categories')
    localStorage.removeItem('finance_budgets')
    
    transactionStore.transactions = [...defaultTransactions]
    categoryStore.categories = [...defaultCategories]
    budgetStore.budgets = [...defaultBudgets]
    
    ElMessage.success('数据已重置为默认值')
    router.push('/')
  } catch {
    // 用户取消
  }
}

async function handleClearAll() {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有数据吗？此操作不可恢复！',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    localStorage.removeItem('finance_transactions')
    localStorage.removeItem('finance_categories')
    localStorage.removeItem('finance_budgets')
    
    transactionStore.transactions = []
    categoryStore.categories = []
    budgetStore.budgets = []
    
    ElMessage.success('数据已清空')
    router.push('/')
  } catch {
    // 用户取消
  }
}
</script>

<template>
  <div class="settings-page">
    <el-card class="settings-card">
      <template #header>
        <div class="card-title">外观设置</div>
      </template>
      
      <el-form label-width="120px" class="settings-form">
        <el-form-item label="暗黑模式">
          <el-switch
            v-model="settings.darkMode"
            active-text="开"
            inactive-text="关"
            @change="handleDarkModeChange"
          />
        </el-form-item>
        
        <el-form-item label="货币符号">
          <el-select
            v-model="settings.currency"
            style="width: 200px"
            @change="handleCurrencyChange"
          >
            <el-option
              v-for="option in currencyOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-card class="settings-card">
      <template #header>
        <div class="card-title">数据管理</div>
      </template>
      
      <div class="data-actions">
        <div class="action-item">
          <div class="action-info">
            <div class="action-title">重置为默认数据</div>
            <div class="action-desc">将所有数据恢复为初始演示数据</div>
          </div>
          <el-button type="warning" @click="handleResetData">
            重置数据
          </el-button>
        </div>
        
        <div class="action-item">
          <div class="action-info">
            <div class="action-title">清空所有数据</div>
            <div class="action-desc">删除所有账单、分类和预算设置</div>
          </div>
          <el-button type="danger" @click="handleClearAll">
            清空数据
          </el-button>
        </div>
      </div>
    </el-card>
    
    <el-card class="settings-card">
      <template #header>
        <div class="card-title">关于</div>
      </template>
      
      <div class="about-section">
        <div class="about-item">
          <span class="about-label">应用名称</span>
          <span class="about-value">个人资产记账与消费分析系统</span>
        </div>
        <div class="about-item">
          <span class="about-label">版本</span>
          <span class="about-value">1.0.0</span>
        </div>
        <div class="about-item">
          <span class="about-label">技术栈</span>
          <span class="about-value">Vue 3 + Vite + TypeScript + Pinia + Element Plus + ECharts</span>
        </div>
        <div class="about-item">
          <span class="about-label">数据存储</span>
          <span class="about-value">浏览器本地存储 (localStorage)</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.settings-page {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-card {
  border: none;
  border-radius: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.settings-form {
  max-width: 500px;
}

.data-actions {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.action-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
}

.action-info {
  flex: 1;
}

.action-title {
  font-size: 15px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
}

.action-desc {
  font-size: 13px;
  color: #6b7280;
}

.about-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.about-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.about-label {
  font-size: 14px;
  color: #6b7280;
}

.about-value {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

@media (max-width: 640px) {
  .action-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .about-item {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
