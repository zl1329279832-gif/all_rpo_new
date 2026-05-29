import { ref, type Ref } from 'vue'

export interface PermissionOptions {
  permissions?: string[]
  strict?: boolean
}

export interface UsePermissionReturn {
  hasPermission: (permission: string | string[], options?: PermissionOptions) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
  userPermissions: Ref<string[]>
  setPermissions: (permissions: string[]) => void
}

const userPermissions = ref<string[]>([])

export function usePermission(): UsePermissionReturn {
  const setPermissions = (permissions: string[]) => {
    userPermissions.value = permissions
  }

  const hasPermission = (
    permission: string | string[],
    options: PermissionOptions = {}
  ): boolean => {
    const { strict = false } = options
    const { permissions = userPermissions.value } = options

    if (!permissions || permissions.length === 0) {
      return false
    }

    if (Array.isArray(permission)) {
      if (strict) {
        return permission.every((p) => permissions.includes(p))
      }
      return permission.some((p) => permissions.includes(p))
    }

    return permissions.includes(permission)
  }

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!permissions || permissions.length === 0) {
      return false
    }
    return permissions.some((p) => userPermissions.value.includes(p))
  }

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!permissions || permissions.length === 0) {
      return false
    }
    return permissions.every((p) => userPermissions.value.includes(p))
  }

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    userPermissions,
    setPermissions
  }
}

export default usePermission
