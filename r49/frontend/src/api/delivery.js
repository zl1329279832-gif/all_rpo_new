import request from '@/utils/request'

export function getDeliveryPage(params) {
  return request({
    url: '/api/delivery/order/page',
    method: 'get',
    params
  })
}

export function getDeliveryDetail(id) {
  return request({
    url: `/api/delivery/order/${id}`,
    method: 'get'
  })
}

export function createDelivery(data) {
  return request({
    url: '/api/delivery/order',
    method: 'post',
    data
  })
}

export function departDelivery(id) {
  return request({
    url: `/api/delivery/order/${id}/depart`,
    method: 'put'
  })
}

export function arriveDelivery(id) {
  return request({
    url: `/api/delivery/order/${id}/arrive`,
    method: 'put'
  })
}

export function completeDelivery(id, items) {
  return request({
    url: `/api/delivery/order/${id}/complete`,
    method: 'put',
    data: { items }
  })
}

export function getDeliveryItemList(deliveryId) {
  return request({
    url: `/api/delivery/order/${deliveryId}/items`,
    method: 'get'
  })
}

export function getRouteList() {
  return request({
    url: '/api/delivery/route/list',
    method: 'get'
  })
}

export function getDeliveryOrderPage(params) {
  return request({
    url: '/api/delivery/order/page',
    method: 'get',
    params
  })
}

export function getDeliveryOrderDetail(id) {
  return request({
    url: `/api/delivery/order/${id}`,
    method: 'get'
  })
}

export function createDeliveryOrder(data) {
  return request({
    url: '/api/delivery/order',
    method: 'post',
    data
  })
}

export function cancelDelivery(id) {
  return request({
    url: `/api/delivery/order/${id}/cancel`,
    method: 'put'
  })
}

export function getDeliveryItems(deliveryId) {
  return request({
    url: `/api/delivery/order/${deliveryId}/items`,
    method: 'get'
  })
}

export function updateDeliveryItems(deliveryId, items) {
  return request({
    url: `/api/delivery/order/${deliveryId}/items`,
    method: 'put',
    data: items
  })
}

export function getDeliveryRoutePage(params) {
  return request({
    url: '/api/delivery/route/page',
    method: 'get',
    params
  })
}

export function createDeliveryRoute(data) {
  return request({
    url: '/api/delivery/route',
    method: 'post',
    data
  })
}

export function updateDeliveryRoute(data) {
  return request({
    url: '/api/delivery/route',
    method: 'put',
    data
  })
}

export function deleteDeliveryRoute(id) {
  return request({
    url: `/api/delivery/route/${id}`,
    method: 'delete'
  })
}

export function deleteDeliveryRouteBatch(ids) {
  return request({
    url: '/api/delivery/route',
    method: 'delete',
    data: ids
  })
}

export function enableDeliveryRoute(id) {
  return request({
    url: `/api/delivery/route/${id}/enable`,
    method: 'put'
  })
}

export function disableDeliveryRoute(id) {
  return request({
    url: `/api/delivery/route/${id}/disable`,
    method: 'put'
  })
}

export function getReceiptPage(params) {
  return request({
    url: '/api/leader/receipt/page',
    method: 'get',
    params
  })
}

export function getReceiptDetail(id) {
  return request({
    url: `/api/leader/receipt/${id}`,
    method: 'get'
  })
}

export function createReceipt(data) {
  return request({
    url: '/api/leader/receipt',
    method: 'post',
    data
  })
}

export function confirmReceipt(data) {
  return request({
    url: '/api/leader/receipt/receipt',
    method: 'post',
    data
  })
}

export function getReceiptItems(receiptId) {
  return request({
    url: `/api/leader/receipt/${receiptId}/items`,
    method: 'get'
  })
}

export function updateReceiptItems(receiptId, items) {
  return request({
    url: `/api/leader/receipt/${receiptId}/items`,
    method: 'put',
    data: items
  })
}
