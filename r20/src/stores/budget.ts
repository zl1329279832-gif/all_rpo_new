import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Budget } from '@/types'
import { getStorage, setStorage, generateId } from '@/utils/storage'
import { defaultBudgets } from '@/utils/mockData'

const STORAGE_KEY = 'finance_budgets'

export const useBudgetStore = defineStore('budget', () => {
  const budgets = ref<Budget[]>(getStorage<Budget[]>(STORAGE_KEY, defaultBudgets))

  watch(
    () => budgets.value,
    (val) => setStorage(STORAGE_KEY, val),
    { deep: true }
  )

  function getBudgetByCategoryAndMonth(categoryId: string, month: string): Budget | undefined {
    return budgets.value.find(b => b.categoryId === categoryId && b.month === month)
  }

  function getBudgetsByMonth(month: string): Budget[] {
    return budgets.value.filter(b => b.month === month)
  }

  function addBudget(categoryId: string, amount: number, month: string): Budget {
    const existing = getBudgetByCategoryAndMonth(categoryId, month)
    if (existing) {
      existing.amount = amount
      return existing
    }
    const budget: Budget = {
      id: generateId(),
      categoryId,
      amount,
      month
    }
    budgets.value.push(budget)
    return budget
  }

  function updateBudget(id: string, amount: number): void {
    const budget = budgets.value.find(b => b.id === id)
    if (budget) {
      budget.amount = amount
    }
  }

  function deleteBudget(id: string): void {
    const index = budgets.value.findIndex(b => b.id === id)
    if (index !== -1) {
      budgets.value.splice(index, 1)
    }
  }

  return {
    budgets,
    getBudgetByCategoryAndMonth,
    getBudgetsByMonth,
    addBudget,
    updateBudget,
    deleteBudget
  }
})
