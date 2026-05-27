import Mock from 'mockjs'
import type { ApiResponse, PageResult, PriceStrategy } from '../types'

const strategies: PriceStrategy[] = [
  {
    id: '1',
    name: '峰时电价',
    type: 'time',
    startTime: '10:00',
    endTime: '14:00',
    price: 1.8,
    serviceFee: 0.6,
    status: 'active',
    createTime: '2024-01-01 00:00:00'
  },
  {
    id: '2',
    name: '平时电价',
    type: 'time',
    startTime: '07:00',
    endTime: '10:00',
    price: 1.2,
    serviceFee: 0.5,
    status: 'active',
    createTime: '2024-01-01 00:00:00'
  },
  {
    id: '3',
    name: '谷时电价',
    type: 'time',
    startTime: '23:00',
    endTime: '07:00',
    price: 0.8,
    serviceFee: 0.4,
    status: 'active',
    createTime: '2024-01-01 00:00:00'
  },
  {
    id: '4',
    name: '平段电价',
    type: 'time',
    startTime: '14:00',
    endTime: '19:00',
    price: 1.35,
    serviceFee: 0.55,
    status: 'active',
    createTime: '2024-01-01 00:00:00'
  },
  {
    id: '5',
    name: '夜间优惠',
    type: 'time',
    startTime: '00:00',
    endTime: '06:00',
    price: 0.65,
    serviceFee: 0.35,
    status: 'inactive',
    createTime: '2024-02-15 10:30:00'
  }
]

export function setupPriceMock() {
  Mock.mock(/\/api\/price\/list.*/, 'get', (options: any) => {
    const url = new URL(options.url, 'http://localhost')
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10')
    const status = url.searchParams.get('status') || ''

    let filtered = [...strategies]

    if (status) {
      filtered = filtered.filter(p => p.status === status)
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
    } as ApiResponse<PageResult<PriceStrategy>>
  })

  Mock.mock('/api/price', 'post', (options: any) => {
    const data = JSON.parse(options.body)
    const newStrategy: PriceStrategy = {
      id: Mock.Random.guid(),
      ...data,
      createTime: Mock.Random.datetime('yyyy-MM-dd HH:mm:ss')
    }
    strategies.unshift(newStrategy)

    return {
      code: 200,
      message: '创建成功',
      data: newStrategy
    } as ApiResponse<PriceStrategy>
  })

  Mock.mock('/api/price', 'put', (options: any) => {
    const data = JSON.parse(options.body)
    const index = strategies.findIndex(p => p.id === data.id)
    if (index > -1) {
      strategies[index] = { ...strategies[index], ...data }
    }

    return {
      code: 200,
      message: '更新成功',
      data: strategies[index]
    } as ApiResponse<PriceStrategy>
  })

  Mock.mock('/api/price', 'delete', (options: any) => {
    const url = new URL(options.url, 'http://localhost')
    const id = url.searchParams.get('id')
    const index = strategies.findIndex(p => p.id === id)
    if (index > -1) {
      strategies.splice(index, 1)
    }

    return {
      code: 200,
      message: '删除成功',
      data: null
    } as ApiResponse
  })
}
