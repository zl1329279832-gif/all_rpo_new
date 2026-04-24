import { request } from './request'
import type { User } from '@/types'

export const userApi = {
  getInfo: () => {
    return request.get<User>('/user/info')
  },
  
  getInfoById: (id: number) => {
    return request.get<User>(`/user/info/id?id=${id}`)
  },
  
  search: (keyword: string) => {
    return request.get<User[]>(`/user/search?keyword=${keyword}`)
  },
  
  getOnlineUsers: () => {
    return request.get<User[]>('/user/online')
  }
}
