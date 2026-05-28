<script setup lang="ts">
import { ref } from 'vue'
import MainMenu from './components/MainMenu.vue'
import GameScreen from './components/GameScreen.vue'

type GameScreenType = 'menu' | 'game'

const currentScreen = ref<GameScreenType>('menu')
const selectedLevel = ref(1)

const handleStartGame = (level: number) => {
  selectedLevel.value = level
  currentScreen.value = 'game'
}

const handleBackToMenu = () => {
  currentScreen.value = 'menu'
}
</script>

<template>
  <MainMenu 
    v-if="currentScreen === 'menu'" 
    @start-game="handleStartGame" 
  />
  <GameScreen 
    v-else 
    :level="selectedLevel" 
    @back-to-menu="handleBackToMenu" 
  />
</template>
