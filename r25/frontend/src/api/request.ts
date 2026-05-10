import request from '../utils/request';
import type { ApiRequest, PageResult, ApiResponse } from '../types';

export interface ForwardRequestParams {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  params?: Record<string, any>;
  body?: any;
  componentId?: string;
  componentName?: string;
}

export interface ForwardResponse {
  status: number;
  statusText: string;
  data: any;
  headers: Record<string, string>;
  duration: number;
  requestId: string;
}

export function forwardApiRequest(data: ForwardRequestParams): Promise<ApiResponse<ForwardResponse>> {
  return request.post('/api/forward', data).then(res => res.data);
}

export function getRequestHistory(params: {
  current: number;
  size: number;
  keyword?: string;
  componentId?: string;
}): Promise<ApiResponse<PageResult<ApiRequest>>> {
  return request.get('/request/history', { params }).then(res => res.data);
}

export function getRequestDetail(id: string): Promise<ApiResponse<ApiRequest>> {
  return request.get(`/request/${id}`).then(res => res.data);
}

export function clearRequestHistory(): Promise<ApiResponse<void>> {
  return request.delete('/request/history').then(res => res.data);
}
