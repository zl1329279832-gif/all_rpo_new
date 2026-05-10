export interface ComponentConfig {
  id: string;
  name: string;
  description: string;
  componentType: 'input' | 'select' | 'radio' | 'checkbox' | 'textarea' | 'date' | 'number';
  defaultValue: string;
  isRequired: boolean;
  validationRule: string;
  placeholder: string;
  options: string;
  apiUrl: string;
  apiMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  apiHeaders: string;
  apiParams: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiRequest {
  id: string;
  componentId: string;
  componentName: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  params: Record<string, any>;
  body: any;
  status: 'pending' | 'success' | 'error';
  responseStatus?: number;
  responseData?: any;
  responseHeaders?: Record<string, string>;
  errorMessage?: string;
  duration: number;
  createdAt: string;
}

export interface OperationLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  module: string;
  detail: string;
  ip: string;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  current: number;
  size: number;
  pages: number;
}

export interface PaginationParams {
  current: number;
  size: number;
  keyword?: string;
}
