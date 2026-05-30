import { computed } from 'vue'
import { useUserStore } from '@/stores'
import type { ObjectDirective } from 'vue'

export function hasPermissionFn(permission: string | string[]): boolean {
  try {
    const userStore = useUserStore()
    if (!userStore.userInfo) return false

    if (Array.isArray(permission)) {
      return permission.some((p) => userStore.hasPermission(p))
    }

    return userStore.hasPermission(permission)
  } catch {
    return false
  }
}

export function createPermissionDirective(): ObjectDirective<HTMLElement, string | string[]> {
  return {
    mounted(el: HTMLElement, binding) {
      if (!hasPermissionFn(binding.value)) {
        el.parentNode?.removeChild(el)
      }
    },
    updated(el: HTMLElement, binding) {
      if (binding.oldValue !== binding.value) {
        if (!hasPermissionFn(binding.value)) {
          el.parentNode?.removeChild(el)
        }
      }
    },
  }
}

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

  const vPermission: ObjectDirective<HTMLElement> = {
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
