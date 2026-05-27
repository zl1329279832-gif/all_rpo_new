import { getAlarms, saveAlarms, getCurrentTime } from '../utils/storage'
import type { ApiResponse, PageResult, Alarm, AlarmParams, AlarmLevel, AlarmStatus } from '../types'

export async function getAlarmList(params: AlarmParams): Promise<ApiResponse<PageResult<Alarm>>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let alarms = getAlarms()

      if (params.level) {
        alarms = alarms.filter(a => a.level === params.level)
      }
      if (params.status) {
        alarms = alarms.filter(a => a.status === params.status)
      }
      if (params.keyword) {
        alarms = alarms.filter(a =>
          a.deviceName.includes(params.keyword!) ||
          a.stationName.includes(params.keyword!) ||
          a.message.includes(params.keyword!)
        )
      }

      const start = (params.page - 1) * params.pageSize
      const list = alarms.slice(start, start + params.pageSize)

      resolve({
        code: 200,
        message: 'success',
        data: {
          list,
          total: alarms.length,
          page: params.page,
          pageSize: params.pageSize
        }
      })
    }, 300)
  })
}

export async function handleAlarm(ids: string[], status: AlarmStatus, remark: string): Promise<ApiResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const alarms = getAlarms()
      ids.forEach((id) => {
        const index = alarms.findIndex(a => a.id === id)
        if (index > -1) {
          alarms[index].status = status
          alarms[index].handler = '当前用户'
          alarms[index].handleTime = getCurrentTime()
          alarms[index].handleRemark = remark
        }
      })
      saveAlarms(alarms)

      resolve({
        code: 200,
        message: '处置成功',
        data: null
      })
    }, 300)
  })
}

export async function getAlarmStats(): Promise<ApiResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const alarms = getAlarms()
      const stats = {
        total: alarms.length,
        pending: alarms.filter(a => a.status === 'pending').length,
        processing: alarms.filter(a => a.status === 'processing').length,
        resolved: alarms.filter(a => a.status === 'resolved').length,
        critical: alarms.filter(a => a.level === 'critical').length,
        major: alarms.filter(a => a.level === 'major').length
      }

      resolve({
        code: 200,
        message: 'success',
        data: stats
      })
    }, 200)
  })
}
