import request from '../utils/request';
import type { OperationLog, PageResult, ApiResponse } from '../types';

export function getOperationLogs(params: {
  current: number;
  size: number;
  keyword?: string;
  module?: string;
  action?: string;
  startTime?: string;
  endTime?: string;
}): Promise<ApiResponse<PageResult<OperationLog>>> {
  return request.get('/log/operation', { params }).then(res => res.data);
}

export function getLogDetail(id: string): Promise<ApiResponse<OperationLog>> {
  return request.get(`/log/${id}`).then(res => res.data);
}
