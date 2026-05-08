<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTransactionStore } from '@/stores/transaction'
import { useCategoryStore } from '@/stores/category'
import { useSettingsStore } from '@/stores/settings'
import type { TransactionType } from '@/types'
import { Edit, Delete } from '@element-plus/icons-vue'

const router = useRouter()
const transactionStore = useTransactionStore()
const categoryStore = useCategoryStore()
const settingsStore = useSettingsStore()

const currency = computed(() => settingsStore.settings.currency)
const isDark = computed(() => settingsStore.settings.darkMode)

const filters = ref({
  type: '' as '' | TransactionType,
  categoryId: '',
  startDate: '',
  endDate: ''
})

const filteredTransactions = computed(() => {
  let result = [...transactionStore.sortedTransactions]
  
  if (filters.value.type) {
    result = result.filter(t => t.type === filters.value.type)
  }
  
  if (filters.value.categoryId) {
    result = result.filter(t => t.categoryId === filters.value.categoryId)
  }
  
  if (filters.value.startDate) {
    result = result.filter(t => t.date >= filters.value.startDate)
  }
  
  if (filters.value.endDate) {
    result = result.filter(t => t.date <= filters.value.endDate)
  }
  
  return result
})

const categoriesByType = computed(() => {
  if (filters.value.type) {
    return filters.value.type === 'income' 
      ? categoryStore.incomeCategories 
      : categoryStore.expenseCategories
  }
  return categoryStore.categories
})

function getCategoryById(id: string) {
  return categoryStore.getCategoryById(id)
}

function formatAmount(amount: number) {
  return `${currency.value}${amount.toFixed(2)}`
}

function resetFilters() {
  filters.value = {
    type: '',
    categoryId: '',
    startDate: '',
    endDate: ''
  }
}

function goToEdit(id: string) {
  router.push(`/edit-transaction/${id}`)
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    transactionStore.deleteTransaction(id)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}
</script>

<template>
  <div class="transactions-page">
    <el-card class="filter-card">
      <el-form :inline="true" class="filter-form">
        <el-form-item label="类型">
          <el-select v-model="filters.type" placeholder="全部" clearable style="width: 120px">
            <el-option label="收入" value="income" />
            <el-option label="支出" value="expense" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="filters.categoryId" placeholder="全部" clearable style="width: 150px">
            <el-option
              v-for="cat in categoriesByType"
              :key="cat.id"
              :label="`${cat.icon} ${cat.name}`"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="filters.startDate"
            type="date"
            placeholder="开始日期"
            value-format="YYYY-MM-DD"
            style="width: 150px"
          />
          <span style="margin: 0 8px">至</span>
          <el-date-picker
            v-model="filters.endDate"
            type="date"
            placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>账单列表</span>
          <span class="count">共 {{ filteredTransactions.length }} 条记录</span>
        </div>
      </template>
      
      <el-table
        :data="filteredTransactions"
        style="width: 100%"
        :stripe="!isDark"
        v-loading="false"
        empty-text="暂无账单记录"
      >
        <el-table-column prop="date" label="日期" width="140" sortable />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'income' ? 'success' : 'danger'" effect="light">
              {{ row.type === 'income' ? '收入' : '支出' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="160">
          <template #default="{ row }">
            <span>
              {{ getCategoryById(row.categoryId)?.icon }}
              {{ getCategoryById(row.categoryId)?.name }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column label="金额" width="140" align="right">
          <template #default="{ row }">
            <span :class="row.type === 'income' ? 'income-text' : 'expense-text'" style="font-weight: 600">
              {{ row.type === 'income' ? '+' : '-' }}{{ formatAmount(row.amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              :icon="Edit"
              @click="goToEdit(row.id)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              link
              size="small"
              :icon="Delete"
              @click="handleDelete(row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.transactions-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-card {
  border: none;
  border-radius: 12px;
}

.filter-form {
  margin-bottom: 0;
}

.table-card {
  border: none;
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.count {
  font-size: 14px;
  font-weight: normal;
  color: #6b7280;
}

.income-text {
  color: #4CAF50;
}

.expense-text {
  color: #F44336;
}
</style>
