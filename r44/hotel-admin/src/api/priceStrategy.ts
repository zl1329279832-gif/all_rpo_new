import { mockLoaders } from '../mock'
import type { PriceStrategy } from '../types'

export interface PriceStrategyQuery {
  name?: string
  roomTypeId?: string
  status?: string
  page?: number
  pageSize?: number
}

export interface PriceStrategyCreate {
  name: string
  roomTypeId: string
  roomTypeName: string
  startDate: string
  endDate: string
  basePrice: number
  weekendPrice: number
  holidayPrice: number
  minDays: number
  maxDays: number
  discount: number
  status: 'active' | 'inactive'
}

export interface PriceStrategyUpdate extends Partial<PriceStrategyCreate> {
  id: string
}

async function getList(query: PriceStrategyQuery = {}): Promise<{ list: PriceStrategy[], total: number }> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  let list = mockLoaders.getPriceStrategies()

  if (query.name) {
    list = list.filter(item => item.name.includes(query.name!))
  }
  if (query.roomTypeId) {
    list = list.filter(item => item.roomTypeId === query.roomTypeId)
  }
  if (query.status) {
    list = list.filter(item => item.status === query.status)
  }

  const page = query.page || 1
  const pageSize = query.pageSize || 10
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginatedList = list.slice(start, end)

  return {
    list: paginatedList,
    total: list.length
  }
}

async function getById(id: string): Promise<PriceStrategy | null> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const list = mockLoaders.getPriceStrategies()
  return list.find(item => item.id === id) || null
}

async function getActiveStrategies(roomTypeId?: string): Promise<PriceStrategy[]> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  let list = mockLoaders.getPriceStrategies()
  list = list.filter(item => item.status === 'active')
  if (roomTypeId) {
    list = list.filter(item => item.roomTypeId === roomTypeId)
  }
  return list
}

async function create(data: PriceStrategyCreate): Promise<PriceStrategy> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const list = mockLoaders.getPriceStrategies()
  const now = new Date().toISOString()
  const newItem: PriceStrategy = {
    ...data,
    id: String(Date.now()),
    weekdays: [1, 2, 3, 4, 5],
    isActive: data.status === 'active',
    discountRate: data.discount,
    minStay: data.minDays,
    maxStay: data.maxDays,
    priority: list.length + 1,
    createdAt: now,
    updatedAt: now
  }
  list.push(newItem)
  mockLoaders.setPriceStrategies(list)
  return newItem
}

async function update(data: PriceStrategyUpdate): Promise<PriceStrategy> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const list = mockLoaders.getPriceStrategies()
  const index = list.findIndex(item => item.id === data.id)
  if (index === -1) {
    throw new Error('价格策略不存在')
  }
  const updated: PriceStrategy = {
    ...list[index],
    ...data,
    updatedAt: new Date().toISOString().split('T')[0]
  }
  list[index] = updated
  mockLoaders.setPriceStrategies(list)
  return updated
}

async function remove(id: string): Promise<void> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const list = mockLoaders.getPriceStrategies()
  const filtered = list.filter(item => item.id !== id)
  mockLoaders.setPriceStrategies(filtered)
}

async function toggleStatus(id: string): Promise<PriceStrategy> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const list = mockLoaders.getPriceStrategies()
  const index = list.findIndex(item => item.id === id)
  if (index === -1) {
    throw new Error('价格策略不存在')
  }
  const currentStatus = list[index].status || (list[index].isActive ? 'active' : 'inactive')
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
  list[index].status = newStatus
  list[index].isActive = newStatus === 'active'
  list[index].updatedAt = new Date().toISOString().split('T')[0]
  mockLoaders.setPriceStrategies(list)
  return list[index]
}

export const priceStrategyApi = {
  getList,
  getById,
  getActiveStrategies,
  create,
  update,
  remove,
  toggleStatus
}

export type { PriceStrategy }
