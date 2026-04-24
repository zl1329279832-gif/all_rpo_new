import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Message, ChatSession, SearchResult } from '@/types'
import { mockSessions, mockMessages, currentUser } from '@/mock'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'

export const useChatStore = defineStore('chat', () => {
  const sessions = ref<ChatSession[]>([...mockSessions])
  const messages = ref<Record<string, Message[]>>({ ...mockMessages })
  const currentSessionId = ref<string | null>(null)
  const isLoading = ref(false)
  const searchKeyword = ref('')
  const searchResults = ref<SearchResult[]>([])

  const currentSession = computed(() => {
    if (!currentSessionId.value) return null
    return sessions.value.find(s => s.id === currentSessionId.value) || null
  })

  const currentMessages = computed(() => {
    if (!currentSessionId.value) return []
    return messages.value[currentSessionId.value] || []
  })

  const totalUnreadCount = computed(() => {
    return sessions.value.reduce((total, session) => total + session.unreadCount, 0)
  })

  const selectSession = (sessionId: string) => {
    currentSessionId.value = sessionId
    markAsRead(sessionId)
  }

  const markAsRead = (sessionId: string) => {
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) {
      session.unreadCount = 0
    }
    if (messages.value[sessionId]) {
      messages.value[sessionId].forEach(msg => {
        if (msg.senderId !== currentUser.id) {
          msg.isRead = true
        }
      })
    }
    saveMessagesToStorage(sessionId)
    saveSessionsToStorage()
  }

  const sendMessage = (content: string, type: 'text' | 'image' = 'text'): Message => {
    if (!currentSessionId.value) {
      throw new Error('No active session')
    }

    const message: Message = {
      id: uuidv4(),
      senderId: currentUser.id,
      receiverId: currentSessionId.value,
      content,
      type,
      status: 'sending',
      timestamp: Date.now(),
      isRead: false,
      isRecalled: false
    }

    if (!messages.value[currentSessionId.value]) {
      messages.value[currentSessionId.value] = []
    }
    messages.value[currentSessionId.value].push(message)

    const session = sessions.value.find(s => s.id === currentSessionId.value)
    if (session) {
      session.lastMessage = message
    }

    setTimeout(() => {
      message.status = 'sent'
    }, 500)

    saveMessagesToStorage(currentSessionId.value)
    saveSessionsToStorage()

    return message
  }

  const recallMessage = (messageId: string): boolean => {
    if (!currentSessionId.value) return false
    
    const messageIndex = messages.value[currentSessionId.value]?.findIndex(
      m => m.id === messageId
    )
    
    if (messageIndex !== undefined && messageIndex !== -1) {
      const message = messages.value[currentSessionId.value][messageIndex]
      const now = Date.now()
      const timeDiff = now - message.timestamp
      
      if (timeDiff <= 120000 && message.senderId === currentUser.id && !message.isRecalled) {
        message.isRecalled = true
        message.recallTime = now
        message.content = '[消息已撤回]'
        message.type = 'system'
        
        const session = sessions.value.find(s => s.id === currentSessionId.value)
        if (session && session.lastMessage?.id === messageId) {
          session.lastMessage = message
        }
        
        saveMessagesToStorage(currentSessionId.value)
        saveSessionsToStorage()
        return true
      }
    }
    return false
  }

  const searchMessages = (keyword: string) => {
    searchKeyword.value = keyword
    searchResults.value = []
    
    if (!keyword.trim()) {
      return
    }

    const results: SearchResult[] = []

    sessions.value.forEach(session => {
      const sessionMessages = messages.value[session.id] || []
      
      sessionMessages.forEach(msg => {
        if (msg.content.toLowerCase().includes(keyword.toLowerCase()) && !msg.isRecalled) {
          results.push({
            type: 'message',
            id: msg.id,
            name: session.name,
            avatar: session.avatar,
            highlight: msg.content,
            timestamp: msg.timestamp
          })
        }
      })

      if (session.name.toLowerCase().includes(keyword.toLowerCase())) {
        results.unshift({
          type: session.type === 'group' ? 'group' : 'contact',
          id: session.id,
          name: session.name,
          avatar: session.avatar
        })
      }
    })

    searchResults.value = results
  }

  const clearSearch = () => {
    searchKeyword.value = ''
    searchResults.value = []
  }

  const groupMessagesByDate = (msgs: Message[]): Record<string, Message[]> => {
    const groups: Record<string, Message[]> = {}
    
    msgs.forEach(msg => {
      const dateKey = dayjs(msg.timestamp).format('YYYY-MM-DD')
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(msg)
    })
    
    return groups
  }

  const loadMoreMessages = (sessionId: string, beforeTime: number): Message[] => {
    isLoading.value = true
    
    setTimeout(() => {
      isLoading.value = false
    }, 500)
    
    return []
  }

  const saveMessagesToStorage = (sessionId: string) => {
    const key = `chat_messages_${sessionId}`
    localStorage.setItem(key, JSON.stringify(messages.value[sessionId] || []))
  }

  const saveSessionsToStorage = () => {
    localStorage.setItem('chat_sessions', JSON.stringify(sessions.value))
  }

  const loadFromStorage = () => {
    const savedSessions = localStorage.getItem('chat_sessions')
    if (savedSessions) {
      sessions.value = JSON.parse(savedSessions)
    }

    sessions.value.forEach(session => {
      const key = `chat_messages_${session.id}`
      const savedMessages = localStorage.getItem(key)
      if (savedMessages) {
        messages.value[session.id] = JSON.parse(savedMessages)
      }
    })
  }

  const simulateReceiveMessage = (sessionId: string, content: string, senderId: string) => {
    if (!messages.value[sessionId]) {
      messages.value[sessionId] = []
    }

    const message: Message = {
      id: uuidv4(),
      senderId,
      receiverId: sessionId,
      content,
      type: 'text',
      status: 'sent',
      timestamp: Date.now(),
      isRead: currentSessionId.value === sessionId,
      isRecalled: false
    }

    messages.value[sessionId].push(message)

    const session = sessions.value.find(s => s.id === sessionId)
    if (session) {
      session.lastMessage = message
      if (currentSessionId.value !== sessionId) {
        session.unreadCount++
      }
    }

    saveMessagesToStorage(sessionId)
    saveSessionsToStorage()

    return message
  }

  return {
    sessions,
    messages,
    currentSessionId,
    isLoading,
    searchKeyword,
    searchResults,
    currentSession,
    currentMessages,
    totalUnreadCount,
    selectSession,
    markAsRead,
    sendMessage,
    recallMessage,
    searchMessages,
    clearSearch,
    groupMessagesByDate,
    loadMoreMessages,
    loadFromStorage,
    simulateReceiveMessage
  }
})
