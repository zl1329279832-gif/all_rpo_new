import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MenuItem, UserRole } from '../types'

const allMenus: MenuItem[] = [
  {
    id: 'dashboard',
    title: '仪表盘',
    path: '/dashboard',
    icon: 'Odometer',
    roles: ['super_admin', 'operation_admin', 'maintenance', 'finance']
  },
  {
    id: 'station',
    title: '站点管理',
    path: '/station',
    icon: 'Location',
    roles: ['super_admin', 'operation_admin']
  },
  {
    id: 'device',
    title: '设备详情',
    path: '/device',
    icon: 'Monitor',
    roles: ['super_admin', 'maintenance']
  },
  {
    id: 'alarm',
    title: '告警处置',
    path: '/alarm',
    icon: 'Warning',
    roles: ['super_admin', 'maintenance']
  },
  {
    id: 'order',
    title: '订单查询',
    path: '/order',
    icon: 'Document',
    roles: ['super_admin', 'operation_admin', 'finance']
  },
  {
    id: 'price',
    title: '价格策略',
    path: '/price',
    icon: 'Coin',
    roles: ['super_admin', 'operation_admin']
  },
  {
    id: 'report',
    title: '运营报表',
    path: '/report',
    icon: 'DataLine',
    roles: ['super_admin', 'finance']
  }
]

export const usePermissionStore = defineStore('permission', () => {
  const menus = ref<MenuItem[]>([])

  function filterMenusByRole(role: UserRole) {
    menus.value = allMenus.filter(menu => menu.roles.includes(role))
  }

  function hasPermission(path: string, role: UserRole) {
    const menu = allMenus.find(m => m.path === path)
    return menu ? menu.roles.includes(role) : true
  }

  const menuRoutes = computed(() => menus.value.map(m => m.path))

  return {
    menus,
    menuRoutes,
    filterMenusByRole,
    hasPermission
  }
})
