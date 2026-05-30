import {
  getReportList as _getReportList,
  getReportSummary as _getReportSummary,
  exportReport as _exportReport,
  getReportHistory as _getReportHistory,
  toggleFavorite as _toggleFavorite,
  generateReport as _generateReport,
} from '@/services/dataService'

export interface ReportHistoryItem {
  id: string
  name: string
  type: string
  createTime: string
  creator: string
  status: 'completed' | 'generating' | 'failed'
  isFavorite: boolean
}

export function getReportList(params?: {
  type?: string
  department?: string
  startDate?: string
  endDate?: string
  period?: string
  metrics?: string[]
  page?: number
  pageSize?: number
}) {
  return Promise.resolve(_getReportList(params || {}))
}

export function getReportSummary() {
  return Promise.resolve(_getReportSummary())
}

export function exportReport(params?: {
  ids?: string[]
  format?: string
  type?: string
  department?: string
  startDate?: string
  endDate?: string
  period?: string
  metrics?: string[]
}) {
  return Promise.resolve(_exportReport(params || {}))
}

export function getReportHistory(params?: {
  page?: number
  pageSize?: number
}) {
  return Promise.resolve(_getReportHistory(params))
}

export function toggleFavorite(params: { id: string; isFavorite: boolean }) {
  return Promise.resolve(_toggleFavorite(params))
}

export function generateReport(params: { type: string; period: string; departments: string[] }) {
  return Promise.resolve(_generateReport(params))
}
