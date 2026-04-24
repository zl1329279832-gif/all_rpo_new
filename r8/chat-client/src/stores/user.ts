import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { storage } from '@/utils/storage'
import { userApi } from '@/api/user'
import { authApi } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<User | null>(storage.getUser())
  const token = ref<string | null>(storage.getToken())

  const isLoggedIn = computed(() => !!token.value)

  function setUser(user: User, newToken: string) {
    userInfo.value = user
    token.value = newToken
    storage.setUser(user)
    storage.setToken(newToken)
  }

  function clearUser() {
    userInfo.value = null
    token.value = null
    storage.clear()
  }

  async function fetchUserInfo() {
    if (!token.value) return
    try {
      const res = await userApi.getInfo()
      if (res.data) {
        userInfo.value = res.data
        storage.setUser(res.data)
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('登出失败:', error)
    }
    clearUser()
  }

  return {
    userInfo,
    token,
    isLoggedIn,
    setUser,
    clearUser,
    fetchUserInfo,
    logout
  }
})
