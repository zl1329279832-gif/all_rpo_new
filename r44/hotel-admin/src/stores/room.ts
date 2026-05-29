import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { roomTypeApi, type RoomTypeQuery, type RoomTypeCreate, type RoomTypeUpdate, type RoomType } from '../api/roomType'
import { dailyStatusApi, type DailyStatusQuery, type DailyStatus } from '../api/dailyStatus'

export const useRoomStore = defineStore('room', () => {
  const roomTypes = ref<RoomType[]>([])
  const roomTypesTotal = ref(0)
  const currentRoomType = ref<RoomType | null>(null)
  const dailyStatusList = ref<DailyStatus[]>([])
  const dailyStatusTotal = ref(0)
  const dailyStatusSummary = ref<{
    totalRooms: number
    soldRooms: number
    availableRooms: number
    avgOccupancy: number
    avgPrice: number
  } | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const roomTypeQuery = ref<RoomTypeQuery>({
    page: 1,
    pageSize: 10
  })
  const dailyStatusQuery = ref<DailyStatusQuery>({
    page: 1,
    pageSize: 30
  })

  const availableCount = computed(() => roomTypes.value.filter((r: RoomType) => r.status === 'available').length)
  const maintenanceCount = computed(() => roomTypes.value.filter((r: RoomType) => r.status === 'maintenance').length)
  const disabledCount = computed(() => roomTypes.value.filter((r: RoomType) => r.status === 'disabled').length)

  async function fetchRoomTypes(params?: RoomTypeQuery): Promise<void> {
    loading.value = true
    error.value = null
    try {
      if (params) {
        roomTypeQuery.value = { ...roomTypeQuery.value, ...params }
      }
      const res = await roomTypeApi.getList(roomTypeQuery.value)
      roomTypes.value = res.list
      roomTypesTotal.value = res.total
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取房型列表失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchAllRoomTypes(): Promise<RoomType[]> {
    loading.value = true
    error.value = null
    try {
      const res = await roomTypeApi.getAll()
      roomTypes.value = res
      roomTypesTotal.value = res.length
      return res
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取所有房型失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchRoomTypeById(id: string): Promise<RoomType | null> {
    loading.value = true
    error.value = null
    try {
      const res = await roomTypeApi.getById(id)
      currentRoomType.value = res
      return res
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取房型详情失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createRoomType(data: RoomTypeCreate): Promise<RoomType> {
    loading.value = true
    error.value = null
    try {
      const res = await roomTypeApi.create(data)
      return res
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建房型失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateRoomType(data: RoomTypeUpdate): Promise<RoomType> {
    loading.value = true
    error.value = null
    try {
      const res = await roomTypeApi.update(data)
      const index = roomTypes.value.findIndex(r => r.id === data.id)
      if (index !== -1) {
        roomTypes.value[index] = res
      }
      if (currentRoomType.value?.id === data.id) {
        currentRoomType.value = res
      }
      return res
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新房型失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteRoomType(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await roomTypeApi.remove(id)
      roomTypes.value = roomTypes.value.filter(r => r.id !== id)
      roomTypesTotal.value--
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除房型失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchDailyStatus(params?: DailyStatusQuery): Promise<void> {
    loading.value = true
    error.value = null
    try {
      if (params) {
        dailyStatusQuery.value = { ...dailyStatusQuery.value, ...params }
      }
      const res = await dailyStatusApi.getList(dailyStatusQuery.value)
      dailyStatusList.value = res.list
      dailyStatusTotal.value = res.total
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取每日房态失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchDailyStatusByDate(date: string): Promise<DailyStatus[]> {
    loading.value = true
    error.value = null
    try {
      const res = await dailyStatusApi.getByDate(date)
      dailyStatusList.value = res
      return res
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取指定日期房态失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchDailyStatusByDateRange(startDate: string, endDate: string): Promise<DailyStatus[]> {
    loading.value = true
    error.value = null
    try {
      const res = await dailyStatusApi.getByDateRange(startDate, endDate)
      dailyStatusList.value = res
      return res
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取日期范围房态失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchDailyStatusSummary(startDate?: string, endDate?: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await dailyStatusApi.getSummary(startDate, endDate)
      dailyStatusSummary.value = res
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取房态汇总失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  function setRoomTypeQuery(params: Partial<RoomTypeQuery>): void {
    roomTypeQuery.value = { ...roomTypeQuery.value, ...params, page: 1 }
  }

  function setDailyStatusQuery(params: Partial<DailyStatusQuery>): void {
    dailyStatusQuery.value = { ...dailyStatusQuery.value, ...params, page: 1 }
  }

  function resetRoomTypeQuery(): void {
    roomTypeQuery.value = {
      page: 1,
      pageSize: 10
    }
  }

  function resetDailyStatusQuery(): void {
    dailyStatusQuery.value = {
      page: 1,
      pageSize: 30
    }
  }

  function reset(): void {
    roomTypes.value = []
    roomTypesTotal.value = 0
    currentRoomType.value = null
    dailyStatusList.value = []
    dailyStatusTotal.value = 0
    dailyStatusSummary.value = null
    error.value = null
    resetRoomTypeQuery()
    resetDailyStatusQuery()
  }

  return {
    roomTypes,
    roomTypesTotal,
    currentRoomType,
    dailyStatusList,
    dailyStatusTotal,
    dailyStatusSummary,
    loading,
    error,
    roomTypeQuery,
    dailyStatusQuery,
    availableCount,
    maintenanceCount,
    disabledCount,
    fetchRoomTypes,
    fetchAllRoomTypes,
    fetchRoomTypeById,
    createRoomType,
    updateRoomType,
    deleteRoomType,
    fetchDailyStatus,
    fetchDailyStatusByDate,
    fetchDailyStatusByDateRange,
    fetchDailyStatusSummary,
    setRoomTypeQuery,
    setDailyStatusQuery,
    resetRoomTypeQuery,
    resetDailyStatusQuery,
    reset
  }
})
