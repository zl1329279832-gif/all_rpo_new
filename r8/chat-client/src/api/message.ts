import { request } from './request'
import type { Message, UnreadCount, PageResult } from '@/types'

export const messageApi = {
  send: (data: {
    chatType: number
    toUserId?: number
    groupId?: number
    messageType: number
    content: string
  }) => {
    return request.post<Message>('/message/send', data)
  },
  
  getHistory: (targetId: number, chatType: number, pageNum = 1, pageSize = 50) => {
    return request.get<PageResult<Message>>(`/message/history?targetId=${targetId}&chatType=${chatType}&pageNum=${pageNum}&pageSize=${pageSize}`)
  },
  
  getUnreadCounts: () => {
    return request.get<UnreadCount[]>('/message/unread/counts')
  },
  
  getUnreadCount: (targetId: number, chatType: number) => {
    return request.get<number>(`/message/unread/count?targetId=${targetId}&chatType=${chatType}`)
  },
  
  markAsRead: (targetId: number, chatType: number) => {
    return request.post('/message/read', null, {
      params: { targetId, chatType }
    })
  },
  
  getOffline: () => {
    return request.get<Message[]>('/message/offline')
  },
  
  clearOffline: () => {
    return request.post('/message/offline/clear')
  }
}
