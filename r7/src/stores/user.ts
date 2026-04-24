import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { currentUser, mockContacts } from '@/mock'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const isLoggedIn = ref(false)
  const token = ref<string | null>(null)
  const contacts = ref(mockContacts)

  const userInfo = computed(() => user.value)
  const isAuthenticated = computed(() => isLoggedIn.value && token.value)

  const login = (username: string, _password: string): boolean => {
    if (username.trim()) {
      user.value = {
        ...currentUser,
        username,
        nickname: username
      }
      isLoggedIn.value = true
      token.value = `token_${Date.now()}`
      localStorage.setItem('chat_user', JSON.stringify(user.value))
      localStorage.setItem('chat_token', token.value)
      return true
    }
    return false
  }

  const logout = () => {
    user.value = null
    isLoggedIn.value = false
    token.value = null
    localStorage.removeItem('chat_user')
    localStorage.removeItem('chat_token')
  }

  const checkAuth = () => {
    const savedUser = localStorage.getItem('chat_user')
    const savedToken = localStorage.getItem('chat_token')
    
    if (savedUser && savedToken) {
      user.value = JSON.parse(savedUser)
      token.value = savedToken
      isLoggedIn.value = true
      return true
    }
    return false
  }

  const updateStatus = (status: 'online' | 'offline' | 'away') => {
    if (user.value) {
      user.value.status = status
    }
  }

  const getUserById = (id: string): User | undefined => {
    if (id === currentUser.id && user.value) {
      return user.value
    }
    return contacts.value.find(c => c.id === id) || mockContacts.find(c => c.id === id)
  }

  return {
    user,
    isLoggedIn,
    token,
    contacts,
    userInfo,
    isAuthenticated,
    login,
    logout,
    checkAuth,
    updateStatus,
    getUserById
  }
})
