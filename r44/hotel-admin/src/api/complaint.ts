import { mockLoaders } from '../mock'
import type { Complaint } from '../types'

export interface ComplaintQuery {
  complaintNo?: string
  guestName?: string
  phone?: string
  type?: string
  priority?: string
  status?: string
  handler?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

export interface ComplaintCreate {
  guestName: string
  phone: string
  type: 'service' | 'room' | 'food' | 'facility' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  description: string
  source: string
}

export interface ComplaintHandle {
  id: string
  handler: string
  handleContent: string
  status: 'processing' | 'resolved' | 'closed'
}

async function getList(query: ComplaintQuery = {}): Promise<{ list: Complaint[], total: number }> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  let list = mockLoaders.getComplaints()

  if (query.complaintNo) {
    list = list.filter(item => item.complaintNo.includes(query.complaintNo!))
  }
  if (query.guestName) {
    list = list.filter(item => item.guestName.includes(query.guestName!))
  }
  if (query.phone) {
    list = list.filter(item => (item.phone || item.guestPhone || '').includes(query.phone!))
  }
  if (query.type) {
    list = list.filter(item => item.type === query.type)
  }
  if (query.priority) {
    list = list.filter(item => item.priority === query.priority)
  }
  if (query.status) {
    list = list.filter(item => item.status === query.status)
  }
  if (query.handler) {
    list = list.filter(item => item.handler?.includes(query.handler!))        
  }
  if (query.startDate) {
    list = list.filter(item => item.createdAt >= query.startDate!)
  }
  if (query.endDate) {
    list = list.filter(item => item.createdAt <= query.endDate!)
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

async function getById(id: string): Promise<Complaint | null> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const list = mockLoaders.getComplaints()
  return list.find(item => item.id === id) || null
}

async function create(data: ComplaintCreate): Promise<Complaint> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const list = mockLoaders.getComplaints()
  const now = new Date().toISOString()
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const count = list.filter(c => c.complaintNo.includes(dateStr)).length + 1
  const newItem: Complaint = {
    id: String(Date.now()),
    complaintNo: `CMP${dateStr}${String(count).padStart(3, '0')}`,
    guestName: data.guestName,
    guestPhone: data.phone,
    phone: data.phone,
    type: data.type,
    title: data.description.substring(0, 30),
    content: data.description,
    description: data.description,
    priority: data.priority,
    source: data.source,
    status: 'pending',
    handler: '',
    handleContent: '',
    createdAt: now,
    updatedAt: now
  }
  list.push(newItem)
  mockLoaders.setComplaints(list)
  return newItem
}

async function handle(data: ComplaintHandle): Promise<Complaint> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const list = mockLoaders.getComplaints()
  const index = list.findIndex(item => item.id === data.id)
  if (index === -1) {
    throw new Error('投诉记录不存在')
  }
  const now = new Date().toISOString()
  list[index].handler = data.handler
  list[index].handleContent = data.handleContent
  list[index].status = data.status
  list[index].updatedAt = now
  if (data.status === 'resolved' || data.status === 'closed') {
    list[index].resolvedAt = now
  }
  mockLoaders.setComplaints(list)
  return list[index]
}

async function getStatistics(startDate?: string, endDate?: string): Promise<{
  totalComplaints: number
  pendingCount: number
  processingCount: number
  resolvedCount: number
  closedCount: number
  typeDistribution: { type: string; count: number }[]
  priorityDistribution: { priority: string; count: number }[]
  avgHandleTime: number
}> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  let list = mockLoaders.getComplaints()

  if (startDate) {
    list = list.filter(item => item.createdAt >= startDate)
  }
  if (endDate) {
    list = list.filter(item => item.createdAt <= endDate)
  }

  const types: Complaint['type'][] = ['service', 'room', 'food', 'facility', 'other']
  const typeNames: Record<string, string> = {
    service: '服务',
    room: '客房',
    food: '餐饮',
    facility: '设施',
    other: '其他'
  }

  const priorities: Complaint['priority'][] = ['low', 'medium', 'high', 'urgent']
  const priorityNames: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急'
  }

  const typeDistribution = types.map(type => ({
    type: typeNames[type],
    count: list.filter(c => c.type === type).length
  }))

  const priorityDistribution = priorities.map(priority => ({
    priority: priorityNames[priority as keyof typeof priorityNames],
    count: list.filter(c => (c.priority || 'medium') === priority).length
  }))

  const resolvedList = list.filter(c => c.resolvedAt && c.handleTime)
  const avgHandleTime = resolvedList.length > 0
    ? Math.round(resolvedList.reduce((sum, c) => {
        const created = new Date(c.createdAt).getTime()
        const resolved = new Date(c.handleTime || c.updatedAt).getTime()
        return sum + (resolved - created) / (1000 * 60 * 60)
      }, 0) / resolvedList.length)
    : 0

  return {
    totalComplaints: list.length,
    pendingCount: list.filter(c => c.status === 'pending').length,
    processingCount: list.filter(c => c.status === 'processing').length,
    resolvedCount: list.filter(c => c.status === 'resolved').length,
    closedCount: list.filter(c => c.status === 'closed').length,
    typeDistribution,
    priorityDistribution,
    avgHandleTime
  }
}

export const complaintApi = {
  getList,
  getById,
  create,
  handle,
  getStatistics
}

export type { Complaint }
