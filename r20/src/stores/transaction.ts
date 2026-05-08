import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Transaction, TransactionType } from '@/types'
import { getStorage, setStorage, generateId } from '@/utils/storage'
import { defaultTransactions } from '@/utils/mockData'

const STORAGE_KEY = 'finance_transactions'

export const useTransactionStore = defineStore('transaction', () => {
  const transactions = ref<Transaction[]>(getStorage<Transaction[]>(STORAGE_KEY, defaultTransactions))

  watch(
    () => transactions.value,
    (val) => setStorage(STORAGE_KEY, val),
    { deep: true }
  )

  const sortedTransactions = computed(() => {
    return [...transactions.value].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  })

  function addTransaction(
    type: TransactionType,
    categoryId: string,
    amount: number,
    description: string,
    date: string
  ): Transaction {
    const transaction: Transaction = {
      id: generateId(),
      type,
      categoryId,
      amount,
      description,
      date,
      createdAt: new Date().toISOString().split('T')[0]
    }
    transactions.value.push(transaction)
    return transaction
  }

  function updateTransaction(id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>): void {
    const index = transactions.value.findIndex(t => t.id === id)
    if (index !== -1) {
      transactions.value[index] = { ...transactions.value[index], ...updates }
    }
  }

  function deleteTransaction(id: string): void {
    const index = transactions.value.findIndex(t => t.id === id)
    if (index !== -1) {
      transactions.value.splice(index, 1)
    }
  }

  function getTransactionsByDateRange(startDate: string, endDate: string): Transaction[] {
    return transactions.value.filter(t => t.date >= startDate && t.date <= endDate)
  }

  function getTransactionsByMonth(year: number, month: number): Transaction[] {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`
    return transactions.value.filter(t => t.date.startsWith(monthStr))
  }

  function getStatisticsByMonth(year: number, month: number) {
    const monthTransactions = getTransactionsByMonth(year, month)
    const totalIncome = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const totalExpense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense }
  }

  function getCategoryStatsByMonth(year: number, month: number, type: TransactionType) {
    const monthTransactions = getTransactionsByMonth(year, month).filter(t => t.type === type)
    const stats: Record<string, number> = {}
    monthTransactions.forEach(t => {
      stats[t.categoryId] = (stats[t.categoryId] || 0) + t.amount
    })
    return stats
  }

  function getDailyTrendByMonth(year: number, month: number) {
    const monthTransactions = getTransactionsByMonth(year, month)
    const daysInMonth = new Date(year, month, 0).getDate()
    const incomeByDay: Record<number, number> = {}
    const expenseByDay: Record<number, number> = {}

    for (let day = 1; day <= daysInMonth; day++) {
      incomeByDay[day] = 0
      expenseByDay[day] = 0
    }

    monthTransactions.forEach(t => {
      const day = parseInt(t.date.split('-')[2], 10)
      if (t.type === 'income') {
        incomeByDay[day] = (incomeByDay[day] || 0) + t.amount
      } else {
        expenseByDay[day] = (expenseByDay[day] || 0) + t.amount
      }
    })

    return { incomeByDay, expenseByDay, daysInMonth }
  }

  function getYearlySummary(year: number) {
    const monthlyData: Array<{
      month: number
      income: number
      expense: number
    }> = []

    for (let month = 1; month <= 12; month++) {
      const stats = getStatisticsByMonth(year, month)
      monthlyData.push({
        month,
        income: stats.totalIncome,
        expense: stats.totalExpense
      })
    }

    const totalIncome = monthlyData.reduce((sum, m) => sum + m.income, 0)
    const totalExpense = monthlyData.reduce((sum, m) => sum + m.expense, 0)

    return { monthlyData, totalIncome, totalExpense, balance: totalIncome - totalExpense }
  }

  return {
    transactions,
    sortedTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionsByDateRange,
    getTransactionsByMonth,
    getStatisticsByMonth,
    getCategoryStatsByMonth,
    getDailyTrendByMonth,
    getYearlySummary
  }
})
