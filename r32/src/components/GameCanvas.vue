<template>
  <div class="game-canvas-container">
    <canvas
      ref="canvasRef"
      :width="canvasWidth"
      :height="canvasHeight"
      class="game-canvas"
    ></canvas>

    <MainMenu
      :visible="gameState === 'menu'"
      :has-save="hasSave"
      @new-game="startNewGame"
      @load-game="loadGame"
    />

    <template v-if="gameState !== 'menu'">
      <HUDPanel :player="playerData" :level="currentLevel" />
      <SkillBar :skills="playerData.skills" @use-skill="useSkill" />
      <InventoryPanel
        :visible="showInventory"
        :inventory="playerData.inventory"
        @close="showInventory = false"
        @use-item="useItem"
      />
      <PauseMenu
        :visible="gameState === 'paused'"
        @resume="resumeGame"
        @save="saveGame"
        @quit="quitToMenu"
      />
      <LevelComplete
        :visible="gameState === 'levelComplete'"
        :level="currentLevel"
        :player-level="playerData.level.level"
        :gold="playerData.gold"
        @continue="continueToNextLevel"
      />
      <GameOver
        :visible="gameState === 'gameOver'"
        :level="currentLevel"
        :player-level="playerData.level.level"
        :gold="playerData.gold"
        @restart="startNewGame"
        @quit="quitToMenu"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { GameEngine } from '@/game/core/GameEngine'
import type { GameState } from '@/types/game'
import { saveManager } from '@/game/core/SaveManager'
import { GAME_CONFIG } from '@/game/config/GameConfig'
import { inputManager } from '@/game/core/InputManager'
import MainMenu from './MainMenu.vue'
import HUDPanel from './HUDPanel.vue'
import SkillBar from './SkillBar.vue'
import InventoryPanel from './InventoryPanel.vue'
import PauseMenu from './PauseMenu.vue'
import LevelComplete from './LevelComplete.vue'
import GameOver from './GameOver.vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasWidth = GAME_CONFIG.canvasWidth
const canvasHeight = GAME_CONFIG.canvasHeight

const gameState = ref<GameState>('menu')
const currentLevel = ref(1)
const showInventory = ref(false)
const hasSave = ref(saveManager.hasSave())

const playerData = reactive({
  stats: {
    maxHp: 100, hp: 100, attack: 15, defense: 5, speed: 3,
    attackSpeed: 1, critRate: 0.1, critDamage: 1.5,
  },
  level: { level: 1, exp: 0, expToNext: 100 },
  gold: 0,
  inventory: [],
  skills: [],
})

let engine: GameEngine | null = null

onMounted(() => {
  if (canvasRef.value) {
    engine = new GameEngine(canvasRef.value)
    engine.setOnStateChange((state) => {
      gameState.value = state
    })
    engine.setOnPlayerUpdate((player) => {
      playerData.stats = { ...player.stats }
      playerData.level = { ...player.level }
      playerData.gold = player.gold
      playerData.inventory = player.inventory.map(i => ({ ...i }))
      playerData.skills = player.skills.map(s => ({ ...s }))
    })
    engine.init()
    engine.start()
    gameState.value = 'menu'
  }

  window.addEventListener('keydown', handleGlobalKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeyDown)
  engine?.destroy()
})

const handleGlobalKeyDown = (e: KeyboardEvent) => {
  const key = e.key.toLowerCase()

  if (gameState.value === 'playing') {
    if (key === 'escape') {
      engine?.pause()
    } else if (key === 'i') {
      showInventory.value = !showInventory.value
    }
  } else if (gameState.value === 'paused') {
    if (key === 'escape') {
      engine?.resume()
    }
  } else if (gameState.value === 'menu') {
    if (key !== 'escape') {
      // startNewGame()
    }
  }
}

const startNewGame = () => {
  engine?.startNewGame()
  hasSave.value = saveManager.hasSave()
}

const loadGame = () => {
  if (engine?.loadGame()) {
    currentLevel.value = engine.getCurrentLevel()
  }
}

const resumeGame = () => {
  engine?.resume()
}

const saveGame = () => {
  engine?.saveGame()
  hasSave.value = saveManager.hasSave()
}

const quitToMenu = () => {
  gameState.value = 'menu'
  engine?.destroy()
  if (canvasRef.value) {
    engine = new GameEngine(canvasRef.value)
    engine.setOnStateChange((state) => {
      gameState.value = state
    })
    engine.setOnPlayerUpdate((player) => {
      playerData.stats = { ...player.stats }
      playerData.level = { ...player.level }
      playerData.gold = player.gold
      playerData.inventory = player.inventory.map(i => ({ ...i }))
      playerData.skills = player.skills.map(s => ({ ...s }))
    })
    engine.init()
    engine.start()
  }
}

const continueToNextLevel = () => {
  engine?.continueToNextLevel()
  currentLevel.value = engine?.getCurrentLevel() || 1
}

const useSkill = (id: string) => {
  engine?.getPlayer().useSkill(id)
}

const useItem = (id: string) => {
  engine?.useInventoryItem(id)
}

watch(gameState, (newState) => {
  if (newState === 'levelComplete') {
    currentLevel.value = engine?.getCurrentLevel() || currentLevel.value
  }
})
</script>

<style scoped>
.game-canvas-container {
  position: relative;
  width: 960px;
  height: 640px;
  margin: 0 auto;
}

.game-canvas {
  display: block;
  border: 2px solid #37474f;
  border-radius: 8px;
  box-shadow: 0 0 30px rgba(79, 195, 247, 0.3);
}
</style>
