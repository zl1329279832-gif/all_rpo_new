import { getCoreMetrics as _getCoreMetrics, getTrendData as _getTrendData, getOverviewAlerts as _getOverviewAlerts } from '@/services/dataService'

export function getCoreMetrics(params?: { department?: string; dateRange?: string }) {
  return Promise.resolve(_getCoreMetrics(params || {}))
}

export function getTrendData(params?: { type?: string; days?: number }) {
  return Promise.resolve(_getTrendData(params || {}))
}

export function getOverviewAlerts() {
  return Promise.resolve(_getOverviewAlerts())
}
