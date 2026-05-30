import { get } from './request'
import type { ApiResult, CoreMetrics, AlertData, TrendData } from '@/types'

export const getCoreMetrics = (params?: { department?: string; dateRange?: string }) => {
  return get<ApiResult<CoreMetrics>>('/overview/metrics', params)
}

export const getTrendData = (params?: { type?: string; days?: number }) => {
  return get<ApiResult<TrendData[]>>('/overview/trend', params)
}

export const getOverviewAlerts = () => {
  return get<ApiResult<AlertData[]>>('/overview/alerts')
}
