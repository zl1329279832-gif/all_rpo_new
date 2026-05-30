import { createRouter, createWebHistory } from 'vue-router'
import NProgress from 'nprogress'
import { getToken } from '@/utils/auth'
import { useUserStore } from '@/store/modules/user'

NProgress.configure({ showSpinner: false })

const Layout = () => import('@/layout/Layout.vue')

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '首页', icon: 'HomeFilled', affix: true }
      }
    ]
  },
  {
    path: '/activity',
    component: Layout,
    redirect: '/activity/list',
    children: [
      {
        path: 'list',
        name: 'ActivityList',
        component: () => import('@/views/activity/index.vue'),
        meta: { title: '活动管理', icon: 'Present' }
      }
    ]
  },
  {
    path: '/order',
    component: Layout,
    redirect: '/order/list',
    children: [
      {
        path: 'list',
        name: 'OrderList',
        component: () => import('@/views/order/index.vue'),
        meta: { title: '订单管理', icon: 'List' }
      }
    ]
  },
  {
    path: '/sort',
    component: Layout,
    redirect: '/sort/list',
    children: [
      {
        path: 'list',
        name: 'SortList',
        component: () => import('@/views/sort/index.vue'),
        meta: { title: '分拣管理', icon: 'Operation' }
      }
    ]
  },
  {
    path: '/delivery',
    component: Layout,
    redirect: '/delivery/list',
    children: [
      {
        path: 'list',
        name: 'DeliveryList',
        component: () => import('@/views/delivery/index.vue'),
        meta: { title: '配送管理', icon: 'Van' }
      }
    ]
  },
  {
    path: '/settlement',
    component: Layout,
    redirect: '/settlement/list',
    children: [
      {
        path: 'list',
        name: 'SettlementList',
        component: () => import('@/views/settlement/index.vue'),
        meta: { title: '团长结算', icon: 'Money' }
      }
    ]
  },
  {
    path: '/afterSale',
    component: Layout,
    redirect: '/afterSale/list',
    children: [
      {
        path: 'list',
        name: 'AfterSaleList',
        component: () => import('@/views/afterSale/index.vue'),
        meta: { title: '售后处理', icon: 'Service' }
      }
    ]
  },
  {
    path: '/statistics',
    component: Layout,
    redirect: '/statistics/index',
    children: [
      {
        path: 'index',
        name: 'Statistics',
        component: () => import('@/views/statistics/index.vue'),
        meta: { title: '经营统计', icon: 'DataLine' }
      }
    ]
  },
  {
    path: '/system',
    component: Layout,
    redirect: '/system/user',
    meta: { title: '系统管理', icon: 'Setting' },
    children: [
      {
        path: 'user',
        name: 'SystemUser',
        component: () => import('@/views/system/user/index.vue'),
        meta: { title: '用户管理', icon: 'User' }
      },
      {
        path: 'role',
        name: 'SystemRole',
        component: () => import('@/views/system/role/index.vue'),
        meta: { title: '角色管理', icon: 'UserFilled' }
      },
      {
        path: 'menu',
        name: 'SystemMenu',
        component: () => import('@/views/system/menu/index.vue'),
        meta: { title: '菜单管理', icon: 'Menu' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { hidden: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

const whiteList = ['/login']

router.beforeEach((to, from, next) => {
  NProgress.start()
  document.title = to.meta.title ? `${to.meta.title} - 社区团购管理系统` : '社区团购管理系统'

  const hasToken = getToken()
  const userStore = useUserStore()

  if (hasToken) {
    if (to.path === '/login') {
      next({ path: '/' })
      NProgress.done()
    } else {
      if (!userStore.userInfo) {
        userStore.getUserInfo().then(() => {
          next({ ...to, replace: true })
        }).catch(() => {
          userStore.logout().then(() => {
            next(`/login?redirect=${to.path}`)
          })
        })
      } else {
        next()
      }
    }
  } else {
    if (whiteList.indexOf(to.path) !== -1) {
      next()
    } else {
      next(`/login?redirect=${to.path}`)
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  NProgress.done()
})

export function resetRouter() {
  const newRouter = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior: () => ({ top: 0 })
  })
  router.matcher = newRouter.matcher
}

export default router
