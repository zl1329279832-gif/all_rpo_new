import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dashboardApi, type KpiData, type DashboardData } from '../api/dashboard'
import type { Order } from '../types'

export const useDashboardStore = defineStore('dashboard', () => {
  const data = ref<DashboardData | null>(null)
  const kpis = ref<KpiData[]>([])
  const channelShare = ref<{ name: string; value: number }[]>([])
  const cancellationTrend = ref<{ date: string; count: number; rate: number }[]>([])
  const sevenDayForecast = ref<{ date: string; occupancy: number; revenue: number }[]>([])
  const recentOrders = ref<Order[]>([])
  const quickStats = ref<{
    memberArrivals: number
    vipArrivals: number
    groupArrivals: number
    specialRequests: number
  } | null>(null)
  const realTimeUpdates = ref<{
    type: 'checkIn' | 'checkOut' | 'complaint' | 'order'
    title: string
    description: string
    time: string
  }[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const [
        dataRes,
        kpisRes,
        channelShareRes,
        cancellationTrendRes,
        sevenDayForecastRes,
        recentOrdersRes,
        quickStatsRes,
        realTimeUpdatesRes
      ] = await Promise.all([
        dashboardApi.getData(),
        dashboardApi.getKpis(),
        dashboardApi.getChannelShare(),
        dashboardApi.getCancellationTrend(),
        dashboardApi.getSevenDayForecast(),
        dashboardApi.getRecentOrders(10),
        dashboardApi.getQuickStats(),
        dashboardApi.getRealTimeUpdates()
      ])
      data.value = dataRes
      kpis.value = kpisRes
      channelShare.value = channelShareRes
      cancellationTrend.value = cancellationTrendRes
      sevenDayForecast.value = sevenDayForecastRes
      recentOrders.value = recentOrdersRes
      quickStats.value = quickStatsRes
      realTimeUpdates.value = realTimeUpdatesRes
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取数据失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function refresh(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await dashboardApi.refresh()
      await fetchAll()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '刷新数据失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  function reset(): void {
    data.value = null
    kpis.value = []
    channelShare.value = []
    cancellationTrend.value = []
    sevenDayForecast.value = []
    recentOrders.value = []
    quickStats.value = null
    realTimeUpdates.value = []
    error.value = null
  }

  return {
    data,
    kpis,
    channelShare,
    cancellationTrend,
    sevenDayForecast,
    recentOrders,
    quickStats,
    realTimeUpdates,
    loading,
    error,
    fetchAll,
    refresh,
    reset
  }
})
