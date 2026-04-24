import { request } from './request'
import type { Group, GroupMember } from '@/types'

export const groupApi = {
  getMyGroups: () => {
    return request.get<Group[]>('/group/my')
  },
  
  getInfo: (groupId: number) => {
    return request.get<Group>(`/group/info/${groupId}`)
  },
  
  getMembers: (groupId: number) => {
    return request.get<GroupMember[]>(`/group/members/${groupId}`)
  },
  
  create: (groupName: string, groupNotice?: string, memberIds?: number[]) => {
    return request.post<Group>('/group/create', { groupName, groupNotice, memberIds })
  },
  
  dissolve: (groupId: number) => {
    return request.delete(`/group/dissolve/${groupId}`)
  },
  
  quit: (groupId: number) => {
    return request.post(`/group/quit/${groupId}`)
  },
  
  addMembers: (groupId: number, userIds: number[]) => {
    return request.post('/group/add-members', null, {
      params: { groupId, userIds: userIds.join(',') }
    })
  },
  
  removeMember: (groupId: number, memberId: number) => {
    return request.post('/group/remove-member', null, {
      params: { groupId, memberId }
    })
  }
}
