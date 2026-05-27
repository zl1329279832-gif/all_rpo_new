import request from '../utils/request'
import type { ApiResponse } from '../types'

export function getReportOverview(period: 'week' | 'month' | 'quarter') {
  return request.get<any, ApiResponse>('/report/overview', { params: { period } })
}

export function exportReport(period: 'week' | 'month' | 'quarter') {
  return request.post<any, ApiResponse<{ downloadUrl: string }>>('/report/export', { period })
}
