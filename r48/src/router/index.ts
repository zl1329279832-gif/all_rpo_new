import { createRouter, createWebHistory } from 'vue-router'
import MonitorPage from '@/pages/MonitorPage.vue'
import DashboardPage from '@/pages/DashboardPage.vue'
import AlarmHandlePage from '@/pages/AlarmHandlePage.vue'
import DeviceLedgerPage from '@/pages/DeviceLedgerPage.vue'
import OperationStatsPage from '@/pages/OperationStatsPage.vue'

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
  {
    path: '/alarm-handle',
    name: 'alarmHandle',
    component: AlarmHandlePage,
  },
  {
    path: '/device-ledger',
    name: 'deviceLedger',
    component: DeviceLedgerPage,
  },
  {
    path: '/operation-stats',
    name: 'operationStats',
    component: OperationStatsPage,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
