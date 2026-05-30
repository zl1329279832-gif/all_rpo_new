import request from '@/utils/request'

export function getSortPage(params) {
  return request({
    url: '/api/warehouse/sort/page',
    method: 'get',
    params
  })
}

export function getSortDetail(id) {
  return request({
    url: `/api/warehouse/sort/${id}`,
    method: 'get'
  })
}

export function createSort(data) {
  return request({
    url: '/api/warehouse/sort',
    method: 'post',
    data
  })
}

export function printSort(id) {
  return request({
    url: `/api/warehouse/sort/${id}/print`,
    method: 'put'
  })
}

export function startSort(id) {
  return request({
    url: `/api/warehouse/sort/${id}/start`,
    method: 'put'
  })
}

export function completeSort(id, items) {
  return request({
    url: `/api/warehouse/sort/${id}/complete`,
    method: 'put',
    data: { items }
  })
}

export function getSortItemList(sortId) {
  return request({
    url: `/api/warehouse/sort/item/list/${sortId}`,
    method: 'get'
  })
}

export function deleteSort(id) {
  return request({
    url: `/api/warehouse/sort/${id}`,
    method: 'delete'
  })
}

export function deleteSortBatch(ids) {
  return request({
    url: '/api/warehouse/sort',
    method: 'delete',
    data: ids
  })
}

export function saveSortItem(data) {
  return request({
    url: '/api/warehouse/sort/item/save',
    method: 'put',
    data
  })
}
