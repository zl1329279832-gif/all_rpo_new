import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type Theme = 'light' | 'dark'

export interface UserPermission {
  code: string
  name: string
}

export const useAppStore = defineStore('app', () => {
  const theme = ref<Theme>('light')
  const sidebarCollapsed = ref(false)
  const loading = ref(false)
  const permissions = ref<UserPermission[]>([
    { code: 'dashboard:view', name: '查看仪表盘' },
    { code: 'room:view', name: '查看客房' },
    { code: 'room:edit', name: '编辑客房' },
    { code: 'order:view', name: '查看订单' },
    { code: 'order:edit', name: '编辑订单' },
    { code: 'price:view', name: '查看价格策略' },
    { code: 'price:edit', name: '编辑价格策略' },
    { code: 'channel:view', name: '查看渠道' },
    { code: 'member:view', name: '查看会员' },
    { code: 'complaint:view', name: '查看投诉' },
    { code: 'complaint:handle', name: '处理投诉' },
    { code: 'report:view', name: '查看报表' }
  ])

  const isDark = computed(() => theme.value === 'dark')

  function toggleTheme(): void {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  function toggleSidebar(): void {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setLoading(value: boolean): void {
    loading.value = value
  }

  function hasPermission(code: string): boolean {
    return permissions.value.some(p => p.code === code)
  }

  function hasAnyPermission(codes: string[]): boolean {
    return codes.some(code => hasPermission(code))
  }

  function hasAllPermissions(codes: string[]): boolean {
    return codes.every(code => hasPermission(code))
  }

  return {
    theme,
    sidebarCollapsed,
    loading,
    permissions,
    isDark,
    toggleTheme,
    toggleSidebar,
    setLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  }
})
