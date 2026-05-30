import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { FilterParams } from '@/types'
import { getDateRange } from '@/utils'

export const useFilterStore = defineStore(
  'filter',
  () => {
    const { startDate, endDate } = getDateRange('week')

    const filterParams = ref<FilterParams>({
      startDate,
      endDate,
      department: 'all',
      dateRange: 'week',
    })

    const setDateRange = (range: string) => {
      filterParams.value.dateRange = range
      const dates = getDateRange(range)
      filterParams.value.startDate = dates.startDate
      filterParams.value.endDate = dates.endDate
    }

    const setDepartment = (dept: string) => {
      filterParams.value.department = dept
    }

    const setCustomDate = (start: string, end: string) => {
      filterParams.value.startDate = start
      filterParams.value.endDate = end
      filterParams.value.dateRange = 'custom'
    }

    const resetFilter = () => {
      const dates = getDateRange('week')
      filterParams.value = {
        startDate: dates.startDate,
        endDate: dates.endDate,
        department: 'all',
        dateRange: 'week',
      }
    }

    return {
      filterParams,
      setDateRange,
      setDepartment,
      setCustomDate,
      resetFilter,
    }
  },
  {
    persist: {
      key: 'hospital-filter',
      storage: localStorage,
    },
  }
)
