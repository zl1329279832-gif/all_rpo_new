import { getDoctorList as _getDoctorList, getDoctorRank as _getDoctorRank, getDoctorDetail as _getDoctorDetail } from '@/services/dataService'

export function getDoctorList(params?: { department?: string; page?: number; pageSize?: number }) {
  return Promise.resolve(_getDoctorList(params || {}))
}

export function getDoctorRank() {
  return Promise.resolve(_getDoctorRank())
}

export function getDoctorDetail(params: { id: string }) {
  return Promise.resolve(_getDoctorDetail(params))
}
