<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore'
import { storeToRefs } from 'pinia'
import TitleScreen from '@/components/TitleScreen.vue'
import HudBar from '@/components/HudBar.vue'
import GameMap from '@/components/GameMap.vue'
import TradePanel from '@/components/TradePanel.vue'
import CargoPanel from '@/components/CargoPanel.vue'
import QuestPanel from '@/components/QuestPanel.vue'
import EventModal from '@/components/EventModal.vue'
import GameOverScreen from '@/components/GameOverScreen.vue'
import SaveMenu from '@/components/SaveMenu.vue'

const gameStore = useGameStore()
const { gameStarted, gameOver, victory } = storeToRefs(gameStore)
</script>

<template>
  <div class="game-app min-h-screen bg-sand-dark text-sand-light">
    <TitleScreen v-if="!gameStarted" />

    <div v-else class="game-container h-screen flex flex-col overflow-hidden">
      <HudBar />

      <div class="flex-1 flex relative overflow-hidden">
        <CargoPanel />

        <div class="flex-1 relative">
          <div class="absolute top-4 right-4 z-20">
            <SaveMenu />
          </div>
          <div class="absolute top-4 left-4 z-20">
            <QuestPanel />
          </div>
          <GameMap />
        </div>

        <TradePanel />
      </div>

      <EventModal />
      <GameOverScreen v-if="gameOver || victory" />
    </div>
  </div>
</template>

<style>
.game-app {
  font-family: 'Noto Sans SC', sans-serif;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
