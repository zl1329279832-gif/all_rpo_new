import { getOrders } from '../utils/storage'
import type { ApiResponse, PageResult, Order, OrderParams } from '../types'

export async function getOrderList(params: OrderParams): Promise<ApiResponse<PageResult<Order>>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let orders = getOrders()

      if (params.keyword) {
        orders = orders.filter(o =>
          o.orderNo.includes(params.keyword!) ||
          o.userName.includes(params.keyword!) ||
          o.deviceName.includes(params.keyword!)
        )
      }
      if (params.status) {
        orders = orders.filter(o => o.status === params.status)
      }
      if (params.startDate) {
        orders = orders.filter(o => o.createTime >= params.startDate!)
      }
      if (params.endDate) {
        orders = orders.filter(o => o.createTime <= params.endDate! + ' 23:59:59')
      }

      const start = (params.page - 1) * params.pageSize
      const list = orders.slice(start, start + params.pageSize)

      resolve({
        code: 200,
        message: 'success',
        data: {
          list,
          total: orders.length,
          page: params.page,
          pageSize: params.pageSize
        }
      })
    }, 300)
  })
}

export async function getOrderDetail(id: string): Promise<ApiResponse<Order | null>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const orders = getOrders()
      const order = orders.find(o => o.id === id)

      resolve({
        code: 200,
        message: 'success',
        data: order || null
      })
    }, 200)
  })
}

export async function exportOrder(): Promise<ApiResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 200,
        message: '导出成功',
        data: {
          downloadUrl: '/reports/orders.xlsx'
        }
      })
    }, 500)
  })
}
