import { getDepartmentList as _getDepartmentList, getDepartmentRank as _getDepartmentRank, getDepartmentDetail as _getDepartmentDetail } from '@/services/dataService'

export function getDepartmentList(params?: { dateRange?: string; department?: string; page?: number; pageSize?: number }) {
  return Promise.resolve(_getDepartmentList(params || {}))
}

export function getDepartmentRank() {
  return Promise.resolve(_getDepartmentRank())
}

export function getDepartmentDetail(params: { id: string }) {
  const result = _getDepartmentDetail(params)
  return Promise.resolve({
    ...result,
    data: {
      ...result.data,
      rank: 1,
    },
  })
}
