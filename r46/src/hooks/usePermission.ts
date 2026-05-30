import { computed } from 'vue'
import { useUserStore } from '@/stores'

export function usePermission() {
  const userStore = useUserStore()

  const hasPermission = (permission: string | string[]): boolean => {
    if (!userStore.userInfo) return false

    if (Array.isArray(permission)) {
      return permission.some((p) => userStore.hasPermission(p))
    }

    return userStore.hasPermission(permission)
  }

  const isAdmin = computed(() => userStore.userInfo?.role === 'admin')
  const isDirector = computed(() => userStore.userInfo?.role === 'director')
  const isLeader = computed(() => userStore.userInfo?.role === 'leader')

  const vPermission = {
    mounted(el: HTMLElement, binding: { value: string | string[] }) {
      if (!hasPermission(binding.value)) {
        el.parentNode?.removeChild(el)
      }
    },
  }

  return {
    hasPermission,
    isAdmin,
    isDirector,
    isLeader,
    vPermission,
  }
}
