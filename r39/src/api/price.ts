import { getPrices, savePrices, generateId, getCurrentTime } from '../utils/storage'
import type { ApiResponse, PageResult, PriceStrategy, PageParams } from '../types'

export async function getPriceList(params: PageParams): Promise<ApiResponse<PageResult<PriceStrategy>>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const prices = getPrices()
      const start = (params.page - 1) * params.pageSize
      const list = prices.slice(start, start + params.pageSize)

      resolve({
        code: 200,
        message: 'success',
        data: {
          list,
          total: prices.length,
          page: params.page,
          pageSize: params.pageSize
        }
      })
    }, 300)
  })
}

export async function createPrice(data: Partial<PriceStrategy>): Promise<ApiResponse<PriceStrategy>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const prices = getPrices()
      const newPrice: PriceStrategy = {
        id: generateId('price'),
        ...data,
        createTime: getCurrentTime()
      } as PriceStrategy

      prices.unshift(newPrice)
      savePrices(prices)

      resolve({
        code: 200,
        message: '创建成功',
        data: newPrice
      })
    }, 300)
  })
}

export async function updatePrice(data: Partial<PriceStrategy>): Promise<ApiResponse<PriceStrategy | null>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const prices = getPrices()
      const index = prices.findIndex(p => p.id === data.id)

      if (index > -1) {
        prices[index] = { ...prices[index], ...data }
        savePrices(prices)
      }

      resolve({
        code: 200,
        message: '更新成功',
        data: prices[index] || null
      })
    }, 300)
  })
}

export async function deletePrice(id: string): Promise<ApiResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let prices = getPrices()
      prices = prices.filter(p => p.id !== id)
      savePrices(prices)

      resolve({
        code: 200,
        message: '删除成功',
        data: null
      })
    }, 300)
  })
}
