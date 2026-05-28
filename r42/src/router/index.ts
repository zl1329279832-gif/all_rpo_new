import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import GamePage from '../pages/GamePage.vue'
import ResultPage from '../pages/ResultPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/game/:levelId', name: 'game', component: GamePage },
    { path: '/result/:levelId', name: 'result', component: ResultPage }
  ]
})

export default router
