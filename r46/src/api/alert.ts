import {
  getAlertList as _getAlertList,
  getAlertDetail as _getAlertDetail,
  handleAlert as _handleAlert,
  ignoreAlert as _ignoreAlert,
  getAlertStatistics as _getAlertStatistics,
  getAlertTypeDistribution as _getAlertTypeDistribution,
  getAlertTrend as _getAlertTrend,
  batchHandleAlert as _batchHandleAlert,
  batchIgnoreAlert as _batchIgnoreAlert,
} from '@/services/dataService'

export interface HandleRecord {
  id: string
  handler: string
  handleTime: string
  action: string
  note: string
}

export function getAlertList(params?: {
  level?: string
  status?: string
  type?: string
  page?: number
  pageSize?: number
}) {
  const result = _getAlertList(params || {})
  return Promise.resolve({
    ...result,
    data: {
      ...result.data,
      processingCount: result.data.processingCount,
      resolvedCount: result.data.resolvedCount,
    },
  })
}

export function getAlertDetail(params: { id: string }) {
  const result = _getAlertDetail(params)
  return Promise.resolve({
    ...result,
    data: {
      alert: {
        id: result.data.id,
        level: result.data.level,
        type: result.data.type,
        department: result.data.department,
        description: result.data.description,
        value: result.data.value,
        threshold: result.data.threshold,
        time: result.data.time,
        status: result.data.status,
        handler: result.data.handler,
        handleTime: result.data.handleTime,
        handleNote: result.data.handleNote,
      },
      handleRecords: result.data.handleRecords.map((r: any, i: number) => ({
        id: `record-${i}`,
        handler: r.operator,
        handleTime: r.time,
        action: r.action,
        note: r.note,
      })),
      suggestions: result.data.suggestions,
    },
  })
}

export function handleAlert(params: { id: string; status: string; note: string }) {
  return Promise.resolve(_handleAlert(params))
}

export function ignoreAlert(params: { id: string; note: string }) {
  return Promise.resolve(_ignoreAlert(params))
}

export function getAlertStatistics() {
  return Promise.resolve(_getAlertStatistics())
}

export function getAlertTypeDistribution() {
  return Promise.resolve(_getAlertTypeDistribution())
}

export function getAlertTrend(params?: { days?: number }) {
  return Promise.resolve(_getAlertTrend(params))
}

export function batchHandleAlert(params: { ids: string[]; status: string; note: string }) {
  return Promise.resolve(_batchHandleAlert(params))
}

export function batchIgnoreAlert(params: { ids: string[]; note: string }) {
  return Promise.resolve(_batchIgnoreAlert(params))
}

export function batchHandle(params: { ids: string[]; note: string }) {
  return batchHandleAlert({ ...params, status: 'processing' })
}

export function batchIgnore(params: { ids: string[]; note: string }) {
  return batchIgnoreAlert(params)
}
