import { get, post } from './request'
import type { ApiResult, UserInfo } from '@/types'

interface LoginParams {
  username: string
  password: string
}

interface LoginResult {
  token: string
  userInfo: UserInfo
}

export const login = (params: LoginParams) => {
  return post<ApiResult<LoginResult>>('/user/login', params)
}

export const getUserInfo = () => {
  return get<ApiResult<UserInfo>>('/user/info')
}

export const logout = () => {
  return post<ApiResult<null>>('/user/logout')
}
