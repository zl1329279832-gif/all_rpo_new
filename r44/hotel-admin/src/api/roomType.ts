import { mockLoaders } from '../mock'
import type { RoomType } from '../types'

export interface RoomTypeQuery {
  name?: string
  status?: string
  page?: number
  pageSize?: number
}

export interface RoomTypeCreate {
  name: string
  bedType: string
  area: number
  floor: string
  maxGuests: number
  price: number
  stock: number
  facilities: string[]
  description: string
  images: string[]
  status: 'available' | 'maintenance' | 'disabled'
}

export interface RoomTypeUpdate extends Partial<RoomTypeCreate> {
  id: string
}

export interface PaginatedResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

async function getList(query: RoomTypeQuery = {}): Promise<PaginatedResponse<RoomType>> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  let list = mockLoaders.getRoomTypes()

  if (query.name) {
    list = list.filter(item => item.name.includes(query.name!))
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
    total: list.length,
    page,
    pageSize
  }
}

async function getById(id: string): Promise<RoomType | null> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const list = mockLoaders.getRoomTypes()
  return list.find(item => item.id === id) || null
}

async function create(data: RoomTypeCreate): Promise<RoomType> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const list = mockLoaders.getRoomTypes()
  const now = new Date().toISOString()
  const newItem: RoomType = {
    ...data,
    id: String(Date.now()),
    nameEn: data.name,
    basePrice: data.price,
    weekendPrice: data.price * 1.15,
    holidayPrice: data.price * 1.3,
    bedSize: '',
    totalRooms: data.stock,
    availableRooms: data.stock,
    occupiedRooms: 0,
    maintenanceRooms: 0,
    breakfastIncluded: false,
    cancellationPolicy: '入住前1天可免费取消',
    images: [],
    createdAt: now,
    updatedAt: now
  }
  list.push(newItem)
  mockLoaders.setRoomTypes(list)
  return newItem
}

async function update(data: RoomTypeUpdate): Promise<RoomType> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const list = mockLoaders.getRoomTypes()
  const index = list.findIndex(item => item.id === data.id)
  if (index === -1) {
    throw new Error('房型不存在')
  }
  const updated: RoomType = {
    ...list[index],
    ...data,
    updatedAt: new Date().toISOString().split('T')[0]
  }
  list[index] = updated
  mockLoaders.setRoomTypes(list)
  return updated
}

async function remove(id: string): Promise<void> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const list = mockLoaders.getRoomTypes()
  const filtered = list.filter(item => item.id !== id)
  mockLoaders.setRoomTypes(filtered)
}

async function getAll(): Promise<RoomType[]> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  return mockLoaders.getRoomTypes()
}

export const roomTypeApi = {
  getList,
  getById,
  create,
  update,
  remove,
  getAll
}

export type { RoomType }
