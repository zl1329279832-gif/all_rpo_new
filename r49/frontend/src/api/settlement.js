import request from '@/utils/request'

export function getSettlementPage(params) {
  return request({
    url: '/settlement/page',
    method: 'get',
    params
  })
}

export function getSettlementDetail(id) {
  return request({
    url: `/settlement/${id}`,
    method: 'get'
  })
}

export function createSettlement(data) {
  return request({
    url: '/settlement',
    method: 'post',
    data
  })
}

export function auditSettlement(id, data) {
  return request({
    url: `/settlement/${id}/audit`,
    method: 'put',
    data
  })
}

export function completeSettlement(id) {
  return request({
    url: `/settlement/${id}/complete`,
    method: 'put'
  })
}

export function exportSettlement(id) {
  return request({
    url: `/settlement/${id}/export`,
    method: 'get',
    responseType: 'blob'
  })
}

export function getSettlementItems(settlementId) {
  return request({
    url: `/settlement/${settlementId}/items`,
    method: 'get'
  })
}

export function getCommissionPage(params) {
  return request({
    url: '/commission/page',
    method: 'get',
    params
  })
}

export function getLeaderSettlementStats(params) {
  return request({
    url: '/settlement/leader-stats',
    method: 'get',
    params
  })
}

export function getLeaderList() {
  return request({
    url: '/leader/list',
    method: 'get'
  })
}

export function getUnsettledOrders(leaderId, startDate, endDate) {
  return request({
    url: '/settlement/unsettled-orders',
    method: 'get',
    params: { leaderId, startDate, endDate }
  })
}
