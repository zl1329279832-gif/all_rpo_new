import request from '../utils/request'
import type { ApiResponse, PageResult, PriceStrategy, PageParams } from '../types'

export function getPriceList(params: PageParams & { status?: string }) {
  return request.get<any, ApiResponse<PageResult<PriceStrategy>>>('/price/list', { params })
}

export function createPrice(data: Partial<PriceStrategy>) {
  return request.post<any, ApiResponse<PriceStrategy>>('/price', data)
}

export function updatePrice(data: Partial<PriceStrategy>) {
  return request.put<any, ApiResponse<PriceStrategy>>('/price', data)
}

export function deletePrice(id: string) {
  return request.delete<any, ApiResponse>('/price', { params: { id } })
}
