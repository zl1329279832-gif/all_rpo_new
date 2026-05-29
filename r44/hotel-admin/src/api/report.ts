import { mockLoaders, type ReportData } from '../mock'

export interface ReportQuery {
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

export interface ReportSummary {
  totalRevenue: number
  totalRoomRevenue: number
  totalFoodRevenue: number
  totalOtherRevenue: number
  totalOrders: number
  totalCheckIns: number
  totalCheckOuts: number
  avgOccupancy: number
  avgAdr: number
  avgRevpar: number
  revenueTrend: {
    date: string
    revenue: number
    occupancy: number
  }[]
  revenueBreakdown: {
    type: string
    revenue: number
    percentage: number
  }[]
  channelRanking: {
    channel: string
    revenue: number
    orderCount: number
    percentage: number
  }[]
}

async function getList(query: ReportQuery = {}): Promise<{ list: ReportData[], total: number }> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  let list = mockLoaders.getReportData()

  if (query.startDate) {
    list = list.filter(item => item.date >= query.startDate!)
  }
  if (query.endDate) {
    list = list.filter(item => item.date <= query.endDate!)
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

async function getSummary(startDate?: string, endDate?: string): Promise<ReportSummary> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  let list = mockLoaders.getReportData()

  if (startDate) {
    list = list.filter(item => item.date >= startDate)
  }
  if (endDate) {
    list = list.filter(item => item.date <= endDate)
  }

  if (list.length === 0) {
    return {
      totalRevenue: 0,
      totalRoomRevenue: 0,
      totalFoodRevenue: 0,
      totalOtherRevenue: 0,
      totalOrders: 0,
      totalCheckIns: 0,
      totalCheckOuts: 0,
      avgOccupancy: 0,
      avgAdr: 0,
      avgRevpar: 0,
      revenueTrend: [],
      revenueBreakdown: [],
      channelRanking: []
    }
  }

  const totalRevenue = list.reduce((sum, item) => sum + item.revenue, 0)
  const totalRoomRevenue = list.reduce((sum, item) => sum + item.roomRevenue, 0)
  const totalFoodRevenue = list.reduce((sum, item) => sum + item.foodRevenue, 0)
  const totalOtherRevenue = list.reduce((sum, item) => sum + item.otherRevenue, 0)
  const totalOrders = list.reduce((sum, item) => sum + item.orderCount, 0)
  const totalCheckIns = list.reduce((sum, item) => sum + item.checkInCount, 0)
  const totalCheckOuts = list.reduce((sum, item) => sum + item.checkOutCount, 0)
  const avgOccupancy = Math.round(list.reduce((sum, item) => sum + item.occupancy, 0) / list.length)
  const avgAdr = Math.round(list.reduce((sum, item) => sum + item.adr, 0) / list.length)
  const avgRevpar = Math.round(list.reduce((sum, item) => sum + item.revpar, 0) / list.length)

  const revenueTrend = list.map(item => ({
    date: item.date,
    revenue: item.revenue,
    occupancy: item.occupancy
  }))

  const revenueBreakdown = [
    { type: '客房收入', revenue: totalRoomRevenue, percentage: totalRevenue > 0 ? Math.round((totalRoomRevenue / totalRevenue) * 100) : 0 },
    { type: '餐饮收入', revenue: totalFoodRevenue, percentage: totalRevenue > 0 ? Math.round((totalFoodRevenue / totalRevenue) * 100) : 0 },
    { type: '其他收入', revenue: totalOtherRevenue, percentage: totalRevenue > 0 ? Math.round((totalOtherRevenue / totalRevenue) * 100) : 0 }
  ]

  const channelMap = new Map<string, { revenue: number; orderCount: number }>()
  list.forEach(item => {
    item.channelBreakdown.forEach(cb => {
      const existing = channelMap.get(cb.channel) || { revenue: 0, orderCount: 0 }
      existing.revenue += cb.revenue
      existing.orderCount += cb.orderCount
      channelMap.set(cb.channel, existing)
    })
  })

  const channelRanking = Array.from(channelMap.entries())
    .map(([channel, data]) => ({
      channel,
      revenue: data.revenue,
      orderCount: data.orderCount,
      percentage: totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) : 0
    }))
    .sort((a, b) => b.revenue - a.revenue)

  return {
    totalRevenue,
    totalRoomRevenue,
    totalFoodRevenue,
    totalOtherRevenue,
    totalOrders,
    totalCheckIns,
    totalCheckOuts,
    avgOccupancy,
    avgAdr,
    avgRevpar,
    revenueTrend,
    revenueBreakdown,
    channelRanking
  }
}

async function exportReport(startDate?: string, endDate?: string, format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const summary = await getSummary(startDate, endDate)
  const list = mockLoaders.getReportData()

  let filteredList = list
  if (startDate) {
    filteredList = filteredList.filter(item => item.date >= startDate)
  }
  if (endDate) {
    filteredList = filteredList.filter(item => item.date <= endDate)
  }

  let content = ''
  let mimeType = ''

  if (format === 'csv') {
    mimeType = 'text/csv;charset=utf-8'
    content += '经营报表汇总\n'
    content += `总收入,${summary.totalRevenue}\n`
    content += `客房收入,${summary.totalRoomRevenue}\n`
    content += `餐饮收入,${summary.totalFoodRevenue}\n`
    content += `其他收入,${summary.totalOtherRevenue}\n`
    content += `平均入住率,${summary.avgOccupancy}%\n`
    content += `平均ADR,${summary.avgAdr}\n`
    content += `平均RevPAR,${summary.avgRevpar}\n`
    content += '\n'
    content += '日期,入住率,ADR,RevPAR,总收入,客房收入,餐饮收入,其他收入,订单数,入住数,退房数\n'
    filteredList.forEach(item => {
      content += `${item.date},${item.occupancy}%,${item.adr},${item.revpar},${item.revenue},${item.roomRevenue},${item.foodRevenue},${item.otherRevenue},${item.orderCount},${item.checkInCount},${item.checkOutCount}\n`
    })
  } else {
    mimeType = 'application/vnd.ms-excel'
    content = JSON.stringify({ summary, list: filteredList })
  }

  return new Blob([content], { type: mimeType })
}

async function getComparison(period1: { start: string; end: string }, period2: { start: string; end: string }): Promise<{
  period1: ReportSummary
  period2: ReportSummary
  changes: {
    revenue: number
    occupancy: number
    adr: number
    revpar: number
  }
}> {
  await mockLoaders.delay()
  mockLoaders.randomError()

  const p1 = await getSummary(period1.start, period1.end)
  const p2 = await getSummary(period2.start, period2.end)

  return {
    period1: p1,
    period2: p2,
    changes: {
      revenue: p1.totalRevenue > 0 ? Math.round(((p2.totalRevenue - p1.totalRevenue) / p1.totalRevenue) * 100) : 0,
      occupancy: p1.avgOccupancy > 0 ? Math.round(((p2.avgOccupancy - p1.avgOccupancy) / p1.avgOccupancy) * 100) : 0,
      adr: p1.avgAdr > 0 ? Math.round(((p2.avgAdr - p1.avgAdr) / p1.avgAdr) * 100) : 0,
      revpar: p1.avgRevpar > 0 ? Math.round(((p2.avgRevpar - p1.avgRevpar) / p1.avgRevpar) * 100) : 0
    }
  }
}

export const reportApi = {
  getList,
  getSummary,
  exportReport,
  getComparison
}

export type { ReportData }
