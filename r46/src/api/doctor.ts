import { get } from './request'
import type { ApiResult, DoctorData, PageResult } from '@/types'

export const getDoctorList = (params?: { department?: string; page?: number; pageSize?: number }) => {
  return get<ApiResult<PageResult<DoctorData>>>('/doctor/list', params)
}

export const getDoctorRank = () => {
  return get<ApiResult<any[]>>('/doctor/rank')
}

export const getDoctorDetail = (params: { id: string }) => {
  return get<ApiResult<any>>('/doctor/detail', params)
}
