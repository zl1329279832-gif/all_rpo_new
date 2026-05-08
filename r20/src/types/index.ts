export type TransactionType = 'income' | 'expense'

export interface Category {
  id: string
  name: string
  icon: string
  type: TransactionType
  color: string
}

export interface Transaction {
  id: string
  type: TransactionType
  categoryId: string
  amount: number
  description: string
  date: string
  createdAt: string
}

export interface Budget {
  id: string
  categoryId: string
  amount: number
  month: string
}

export interface AppSettings {
  darkMode: boolean
  currency: string
  language: string
}
