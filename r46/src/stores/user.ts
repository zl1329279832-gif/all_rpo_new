import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as dataService from '@/services/dataService'
import type { UserInfo } from '@/services/dataService'

export const useUserStore = defineStore(
  'user',
  () => {
    const userInfo = ref<UserInfo | null>(null)

    const initUserFromStorage = () => {
      const stored = dataService.getCurrentUser()
      if (stored) {
        userInfo.value = stored
      }
    }

    const setUserInfo = (info: UserInfo) => {
      userInfo.value = info
    }

    const hasPermission = (permission: string): boolean => {
      if (!userInfo.value) return false
      return userInfo.value.permissions.includes(permission)
    }

    const logout = () => {
      userInfo.value = null
      dataService.logout()
    }

    initUserFromStorage()

    return {
      userInfo,
      setUserInfo,
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
