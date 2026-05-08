<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCategoryStore } from '@/stores/category'
import type { Category, TransactionType } from '@/types'
import { Edit, Delete, Plus } from '@element-plus/icons-vue'

const categoryStore = useCategoryStore()

const activeTab = ref<TransactionType>('expense')
const dialogVisible = ref(false)
const editingCategory = ref<Category | null>(null)

const icons = ['💰', '🎁', '📈', '🍜', '🚗', '🛒', '🎮', '🏠', '💊', '📚', '💼', '🎨', '✈️', '🎵', '💻']
const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#E91E63', '#9C27B0', '#00BCD4', '#FF9800', '#795548']

const formData = reactive({
  name: '',
  icon: icons[0],
  color: colors[0]
})

const currentCategories = computed(() => {
  return activeTab.value === 'income'
    ? categoryStore.incomeCategories
    : categoryStore.expenseCategories
})

function handleTabChange(tab: TransactionType) {
  activeTab.value = tab
}

function openAddDialog() {
  editingCategory.value = null
  formData.name = ''
  formData.icon = icons[0]
  formData.color = colors[0]
  dialogVisible.value = true
}

function openEditDialog(category: Category) {
  editingCategory.value = category
  formData.name = category.name
  formData.icon = category.icon
  formData.color = category.color
  dialogVisible.value = true
}

function handleSubmit() {
  if (!formData.name.trim()) {
    ElMessage.warning('请输入分类名称')
    return
  }
  
  if (editingCategory.value) {
    categoryStore.updateCategory(editingCategory.value.id, {
      name: formData.name,
      icon: formData.icon,
      color: formData.color
    })
    ElMessage.success('更新成功')
  } else {
    categoryStore.addCategory(
      formData.name,
      formData.icon,
      activeTab.value,
      formData.color
    )
    ElMessage.success('添加成功')
  }
  
  dialogVisible.value = false
}

async function handleDelete(category: Category) {
  try {
    await ElMessageBox.confirm(`确定要删除分类"${category.name}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    categoryStore.deleteCategory(category.id)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}
</script>

<template>
  <div class="categories-page">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span>分类管理</span>
          <el-button type="primary" :icon="Plus" @click="openAddDialog">
            添加分类
          </el-button>
        </div>
      </template>
      
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="支出分类" name="expense">
          <div class="category-grid">
            <div v-for="cat in currentCategories" :key="cat.id" class="category-item">
              <div class="category-info">
                <div class="category-icon" :style="{ backgroundColor: cat.color + '20', color: cat.color }">
                  {{ cat.icon }}
                </div>
                <span class="category-name">{{ cat.name }}</span>
              </div>
              <div class="category-actions">
                <el-button type="primary" link :icon="Edit" @click="openEditDialog(cat)" />
                <el-button type="danger" link :icon="Delete" @click="handleDelete(cat)" />
              </div>
            </div>
            <el-empty v-if="currentCategories.length === 0" description="暂无分类" />
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="收入分类" name="income">
          <div class="category-grid">
            <div v-for="cat in currentCategories" :key="cat.id" class="category-item">
              <div class="category-info">
                <div class="category-icon" :style="{ backgroundColor: cat.color + '20', color: cat.color }">
                  {{ cat.icon }}
                </div>
                <span class="category-name">{{ cat.name }}</span>
              </div>
              <div class="category-actions">
                <el-button type="primary" link :icon="Edit" @click="openEditDialog(cat)" />
                <el-button type="danger" link :icon="Delete" @click="handleDelete(cat)" />
              </div>
            </div>
            <el-empty v-if="currentCategories.length === 0" description="暂无分类" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <el-dialog v-model="dialogVisible" :title="editingCategory ? '编辑分类' : '添加分类'" width="500px">
      <el-form label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="formData.name" placeholder="请输入分类名称" maxlength="20" />
        </el-form-item>
        <el-form-item label="图标">
          <div class="icon-picker">
            <div
              v-for="icon in icons"
              :key="icon"
              class="icon-item"
              :class="{ active: formData.icon === icon }"
              @click="formData.icon = icon"
            >
              {{ icon }}
            </div>
          </div>
        </el-form-item>
        <el-form-item label="颜色">
          <div class="color-picker">
            <div
              v-for="color in colors"
              :key="color"
              class="color-item"
              :class="{ active: formData.color === color }"
              :style="{ backgroundColor: color }"
              @click="formData.color = color"
            />
          </div>
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
.categories-page {
  max-width: 900px;
  margin: 0 auto;
}

.main-card {
  border: none;
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  padding: 8px 0;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  transition: all 0.2s;
}

.category-item:hover {
  background: #eef2ff;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.category-name {
  font-size: 15px;
  font-weight: 500;
  color: #374151;
}

.category-actions {
  display: flex;
  gap: 4px;
}

.icon-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.icon-item {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
  background: #f8fafc;
}

.icon-item:hover {
  background: #eef2ff;
}

.icon-item.active {
  border-color: #409EFF;
  background: #ecf5ff;
}

.color-picker {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.color-item {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.2s;
}

.color-item.active {
  border-color: #1f2937;
  transform: scale(1.1);
}
</style>
