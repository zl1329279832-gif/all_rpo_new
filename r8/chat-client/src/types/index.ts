export interface User {
  id: number
  username: string
  nickname: string
  avatar: string
  email: string
  phone: string
  status: number
  online: boolean
  lastLoginTime: string
  createTime: string
}

export interface LoginResult {
  token: string
  user: User
}

export interface Friend {
  id: number
  userId: number
  friendId: number
  remark: string
  status: number
  friendInfo: User
  createTime: string
}

export interface Group {
  id: number
  groupName: string
  groupAvatar: string
  groupNotice: string
  ownerId: number
  ownerInfo: User
  maxMembers: number
  memberCount: number
  createTime: string
  updateTime: string
}

export interface GroupMember {
  id: number
  groupId: number
  userId: number
  nickname: string
  role: number
  userInfo: User
  joinTime: string
}

export interface Message {
  id: number
  fromUserId: number
  fromUser?: User
  toUserId: number
  groupId: number
  chatType: number
  messageType: number
  content: string
  status: number
  sendTime: string
  readTime: string
}

export interface UnreadCount {
  targetId: number
  chatType: number
  count: number
}

export interface WebSocketMessage {
  type: string
  fromUserId: number
  toUserId: number
  groupId: number
  chatType: number
  messageType: number
  content: string
  data: any
  timestamp: string
}

export interface ChatSession {
  id: string
  targetId: number
  chatType: number
  name: string
  avatar: string
  lastMessage?: string
  lastTime?: string
  unreadCount: number
}

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: number
}

export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

export const ChatType = {
  PRIVATE: 1,
  GROUP: 2
} as const

export const MessageType = {
  TEXT: 1,
  IMAGE: 2,
  FILE: 3,
  SYSTEM: 4
} as const

export const MessageStatus = {
  SENT: 0,
  DELIVERED: 1,
  READ: 2
} as const

export const FriendStatus = {
  PENDING: 0,
  ACCEPTED: 1
} as const
