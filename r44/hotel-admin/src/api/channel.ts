import { mockLoaders } from '../mock'
import type { Channel, ChannelType } from '../types'

export interface ChannelQuery {
  name?: string
  type?: string
  status?: string
  page?: number
  pageSize?: number
}

export interface ChannelCreate {
  name: string
  code: string
  type: 'ota' | 'direct' | 'corporate' | 'other'
  commissionRate: number
  contact: string
  phone: string
  status: 'active' | 'inactive'
}

export interface ChannelUpdate extends Partial<ChannelCreate> {
  id: string
}

async function getList(query: ChannelQuery = {}): Promise<{ list: Channel[], total: number }> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  let list = mockLoaders.getChannels()

  if (query.name) {
    list = list.filter(item => item.name.includes(query.name!))
  }
  if (query.type) {
    list = list.filter(item => item.type === query.type)
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

async function getById(id: string): Promise<Channel | null> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const list = mockLoaders.getChannels()
  return list.find(item => item.id === id) || null
}

async function getAll(): Promise<Channel[]> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  return mockLoaders.getChannels()
}

async function getActive(): Promise<Channel[]> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const list = mockLoaders.getChannels()
  return list.filter(item => item.status === 'active')
}

async function create(data: ChannelCreate): Promise<Channel> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const list = mockLoaders.getChannels()
  const now = new Date().toISOString()
  const newItem: Channel = {
    id: String(Date.now()),
    name: data.name,
    code: data.code,
    type: data.type as ChannelType,
    description: '',
    contactPerson: data.contact,
    contactPhone: data.phone,
    commissionRate: data.commissionRate,
    settlementPeriod: 7,
    isActive: data.status === 'active',
    status: data.status,
    orderCount: 0,
    revenue: 0,
    createdAt: now,
    updatedAt: now
  }
  list.push(newItem)
  mockLoaders.setChannels(list)
  return newItem
}

async function update(data: ChannelUpdate): Promise<Channel> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const list = mockLoaders.getChannels()
  const index = list.findIndex(item => item.id === data.id)
  if (index === -1) {
    throw new Error('渠道不存在')
  }
  const updated: Channel = {
    ...list[index],
    ...data,
    type: data.type as ChannelType || list[index].type
  }
  list[index] = updated
  mockLoaders.setChannels(list)
  return updated
}

async function remove(id: string): Promise<void> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const list = mockLoaders.getChannels()
  const filtered = list.filter(item => item.id !== id)
  mockLoaders.setChannels(filtered)
}

async function toggleStatus(id: string): Promise<Channel> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const list = mockLoaders.getChannels()
  const index = list.findIndex(item => item.id === id)
  if (index === -1) {
    throw new Error('渠道不存在')
  }
  list[index].status = list[index].status === 'active' ? 'inactive' : 'active'
  mockLoaders.setChannels(list)
  return list[index]
}

async function getStatistics(_startDate?: string, _endDate?: string): Promise<{
  channel: string
  orderCount: number
  revenue: number
  avgOrderValue: number
  commission: number
}[]> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const list = mockLoaders.getChannels()

  return list.map(item => {
    const orderCount = item.orderCount || 50 + Math.floor(Math.random() * 150)
    const revenue = item.revenue || 50000 + Math.floor(Math.random() * 200000)
    return {
      channel: item.name,
      orderCount,
      revenue,
      avgOrderValue: orderCount > 0 ? Math.round(revenue / orderCount) : 0,
      commission: Math.round(revenue * item.commissionRate / 100)
    }
  })
}

export const channelApi = {
  getList,
  getById,
  getAll,
  getActive,
  create,
  update,
  remove,
  toggleStatus,
  getStatistics
}

export type { Channel }
