import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { orderApi, type OrderQuery, type OrderExportParams } from '../api/order'
import type { Order } from '../types'

export const useOrderStore = defineStore('order', () => {
  const list = ref<Order[]>([])
  const total = ref(0)
  const current = ref<Order | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const query = ref<OrderQuery>({
    page: 1,
    pageSize: 10
  })

  const statistics = ref<{
    totalOrders: number
    totalRevenue: number
    confirmedOrders: number
    cancelledOrders: number
    cancelledRate: number
  } | null>(null)

  const pendingCount = computed(() => list.value.filter(o => o.status === 'pending').length)
  const confirmedCount = computed(() => list.value.filter(o => o.status === 'confirmed').length)
  const checkedInCount = computed(() => list.value.filter(o => o.status === 'checkedIn').length)
  const checkedOutCount = computed(() => list.value.filter(o => o.status === 'checkedOut').length)
  const cancelledCount = computed(() => list.value.filter(o => o.status === 'cancelled').length)

  type OrderStatus = Order['status']

  async function fetchList(params?: OrderQuery): Promise<void> {
    loading.value = true
    error.value = null
    try {
      if (params) {
        query.value = { ...query.value, ...params }
      }
      const res = await orderApi.getList(query.value)
      list.value = res.list
      total.value = res.total
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取订单列表失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: string): Promise<Order | null> {
    loading.value = true
    error.value = null
    try {
      const res = await orderApi.getById(id)
      current.value = res
      return res
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取订单详情失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchByStatus(status: OrderStatus): Promise<Order[]> {
    loading.value = true
    error.value = null
    try {
      const res = await orderApi.getByStatus(status)
      return res
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取订单失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateStatus(id: string, status: OrderStatus): Promise<Order> {
    loading.value = true
    error.value = null
    try {
      const res = await orderApi.updateStatus(id, status)
      const index = list.value.findIndex(o => o.id === id)
      if (index !== -1) {
        list.value[index] = res
      }
      if (current.value?.id === id) {
        current.value = res
      }
      return res
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新订单状态失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function exportData(params: OrderExportParams): Promise<Blob> {
    loading.value = true
    error.value = null
    try {
      return await orderApi.exportData(params)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '导出订单失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchStatistics(startDate?: string, endDate?: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await orderApi.getStatistics(startDate, endDate)
      statistics.value = res
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取订单统计失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  function setQuery(params: Partial<OrderQuery>): void {
    query.value = { ...query.value, ...params, page: 1 }
  }

  function resetQuery(): void {
    query.value = {
      page: 1,
      pageSize: 10
    }
  }

  function reset(): void {
    list.value = []
    total.value = 0
    current.value = null
    error.value = null
    statistics.value = null
    resetQuery()
  }

  return {
    list,
    total,
    current,
    loading,
    error,
    query,
    statistics,
    pendingCount,
    confirmedCount,
    checkedInCount,
    checkedOutCount,
    cancelledCount,
    fetchList,
    fetchById,
    fetchByStatus,
    updateStatus,
    exportData,
    fetchStatistics,
    setQuery,
    resetQuery,
    reset
  }
})
