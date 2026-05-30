import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { setupGuards } from './guards'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/views/layout/index.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Overview',
        component: () => import('@/views/overview/index.vue'),
        meta: { title: '运营概览', permission: 'overview:view' },
      },
      {
        path: 'department',
        name: 'Department',
        component: () => import('@/views/department/index.vue'),
        meta: { title: '科室分析', permission: 'department:view' },
      },
      {
        path: 'doctor',
        name: 'Doctor',
        component: () => import('@/views/doctor/index.vue'),
        meta: { title: '医生绩效', permission: 'doctor:view' },
      },
      {
        path: 'bed',
        name: 'Bed',
        component: () => import('@/views/bed/index.vue'),
        meta: { title: '床位看板', permission: 'bed:view' },
      },
      {
        path: 'cost',
        name: 'Cost',
        component: () => import('@/views/cost/index.vue'),
        meta: { title: '费用结构', permission: 'cost:view' },
      },
      {
        path: 'appointment',
        name: 'Appointment',
        component: () => import('@/views/appointment/index.vue'),
        meta: { title: '预约趋势', permission: 'appointment:view' },
      },
      {
        path: 'alert',
        name: 'Alert',
        component: () => import('@/views/alert/index.vue'),
        meta: { title: '预警中心', permission: 'alert:view' },
      },
      {
        path: 'report',
        name: 'Report',
        component: () => import('@/views/report/index.vue'),
        meta: { title: '报表查询', permission: 'report:view' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/layout/NotFound.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

setupGuards(router)

export default router
