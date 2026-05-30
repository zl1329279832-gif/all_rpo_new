import request from '@/utils/request'

export function getOrderPage(params) {
  return request({
    url: '/order/page',
    method: 'get',
    params
  })
}

export function getOrderDetail(id) {
  return request({
    url: `/order/${id}`,
    method: 'get'
  })
}

export function getOrderItems(id) {
  return request({
    url: `/order/${id}/items`,
    method: 'get'
  })
}

export function getOrderItemList(orderId) {
  return request({
    url: `/order/${orderId}/items`,
    method: 'get'
  })
}

export function getMyOrders(params) {
  return request({
    url: '/order/my',
    method: 'get',
    params
  })
}

export function createOrder(data) {
  return request({
    url: '/order',
    method: 'post',
    data
  })
}

export function cancelOrder(id, cancelReason) {
  return request({
    url: `/order/${id}/cancel`,
    method: 'put',
    data: { cancelReason }
  })
}

export function payOrder(id) {
  return request({
    url: `/order/${id}/pay`,
    method: 'put'
  })
}

export function deleteOrder(id) {
  return request({
    url: `/order/${id}`,
    method: 'delete'
  })
}

export function deleteOrderBatch(ids) {
  return request({
    url: '/order',
    method: 'delete',
    data: ids
  })
}
