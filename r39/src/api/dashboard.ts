import { getStations, getDevices, getOrders, getAlarms } from '../utils/storage'
import type { ApiResponse, DashboardStats, ChartData, TrendData, Alarm } from '../types'

export async function getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const stations = getStations()
      const devices = getDevices()
      const orders = getOrders()
      const alarms = getAlarms()

      const today = new Date().toISOString().split('T')[0]

      const stats: DashboardStats = {
        stationCount: stations.length,
        stationOnlineRate: stations.length > 0
          ? Number(((stations.filter(s => s.status === 'active').length / stations.length) * 100).toFixed(1))
          : 0,
        deviceCount: devices.length,
        deviceOnlineRate: devices.length > 0
          ? Number(((devices.filter(d => d.status !== 'offline').length / devices.length) * 100).toFixed(1))
          : 0,
        todayOrders: orders.filter(o => o.createTime.startsWith(today)).length,
        todayElectricity: devices.reduce((sum, d) => sum + (d.todayElectricity || 0), 0),
        todayIncome: orders.filter(o => o.createTime.startsWith(today)).reduce((sum, o) => sum + (o.amount || 0), 0),
        pendingAlarms: alarms.filter(a => a.status === 'pending').length
      }

      resolve({
        code: 200,
        message: 'success',
        data: stats
      })
    }, 300)
  })
}

export async function getDeviceStatusChart(): Promise<ApiResponse<ChartData[]>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const devices = getDevices()
      const data: ChartData[] = [
        { name: '空闲', value: devices.filter(d => d.status === 'idle').length },
        { name: '充电中', value: devices.filter(d => d.status === 'charging').length },
        { name: '离线', value: devices.filter(d => d.status === 'offline').length },
        { name: '故障', value: devices.filter(d => d.status === 'fault').length },
        { name: '告警中', value: devices.filter(d => d.status === 'alarm').length }
      ]

      resolve({
        code: 200,
        message: 'success',
        data
      })
    }, 200)
  })
}

export async function getOrderTrend(): Promise<ApiResponse<TrendData[]>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const data: TrendData[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        data.push({
          date: `${date.getMonth() + 1}-${date.getDate()}`,
          value: Math.floor(Math.random() * 100) + 50
        })
      }

      resolve({
        code: 200,
        message: 'success',
        data
      })
    }, 200)
  })
}

export async function getIncomeTrend(): Promise<ApiResponse<TrendData[]>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const data: TrendData[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        data.push({
          date: `${date.getMonth() + 1}-${date.getDate()}`,
          value: Number((Math.random() * 5000 + 1000).toFixed(2))
        })
      }

      resolve({
        code: 200,
        message: 'success',
        data
      })
    }, 200)
  })
}

export async function getAreaHeat(): Promise<ApiResponse<any[]>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const stations = getStations()
      const areaMap = new Map<string, number>()

      stations.forEach(s => {
        const current = areaMap.get(s.area) || 0
        areaMap.set(s.area, current + (s.deviceCount || 0))
      })

      const data = Array.from(areaMap.entries()).map(([name, value]) => ({ name, value }))

      resolve({
        code: 200,
        message: 'success',
        data
      })
    }, 200)
  })
}

export async function getRecentAlarms(): Promise<ApiResponse<Alarm[]>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const alarms = getAlarms()
      const pendingAlarms = alarms.filter(a => a.status === 'pending').slice(0, 5)

      resolve({
        code: 200,
        message: 'success',
        data: pendingAlarms
      })
    }, 200)
  })
}
