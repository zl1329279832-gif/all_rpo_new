import Mock from 'mockjs'
import type { ApiResponse, PageResult, Device, DeviceStatus } from '../types'

const statuses: DeviceStatus[] = ['idle', 'charging', 'offline', 'fault', 'alarm']
const deviceTypes: Array<'dc' | 'ac'> = ['dc', 'dc', 'dc', 'ac']

const generateDevices = (count: number, stations: any[]): Device[] => {
  return Array.from({ length: count }, (_, i) => {
    const station = stations[i % stations.length]
    const status = statuses[Mock.Random.integer(0, 4)]
    return {
      id: Mock.Random.guid(),
      stationId: station.id,
      stationName: station.name,
      name: `${station.name.split('充电站')[0]}充电桩-${String(i + 1).padStart(3, '0')}`,
      code: `CD${Mock.Random.string('number', 8)}`,
      status,
      power: Mock.Random.pick([60, 80, 120, 160, 250]),
      type: deviceTypes[i % deviceTypes.length],
      currentPower: status === 'charging' ? Mock.Random.float(20, 100, 1, 1) : 0,
      totalElectricity: Mock.Random.float(1000, 50000, 2, 2),
      todayElectricity: Mock.Random.float(0, 500, 2, 2),
      createTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
      lastOnlineTime: status !== 'offline' ? Mock.Random.datetime('yyyy-MM-dd HH:mm:ss') : undefined
    }
  })
}

export function setupDeviceMock(stations: any[]) {
  const devices = generateDevices(200, stations)

  Mock.mock(/\/api\/device\/list.*/, 'get', (options: any) => {
    const url = new URL(options.url, 'http://localhost')
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10')
    const stationId = url.searchParams.get('stationId') || ''
    const status = url.searchParams.get('status') || ''
    const keyword = url.searchParams.get('keyword') || ''

    let filtered = [...devices]

    if (stationId) {
      filtered = filtered.filter(d => d.stationId === stationId)
    }
    if (status) {
      filtered = filtered.filter(d => d.status === status)
    }
    if (keyword) {
      filtered = filtered.filter(d => d.name.includes(keyword) || d.code.includes(keyword))
    }

    const start = (page - 1) * pageSize
    const list = filtered.slice(start, start + pageSize)

    return {
      code: 200,
      message: 'success',
      data: {
        list,
        total: filtered.length,
        page,
        pageSize
      }
    } as ApiResponse<PageResult<Device>>
  })

  Mock.mock(/\/api\/device\/detail.*/, 'get', (options: any) => {
    const url = new URL(options.url, 'http://localhost')
    const id = url.searchParams.get('id')
    const device = devices.find(d => d.id === id)

    return {
      code: 200,
      message: 'success',
      data: device
    } as ApiResponse<Device>
  })

  Mock.mock('/api/device/status', 'put', (options: any) => {
    const { id, status } = JSON.parse(options.body)
    const index = devices.findIndex(d => d.id === id)
    if (index > -1) {
      devices[index].status = status
    }

    return {
      code: 200,
      message: '状态更新成功',
      data: null
    } as ApiResponse
  })

  Mock.mock('/api/device/restart', 'post', (options: any) => {
    const { id } = JSON.parse(options.body)
    const index = devices.findIndex(d => d.id === id)
    if (index > -1) {
      devices[index].status = 'idle'
    }

    return {
      code: 200,
      message: '重启指令已发送',
      data: null
    } as ApiResponse
  })

  Mock.mock('/api/device/stats', 'get', () => {
    const stats = {
      total: devices.length,
      idle: devices.filter(d => d.status === 'idle').length,
      charging: devices.filter(d => d.status === 'charging').length,
      offline: devices.filter(d => d.status === 'offline').length,
      fault: devices.filter(d => d.status === 'fault').length,
      alarm: devices.filter(d => d.status === 'alarm').length
    }

    return {
      code: 200,
      message: 'success',
      data: stats
    } as ApiResponse
  })

  return { devices }
}
