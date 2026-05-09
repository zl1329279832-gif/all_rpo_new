import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import WhiteboardView from '@/views/WhiteboardView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/room/:roomId',
      name: 'room',
      component: WhiteboardView
    }
  ]
})

export default router
