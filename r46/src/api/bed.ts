import { get } from './request'
import type { ApiResult, BedData } from '@/types'

interface BedListResult {
  list: BedData[]
  total: number
  occupied: number
  empty: number
  reserved: number
  cleaning: number
  occupancyRate: number
}

export const getBedList = (params?: { department?: string }) => {
  return get<ApiResult<BedListResult>>('/bed/list', params)
}

export const getBedTrend = () => {
  return get<ApiResult<any[]>>('/bed/trend')
}

export const getBedByDepartment = () => {
  return get<ApiResult<any[]>>('/bed/department')
}
