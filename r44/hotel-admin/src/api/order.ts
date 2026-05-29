import { mockLoaders } from '../mock'
import type { Order } from '../types'

export interface OrderQuery {
  orderNo?: string
  guestName?: string
  phone?: string
  roomTypeId?: string
  status?: string
  channel?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

export interface OrderExportParams {
  orderNo?: string
  guestName?: string
  phone?: string
  roomTypeId?: string
  status?: string
  channel?: string
  startDate?: string
  endDate?: string
  format?: 'csv' | 'excel'
}

async function getList(query: OrderQuery = {}): Promise<{ list: Order[], total: number }> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  let list = mockLoaders.getOrders()

  if (query.orderNo) {
    list = list.filter(item => item.orderNo.includes(query.orderNo!))
  }
  if (query.guestName) {
    list = list.filter(item => item.guestName.includes(query.guestName!))
  }
  if (query.phone) {
    list = list.filter(item => (item.phone || item.guestPhone || '').includes(query.phone!))
  }
  if (query.roomTypeId) {
    list = list.filter(item => item.roomTypeId === query.roomTypeId)
  }
  if (query.status) {
    list = list.filter(item => item.status === query.status)
  }
  if (query.channel) {
    list = list.filter(item => item.channel === query.channel)
  }
  if (query.startDate) {
    list = list.filter(item => item.checkInDate >= query.startDate!)
  }
  if (query.endDate) {
    list = list.filter(item => item.checkOutDate <= query.endDate!)
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

async function getById(id: string): Promise<Order | null> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const list = mockLoaders.getOrders()
  return list.find(item => item.id === id) || null
}

async function getByStatus(status: string): Promise<Order[]> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const list = mockLoaders.getOrders()
  return list.filter(item => item.status === status)
}

async function updateStatus(id: string, status: Order['status']): Promise<Order> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const list = mockLoaders.getOrders()
  const index = list.findIndex(item => item.id === id)
  if (index === -1) {
    throw new Error('订单不存在')
  }
  list[index].status = status
  list[index].updatedAt = new Date().toISOString()
  mockLoaders.setOrders(list)
  return list[index]
}

async function exportData(params: OrderExportParams): Promise<Blob> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  let list = mockLoaders.getOrders()

  if (params.orderNo) {
    list = list.filter(item => item.orderNo.includes(params.orderNo!))
  }
  if (params.guestName) {
    list = list.filter(item => item.guestName.includes(params.guestName!))
  }
  if (params.phone) {
    list = list.filter(item => (item.phone || item.guestPhone || '').includes(params.phone!))
  }
  if (params.roomTypeId) {
    list = list.filter(item => item.roomTypeId === params.roomTypeId)
  }
  if (params.status) {
    list = list.filter(item => item.status === params.status)
  }
  if (params.channel) {
    list = list.filter(item => item.channel === params.channel)
  }
  if (params.startDate) {
    list = list.filter(item => item.checkInDate >= params.startDate!)
  }
  if (params.endDate) {
    list = list.filter(item => item.checkOutDate <= params.endDate!)
  }

  const format = params.format || 'csv'
  let content = ''
  let mimeType = ''

  if (format === 'csv') {
    mimeType = 'text/csv;charset=utf-8'
    const headers = ['订单号', '客人姓名', '手机号', '房型', '房号', '入住日期', '退房日期', '金额', '状态', '渠道']
    content = headers.join(',') + '\n'
    list.forEach(item => {
      content += [
        item.orderNo,
        item.guestName,
        item.phone,
        item.roomTypeName,
        item.roomNo,
        item.checkInDate,
        item.checkOutDate,
        item.totalAmount,
        item.status,
        item.channel
      ].join(',') + '\n'
    })
  } else {
    mimeType = 'application/vnd.ms-excel'
    content = JSON.stringify(list)
  }

  return new Blob([content], { type: mimeType })
}

async function getStatistics(startDate?: string, endDate?: string): Promise<{
  totalOrders: number
  totalRevenue: number
  confirmedOrders: number
  cancelledOrders: number
  cancelledRate: number
}> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  let list = mockLoaders.getOrders()

  if (startDate) {
    list = list.filter(item => item.createdAt >= startDate)
  }
  if (endDate) {
    list = list.filter(item => item.createdAt <= endDate)
  }

  const totalOrders = list.length
  const totalRevenue = list.reduce((sum, item) => sum + (item.totalAmount ?? item.actualPrice), 0)
  const confirmedOrders = list.filter(item => item.status === 'confirmed' || item.status === 'checkedIn' || item.status === 'checkedOut').length
  const cancelledOrders = list.filter(item => item.status === 'cancelled' || item.status === 'noShow').length
  const cancelledRate = totalOrders > 0 ? Math.round((cancelledOrders / totalOrders) * 100) : 0

  return {
    totalOrders,
    totalRevenue,
    confirmedOrders,
    cancelledOrders,
    cancelledRate
  }
}

export const orderApi = {
  getList,
  getById,
  getByStatus,
  updateStatus,
  exportData,
  getStatistics
}

export type { Order }
