import { get } from './request'
import type { ApiResult, AppointmentTrend, PageResult } from '@/types'

export interface AppointmentListItem {
  id: string
  patientName: string
  phone: string
  department: string
  doctor: string
  appointmentTime: string
  type: string
  status: 'pending' | 'completed' | 'cancelled' | 'no_show'
  createTime: string
  remark?: string
}

export const getAppointmentList = (params?: {
  status?: string
  department?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}) => {
  return get<ApiResult<PageResult<AppointmentListItem>>>('/appointment/list', params)
}

export const getAppointmentTrend = () => {
  return get<ApiResult<AppointmentTrend[]>>('/appointment/trend')
}

export const getWaitingTime = () => {
  return get<ApiResult<{ avgWaitingTime: number; maxWaitingTime: number; minWaitingTime: number }>>('/appointment/waiting-time')
}

export const getAppointmentByDepartment = () => {
  return get<ApiResult<{ department: string; count: number }[]>>('/appointment/department')
}

export const getExaminationAppointment = () => {
  return get<ApiResult<{ name: string; value: number }[]>>('/appointment/examination')
}

export const getAppointmentOverview = () => {
  return get<ApiResult<{
    todayCount: number
    pendingCount: number
    completedCount: number
    cancelledCount: number
  }>>('/appointment/overview')
}
