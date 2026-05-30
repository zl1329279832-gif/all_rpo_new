import { get, post } from './request'
import type { ApiResult, AlertData, PageResult } from '@/types'

interface AlertListResult extends PageResult<AlertData> {
  highCount: number
  mediumCount: number
  lowCount: number
  pendingCount: number
  processingCount: number
  resolvedCount: number
}

export interface HandleRecord {
  id: string
  handler: string
  handleTime: string
  action: string
  note: string
}

export const getAlertList = (params?: {
  level?: string
  status?: string
  type?: string
  page?: number
  pageSize?: number
}) => {
  return get<ApiResult<AlertListResult>>('/alert/list', params)
}

export const getAlertDetail = (params: { id: string }) => {
  return get<ApiResult<{
    alert: AlertData
    handleRecords: HandleRecord[]
    suggestions: string[]
  }>>('/alert/detail', params)
}

export const handleAlert = (params: { id: string; status: string; note: string }) => {
  return post<ApiResult<any>>('/alert/handle', params)
}

export const batchHandle = (params: { ids: string[]; note: string }) => {
  return post<ApiResult<any>>('/alert/batch-handle', params)
}

export const batchIgnore = (params: { ids: string[]; note: string }) => {
  return post<ApiResult<any>>('/alert/batch-ignore', params)
}

export const getAlertStatistics = () => {
  return get<ApiResult<any>>('/alert/statistics')
}

export const getAlertTypeDistribution = () => {
  return get<ApiResult<{ name: string; value: number }[]>>('/alert/type-distribution')
}

export const getAlertTrend = () => {
  return get<ApiResult<{ date: string; high: number; medium: number; low: number }[]>>('/alert/trend')
}
