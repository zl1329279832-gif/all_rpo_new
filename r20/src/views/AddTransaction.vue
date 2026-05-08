<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useTransactionStore } from '@/stores/transaction'
import { useCategoryStore } from '@/stores/category'
import type { TransactionType } from '@/types'

const route = useRoute()
const router = useRouter()
const transactionStore = useTransactionStore()
const categoryStore = useCategoryStore()

const editId = computed(() => route.params.id as string)
const isEdit = computed(() => !!editId.value)

const formData = ref({
  type: 'expense' as TransactionType,
  categoryId: '',
  amount: 0,
  description: '',
  date: new Date().toISOString().split('T')[0]
})

const currentCategories = computed(() => {
  return formData.value.type === 'income'
    ? categoryStore.incomeCategories
    : categoryStore.expenseCategories
})

function resetCategory() {
  if (currentCategories.value.length > 0) {
    if (!currentCategories.value.find(c => c.id === formData.value.categoryId)) {
      formData.value.categoryId = currentCategories.value[0].id
    }
  } else {
    formData.value.categoryId = ''
  }
}

function handleTypeChange() {
  resetCategory()
}

function onSubmit() {
  if (!formData.value.categoryId) {
    ElMessage.warning('请选择分类')
    return
  }
  if (formData.value.amount <= 0) {
    ElMessage.warning('金额必须大于0')
    return
  }
  
  if (isEdit.value) {
    transactionStore.updateTransaction(editId.value, {
      type: formData.value.type,
      categoryId: formData.value.categoryId,
      amount: formData.value.amount,
      description: formData.value.description,
      date: formData.value.date
    })
    ElMessage.success('更新成功')
  } else {
    transactionStore.addTransaction(
      formData.value.type,
      formData.value.categoryId,
      formData.value.amount,
      formData.value.description,
      formData.value.date
    )
    ElMessage.success('添加成功')
  }
  
  router.push('/transactions')
}

function onCancel() {
  router.back()
}

onMounted(() => {
  resetCategory()
  
  if (isEdit.value) {
    const transaction = transactionStore.transactions.find(t => t.id === editId.value)
    if (transaction) {
      formData.value = {
        type: transaction.type,
        categoryId: transaction.categoryId,
        amount: transaction.amount,
        description: transaction.description,
        date: transaction.date
      }
    } else {
      ElMessage.error('记录不存在')
      router.push('/transactions')
    }
  }
})
</script>

<template>
  <div class="transaction-form-page">
    <el-card class="form-card">
      <template #header>
        <div class="card-title">{{ isEdit ? '编辑账单' : '记一笔' }}</div>
      </template>
      
      <el-form :model="formData" label-width="100px" class="transaction-form">
        <el-form-item label="类型">
          <el-radio-group v-model="formData.type" @change="handleTypeChange">
            <el-radio-button value="expense">支出</el-radio-button>
            <el-radio-button value="income">收入</el-radio-button>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="分类">
          <el-select v-model="formData.categoryId" placeholder="请选择分类" style="width: 100%">
            <el-option
              v-for="cat in currentCategories"
              :key="cat.id"
              :label="`${cat.icon} ${cat.name}`"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="金额">
          <el-input-number
            v-model="formData.amount"
            :min="0"
            :precision="2"
            :step="10"
            style="width: 100%"
            controls-position="right"
            placeholder="请输入金额"
          />
        </el-form-item>
        
        <el-form-item label="日期">
          <el-date-picker
            v-model="formData.date"
            type="date"
            value-format="YYYY-MM-DD"
            style="width: 100%"
            placeholder="选择日期"
          />
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述（可选）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="onSubmit" style="width: 120px">
            {{ isEdit ? '保存' : '添加' }}
          </el-button>
          <el-button @click="onCancel" style="margin-left: 12px; width: 120px">
            取消
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.transaction-form-page {
  max-width: 600px;
  margin: 0 auto;
}

.form-card {
  border: none;
  border-radius: 12px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
}

.transaction-form {
  max-width: 500px;
  margin: 0 auto;
}

:deep(.el-input-number) {
  width: 100%;
}
</style>
