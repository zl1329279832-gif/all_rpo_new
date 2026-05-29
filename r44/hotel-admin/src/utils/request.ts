import type { ApiResponse } from '../types'

interface RequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  params?: Record<string, any>
  delay?: number
  errorRate?: number
  headers?: Record<string, string>
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  })
  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export async function request<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
  const {
    url,
    method = 'GET',
    data,
    params,
    delay: customDelay,
    errorRate = 0.05,
    headers = {}
  } = config

  const baseDelay = customDelay ?? Math.floor(Math.random() * 500) + 300
  
  await delay(baseDelay)

  if (Math.random() < errorRate) {
    const errorTypes = [
      { code: 400, message: '请求参数错误' },
      { code: 401, message: '未授权，请重新登录' },
      { code: 403, message: '没有权限访问' },
      { code: 404, message: '请求的资源不存在' },
      { code: 500, message: '服务器内部错误' },
      { code: 502, message: '网关错误' },
      { code: 503, message: '服务不可用' },
      { code: 504, message: '请求超时' }
    ]
    const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)]
    
    throw new ApiError(randomError.code, randomError.message)
  }

  const fullUrl = params ? `${url}${buildQueryString(params)}` : url

  console.log(`[Mock Request] ${method} ${fullUrl}`, {
    headers,
    data,
    responseTime: `${baseDelay}ms`
  })

  return {
    code: 200,
    message: 'success',
    data: null as T
  }
}

export class ApiError extends Error {
  code: number
  message: string

  constructor(code: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.message = message
  }

  toString(): string {
    return `[ApiError ${this.code}] ${this.message}`
  }
}

export async function get<T = any>(
  url: string,
  params?: Record<string, any>,
  config?: Omit<RequestConfig, 'url' | 'method' | 'params' | 'data'>
): Promise<ApiResponse<T>> {
  return request<T>({ ...config, url, method: 'GET', params })
}

export async function post<T = any>(
  url: string,
  data?: any,
  config?: Omit<RequestConfig, 'url' | 'method' | 'data'>
): Promise<ApiResponse<T>> {
  return request<T>({ ...config, url, method: 'POST', data })
}

export async function put<T = any>(
  url: string,
  data?: any,
  config?: Omit<RequestConfig, 'url' | 'method' | 'data'>
): Promise<ApiResponse<T>> {
  return request<T>({ ...config, url, method: 'PUT', data })
}

export async function del<T = any>(
  url: string,
  config?: Omit<RequestConfig, 'url' | 'method'>
): Promise<ApiResponse<T>> {
  return request<T>({ ...config, url, method: 'DELETE' })
}

export function mockSuccess<T>(data: T, delayMs?: number): Promise<ApiResponse<T>> {
  return new Promise(async (resolve) => {
    if (delayMs) await delay(delayMs)
    resolve({
      code: 200,
      message: 'success',
      data
    })
  })
}

export function mockError(code: number, message: string, delayMs?: number): Promise<never> {
  return new Promise(async (_, reject) => {
    if (delayMs) await delay(delayMs)
    reject(new ApiError(code, message))
  })
}

export function mockPagination<T>(
  list: T[],
  page: number,
  pageSize: number
): Promise<ApiResponse<{ list: T[]; total: number; page: number; pageSize: number }>> {
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedList = list.slice(startIndex, endIndex)

  return mockSuccess({
    list: paginatedList,
    total: list.length,
    page,
    pageSize
  })
}

export function mockCreate<T extends { id?: string; createdAt?: string; updatedAt?: string }>(
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ApiResponse<T>> {
  const now = new Date().toISOString()
  const created = {
    ...(data as unknown as T),
    id: generateId(),
    createdAt: now,
    updatedAt: now
  }

  return mockSuccess(created as T, 300)
}

export function mockUpdate<T extends { updatedAt?: string }>(
  existing: T,
  updates: Partial<T>
): Promise<ApiResponse<T>> {
  const updated = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  }

  return mockSuccess(updated, 200)
}

export function mockDelete(): Promise<ApiResponse<null>> {
  return mockSuccess(null, 200)
}

export function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  return fn().catch(error => {
    if (retries > 0) {
      console.warn(`Request failed, retrying... (${retries} attempts left)`)
      return delay(delayMs).then(() => withRetry(fn, retries - 1, delayMs * 2))
    }
    throw error
  })
}

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 10000,
  message: string = '请求超时'
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new ApiError(504, message)), timeoutMs)
  })
  return Promise.race([promise, timeout])
}
