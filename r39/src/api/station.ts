import { getStations, saveStations, generateId, getCurrentTime } from '../utils/storage'
import type { ApiResponse, PageResult, Station, StationParams } from '../types'

const areas = ['朝阳区', '海淀区', '西城区', '东城区', '丰台区', '通州区', '大兴区', '昌平区']

export async function getStationList(params: StationParams): Promise<ApiResponse<PageResult<Station>>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let stations = getStations()

      if (params.keyword) {
        stations = stations.filter(s =>
          s.name.includes(params.keyword!) ||
          s.address.includes(params.keyword!)
        )
      }
      if (params.area) {
        stations = stations.filter(s => s.area === params.area)
      }
      if (params.status) {
        stations = stations.filter(s => s.status === params.status)
      }

      const start = (params.page - 1) * params.pageSize
      const list = stations.slice(start, start + params.pageSize)

      resolve({
        code: 200,
        message: 'success',
        data: {
          list,
          total: stations.length,
          page: params.page,
          pageSize: params.pageSize
        }
      })
    }, 300)
  })
}

export async function getStationDetail(id: string): Promise<ApiResponse<Station | null>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const stations = getStations()
      const station = stations.find(s => s.id === id)

      resolve({
        code: 200,
        message: 'success',
        data: station || null
      })
    }, 200)
  })
}

export async function createStation(data: Partial<Station>): Promise<ApiResponse<Station>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const stations = getStations()
      const newStation: Station = {
        id: generateId('station'),
        ...data,
        deviceCount: 0,
        onlineCount: 0,
        onlineRate: 0,
        createTime: getCurrentTime(),
        updateTime: getCurrentTime()
      } as Station

      stations.unshift(newStation)
      saveStations(stations)

      resolve({
        code: 200,
        message: '创建成功',
        data: newStation
      })
    }, 300)
  })
}

export async function updateStation(data: Partial<Station>): Promise<ApiResponse<Station | null>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const stations = getStations()
      const index = stations.findIndex(s => s.id === data.id)

      if (index > -1) {
        stations[index] = { ...stations[index], ...data, updateTime: getCurrentTime() }
        saveStations(stations)
      }

      resolve({
        code: 200,
        message: '更新成功',
        data: stations[index] || null
      })
    }, 300)
  })
}

export async function deleteStations(ids: string[]): Promise<ApiResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let stations = getStations()
      stations = stations.filter(s => !ids.includes(s.id))
      saveStations(stations)

      resolve({
        code: 200,
        message: '删除成功',
        data: null
      })
    }, 300)
  })
}

export async function getAreas(): Promise<ApiResponse<string[]>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 200,
        message: 'success',
        data: areas
      })
    }, 100)
  })
}
