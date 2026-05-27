import request from '../utils/request'
import type { ApiResponse, PageResult, Station, PageParams } from '../types'

export interface StationParams extends PageParams {
  keyword?: string
  area?: string
  status?: string
}

export function getStationList(params: StationParams) {
  return request.get<any, ApiResponse<PageResult<Station>>>('/station/list', { params })
}

export function getStationDetail(id: string) {
  return request.get<any, ApiResponse<Station>>('/station/detail', { params: { id } })
}

export function createStation(data: Partial<Station>) {
  return request.post<any, ApiResponse<Station>>('/station', data)
}

export function updateStation(data: Partial<Station>) {
  return request.put<any, ApiResponse<Station>>('/station', data)
}

export function deleteStations(ids: string[]) {
  return request.delete<any, ApiResponse>('/station/batch', { data: { ids } })
}

export function getAreas() {
  return request.get<any, ApiResponse<string[]>>('/station/areas')
}
