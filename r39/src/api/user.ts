import request from '../utils/request'
import type { ApiResponse, User, LoginParams } from '../types'

export function login(data: LoginParams) {
  return request.post<any, ApiResponse<User>>('/user/login', data)
}

export function getUserInfo() {
  return request.get<any, ApiResponse<User>>('/user/info')
}

export function logout() {
  return request.post<any, ApiResponse>('/user/logout')
}
