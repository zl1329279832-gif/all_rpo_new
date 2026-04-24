import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Message, ChatSession, UnreadCount, Friend, Group, User } from '@/types'
import { ChatType } from '@/types'
import { messageApi } from '@/api/message'
import { friendApi } from '@/api/friend'
import { groupApi } from '@/api/group'

export const useChatStore = defineStore('chat', () => {
  const friends = ref<Friend[]>([])
  const groups = ref<Group[]>([])
  const sessions = ref<ChatSession[]>([])
  const currentSession = ref<ChatSession | null>(null)
  const messages = ref<Message[]>([])
  const unreadCounts = ref<UnreadCount[]>([])
  const onlineUsers = ref<User[]>([])

  const totalUnreadCount = computed(() => {
    return unreadCounts.value.reduce((sum, item) => sum + item.count, 0)
  })

  function getSessionKey(targetId: number, chatType: number): string {
    return `${chatType}-${targetId}`
  }

  function createSession(target: Friend | Group, chatType: number): ChatSession {
    if (chatType === ChatType.PRIVATE) {
      const friend = target as Friend
      return {
        id: getSessionKey(friend.friendId, ChatType.PRIVATE),
        targetId: friend.friendId,
        chatType: ChatType.PRIVATE,
        name: friend.remark || friend.friendInfo?.nickname || friend.friendInfo?.username,
        avatar: friend.friendInfo?.avatar || '',
        unreadCount: 0
      }
    } else {
      const group = target as Group
      return {
        id: getSessionKey(group.id, ChatType.GROUP),
        targetId: group.id,
        chatType: ChatType.GROUP,
        name: group.groupName,
        avatar: group.groupAvatar || '',
        unreadCount: 0
      }
    }
  }

  async function fetchFriends() {
    try {
      const res = await friendApi.getList()
      friends.value = res.data || []
    } catch (error) {
      console.error('获取好友列表失败:', error)
    }
  }

  async function fetchGroups() {
    try {
      const res = await groupApi.getMyGroups()
      groups.value = res.data || []
    } catch (error) {
      console.error('获取群组列表失败:', error)
    }
  }

  async function fetchUnreadCounts() {
    try {
      const res = await messageApi.getUnreadCounts()
      unreadCounts.value = res.data || []
      
      unreadCounts.value.forEach(item => {
        const session = sessions.value.find(
          s => s.targetId === item.targetId && s.chatType === item.chatType
        )
        if (session) {
          session.unreadCount = item.count
        }
      })
    } catch (error) {
      console.error('获取未读消息数失败:', error)
    }
  }

  async function fetchHistoryMessages(targetId: number, chatType: number) {
    try {
      const res = await messageApi.getHistory(targetId, chatType)
      messages.value = res.data?.records || []
    } catch (error) {
      console.error('获取历史消息失败:', error)
    }
  }

  function addMessage(message: Message) {
    messages.value.push(message)
  }

  function setCurrentSession(session: ChatSession) {
    currentSession.value = session
  }

  function clearCurrentSession() {
    currentSession.value = null
    messages.value = []
  }

  function updateUnreadCount(targetId: number, chatType: number, count: number) {
    const index = unreadCounts.value.findIndex(
      item => item.targetId === targetId && item.chatType === chatType
    )
    
    if (index >= 0) {
      unreadCounts.value[index].count = count
    } else {
      unreadCounts.value.push({ targetId, chatType, count })
    }

    const session = sessions.value.find(
      s => s.targetId === targetId && s.chatType === chatType
    )
    if (session) {
      session.unreadCount = count
    }
  }

  function incrementUnreadCount(targetId: number, chatType: number) {
    const item = unreadCounts.value.find(
      i => i.targetId === targetId && i.chatType === chatType
    )
    
    if (item) {
      item.count++
    } else {
      unreadCounts.value.push({ targetId, chatType, count: 1 })
    }

    const session = sessions.value.find(
      s => s.targetId === targetId && s.chatType === chatType
    )
    if (session) {
      session.unreadCount++
    }
  }

  function clearUnreadCount(targetId: number, chatType: number) {
    const item = unreadCounts.value.find(
      i => i.targetId === targetId && i.chatType === chatType
    )
    if (item) {
      item.count = 0
    }

    const session = sessions.value.find(
      s => s.targetId === targetId && s.chatType === chatType
    )
    if (session) {
      session.unreadCount = 0
    }
  }

  function initSessions() {
    sessions.value = []
    
    friends.value.forEach(friend => {
      const unread = unreadCounts.value.find(
        u => u.targetId === friend.friendId && u.chatType === ChatType.PRIVATE
      )
      sessions.value.push({
        id: getSessionKey(friend.friendId, ChatType.PRIVATE),
        targetId: friend.friendId,
        chatType: ChatType.PRIVATE,
        name: friend.remark || friend.friendInfo?.nickname || friend.friendInfo?.username,
        avatar: friend.friendInfo?.avatar || '',
        unreadCount: unread?.count || 0
      })
    })

    groups.value.forEach(group => {
      const unread = unreadCounts.value.find(
        u => u.targetId === group.id && u.chatType === ChatType.GROUP
      )
      sessions.value.push({
        id: getSessionKey(group.id, ChatType.GROUP),
        targetId: group.id,
        chatType: ChatType.GROUP,
        name: group.groupName,
        avatar: group.groupAvatar || '',
        unreadCount: unread?.count || 0
      })
    })
  }

  return {
    friends,
    groups,
    sessions,
    currentSession,
    messages,
    unreadCounts,
    onlineUsers,
    totalUnreadCount,
    getSessionKey,
    createSession,
    fetchFriends,
    fetchGroups,
    fetchUnreadCounts,
    fetchHistoryMessages,
    addMessage,
    setCurrentSession,
    clearCurrentSession,
    updateUnreadCount,
    incrementUnreadCount,
    clearUnreadCount,
    initSessions
  }
})
