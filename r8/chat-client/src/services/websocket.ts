import type { WebSocketMessage, Message } from '@/types'
import { storage } from '@/utils/storage'
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chat'
import { ElMessage } from 'element-plus'

class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 3000
  private heartbeatInterval: number | null = null
  private messageHandlers: Map<string, ((msg: WebSocketMessage) => void)[]> = new Map()
  private isConnecting = false

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      if (this.isConnecting) {
        reject(new Error('正在连接中'))
        return
      }

      const token = storage.getToken()
      if (!token) {
        reject(new Error('未登录'))
        return
      }

      this.isConnecting = true
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/ws/chat?token=${token}`

      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        this.isConnecting = false
        this.reconnectAttempts = 0
        this.startHeartbeat()
        console.log('WebSocket 连接成功')
        resolve()
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('解析 WebSocket 消息失败:', error)
        }
      }

      this.ws.onclose = () => {
        this.isConnecting = false
        this.stopHeartbeat()
        console.log('WebSocket 连接关闭')
        this.reconnect()
      }

      this.ws.onerror = (error) => {
        this.isConnecting = false
        console.error('WebSocket 错误:', error)
        reject(error)
      }
    })
  }

  disconnect() {
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket 未连接，消息无法发送')
    }
  }

  on(type: string, handler: (msg: WebSocketMessage) => void) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, [])
    }
    this.messageHandlers.get(type)!.push(handler)
  }

  off(type: string, handler: (msg: WebSocketMessage) => void) {
    const handlers = this.messageHandlers.get(type)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  private handleMessage(message: WebSocketMessage) {
    const handlers = this.messageHandlers.get(message.type)
    if (handlers) {
      handlers.forEach(handler => handler(message))
    }

    this.handleDefaultMessage(message)
  }

  private handleDefaultMessage(message: WebSocketMessage) {
    const userStore = useUserStore()
    const chatStore = useChatStore()

    switch (message.type) {
      case 'chat':
        this.handleChatMessage(message)
        break
      case 'online':
        if (message.fromUserId !== userStore.userInfo?.id) {
          ElMessage.info(`${message.data ? '用户上线' : '用户下线'}`)
        }
        break
      case 'read':
        console.log('消息已读:', message)
        break
      case 'typing':
        console.log('正在输入:', message)
        break
      case 'heartbeat':
        break
    }
  }

  private handleChatMessage(message: WebSocketMessage) {
    const userStore = useUserStore()
    const chatStore = useChatStore()

    if (message.fromUserId === userStore.userInfo?.id) {
      return
    }

    const chatMessage: Message = {
      id: 0,
      fromUserId: message.fromUserId,
      toUserId: message.toUserId,
      groupId: message.groupId,
      chatType: message.chatType,
      messageType: message.messageType,
      content: message.content,
      status: 0,
      sendTime: message.timestamp,
      readTime: ''
    }

    let targetId: number
    let chatType: number

    if (message.chatType === 1) {
      targetId = message.fromUserId
      chatType = 1
    } else {
      targetId = message.groupId
      chatType = 2
    }

    if (chatStore.currentSession &&
        chatStore.currentSession.targetId === targetId &&
        chatStore.currentSession.chatType === chatType) {
      chatStore.addMessage(chatMessage)
    } else {
      chatStore.incrementUnreadCount(targetId, chatType)
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({
          type: 'heartbeat',
          fromUserId: 0,
          toUserId: 0,
          groupId: 0,
          chatType: 0,
          messageType: 0,
          content: '',
          data: null,
          timestamp: new Date().toISOString()
        })
      }
    }, 30000)
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`WebSocket 重连中... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      
      setTimeout(() => {
        this.connect().catch(() => {
          console.log('重连失败')
        })
      }, this.reconnectInterval)
    } else {
      console.log('WebSocket 重连次数已达上限，请刷新页面重试')
    }
  }
}

export const webSocketService = new WebSocketService()
