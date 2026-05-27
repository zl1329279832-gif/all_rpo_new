import Mock from 'mockjs'
import type { ApiResponse, PageResult, Order, OrderStatus } from '../types'

const statuses: OrderStatus[] = ['charging', 'completed', 'completed', 'completed', 'cancelled', 'exception']
const userNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十']

const generateOrders = (count: number, stations: any[], devices: any[]): Order[] => {
  return Array.from({ length: count }, (_, i) => {
    const device = devices[i % devices.length]
    const status = statuses[Mock.Random.integer(0, 5)]
    const startTime = Mock.Random.datetime('yyyy-MM-dd HH:mm:ss')
    const duration = status === 'completed' ? Mock.Random.integer(10, 120) : undefined
    const electricity = Mock.Random.float(5, 80, 2, 2)
    const amount = Number((electricity * 1.5 + (duration || 30) * 0.1).toFixed(2))

    return {
      id: Mock.Random.guid(),
      orderNo: `ORD${Mock.Random.string('number', 14)}`,
      stationId: device.stationId,
      stationName: device.stationName,
      deviceId: device.id,
      deviceName: device.name,
      userId: Mock.Random.guid(),
      userName: userNames[Mock.Random.integer(0, userNames.length - 1)],
      startSoc: Mock.Random.integer(10, 40),
      endSoc: status === 'completed' ? Mock.Random.integer(80, 95) : undefined,
      startTime,
      endTime: status === 'completed' ? Mock.Random.datetime('yyyy-MM-dd HH:mm:ss') : undefined,
      duration,
      electricity,
      amount,
      status,
      payStatus: status === 'completed' ? 'paid' : status === 'charging' ? 'pending' : Mock.Random.pick(['paid', 'refunded']),
      createTime: startTime
    }
  })
}

export function setupOrderMock(stations: any[], devices: any[]) {
  const orders = generateOrders(500, stations, devices)

  Mock.mock(/\/api\/order\/list.*/, 'get', (options: any) => {
    const url = new URL(options.url, 'http://localhost')
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10')
    const stationId = url.searchParams.get('stationId') || ''
    const status = url.searchParams.get('status') || ''
    const keyword = url.searchParams.get('keyword') || ''
    const startDate = url.searchParams.get('startDate') || ''
    const endDate = url.searchParams.get('endDate') || ''

    let filtered = [...orders]

    if (stationId) {
      filtered = filtered.filter(o => o.stationId === stationId)
    }
    if (status) {
      filtered = filtered.filter(o => o.status === status)
    }
    if (keyword) {
      filtered = filtered.filter(o =>
        o.orderNo.includes(keyword) ||
        o.userName.includes(keyword) ||
        o.deviceName.includes(keyword)
      )
    }
    if (startDate) {
      filtered = filtered.filter(o => o.createTime >= startDate)
    }
    if (endDate) {
      filtered = filtered.filter(o => o.createTime <= endDate + ' 23:59:59')
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
    } as ApiResponse<PageResult<Order>>
  })

  Mock.mock(/\/api\/order\/detail.*/, 'get', (options: any) => {
    const url = new URL(options.url, 'http://localhost')
    const id = url.searchParams.get('id')
    const order = orders.find(o => o.id === id)

    return {
      code: 200,
      message: 'success',
      data: order
    } as ApiResponse<Order>
  })

  Mock.mock('/api/order/export', 'post', () => {
    return {
      code: 200,
      message: '导出成功',
      data: {
        downloadUrl: '/reports/orders.xlsx'
      }
    } as ApiResponse
  })

  Mock.mock('/api/order/trend', 'get', () => {
    const data = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - 6 + i)
      return {
        date: `${date.getMonth() + 1}-${date.getDate()}`,
        value: Mock.Random.integer(50, 200),
        amount: Mock.Random.float(1000, 5000, 2, 2)
      }
    })

    return {
      code: 200,
      message: 'success',
      data
    } as ApiResponse
  })

  return { orders }
}
