import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Category, TransactionType } from '@/types'
import { getStorage, setStorage, generateId } from '@/utils/storage'
import { defaultCategories } from '@/utils/mockData'

const STORAGE_KEY = 'finance_categories'

export const useCategoryStore = defineStore('category', () => {
  const categories = ref<Category[]>(getStorage<Category[]>(STORAGE_KEY, defaultCategories))

  const incomeCategories = computed(() => categories.value.filter(c => c.type === 'income'))
  const expenseCategories = computed(() => categories.value.filter(c => c.type === 'expense'))

  watch(
    () => categories.value,
    (val) => setStorage(STORAGE_KEY, val),
    { deep: true }
  )

  function getCategoryById(id: string): Category | undefined {
    return categories.value.find(c => c.id === id)
  }

  function addCategory(name: string, icon: string, type: TransactionType, color: string): Category {
    const category: Category = {
      id: generateId(),
      name,
      icon,
      type,
      color
    }
    categories.value.push(category)
    return category
  }

  function updateCategory(id: string, updates: Partial<Omit<Category, 'id' | 'type'>>): void {
    const index = categories.value.findIndex(c => c.id === id)
    if (index !== -1) {
      categories.value[index] = { ...categories.value[index], ...updates }
    }
  }

  function deleteCategory(id: string): void {
    const index = categories.value.findIndex(c => c.id === id)
    if (index !== -1) {
      categories.value.splice(index, 1)
    }
  }

  return {
    categories,
    incomeCategories,
    expenseCategories,
    getCategoryById,
    addCategory,
    updateCategory,
    deleteCategory
  }
})
