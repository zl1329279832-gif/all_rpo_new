<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { hasAnySave, hasAutoSave, getSaveSlots, getAutoSaveInfo } from '@/game/save/saveService'

const gameStore = useGameStore()

const showLoadMenu = ref(false)
const saveSlots = ref<Array<{ slot: number; exists: boolean; day: number; gold: number }>>([])
const autoSaveInfo = ref<{ exists: boolean; day: number; gold: number }>({ exists: false, day: 0, gold: 0 })
const canContinue = ref(false)

onMounted(() => {
  refreshSaveInfo()
})

function refreshSaveInfo() {
  saveSlots.value = getSaveSlots()
  autoSaveInfo.value = getAutoSaveInfo()
  canContinue.value = hasAnySave()
}

function startNewGame() {
  gameStore.startNewGame()
}

function continueGame() {
  if (hasAutoSave()) {
    gameStore.loadFromAutoSave()
  } else {
    const slots = getSaveSlots()
    const latest = slots.filter((s) => s.exists).reduce((a, b) => (a.day > b.day ? a : b), slots[0])
    if (latest && latest.exists) {
      gameStore.loadFromSlot(latest.slot)
    }
  }
}

function loadGame(slot: number) {
  gameStore.loadFromSlot(slot)
}

function loadAutoSaveGame() {
  gameStore.loadFromAutoSave()
}

function openLoadMenu() {
  refreshSaveInfo()
  showLoadMenu.value = true
}

function closeLoadMenu() {
  showLoadMenu.value = false
}
</script>

<template>
  <div class="title-screen min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-b from-sand-dark via-sand-dark/95 to-sand-dark"></div>
    
    <div class="relative z-10 text-center">
      <div class="text-8xl mb-6 animate-bounce">🐪</div>
      
      <h1 class="text-6xl font-bold text-amber-gold font-cinzel mb-4 tracking-wider">
        丝路商队
      </h1>
      <p class="text-sand-light/70 text-xl mb-12 font-body">
        穿越沙漠，掌控贸易，成为传奇商人
      </p>

      <div class="space-y-4">
        <button
          @click="startNewGame"
          class="block w-72 mx-auto py-4 px-8 bg-amber-gold hover:bg-amber-gold/80 text-sand-dark text-xl font-bold rounded-lg shadow-lg transition-all hover:scale-105 font-cinzel"
        >
          🆕 开始新游戏
        </button>

        <button
          @click="continueGame"
          :disabled="!canContinue"
          class="block w-72 mx-auto py-4 px-8 bg-sand-light/10 hover:bg-sand-light/20 text-sand-light text-xl font-bold rounded-lg border-2 border-amber-gold/50 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-cinzel"
        >
          💾 继续游戏
        </button>

        <button
          @click="openLoadMenu"
          class="block w-72 mx-auto py-3 px-8 bg-sand-light/5 hover:bg-sand-light/10 text-sand-light/70 text-lg font-bold rounded-lg border border-amber-gold/30 transition-all font-cinzel"
        >
          📂 读取存档
        </button>
      </div>

      <div class="mt-16 text-sand-light/40 text-sm">
        <p>🎮 点击相邻城市出发 | 💰 低买高卖积累财富</p>
        <p class="mt-1">⚔️ 应对随机事件 | 📜 完成任务获得奖励</p>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showLoadMenu"
        class="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        @click.self="closeLoadMenu"
      >
        <div class="bg-sand-dark text-sand-light p-8 rounded-xl border-2 border-amber-gold shadow-2xl w-96">
          <h2 class="text-2xl font-bold text-amber-gold font-cinzel text-center mb-6">
            📂 读取存档
          </h2>

          <div class="space-y-3">
            <button
              v-if="autoSaveInfo.exists"
              @click="loadAutoSaveGame()"
              class="w-full p-4 bg-green-900/30 hover:bg-green-900/50 border border-green-500/50 rounded-lg transition-all text-left"
            >
              <div class="font-bold text-green-400">🔄 自动存档</div>
              <div class="text-sm opacity-70 mt-1">
                第 {{ autoSaveInfo.day }} 天 | {{ autoSaveInfo.gold }} 金币
              </div>
            </button>

            <button
              v-for="slot in saveSlots"
              :key="slot.slot"
              @click="slot.exists ? loadGame(slot.slot) : null"
              :disabled="!slot.exists"
              class="w-full p-4 bg-sand-light/5 hover:bg-sand-light/10 border border-amber-gold/30 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed text-left"
            >
              <div class="font-bold">存档 {{ slot.slot }}</div>
              <div v-if="slot.exists" class="text-sm opacity-70 mt-1">
                第 {{ slot.day }} 天 | {{ slot.gold }} 金币
              </div>
              <div v-else class="text-sm opacity-50 mt-1">空存档</div>
            </button>
          </div>

          <button
            @click="closeLoadMenu"
            class="w-full mt-6 py-3 bg-sand-light/10 hover:bg-sand-light/20 rounded-lg font-bold transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.font-cinzel {
  font-family: 'Cinzel', serif;
}

.font-body {
  font-family: 'Noto Sans SC', sans-serif;
}

.animate-bounce {
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
</style>
