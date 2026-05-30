import { get } from './request'
import type { ApiResult, DepartmentData, PageResult } from '@/types'

export const getDepartmentList = (params?: { dateRange?: string; department?: string; page?: number; pageSize?: number }) => {
  return get<ApiResult<PageResult<DepartmentData>>>('/department/list', params)
}

export const getDepartmentRank = () => {
  return get<ApiResult<DepartmentData[]>>('/department/rank')
}

export const getDepartmentDetail = (params: { id: string }) => {
  return get<ApiResult<DepartmentData>>('/department/detail', params)
}

export const getDepartmentTrend = () => {
  return get<ApiResult<any[]>>('/department/trend')
}
