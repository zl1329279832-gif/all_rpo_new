import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '监控看板' }
      },
      {
        path: 'servers',
        name: 'Servers',
        component: () => import('@/views/Servers.vue'),
        meta: { title: '服务器管理' }
      },
      {
        path: 'servers/:id',
        name: 'ServerDetail',
        component: () => import('@/views/ServerDetail.vue'),
        meta: { title: '服务器详情' }
      },
      {
        path: 'alerts',
        name: 'Alerts',
        component: () => import('@/views/Alerts.vue'),
        meta: { title: '告警记录' }
      },
      {
        path: 'alert-rules',
        name: 'AlertRules',
        component: () => import('@/views/AlertRules.vue'),
        meta: { title: '告警规则' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/Users.vue'),
        meta: { title: '用户管理', roles: ['ADMIN'] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.path === '/login') {
    if (authStore.isLoggedIn) {
      next('/dashboard')
    } else {
      next()
    }
    return
  }
  
  if (!authStore.isLoggedIn) {
    next('/login')
    return
  }
  
  if (to.meta.roles && to.meta.roles.length > 0) {
    if (!to.meta.roles.includes(authStore.userInfo?.roleName)) {
      next('/dashboard')
      return
    }
  }
  
  next()
})

export default router
