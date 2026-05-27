import request from '../utils/request'
import type { ApiResponse, PageResult, Alarm, PageParams, AlarmLevel, AlarmStatus } from '../types'

export interface AlarmParams extends PageParams {
  level?: AlarmLevel
  status?: AlarmStatus
  keyword?: string
}

export function getAlarmList(params: AlarmParams) {
  return request.get<any, ApiResponse<PageResult<Alarm>>>('/alarm/list', { params })
}

export function handleAlarm(ids: string[], status: AlarmStatus, remark?: string) {
  return request.post<any, ApiResponse>('/alarm/handle', { ids, status, remark })
}

export function getAlarmStats() {
  return request.get<any, ApiResponse>('/alarm/stats')
}
