import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { title: '仪表盘' }
  },
  {
    path: '/components',
    name: 'Components',
    component: () => import('../views/Components.vue'),
    meta: { title: '组件列表' }
  },
  {
    path: '/components/:id/edit',
    name: 'ComponentEdit',
    component: () => import('../views/ComponentConfig.vue'),
    meta: { title: '组件配置' }
  },
  {
    path: '/components/new',
    name: 'ComponentNew',
    component: () => import('../views/ComponentConfig.vue'),
    meta: { title: '新建组件' }
  },
  {
    path: '/debug',
    name: 'Debug',
    component: () => import('../views/DebugPanel.vue'),
    meta: { title: '接口调试' }
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('../views/RequestHistory.vue'),
    meta: { title: '请求历史' }
  },
  {
    path: '/logs',
    name: 'Logs',
    component: () => import('../views/OperationLogs.vue'),
    meta: { title: '操作日志' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, _from, next) => {
  document.title = (to.meta.title as string) || '企业内部组件配置平台';
  next();
});

export default router;
