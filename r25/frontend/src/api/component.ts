import request from '../utils/request';
import type { ComponentConfig, PageResult, ApiResponse } from '../types';

export interface ComponentListParams {
  current: number;
  size: number;
  keyword?: string;
  componentType?: string;
}

export function getComponentList(params: ComponentListParams): Promise<ApiResponse<PageResult<ComponentConfig>>> {
  return request.get('/component/list', { params }).then(res => res.data);
}

export function getComponentDetail(id: string): Promise<ApiResponse<ComponentConfig>> {
  return request.get(`/component/${id}`).then(res => res.data);
}

export function createComponent(data: Partial<ComponentConfig>): Promise<ApiResponse<ComponentConfig>> {
  return request.post('/component', data).then(res => res.data);
}

export function updateComponent(id: string, data: Partial<ComponentConfig>): Promise<ApiResponse<ComponentConfig>> {
  return request.put(`/component/${id}`, data).then(res => res.data);
}

export function deleteComponent(id: string): Promise<ApiResponse<void>> {
  return request.delete(`/component/${id}`).then(res => res.data);
}

export function saveComponentConfig(data: Partial<ComponentConfig>): Promise<ApiResponse<ComponentConfig>> {
  return request.post('/component/config', data).then(res => res.data);
}
