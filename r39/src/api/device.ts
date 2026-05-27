import request from '../utils/request'
import type { ApiResponse, PageResult, Device, PageParams, DeviceStatus } from '../types'

export interface DeviceParams extends PageParams {
  stationId?: string
  status?: DeviceStatus
  keyword?: string
}

export function getDeviceList(params: DeviceParams) {
  return request.get<any, ApiResponse<PageResult<Device>>>('/device/list', { params })
}

export function getDeviceDetail(id: string) {
  return request.get<any, ApiResponse<Device>>('/device/detail', { params: { id } })
}

export function updateDeviceStatus(id: string, status: DeviceStatus) {
  return request.put<any, ApiResponse>('/device/status', { id, status })
}

export function restartDevice(id: string) {
  return request.post<any, ApiResponse>('/device/restart', { id })
}

export function getDeviceStats() {
  return request.get<any, ApiResponse>('/device/stats')
}
