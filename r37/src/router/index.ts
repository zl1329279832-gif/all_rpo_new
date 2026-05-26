import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/battle',
    name: 'Battle',
    component: () => import('@/views/BattleView.vue')
  },
  {
    path: '/records',
    name: 'Records',
    component: () => import('@/views/RecordsView.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
