import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MenuItem } from '@/types'

export const useMenuStore = defineStore(
  'menu',
  () => {
    const isCollapsed = ref(false)
    const activeMenu = ref('/')

    const menuList = ref<MenuItem[]>([
      {
        path: '/',
        name: '运营概览',
        icon: 'DataLine',
        permission: 'overview:view',
      },
      {
        path: '/department',
        name: '科室分析',
        icon: 'OfficeBuilding',
        permission: 'department:view',
      },
      {
        path: '/doctor',
        name: '医生绩效',
        icon: 'User',
        permission: 'doctor:view',
      },
      {
        path: '/bed',
        name: '床位看板',
        icon: 'Bed',
        permission: 'bed:view',
      },
      {
        path: '/cost',
        name: '费用结构',
        icon: 'Money',
        permission: 'cost:view',
      },
      {
        path: '/appointment',
        name: '预约趋势',
        icon: 'Calendar',
        permission: 'appointment:view',
      },
      {
        path: '/alert',
        name: '预警中心',
        icon: 'Warning',
        permission: 'alert:view',
      },
      {
        path: '/report',
        name: '报表查询',
        icon: 'Document',
        permission: 'report:view',
      },
    ])

    const toggleCollapse = () => {
      isCollapsed.value = !isCollapsed.value
    }

    const setActiveMenu = (path: string) => {
      activeMenu.value = path
    }

    const getMenuList = computed(() => {
      return menuList.value
    })

    return {
      isCollapsed,
      activeMenu,
      menuList,
      toggleCollapse,
      setActiveMenu,
      getMenuList,
    }
  },
  {
    persist: {
      key: 'hospital-menu',
      storage: localStorage,
      paths: ['isCollapsed'],
    },
  }
)
