import request from '@/utils/request'

export function getProductList(params) {
  return request({
    url: '/product/list',
    method: 'get',
    params
  })
}

export function getProductPage(params) {
  return request({
    url: '/product/page',
    method: 'get',
    params
  })
}

export function getProductDetail(id) {
  return request({
    url: `/product/${id}`,
    method: 'get'
  })
}

export function getProductBatchList(productId) {
  return request({
    url: `/product/${productId}/batch-list`,
    method: 'get'
  })
}

export function getBatchDetail(batchId) {
  return request({
    url: `/product/batch/${batchId}`,
    method: 'get'
  })
}
