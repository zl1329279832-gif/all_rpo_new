import Mock from 'mockjs'
import type { ApiResponse, PageResult, Station } from '../types'

const stationNames = [
  '朝阳区国贸充电站', '海淀区中关村充电站', '西城区金融街充电站',
  '东城区王府井充电站', '丰台区西站充电站', '通州区万达广场充电站',
  '大兴区亦庄充电站', '昌平区回龙观充电站', '顺义区机场充电站',
  '房山区长阳充电站', '石景山区八角充电站', '密云区鼓楼充电站'
]

const areas = ['朝阳区', '海淀区', '西城区', '东城区', '丰台区', '通州区', '大兴区', '昌平区']

const generateStations = (count: number): Station[] => {
  return Array.from({ length: count }, (_, i) => {
    const deviceCount = Mock.Random.integer(4, 20)
    const onlineCount = Mock.Random.integer(Math.floor(deviceCount * 0.6), deviceCount)
    return {
      id: Mock.Random.guid(),
      name: stationNames[i % stationNames.length] + (i >= stationNames.length ? ` ${Math.floor(i / stationNames.length) + 1}号站` : ''),
      address: Mock.Random.county(true) + Mock.Random.cword(10, 20) + '号',
      deviceCount,
      onlineCount,
      onlineRate: Number(((onlineCount / deviceCount) * 100).toFixed(1)),
      status: Mock.Random.pick(['active', 'active', 'active', 'inactive']),
      area: areas[i % areas.length],
      lng: Mock.Random.float(116.0, 116.8, 5, 5),
      lat: Mock.Random.float(39.6, 40.2, 5, 5),
      createTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
      updateTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss')
    }
  })
}

const stations = generateStations(50)

export function setupStationMock() {
  Mock.mock(/\/api\/station\/list.*/, 'get', (options: any) => {
    const url = new URL(options.url, 'http://localhost')
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10')
    const keyword = url.searchParams.get('keyword') || ''
    const area = url.searchParams.get('area') || ''
    const status = url.searchParams.get('status') || ''

    let filtered = [...stations]

    if (keyword) {
      filtered = filtered.filter(s => s.name.includes(keyword) || s.address.includes(keyword))
    }
    if (area) {
      filtered = filtered.filter(s => s.area === area)
    }
    if (status) {
      filtered = filtered.filter(s => s.status === status)
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
    } as ApiResponse<PageResult<Station>>
  })

  Mock.mock(/\/api\/station\/detail.*/, 'get', (options: any) => {
    const url = new URL(options.url, 'http://localhost')
    const id = url.searchParams.get('id')
    const station = stations.find(s => s.id === id)

    return {
      code: 200,
      message: 'success',
      data: station
    } as ApiResponse<Station>
  })

  Mock.mock('/api/station', 'post', (options: any) => {
    const data = JSON.parse(options.body)
    const newStation: Station = {
      id: Mock.Random.guid(),
      ...data,
      deviceCount: 0,
      onlineCount: 0,
      onlineRate: 0,
      createTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss'),
      updateTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss')
    }
    stations.unshift(newStation)

    return {
      code: 200,
      message: '创建成功',
      data: newStation
    } as ApiResponse<Station>
  })

  Mock.mock('/api/station', 'put', (options: any) => {
    const data = JSON.parse(options.body)
    const index = stations.findIndex(s => s.id === data.id)
    if (index > -1) {
      stations[index] = { ...stations[index], ...data, updateTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss') }
    }

    return {
      code: 200,
      message: '更新成功',
      data: stations[index]
    } as ApiResponse<Station>
  })

  Mock.mock('/api/station/batch', 'delete', (options: any) => {
    const { ids } = JSON.parse(options.body)
    ids.forEach((id: string) => {
      const index = stations.findIndex(s => s.id === id)
      if (index > -1) stations.splice(index, 1)
    })

    return {
      code: 200,
      message: '删除成功',
      data: null
    } as ApiResponse
  })

  Mock.mock('/api/station/areas', 'get', () => {
    return {
      code: 200,
      message: 'success',
      data: areas
    } as ApiResponse<string[]>
  })
}

export { stations }
