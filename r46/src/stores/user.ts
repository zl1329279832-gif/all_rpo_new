import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserInfo } from '@/types'

export const useUserStore = defineStore(
  'user',
  () => {
    const userInfo = ref<UserInfo | null>(null)
    const token = ref<string>('')

    const setUserInfo = (info: UserInfo) => {
      userInfo.value = info
    }

    const setToken = (t: string) => {
      token.value = t
    }

    const hasPermission = (permission: string): boolean => {
      if (!userInfo.value) return false
      return userInfo.value.permissions.includes(permission)
    }

    const logout = () => {
      userInfo.value = null
      token.value = ''
    }

    return {
      userInfo,
      token,
      setUserInfo,
      setToken,
      hasPermission,
      logout,
    }
  },
  {
    persist: {
      key: 'hospital-user',
      storage: localStorage,
    },
  }
)
