import { usePermissionStore } from '../stores/permission'
import { useUserStore } from '../stores/user'
import type { UserRole } from '../types'

export function usePermission() {
  const permissionStore = usePermissionStore()
  const userStore = useUserStore()

  function hasRoleAccess(allowedRoles: UserRole[]) {
    return allowedRoles.includes(userStore.userRole)
  }

  function hasPagePermission(path: string) {
    return permissionStore.hasPermission(path, userStore.userRole)
  }

  return {
    hasRoleAccess,
    hasPagePermission
  }
}
