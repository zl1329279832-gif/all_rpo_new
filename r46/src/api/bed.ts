import { getBedList as _getBedList, getBedByDepartment as _getBedByDepartment } from '@/services/dataService'

export function getBedList(params?: { department?: string }) {
  return Promise.resolve(_getBedList(params || {}))
}

export function getBedByDepartment() {
  return Promise.resolve(_getBedByDepartment())
}
