import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { storage } from '@/utils/storage'
import { userApi } from '@/api/user'
import { authApi } from '@/api/auth'
import router from '@/router'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<User | null>(storage.getUser())
  const token = ref<string | null>(storage.getToken())

  const isLoggedIn = computed(() => !!token.value)
  const userId = computed(() => currentUser.value?.id || 0)
  const nickname = computed(() => currentUser.value?.nickname || currentUser.value?.username || '')

  const setUser = (user: User) => {
    currentUser.value = user
    storage.setUser(user)
  }

  const setToken = (newToken: string) => {
    token.value = newToken
    storage.setToken(newToken)
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (e) {
      console.error('Logout error:', e)
    }
    currentUser.value = null
    token.value = null
    storage.clear()
    router.push('/login')
  }

  const fetchUserInfo = async () => {
    if (!token.value) return
    try {
      const res = await userApi.getInfo()
      setUser(res.data)
    } catch (e) {
      console.error('Fetch user info error:', e)
      logout()
    }
  }

  return {
    currentUser,
    token,
    isLoggedIn,
    userId,
    nickname,
    setUser,
    setToken,
    logout,
    fetchUserInfo
  }
})
