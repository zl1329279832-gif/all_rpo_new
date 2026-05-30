import { createRouter, createWebHistory } from 'vue-router'
import MonitorPage from '@/pages/MonitorPage.vue'
import DashboardPage from '@/pages/DashboardPage.vue'

const routes = [
  {
    path: '/',
    name: 'monitor',
    component: MonitorPage,
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardPage,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
