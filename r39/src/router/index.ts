import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '../stores/user'
import { usePermissionStore } from '../stores/permission'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login/index.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('../components/Layout/index.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard/index.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'station',
        name: 'Station',
        component: () => import('../views/Station/index.vue'),
        meta: { title: '站点管理' }
      },
      {
        path: 'device',
        name: 'Device',
        component: () => import('../views/Device/index.vue'),
        meta: { title: '设备详情' }
      },
      {
        path: 'alarm',
        name: 'Alarm',
        component: () => import('../views/Alarm/index.vue'),
        meta: { title: '告警处置' }
      },
      {
        path: 'order',
        name: 'Order',
        component: () => import('../views/Order/index.vue'),
        meta: { title: '订单查询' }
      },
      {
        path: 'price',
        name: 'Price',
        component: () => import('../views/Price/index.vue'),
        meta: { title: '价格策略' }
      },
      {
        path: 'report',
        name: 'Report',
        component: () => import('../views/Report/index.vue'),
        meta: { title: '运营报表' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()

  if (to.meta.requiresAuth !== false && !userStore.isLoggedIn) {
    next('/login')
    return
  }

  if (to.path === '/login' && userStore.isLoggedIn) {
    next('/dashboard')
    return
  }

  if (userStore.user && permissionStore.menus.length === 0) {
    permissionStore.filterMenusByRole(userStore.userRole)
  }

  if (to.meta.requiresAuth && to.path !== '/dashboard') {
    if (!permissionStore.hasPermission(to.path, userStore.userRole)) {
      next('/dashboard')
      return
    }
  }

  next()
})

export default router
