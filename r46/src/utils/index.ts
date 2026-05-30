import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num >= 100000000) {
    return (num / 100000000).toFixed(2) + '亿'
  } else if (num >= 10000) {
    return (num / 10000).toFixed(2) + '万'
  }
  return num.toLocaleString()
}

export function formatPercent(num: number): string {
  return num.toFixed(2) + '%'
}

export function formatMoney(num: number): string {
  if (num >= 100000000) {
    return '¥' + (num / 100000000).toFixed(2) + '亿'
  } else if (num >= 10000) {
    return '¥' + (num / 10000).toFixed(2) + '万'
  }
  return '¥' + num.toLocaleString()
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${formatDate(d)} ${hours}:${minutes}`
}

export function getDateRange(range: string): { startDate: string; endDate: string } {
  const today = new Date()
  const endDate = formatDate(today)
  let startDate: string

  switch (range) {
    case 'today':
      startDate = endDate
      break
    case 'yesterday':
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      startDate = formatDate(yesterday)
      break
    case 'week':
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      startDate = formatDate(weekAgo)
      break
    case 'month':
      const monthAgo = new Date(today)
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      startDate = formatDate(monthAgo)
      break
    case 'quarter':
      const quarterAgo = new Date(today)
      quarterAgo.setMonth(quarterAgo.getMonth() - 3)
      startDate = formatDate(quarterAgo)
      break
    case 'year':
      const yearAgo = new Date(today)
      yearAgo.setFullYear(yearAgo.getFullYear() - 1)
      startDate = formatDate(yearAgo)
      break
    default:
      startDate = endDate
  }

  return { startDate, endDate }
}

export function getTrendColor(value: number, isPositiveGood: boolean = true): string {
  if (value === 0) return '#999'
  if (isPositiveGood) {
    return value > 0 ? '#4CAF50' : '#F44336'
  } else {
    return value > 0 ? '#F44336' : '#4CAF50'
  }
}

export function getAlertLevelColor(level: string): string {
  switch (level) {
    case 'high':
      return '#F44336'
    case 'medium':
      return '#FF9800'
    case 'low':
      return '#4CAF50'
    default:
      return '#999'
  }
}

export function getBedStatusColor(status: string): string {
  switch (status) {
    case 'occupied':
      return '#F44336'
    case 'empty':
      return '#4CAF50'
    case 'reserved':
      return '#FF9800'
    case 'cleaning':
      return '#2196F3'
    default:
      return '#999'
  }
}

export function getBedStatusText(status: string): string {
  switch (status) {
    case 'occupied':
      return '已占用'
    case 'empty':
      return '空床'
    case 'reserved':
      return '已预约'
    case 'cleaning':
      return '清洁中'
    default:
      return '未知'
  }
}

export function randomRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomFloat(min: number, max: number, decimals: number = 2): number {
  return Number((Math.random() * (max - min) + min).toFixed(decimals))
}
