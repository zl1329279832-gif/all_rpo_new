import request from '@/utils/request'

export function getAfterSalePage(params) {
  return request({
    url: '/afterSale/page',
    method: 'get',
    params
  })
}

export function getAfterSaleDetail(id) {
  return request({
    url: `/afterSale/${id}`,
    method: 'get'
  })
}

export function applyAfterSale(data) {
  return request({
    url: '/afterSale',
    method: 'post',
    data
  })
}

export function auditAfterSale(id, data) {
  return request({
    url: `/afterSale/${id}/audit`,
    method: 'put',
    data
  })
}

export function completeAfterSale(id) {
  return request({
    url: `/afterSale/${id}/complete`,
    method: 'put'
  })
}

export function getAfterSaleItems(afterSaleId) {
  return request({
    url: `/afterSale/${afterSaleId}/items`,
    method: 'get'
  })
}

export function cancelAfterSale(id) {
  return request({
    url: `/afterSale/${id}/cancel`,
    method: 'put'
  })
}
