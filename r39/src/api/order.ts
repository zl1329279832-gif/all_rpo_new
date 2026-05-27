import request from '../utils/request'
import type { ApiResponse, PageResult, Order, PageParams, OrderStatus } from '../types'

export interface OrderParams extends PageParams {
  stationId?: string
  status?: OrderStatus
  keyword?: string
  startDate?: string
  endDate?: string
}

export function getOrderList(params: OrderParams) {
  return request.get<any, ApiResponse<PageResult<Order>>>('/order/list', { params })
}

export function getOrderDetail(id: string) {
  return request.get<any, ApiResponse<Order>>('/order/detail', { params: { id } })
}

export function exportOrders(params: Partial<OrderParams>) {
  return request.post<any, ApiResponse<{ downloadUrl: string }>>('/order/export', params)
}

export function getOrderTrend() {
  return request.get<any, ApiResponse>('/order/trend')
}
