import { request } from './request'
import type { Friend } from '@/types'

export const friendApi = {
  getList: () => {
    return request.get<Friend[]>('/friend/list')
  },
  
  getPending: () => {
    return request.get<Friend[]>('/friend/pending')
  },
  
  add: (friendId: number, remark?: string) => {
    return request.post('/friend/add', { friendId, remark })
  },
  
  accept: (friendId: number) => {
    return request.post(`/friend/accept?friendId=${friendId}`)
  },
  
  reject: (friendId: number) => {
    return request.post(`/friend/reject?friendId=${friendId}`)
  },
  
  remove: (friendId: number) => {
    return request.delete(`/friend/remove?friendId=${friendId}`)
  }
}
