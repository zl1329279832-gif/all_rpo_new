import { getDevices, saveDevices, getCurrentTime } from '../utils/storage'
import type { ApiResponse, PageResult, Device, DeviceParams, DeviceStatus } from '../types'

export async function getDeviceList(params: DeviceParams): Promise<ApiResponse<PageResult<Device>>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let devices = getDevices()

      if (params.stationId) {
        devices = devices.filter(d => d.stationId === params.stationId)
      }
      if (params.status) {
        devices = devices.filter(d => d.status === params.status)
      }
      if (params.keyword) {
        devices = devices.filter(d =>
          d.name.includes(params.keyword!) ||
          d.code.includes(params.keyword!)
        )
      }

      const start = (params.page - 1) * params.pageSize
      const list = devices.slice(start, start + params.pageSize)

      resolve({
        code: 200,
        message: 'success',
        data: {
          list,
          total: devices.length,
          page: params.page,
          pageSize: params.pageSize
        }
      })
    }, 300)
  })
}

export async function getDeviceDetail(id: string): Promise<ApiResponse<Device | null>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const devices = getDevices()
      const device = devices.find(d => d.id === id)

      resolve({
        code: 200,
        message: 'success',
        data: device || null
      })
    }, 200)
  })
}

export async function updateDeviceStatus(id: string, status: DeviceStatus): Promise<ApiResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const devices = getDevices()
      const index = devices.findIndex(d => d.id === id)

      if (index > -1) {
        devices[index].status = status
        devices[index].lastOnlineTime = status !== 'offline' ? getCurrentTime() : undefined
        saveDevices(devices)
      }

      resolve({
        code: 200,
        message: '状态更新成功',
        data: null
      })
    }, 300)
  })
}

export async function restartDevice(id: string): Promise<ApiResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const devices = getDevices()
      const index = devices.findIndex(d => d.id === id)

      if (index > -1) {
        devices[index].status = 'idle'
        devices[index].currentPower = 0
        devices[index].lastOnlineTime = getCurrentTime()
        saveDevices(devices)
      }

      resolve({
        code: 200,
        message: '重启指令已发送',
        data: null
      })
    }, 300)
  })
}

export async function getDeviceStats(): Promise<ApiResponse<Record<string, number>>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const devices = getDevices()
      const stats = {
        total: devices.length,
        idle: devices.filter(d => d.status === 'idle').length,
        charging: devices.filter(d => d.status === 'charging').length,
        offline: devices.filter(d => d.status === 'offline').length,
        fault: devices.filter(d => d.status === 'fault').length,
        alarm: devices.filter(d => d.status === 'alarm').length
      }

      resolve({
        code: 200,
        message: 'success',
        data: stats
      })
    }, 200)
  })
}
