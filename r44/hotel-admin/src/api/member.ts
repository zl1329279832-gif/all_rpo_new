import { mockLoaders } from '../mock'
import type { Member } from '../types'

export interface MemberQuery {
  memberNo?: string
  name?: string
  phone?: string
  level?: string
  minPoints?: number
  maxPoints?: number
  page?: number
  pageSize?: number
}

export interface MemberProfile {
  member: Member
  stayHistory: {
    date: string
    hotel: string
    roomType: string
    nights: number
    amount: number
  }[]
  consumptionTrend: {
    month: string
    amount: number
    nights: number
  }[]
  preferences: {
    roomTypes: string[]
    floors: string[]
    facilities: string[]
  }
}

async function getList(query: MemberQuery = {}): Promise<{ list: Member[], total: number }> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  let list = mockLoaders.getMembers()

  if (query.memberNo) {
    list = list.filter(item => item.memberNo.includes(query.memberNo!))
  }
  if (query.name) {
    list = list.filter(item => item.name.includes(query.name!))
  }
  if (query.phone) {
    list = list.filter(item => item.phone.includes(query.phone!))
  }
  if (query.level) {
    list = list.filter(item => item.level === query.level)
  }
  if (query.minPoints !== undefined) {
    list = list.filter(item => item.points >= query.minPoints!)
  }
  if (query.maxPoints !== undefined) {
    list = list.filter(item => item.points <= query.maxPoints!)
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

async function getById(id: string): Promise<Member | null> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const list = mockLoaders.getMembers()
  return list.find(item => item.id === id) || null
}

async function getProfile(id: string): Promise<MemberProfile | null> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const list = mockLoaders.getMembers()
  const member = list.find(item => item.id === id)
  if (!member) return null

  const stayHistory = Array.from({ length: 10 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    return {
      date: d.toISOString().split('T')[0],
      hotel: '本酒店',
      roomType: ['标准大床房', '豪华双床房', '行政套房'][i % 3],
      nights: 1 + Math.floor(Math.random() * 4),
      amount: 300 + Math.floor(Math.random() * 1500)
    }
  })

  const consumptionTrend = Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - 11 + i)
    return {
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      amount: 1000 + Math.floor(Math.random() * 5000),
      nights: 2 + Math.floor(Math.random() * 8)
    }
  })

  return {
    member,
    stayHistory,
    consumptionTrend,
    preferences: {
      roomTypes: member.preferences || [],
      floors: ['高楼层', '安静楼层'],
      facilities: ['免费WiFi', '空调', '电视']
    }
  }
}

async function getStatistics(): Promise<{
  totalMembers: number
  levelDistribution: { level: string; count: number }[]
  totalPoints: number
  avgPoints: number
  activeMembers: number
  newMembersThisMonth: number
}> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const list = mockLoaders.getMembers()
  const levels: Member['level'][] = ['normal', 'silver', 'gold', 'platinum', 'diamond']
  const levelNames: Record<string, string> = {
    normal: '普通会员',
    silver: '银卡会员',
    gold: '金卡会员',
    platinum: '白金会员',
    diamond: '钻石会员'
  }

  const levelDistribution = levels.map(level => ({
    level: levelNames[level],
    count: list.filter(m => m.level === level).length
  }))

  const totalPoints = list.reduce((sum, m) => sum + m.points, 0)
  const activeMembers = list.filter(m => {
    const lastStayDate = m.lastStayDate || m.lastVisitDate || m.registerDate
    const lastStay = new Date(lastStayDate)
    const now = new Date()
    const diffDays = (now.getTime() - lastStay.getTime()) / (1000 * 60 * 60 * 24)
    return diffDays <= 90
  }).length

  const now = new Date()
  const newMembersThisMonth = list.filter(m => {
    const regDate = new Date(m.registerDate)
    return regDate.getMonth() === now.getMonth() && regDate.getFullYear() === now.getFullYear()
  }).length

  return {
    totalMembers: list.length,
    levelDistribution,
    totalPoints,
    avgPoints: list.length > 0 ? Math.round(totalPoints / list.length) : 0,
    activeMembers,
    newMembersThisMonth
  }
}

async function updatePoints(id: string, points: number, _reason: string): Promise<Member> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const list = mockLoaders.getMembers()
  const index = list.findIndex(item => item.id === id)
  if (index === -1) {
    throw new Error('会员不存在')
  }
  list[index].points += points
  mockLoaders.setMembers(list)
  return list[index]
}

async function updateLevel(id: string, level: Member['level']): Promise<Member> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const list = mockLoaders.getMembers()
  const index = list.findIndex(item => item.id === id)
  if (index === -1) {
    throw new Error('会员不存在')
  }
  list[index].level = level
  mockLoaders.setMembers(list)
  return list[index]
}

export const memberApi = {
  getList,
  getById,
  getProfile,
  getStatistics,
  updatePoints,
  updateLevel
}

export type { Member }
