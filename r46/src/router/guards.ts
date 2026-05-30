import type { Router } from 'vue-router'
import { useUserStore, useMenuStore } from '@/stores'

export function setupGuards(router: Router) {
  router.beforeEach((to, from, next) => {
    const userStore = useUserStore()

    document.title = to.meta.title ? `${to.meta.title} - 医院运营指标系统` : '医院运营指标系统'

    if (to.meta.requiresAuth === false) {
      if (userStore.userInfo && to.path === '/login') {
        next('/')
      } else {
        next()
      }
      return
    }

    if (!userStore.userInfo) {
      next({
        path: '/login',
        query: { redirect: to.fullPath },
      })
      return
    }

    if (to.meta.permission && !userStore.hasPermission(to.meta.permission as string)) {
      next('/403')
      return
    }

    next()
  })

  router.afterEach((to) => {
    const menuStore = useMenuStore()
    if (to.path !== '/login') {
      menuStore.setActiveMenu(to.path)
    }
  })
}
