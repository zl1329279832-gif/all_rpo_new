import { defineStore } from 'pinia'
import { login, logout, getUserInfo } from '@/api/auth'
import { getToken, setToken, removeToken } from '@/utils/auth'
import { resetRouter } from '@/router'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken() || '',
    userInfo: null,
    permissions: [],
    roles: []
  }),
  actions: {
    async login(loginData) {
      try {
        const res = await login(loginData)
        const { token } = res.data
        this.token = token
        setToken(token)
        return res
      } catch (error) {
        throw error
      }
    },
    async getUserInfo() {
      try {
        const res = await getUserInfo()
        const { user, permissions, roles } = res.data
        this.userInfo = user
        this.permissions = permissions || []
        this.roles = roles || []
        return res
      } catch (error) {
        throw error
      }
    },
    async logout() {
      try {
        await logout()
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.token = ''
        this.userInfo = null
        this.permissions = []
        this.roles = []
        removeToken()
        resetRouter()
      }
    },
    resetToken() {
      this.token = ''
      this.userInfo = null
      this.permissions = []
      this.roles = []
      removeToken()
    }
  },
  persist: {
    key: 'user-store',
    storage: localStorage,
    paths: ['token', 'userInfo', 'permissions', 'roles']
  }
})
