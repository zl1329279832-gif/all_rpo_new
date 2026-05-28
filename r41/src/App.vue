<script setup lang="ts">
import { ref } from 'vue'
import MainMenu from './components/MainMenu.vue'
import GameScreen from './components/GameScreen.vue'

type GameScreenType = 'menu' | 'game'

const currentScreen = ref<GameScreenType>('menu')
const selectedLevel = ref(1)
const loadSave = ref(false)

const handleStartGame = (level: number, loadSaved = false) => {
  selectedLevel.value = level
  loadSave.value = loadSaved
  currentScreen.value = 'game'
}

const handleBackToMenu = () => {
  currentScreen.value = 'menu'
  loadSave.value = false
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
    :load-save="loadSave"
    @back-to-menu="handleBackToMenu" 
  />
</template>
