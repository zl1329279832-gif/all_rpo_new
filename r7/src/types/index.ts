export interface User {
  id: string
  username: string
  avatar: string
  nickname: string
  status: 'online' | 'offline' | 'away'
  signature?: string
  lastOnlineTime?: string
}

export interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  type: 'text' | 'image' | 'system'
  status: 'sending' | 'sent' | 'read' | 'failed'
  timestamp: number
  isRead: boolean
  isRecalled: boolean
  recallTime?: number
}

export interface ChatSession {
  id: string
  type: 'single' | 'group'
  name: string
  avatar: string
  lastMessage?: Message
  unreadCount: number
  members?: User[]
  ownerId?: string
  createTime?: number
}

export interface Contact extends User {
  isFriend: boolean
  lastChatTime?: number
}

export interface ChatHistory {
  sessionId: string
  messages: Message[]
  total: number
  hasMore: boolean
}

export interface Notification {
  id: string
  type: 'message' | 'friend_request' | 'system'
  title: string
  content: string
  timestamp: number
  isRead: boolean
  relatedId?: string
}

export interface SearchResult {
  type: 'contact' | 'message' | 'group'
  id: string
  name: string
  avatar: string
  highlight?: string
  timestamp?: number
}

export interface WebSocketMessage {
  type: 'message' | 'status' | 'typing' | 'read_receipt' | 'system'
  data: any
  timestamp: number
}

export interface ConnectionState {
  isConnected: boolean
  lastPingTime?: number
  reconnectAttempts: number
}

export interface ThemeState {
  isDark: boolean
}
