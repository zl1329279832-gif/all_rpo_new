import type { Category, Transaction, Budget } from '@/types'
import { generateId } from './storage'

const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth() + 1

function getDateString(dayOffset: number = 0): string {
  const date = new Date()
  date.setDate(date.getDate() + dayOffset)
  return date.toISOString().split('T')[0]
}

export const defaultCategories: Category[] = [
  { id: 'cat_1', name: '工资', icon: '💰', type: 'income', color: '#67C23A' },
  { id: 'cat_2', name: '奖金', icon: '🎁', type: 'income', color: '#E6A23C' },
  { id: 'cat_3', name: '投资收益', icon: '📈', type: 'income', color: '#409EFF' },
  { id: 'cat_4', name: '餐饮', icon: '🍜', type: 'expense', color: '#F56C6C' },
  { id: 'cat_5', name: '交通', icon: '🚗', type: 'expense', color: '#909399' },
  { id: 'cat_6', name: '购物', icon: '🛒', type: 'expense', color: '#E91E63' },
  { id: 'cat_7', name: '娱乐', icon: '🎮', type: 'expense', color: '#9C27B0' },
  { id: 'cat_8', name: '住房', icon: '🏠', type: 'expense', color: '#00BCD4' },
  { id: 'cat_9', name: '医疗', icon: '💊', type: 'expense', color: '#FF9800' },
  { id: 'cat_10', name: '教育', icon: '📚', type: 'expense', color: '#795548' }
]

export const defaultTransactions: Transaction[] = [
  { id: generateId(), type: 'income', categoryId: 'cat_1', amount: 15000, description: '5月工资', date: getDateString(-15), createdAt: getDateString(-15) },
  { id: generateId(), type: 'income', categoryId: 'cat_3', amount: 500, description: '股票收益', date: getDateString(-10), createdAt: getDateString(-10) },
  { id: generateId(), type: 'expense', categoryId: 'cat_4', amount: 35, description: '午餐', date: getDateString(-2), createdAt: getDateString(-2) },
  { id: generateId(), type: 'expense', categoryId: 'cat_6', amount: 299, description: '买衣服', date: getDateString(-3), createdAt: getDateString(-3) },
  { id: generateId(), type: 'expense', categoryId: 'cat_5', amount: 15, description: '打车', date: getDateString(-1), createdAt: getDateString(-1) },
  { id: generateId(), type: 'expense', categoryId: 'cat_8', amount: 3500, description: '房租', date: getDateString(-20), createdAt: getDateString(-20) },
  { id: generateId(), type: 'expense', categoryId: 'cat_7', amount: 89, description: '电影票', date: getDateString(-5), createdAt: getDateString(-5) },
  { id: generateId(), type: 'expense', categoryId: 'cat_4', amount: 58, description: '晚餐', date: getDateString(-1), createdAt: getDateString(-1) },
  { id: generateId(), type: 'income', categoryId: 'cat_2', amount: 2000, description: '项目奖金', date: getDateString(-8), createdAt: getDateString(-8) },
  { id: generateId(), type: 'expense', categoryId: 'cat_9', amount: 120, description: '药品', date: getDateString(-12), createdAt: getDateString(-12) },
  { id: generateId(), type: 'expense', categoryId: 'cat_4', amount: 25, description: '早餐', date: getDateString(0), createdAt: getDateString(0) },
  { id: generateId(), type: 'expense', categoryId: 'cat_5', amount: 8, description: '地铁', date: getDateString(0), createdAt: getDateString(0) }
]

export const defaultBudgets: Budget[] = [
  { id: generateId(), categoryId: 'cat_4', amount: 2000, month: `${currentYear}-${String(currentMonth).padStart(2, '0')}` },
  { id: generateId(), categoryId: 'cat_6', amount: 3000, month: `${currentYear}-${String(currentMonth).padStart(2, '0')}` },
  { id: generateId(), categoryId: 'cat_7', amount: 500, month: `${currentYear}-${String(currentMonth).padStart(2, '0')}` }
]
