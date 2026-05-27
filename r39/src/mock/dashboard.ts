import Mock from 'mockjs'
import type { ApiResponse, DashboardStats, ChartData, TrendData } from '../types'

export function setupDashboardMock(stations: any[], devices: any[], orders: any[], alarms: any[]) {
  Mock.mock('/api/dashboard/stats', 'get', () => {
    const onlineStations = stations.filter(s => s.status === 'active').length
    const onlineDevices = devices.filter(d => d.status !== 'offline').length
    const todayOrders = orders.filter((o: any) => o.status === 'completed').length
    const todayElectricity = devices.reduce((sum: number, d: any) => sum + d.todayElectricity, 0)
    const todayIncome = orders
      .filter((o: any) => o.status === 'completed' && o.payStatus === 'paid')
      .reduce((sum: number, o: any) => sum + o.amount, 0)
    const pendingAlarms = alarms.filter((a: any) => a.status === 'pending').length

    const data: DashboardStats = {
      stationCount: stations.length,
      stationOnlineRate: Number(((onlineStations / stations.length) * 100).toFixed(1)),
      deviceCount: devices.length,
      deviceOnlineRate: Number(((onlineDevices / devices.length) * 100).toFixed(1)),
      todayOrders: todayOrders + Mock.Random.integer(50, 100),
      todayElectricity: Number(todayElectricity.toFixed(2)),
      todayIncome: Number(todayIncome.toFixed(2)) + Mock.Random.float(5000, 15000, 2, 2),
      pendingAlarms: pendingAlarms + Mock.Random.integer(3, 10)
    }

    return {
      code: 200,
      message: 'success',
      data
    } as ApiResponse<DashboardStats>
  })

  Mock.mock('/api/dashboard/device-status', 'get', () => {
    const data: ChartData[] = [
      { name: '空闲', value: devices.filter((d: any) => d.status === 'idle').length },
      { name: '充电中', value: devices.filter((d: any) => d.status === 'charging').length },
      { name: '离线', value: devices.filter((d: any) => d.status === 'offline').length },
      { name: '故障', value: devices.filter((d: any) => d.status === 'fault').length },
      { name: '告警中', value: devices.filter((d: any) => d.status === 'alarm').length }
    ]

    return {
      code: 200,
      message: 'success',
      data
    } as ApiResponse<ChartData[]>
  })

  Mock.mock('/api/dashboard/order-trend', 'get', () => {
    const data: TrendData[] = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - 6 + i)
      return {
        date: `${date.getMonth() + 1}-${date.getDate()}`,
        value: Mock.Random.integer(80, 200)
      }
    })

    return {
      code: 200,
      message: 'success',
      data
    } as ApiResponse<TrendData[]>
  })

  Mock.mock('/api/dashboard/income-trend', 'get', () => {
    const data: TrendData[] = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - 6 + i)
      return {
        date: `${date.getMonth() + 1}-${date.getDate()}`,
        value: Mock.Random.float(3000, 12000, 2, 2)
      }
    })

    return {
      code: 200,
      message: 'success',
      data
    } as ApiResponse<TrendData[]>
  })

  Mock.mock('/api/dashboard/area-heat', 'get', () => {
    const areas = ['朝阳区', '海淀区', '西城区', '东城区', '丰台区', '通州区', '大兴区', '昌平区']
    const data = areas.map(area => ({
      name: area,
      value: Mock.Random.integer(10, 100)
    }))

    return {
      code: 200,
      message: 'success',
      data
    } as ApiResponse
  })

  Mock.mock('/api/dashboard/recent-alarms', 'get', () => {
    const data = alarms.slice(0, 5).map((a: any) => ({
      id: a.id,
      level: a.level,
      message: a.message,
      deviceName: a.deviceName,
      alarmTime: a.alarmTime
    }))

    return {
      code: 200,
      message: 'success',
      data
    } as ApiResponse
  })
}

export function setupReportMock(orders: any[]) {
  Mock.mock('/api/report/overview', 'get', (options: any) => {
    const url = new URL(options.url, 'http://localhost')
    const period = url.searchParams.get('period') || 'week'

    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90

    const data = Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - days + 1 + i)
      return {
        date: `${date.getMonth() + 1}-${date.getDate()}`,
        orders: Mock.Random.integer(50, 200),
        electricity: Mock.Random.float(200, 1000, 2, 2),
        income: Mock.Random.float(1000, 5000, 2, 2),
        devices: Mock.Random.integer(100, 180)
      }
    })

    return {
      code: 200,
      message: 'success',
      data: {
        list: data,
        summary: {
          totalOrders: Mock.Random.integer(3000, 10000),
          totalElectricity: Mock.Random.float(15000, 50000, 2, 2),
          totalIncome: Mock.Random.float(50000, 200000, 2, 2),
          avgUtilization: Mock.Random.float(45, 75, 1, 1)
        }
      }
    } as ApiResponse
  })

  Mock.mock('/api/report/export', 'post', () => {
    return {
      code: 200,
      message: '导出成功',
      data: {
        downloadUrl: '/reports/operation.xlsx'
      }
    } as ApiResponse
  })
}
