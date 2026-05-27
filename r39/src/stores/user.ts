import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, UserRole, LoginParams } from '../types'
import { login, logout } from '../api/user'
import { setToken, removeToken, setUser, getUser, clearAuth } from '../utils/auth'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(getUser())

  const token = ref<string | null>(localStorage.getItem('token'))

  const userRole = computed<UserRole>(() => user.value?.role || 'super_admin')

  const isLoggedIn = computed(() => !!token.value)

  async function handleLogin(params: LoginParams) {
    const res = await login(params)
    if (res.code === 200) {
      user.value = res.data
      token.value = res.data.token
      setToken(res.data.token)
      setUser(res.data)
    }
    return res
  }

  async function handleLogout() {
    try {
      await logout()
    } finally {
      user.value = null
      token.value = null
      clearAuth()
    }
  }

  return {
    user,
    token,
    userRole,
    isLoggedIn,
    handleLogin,
    handleLogout
  }
})
