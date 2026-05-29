import { mockLoaders } from '../mock'
import type { DailyStatus } from '../types'

export interface DailyStatusQuery {
  startDate?: string
  endDate?: string
  roomTypeId?: string
  roomTypeName?: string
  page?: number
  pageSize?: number
}

async function getList(query: DailyStatusQuery = {}): Promise<{ list: DailyStatus[], total: number }> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  let list = mockLoaders.getDailyStatus()

  if (query.startDate) {
    list = list.filter(item => item.date >= query.startDate!)
  }
  if (query.endDate) {
    list = list.filter(item => item.date <= query.endDate!)
  }
  if (query.roomTypeId) {
    list = list.filter(item => item.roomTypeId === query.roomTypeId)
  }
  if (query.roomTypeName) {
    list = list.filter(item => (item.roomTypeName || '').includes(query.roomTypeName!))
  }

  const page = query.page || 1
  const pageSize = query.pageSize || 30
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginatedList = list.slice(start, end)

  return {
    list: paginatedList,
    total: list.length
  }
}

async function getByDate(date: string): Promise<DailyStatus[]> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const list = mockLoaders.getDailyStatus()
  return list.filter(item => item.date === date)
}

async function getByDateRange(startDate: string, endDate: string): Promise<DailyStatus[]> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const list = mockLoaders.getDailyStatus()
  return list.filter(item => item.date >= startDate && item.date <= endDate)
}

async function getSummary(startDate?: string, endDate?: string): Promise<{
  totalRooms: number
  soldRooms: number
  availableRooms: number
  avgOccupancy: number
  avgPrice: number
}> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  let list = mockLoaders.getDailyStatus()

  if (startDate) {
    list = list.filter(item => item.date >= startDate)
  }
  if (endDate) {
    list = list.filter(item => item.date <= endDate)
  }

  if (list.length === 0) {
    return {
      totalRooms: 0,
      soldRooms: 0,
      availableRooms: 0,
      avgOccupancy: 0,
      avgPrice: 0
    }
  }

  const totalRooms = list[0].totalRooms
  const soldRooms = Math.round(list.reduce((sum, item) => sum + (item.soldRooms || item.occupiedRooms), 0) / list.length)
  const availableRooms = totalRooms - soldRooms
  const avgOccupancy = Math.round(list.reduce((sum, item) => sum + (item.occupancy || item.occupancyRate), 0) / list.length)
  const avgPrice = Math.round(list.reduce((sum, item) => sum + (item.price || item.avgDailyRate), 0) / list.length)

  return {
    totalRooms,
    soldRooms,
    availableRooms,
    avgOccupancy,
    avgPrice
  }
}

export const dailyStatusApi = {
  getList,
  getByDate,
  getByDateRange,
  getSummary
}

export type { DailyStatus }
