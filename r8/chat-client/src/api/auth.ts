import { request } from './request'
import type { LoginResult } from '@/types'

export const authApi = {
  login: (username: string, password: string) => {
    return request.post<LoginResult>('/auth/login', { username, password })
  },
  
  register: (username: string, password: string, confirmPassword: string, nickname?: string) => {
    return request.post('/auth/register', { username, password, confirmPassword, nickname })
  },
  
  logout: () => {
    return request.post('/auth/logout')
  }
}
