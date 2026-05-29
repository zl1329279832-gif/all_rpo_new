import { mockLoaders, type DashboardData } from '../mock'
import type { Order } from '../types'

export interface KpiData {
  label: string
  value: number
  unit: string
  trend: number
  trendType: 'up' | 'down' | 'flat'
}

async function getData(): Promise<DashboardData> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  return mockLoaders.getDashboardData()
}

async function getKpis(): Promise<KpiData[]> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const data = mockLoaders.getDashboardData()

  return [
    {
      label: '入住率',
      value: data.occupancy,
      unit: '%',
      trend: 5,
      trendType: 'up'
    },
    {
      label: 'ADR',
      value: data.adr,
      unit: '元',
      trend: 3,
      trendType: 'up'
    },
    {
      label: 'RevPAR',
      value: data.revpar,
      unit: '元',
      trend: 4,
      trendType: 'up'
    },
    {
      label: '今日收入',
      value: data.totalRevenue,
      unit: '元',
      trend: -2,
      trendType: 'down'
    },
    {
      label: '今日入住',
      value: data.todayCheckIn,
      unit: '间',
      trend: 8,
      trendType: 'up'
    },
    {
      label: '今日退房',
      value: data.todayCheckOut,
      unit: '间',
      trend: 1,
      trendType: 'flat'
    },
    {
      label: '在住客人',
      value: data.inHouse,
      unit: '人',
      trend: 3,
      trendType: 'up'
    },
    {
      label: '待处理投诉',
      value: data.pendingComplaints,
      unit: '件',
      trend: 0,
      trendType: 'flat'
    }
  ]
}

async function getChannelShare(): Promise<{ name: string; value: number }[]> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const data = mockLoaders.getDashboardData()
  return data.channelShare
}

async function getCancellationTrend(): Promise<{
  date: string
  count: number
  rate: number
}[]> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const data = mockLoaders.getDashboardData()
  return data.cancellationTrend
}

async function getSevenDayForecast(): Promise<{
  date: string
  occupancy: number
  revenue: number
}[]> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const data = mockLoaders.getDashboardData()
  return data.sevenDayForecast
}

async function getRecentOrders(limit: number = 10): Promise<Order[]> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const data = mockLoaders.getDashboardData()
  return data.recentOrders.slice(0, limit)
}

async function getQuickStats(): Promise<{
  memberArrivals: number
  vipArrivals: number
  groupArrivals: number
  specialRequests: number
}> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const data = mockLoaders.getDashboardData()
  return {
    memberArrivals: data.memberArrivals,
    vipArrivals: Math.floor(data.memberArrivals * 0.3),
    groupArrivals: 2,
    specialRequests: 8
  }
}

async function getRealTimeUpdates(): Promise<{
  type: 'checkIn' | 'checkOut' | 'complaint' | 'order'
  title: string
  description: string
  time: string
}[]> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const now = new Date()
  const formatTime = (d: Date) => d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

  return [
    {
      type: 'checkIn',
      title: '新入住',
      description: '张三 - 标准大床房 201',
      time: formatTime(new Date(now.getTime() - 5 * 60 * 1000))
    },
    {
      type: 'order',
      title: '新订单',
      description: '李四 - 豪华双床房 305',
      time: formatTime(new Date(now.getTime() - 15 * 60 * 1000))
    },
    {
      type: 'complaint',
      title: '新投诉',
      description: '客房空调故障 - 紧急',
      time: formatTime(new Date(now.getTime() - 30 * 60 * 1000))
    },
    {
      type: 'checkOut',
      title: '退房',
      description: '王五 - 行政套房 801',
      time: formatTime(new Date(now.getTime() - 45 * 60 * 1000))
    }
  ]
}

async function refresh(): Promise<DashboardData> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  localStorage.removeItem('dashboardData')
  return mockLoaders.getDashboardData()
}

export const dashboardApi = {
  getData,
  getKpis,
  getChannelShare,
  getCancellationTrend,
  getSevenDayForecast,
  getRecentOrders,
  getQuickStats,
  getRealTimeUpdates,
  refresh
}

export type { DashboardData, Order }
