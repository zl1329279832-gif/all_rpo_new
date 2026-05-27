import request from '../utils/request'
import type { ApiResponse, DashboardStats, ChartData, TrendData } from '../types'

export function getDashboardStats() {
  return request.get<any, ApiResponse<DashboardStats>>('/dashboard/stats')
}

export function getDeviceStatusChart() {
  return request.get<any, ApiResponse<ChartData[]>>('/dashboard/device-status')
}

export function getOrderTrend() {
  return request.get<any, ApiResponse<TrendData[]>>('/dashboard/order-trend')
}

export function getIncomeTrend() {
  return request.get<any, ApiResponse<TrendData[]>>('/dashboard/income-trend')
}

export function getAreaHeat() {
  return request.get<any, ApiResponse>('/dashboard/area-heat')
}

export function getRecentAlarms() {
  return request.get<any, ApiResponse>('/dashboard/recent-alarms')
}
