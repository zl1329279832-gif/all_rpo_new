import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'transactions',
        name: 'Transactions',
        component: () => import('@/views/Transactions.vue'),
        meta: { title: '账单列表' }
      },
      {
        path: 'add-transaction',
        name: 'AddTransaction',
        component: () => import('@/views/AddTransaction.vue'),
        meta: { title: '记一笔' }
      },
      {
        path: 'edit-transaction/:id',
        name: 'EditTransaction',
        component: () => import('@/views/AddTransaction.vue'),
        meta: { title: '编辑账单' }
      },
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('@/views/Categories.vue'),
        meta: { title: '分类管理' }
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('@/views/Statistics.vue'),
        meta: { title: '统计分析' }
      },
      {
        path: 'budget',
        name: 'Budget',
        component: () => import('@/views/Budget.vue'),
        meta: { title: '预算管理' }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
        meta: { title: '设置' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || '个人记账'} - 个人资产记账系统`
  next()
})

export default router
