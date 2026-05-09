import SockJS from 'sockjs-client'
import { Stomp } from '@stomp/stompjs'

class WebSocketService {
  constructor() {
    this.stompClient = null
    this.connected = false
    this.listeners = new Map()
    this.roomId = null
    this.userId = null
  }

  connect(roomId, userId) {
    return new Promise((resolve, reject) => {
      this.roomId = roomId
      this.userId = userId

      const socket = new SockJS('/ws')
      this.stompClient = Stomp.over(() => socket)
      this.stompClient.reconnect_delay = 5000

      this.stompClient.connect(
        {},
        (frame) => {
          console.log('WebSocket connected:', frame)
          this.connected = true
          this.subscribeToRoom(roomId)
          resolve(frame)
        },
        (error) => {
          console.error('WebSocket connection error:', error)
          this.connected = false
          reject(error)
        }
      )
    })
  }

  subscribeToRoom(roomId) {
    if (!this.stompClient) return

    this.stompClient.subscribe(`/topic/room/${roomId}`, (message) => {
      const data = JSON.parse(message.body)
      this.notifyListeners(data)
    })
  }

  send(destination, message) {
    if (!this.stompClient || !this.connected) {
      console.warn('WebSocket not connected')
      return
    }

    this.stompClient.send(destination, {}, JSON.stringify(message))
  }

  addListener(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type).add(callback)
  }

  removeListener(type, callback) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).delete(callback)
    }
  }

  notifyListeners(message) {
    const type = message.type
    
    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach((callback) => {
        callback(message)
      })
    }

    if (this.listeners.has('*')) {
      this.listeners.get('*').forEach((callback) => {
        callback(message)
      })
    }
  }

  disconnect() {
    if (this.stompClient) {
      if (this.roomId && this.userId) {
        this.send('/app/whiteboard/leave', {
          type: 'LEAVE',
          roomId: this.roomId,
          userId: this.userId
        })
      }
      this.stompClient.disconnect()
      this.connected = false
      this.roomId = null
      this.userId = null
    }
  }
}

export const wsService = new WebSocketService()
