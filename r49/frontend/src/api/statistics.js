import request from '@/utils/request'

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

export function getAfterSaleStatistics(params) {
  return request({
    url: '/statistics/afterSale',
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
