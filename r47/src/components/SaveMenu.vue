<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { getSaveSlots } from '@/game/save/saveService'

const gameStore = useGameStore()

const showSaveMenu = ref(false)
const saveSlots = ref(getSaveSlots())

function openSaveMenu() {
  saveSlots.value = getSaveSlots()
  showSaveMenu.value = true
}

function closeSaveMenu() {
  showSaveMenu.value = false
}

function saveToSlot(slot: number) {
  gameStore.saveToSlot(slot)
  saveSlots.value = getSaveSlots()
}
</script>

<template>
  <div class="save-menu">
    <button
      @click="openSaveMenu"
      class="px-4 py-2 bg-sand-light/10 hover:bg-sand-light/20 rounded-lg text-sm font-bold border border-amber-gold/30 transition-colors"
    >
      💾 存档
    </button>

    <Teleport to="body">
      <div
        v-if="showSaveMenu"
        class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
        @click.self="closeSaveMenu"
      >
        <div class="bg-sand-dark text-sand-light p-6 rounded-xl border-2 border-amber-gold shadow-2xl w-80">
          <h2 class="text-xl font-bold text-amber-gold font-cinzel text-center mb-4">
            💾 保存游戏
          </h2>

          <div class="space-y-2">
            <button
              v-for="slot in saveSlots"
              :key="slot.slot"
              @click="saveToSlot(slot.slot)"
              class="w-full p-3 bg-sand-light/5 hover:bg-sand-light/15 border border-amber-gold/30 rounded-lg transition-all text-left"
            >
              <div class="font-bold">存档 {{ slot.slot }}</div>
              <div v-if="slot.exists" class="text-sm opacity-70">
                第 {{ slot.day }} 天 | {{ slot.gold }} 金币
                <span class="text-amber-gold/70 ml-2">(覆盖)</span>
              </div>
              <div v-else class="text-sm opacity-50">新存档</div>
            </button>
          </div>

          <button
            @click="closeSaveMenu"
            class="w-full mt-4 py-2 bg-sand-light/10 hover:bg-sand-light/20 rounded-lg font-bold transition-colors"
          >
            关闭
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
</style>
