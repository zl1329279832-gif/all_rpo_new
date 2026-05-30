import request from '@/utils/request'

export function getActivityPage(params) {
  return request({
    url: '/activity/page',
    method: 'get',
    params
  })
}

export function getActivityDetail(id) {
  return request({
    url: `/activity/${id}`,
    method: 'get'
  })
}

export function getActivitySkuList(id) {
  return request({
    url: `/activity/${id}/sku-list`,
    method: 'get'
  })
}

export function createActivity(data) {
  return request({
    url: '/activity',
    method: 'post',
    data
  })
}

export function updateActivity(data) {
  return request({
    url: '/activity',
    method: 'put',
    data
  })
}

export function deleteActivity(id) {
  return request({
    url: `/activity/${id}`,
    method: 'delete'
  })
}

export function updateActivityStatus(id, status) {
  return request({
    url: `/activity/${id}/status`,
    method: 'put',
    data: { status }
  })
}

export function validateStock(id, skuList) {
  return request({
    url: `/activity/${id}/validate-stock`,
    method: 'post',
    data: skuList
  })
}

export function validateCutoff(id) {
  return request({
    url: `/activity/${id}/validate-cutoff`,
    method: 'post'
  })
}

export function getActivitySkuPage(params) {
  return request({
    url: '/activity/sku/list',
    method: 'get',
    params
  })
}

export function createActivitySku(data) {
  return request({
    url: '/activity/sku',
    method: 'post',
    data
  })
}

export function updateActivitySku(data) {
  return request({
    url: '/activity/sku',
    method: 'put',
    data
  })
}

export function deleteActivitySku(id) {
  return request({
    url: `/activity/sku/${id}`,
    method: 'delete'
  })
}

export function decreaseStock(id, quantity) {
  return request({
    url: `/activity/sku/${id}/decrease-stock`,
    method: 'put',
    data: { quantity }
  })
}

export function releaseStock(id, quantity) {
  return request({
    url: `/activity/sku/${id}/release-stock`,
    method: 'put',
    data: { quantity }
  })
}

export function lockStock(id, quantity) {
  return request({
    url: `/activity/sku/${id}/lock-stock`,
    method: 'put',
    data: { quantity }
  })
}

export function unlockStock(id, quantity) {
  return request({
    url: `/activity/sku/${id}/unlock-stock`,
    method: 'put',
    data: { quantity }
  })
}
