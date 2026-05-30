import { get, post } from './request'
import type { ApiResult, ReportData, PageResult } from '@/types'

export interface ReportHistoryItem {
  id: string
  name: string
  type: string
  createTime: string
  creator: string
  status: 'completed' | 'generating' | 'failed'
  isFavorite: boolean
}

export const getReportList = (params?: {
  type?: string
  department?: string
  startDate?: string
  endDate?: string
  period?: string
  metrics?: string[]
  page?: number
  pageSize?: number
}) => {
  return get<ApiResult<PageResult<ReportData>>>('/report/list', params)
}

export const getReportHistory = (params?: {
  page?: number
  pageSize?: number
}) => {
  return get<ApiResult<PageResult<ReportHistoryItem>>>('/report/history', params)
}

export const exportReport = (params?: {
  ids?: string[]
  format?: string
  type?: string
  department?: string
  startDate?: string
  endDate?: string
  period?: string
  metrics?: string[]
}) => {
  return post<ApiResult<{ downloadUrl: string; filename: string; totalCount: number; format: string }>>(
    '/report/export',
    params
  )
}

export const toggleFavorite = (params: { id: string; isFavorite: boolean }) => {
  return post<ApiResult<any>>('/report/favorite', params)
}

export const getReportSummary = () => {
  return get<ApiResult<any>>('/report/summary')
}
