import { getStations, getOrders, getAlarms } from '../utils/storage'
import type { ApiResponse, PageResult, ReportParams } from '../types'

export async function getReportList(params: ReportParams): Promise<ApiResponse<PageResult<any>>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const stations = getStations()
      const orders = getOrders()
      const alarms = getAlarms()

      const reportData: any[] = stations.map(station => {
        const stationOrders = orders.filter(o => o.stationId === station.id)
        const stationAlarms = alarms.filter(a => a.stationId === station.stationId)
        
        const totalElectricity = stationOrders.reduce((sum, o) => sum + (o.electricity || 0), 0)
        const totalIncome = stationOrders.reduce((sum, o) => sum + (o.amount || 0), 0)

        return {
          id: station.id,
          stationName: station.name,
          area: station.area,
          deviceCount: station.deviceCount,
          totalElectricity: Number(totalElectricity.toFixed(2)),
          totalOrders: stationOrders.length,
          totalIncome: Number(totalIncome.toFixed(2)),
          faultCount: stationAlarms.filter(a => a.level === 'critical').length,
          alarmCount: stationAlarms.length
        }
      })

      const start = (params.page - 1) * params.pageSize
      const list = reportData.slice(start, start + params.pageSize)

      resolve({
        code: 200,
        message: 'success',
        data: {
          list,
          total: reportData.length,
          page: params.page,
          pageSize: params.pageSize
        }
      })
    }, 300)
  })
}

export async function getReportStats(): Promise<ApiResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const orders = getOrders()
      const alarms = getAlarms()

      const totalElectricity = orders.reduce((sum, o) => sum + (o.electricity || 0), 0)
      const totalIncome = orders.reduce((sum, o) => sum + (o.amount || 0), 0)

      const stats = {
        totalElectricity: Number(totalElectricity.toFixed(2)),
        totalOrders: orders.length,
        totalIncome: Number(totalIncome.toFixed(2)),
        faultCount: alarms.filter(a => a.level === 'critical').length,
        alarmCount: alarms.length
      }

      resolve({
        code: 200,
        message: 'success',
        data: stats
      })
    }, 200)
  })
}

export async function getReportOverview(): Promise<ApiResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const orders = getOrders()
      const alarms = getAlarms()
      const stations = getStations()

      const totalElectricity = orders.reduce((sum, o) => sum + (o.electricity || 0), 0)
      const totalIncome = orders.reduce((sum, o) => sum + (o.amount || 0), 0)

      resolve({
        code: 200,
        message: 'success',
        data: {
          totalStations: stations.length,
          totalElectricity: Number(totalElectricity.toFixed(2)),
          totalOrders: orders.length,
          totalIncome: Number(totalIncome.toFixed(2)),
          faultCount: alarms.filter(a => a.level === 'critical').length,
          alarmCount: alarms.length
        }
      })
    }, 200)
  })
}

export async function exportReport(period?: string): Promise<ApiResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 200,
        message: '导出成功',
        data: {
          downloadUrl: '/reports/operation.xlsx'
        }
      })
    }, 500)
  })
}
