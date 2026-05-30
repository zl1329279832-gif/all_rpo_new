import request from '@/utils/request'

export function getBusinessOverview() {
  return request({
    url: '/statistics/business-overview',
    method: 'get'
  })
}

export function getSalesTrend(startDate, endDate) {
  return request({
    url: '/statistics/sales-trend',
    method: 'get',
    params: { startDate, endDate }
  })
}

export function getProductRank(limit, sortBy) {
  return request({
    url: '/statistics/product-rank',
    method: 'get',
    params: { limit, sortBy }
  })
}

export function getLeaderRank(limit) {
  return request({
    url: '/statistics/leader-rank',
    method: 'get',
    params: { limit }
  })
}

export function getAfterSaleStatistics(startDate, endDate) {
  return request({
    url: '/statistics/afterSale',
    method: 'get',
    params: { startDate, endDate }
  })
}

export function getDashboardData() {
  return request({
    url: '/statistics/dashboard',
    method: 'get'
  })
}

export function getSalesStatistics(params) {
  return request({
    url: '/statistics/sales',
    method: 'get',
    params
  })
}

export function getOrderStatistics(params) {
  return request({
    url: '/statistics/order',
    method: 'get',
    params
  })
}

export function getProductStatistics(params) {
  return request({
    url: '/statistics/product',
    method: 'get',
    params
  })
}

export function getLeaderStatistics(params) {
  return request({
    url: '/statistics/leader',
    method: 'get',
    params
  })
}

export function getActivityStatistics(params) {
  return request({
    url: '/statistics/activity',
    method: 'get',
    params
  })
}

export function getTrendData(params) {
  return request({
    url: '/statistics/trend',
    method: 'get',
    params
  })
}

export function exportStatistics(params) {
  return request({
    url: '/statistics/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}
