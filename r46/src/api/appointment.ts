import {
  getAppointmentTrend as _getAppointmentTrend,
  getWaitingTime as _getWaitingTime,
  getAppointmentByDepartment as _getAppointmentByDepartment,
  getExaminationAppointment as _getExaminationAppointment,
  getAppointmentList as _getAppointmentList,
  getAppointmentOverview as _getAppointmentOverview,
} from '@/services/dataService'

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

export function getAppointmentTrend() {
  return Promise.resolve(_getAppointmentTrend())
}

export function getWaitingTime() {
  const result = _getWaitingTime()
  const avgWaitingTime = result.data.reduce((sum: number, item: any) => sum + item.avgWaitingTime, 0) / result.data.length
  const maxWaitingTime = Math.max(...result.data.map((item: any) => item.maxWaitingTime))
  return Promise.resolve({
    ...result,
    data: {
      avgWaitingTime,
      maxWaitingTime,
      minWaitingTime: Math.floor(avgWaitingTime * 0.5),
    },
  })
}

export function getAppointmentByDepartment() {
  const result = _getAppointmentByDepartment()
  return Promise.resolve({
    ...result,
    data: result.data.map((item: any) => ({
      department: item.department,
      count: item.totalAppointments,
    })),
  })
}

export function getExaminationAppointment() {
  const result = _getExaminationAppointment()
  return Promise.resolve({
    ...result,
    data: result.data.map((item: any) => ({
      name: item.type,
      value: item.count,
    })),
  })
}

export function getAppointmentList(params?: {
  status?: string
  department?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}) {
  return Promise.resolve(_getAppointmentList(params || {}))
}

export function getAppointmentOverview() {
  const result = _getAppointmentOverview()
  return Promise.resolve({
    ...result,
    data: {
      todayCount: result.data.today,
      pendingCount: result.data.pending,
      completedCount: result.data.completed,
      cancelledCount: result.data.cancelled,
    },
  })
}
