import { createRouter, createWebHistory, type RouteRecordRaw, type NavigationGuardNext, type RouteLocationNormalized } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../stores/app'

export interface BreadcrumbItem {
  title: string
  path?: string
}

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    breadcrumb?: BreadcrumbItem[]
    requiresAuth?: boolean
    permission?: string
    icon?: string
    keepAlive?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: {
      title: '登录',
      hidden: true,
      layout: 'empty'
    }
  },
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: {
      title: '首页',
      breadcrumb: [{ title: '首页' }],
      requiresAuth: true,
      permission: 'dashboard:view',
      icon: 'DataAnalysis',
      keepAlive: true
    }
  },
  {
    path: '/room-types',
    name: 'RoomTypes',
    component: () => import('../views/RoomTypes.vue'),
    meta: {
      title: '客房类型',
      breadcrumb: [
        { title: '首页', path: '/dashboard' },
        { title: '客房管理' },
        { title: '客房类型' }
      ],
      requiresAuth: true,
      permission: 'room:view',
      icon: 'House'
    }
  },
  {
    path: '/daily-status',
    name: 'DailyStatus',
    component: () => import('../views/DailyStatus.vue'),
    meta: {
      title: '每日房态',
      breadcrumb: [
        { title: '首页', path: '/dashboard' },
        { title: '客房管理' },
        { title: '每日房态' }
      ],
      requiresAuth: true,
      permission: 'room:view',
      icon: 'Calendar'
    }
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('../views/Orders.vue'),
    meta: {
      title: '订单列表',
      breadcrumb: [
        { title: '首页', path: '/dashboard' },
        { title: '订单管理' },
        { title: '订单列表' }
      ],
      requiresAuth: true,
      permission: 'order:view',
      icon: 'List'
    }
  },
  {
    path: '/orders/:id',
    name: 'OrderDetail',
    component: () => import('../views/Orders.vue'),
    meta: {
      title: '订单详情',
      breadcrumb: [
        { title: '首页', path: '/dashboard' },
        { title: '订单管理', path: '/orders' },
        { title: '订单详情' }
      ],
      requiresAuth: true,
      permission: 'order:view',
      hidden: true
    }
  },
  {
    path: '/price-strategy',
    name: 'PriceStrategy',
    component: () => import('../views/PriceStrategy.vue'),
    meta: {
      title: '价格策略',
      breadcrumb: [
        { title: '首页', path: '/dashboard' },
        { title: '收益管理' },
        { title: '价格策略' }
      ],
      requiresAuth: true,
      permission: 'price:view',
      icon: 'PriceTag'
    }
  },
  {
    path: '/channel-performance',
    name: 'ChannelPerformance',
    component: () => import('../views/ChannelPerformance.vue'),
    meta: {
      title: '渠道表现',
      breadcrumb: [
        { title: '首页', path: '/dashboard' },
        { title: '收益管理' },
        { title: '渠道表现' }
      ],
      requiresAuth: true,
      permission: 'channel:view',
      icon: 'TrendCharts'
    }
  },
  {
    path: '/member-profiling',
    name: 'MemberProfiling',
    component: () => import('../views/MemberProfile.vue'),
    meta: {
      title: '会员画像',
      breadcrumb: [
        { title: '首页', path: '/dashboard' },
        { title: '会员管理' },
        { title: '会员画像' }
      ],
      requiresAuth: true,
      permission: 'member:view',
      icon: 'User'
    }
  },
  {
    path: '/complaints',
    name: 'Complaints',
    component: () => import('../views/Complaints.vue'),
    meta: {
      title: '投诉记录',
      breadcrumb: [
        { title: '首页', path: '/dashboard' },
        { title: '服务管理' },
        { title: '投诉记录' }
      ],
      requiresAuth: true,
      permission: 'complaint:view',
      icon: 'ChatDotRound'
    }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('../views/Reports.vue'),
    meta: {
      title: '经营报表',
      breadcrumb: [
        { title: '首页', path: '/dashboard' },
        { title: '数据中心' },
        { title: '经营报表' }
      ],
      requiresAuth: true,
      permission: 'report:view',
      icon: 'Document'
    }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('../views/Dashboard.vue'),
    meta: {
      title: '页面不存在',
      hidden: true
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
  const appStore = useAppStore()

  if (to.meta.title) {
    document.title = `${to.meta.title} - 酒店管理系统`
  }

  const token = localStorage.getItem('token')

  if (to.path === '/login') {
    if (token) {
      next('/dashboard')
      return
    }
    next()
    return
  }

  if (to.meta.requiresAuth) {
    if (!token) {
      ElMessage.warning('请先登录')
      next('/login')
      return
    }
  }

  if (to.meta.permission) {
    const hasPermission = appStore.hasPermission(to.meta.permission)
    if (!hasPermission) {
      ElMessage.error('您没有权限访问该页面')
      next('/dashboard')
      return
    }
  }

  appStore.setLoading(true)
  next()
})

router.afterEach(() => {
  const appStore = useAppStore()
  appStore.setLoading(false)
})

router.onError((error) => {
  const appStore = useAppStore()
  appStore.setLoading(false)
  console.error('路由错误:', error)
  ElMessage.error('页面加载失败，请稍后重试')
})

export default router
