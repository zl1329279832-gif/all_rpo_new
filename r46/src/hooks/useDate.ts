import { ref, computed } from 'vue'
import type { FilterParams } from '@/types'
import { getDateRange, formatDate } from '@/utils'

export function useDate() {
  const startDate = ref('')
  const endDate = ref('')
  const dateRange = ref('week')

  const quickRanges = [
    { value: 'today', label: '今日' },
    { value: 'yesterday', label: '昨日' },
    { value: 'week', label: '近一周' },
    { value: 'month', label: '近一月' },
    { value: 'quarter', label: '近三月' },
    { value: 'year', label: '近一年' },
  ]

  const initFromFilter = (filter: FilterParams) => {
    startDate.value = filter.startDate
    endDate.value = filter.endDate
    dateRange.value = filter.dateRange
  }

  const setQuickRange = (range: string) => {
    dateRange.value = range
    const dates = getDateRange(range)
    startDate.value = dates.startDate
    endDate.value = dates.endDate
  }

  const setCustomRange = (dates: [string, string]) => {
    startDate.value = dates[0]
    endDate.value = dates[1]
    dateRange.value = 'custom'
  }

  const dateRangeArray = computed((): [string, string] => [startDate.value, endDate.value])

  const getDaysBetween = (): number => {
    const start = new Date(startDate.value)
    const end = new Date(endDate.value)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  const generateDateArray = (): string[] => {
    const dates: string[] = []
    const start = new Date(startDate.value)
    const end = new Date(endDate.value)

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(formatDate(new Date(d)))
    }

    return dates
  }

  const formatDisplay = computed(() => {
    if (dateRange.value !== 'custom') {
      const range = quickRanges.find((r) => r.value === dateRange.value)
      return range ? range.label : `${startDate.value} 至 ${endDate.value}`
    }
    return `${startDate.value} 至 ${endDate.value}`
  })

  return {
    startDate,
    endDate,
    dateRange,
    quickRanges,
    initFromFilter,
    setQuickRange,
    setCustomRange,
    dateRangeArray,
    getDaysBetween,
    generateDateArray,
    formatDisplay,
  }
}
