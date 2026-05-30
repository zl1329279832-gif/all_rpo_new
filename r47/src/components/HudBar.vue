<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { storeToRefs } from 'pinia'
import { getSaveSlots, deleteSave } from '@/game/save/saveService'

const gameStore = useGameStore()
const { caravan } = storeToRefs(gameStore)

const showSaveMenu = ref(false)
const saveSlots = ref(getSaveSlots())
const saveFeedback = ref('')

function openSaveMenu() {
  saveSlots.value = getSaveSlots()
  showSaveMenu.value = true
  saveFeedback.value = ''
}

function closeSaveMenu() {
  showSaveMenu.value = false
}

function saveToSlot(slot: number) {
  gameStore.saveToSlot(slot)
  saveSlots.value = getSaveSlots()
  saveFeedback.value = `已保存到存档 ${slot}`
  setTimeout(() => { saveFeedback.value = '' }, 2000)
}

function deleteSlot(slot: number) {
  deleteSave(slot)
  saveSlots.value = getSaveSlots()
}

function quickSave() {
  gameStore.saveToSlot(1)
  saveFeedback.value = '已快速保存到存档 1'
  setTimeout(() => { saveFeedback.value = '' }, 2000)
}
</script>

<template>
  <div class="hud-bar bg-sand-dark/90 text-sand-light px-6 py-3 flex items-center justify-between font-body shadow-lg border-b-2 border-amber-gold">
    <div class="flex items-center gap-8">
      <div class="flex items-center gap-2">
        <span class="text-2xl">💰</span>
        <span class="font-bold text-lg text-amber-gold">{{ caravan.gold }}</span>
        <span class="text-sm opacity-70">金币</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-2xl">🎒</span>
        <span class="font-bold">{{ caravan.currentWeight }}/{{ caravan.maxCapacity }}</span>
        <span class="text-sm opacity-70">负重</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-2xl">🛡️</span>
        <span class="font-bold">Lv.{{ caravan.guardLevel }}</span>
        <span class="text-sm opacity-70">护卫</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-2xl">⭐</span>
        <span class="font-bold">{{ caravan.reputation }}</span>
        <span class="text-sm opacity-70">声望</span>
      </div>
    </div>
    <div class="flex items-center gap-6">
      <div class="flex items-center gap-2">
        <span class="text-2xl">📅</span>
        <span class="font-bold">第 {{ caravan.day }} 天</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-2xl">📍</span>
        <span class="font-bold text-amber-gold">
          {{ caravan.isMoving ? '旅途中...' : (gameStore.currentCity?.name || '未知') }}
        </span>
      </div>
      <div class="flex items-center gap-2 ml-4">
        <span v-if="saveFeedback" class="text-green-400 text-sm font-bold">{{ saveFeedback }}</span>
        <button
          @click="quickSave"
          class="px-3 py-1 bg-amber-gold/30 hover:bg-amber-gold/50 rounded text-sm font-bold transition-colors border border-amber-gold/50"
          title="快速存档到槽位1"
        >
          💾 保存
        </button>
        <button
          @click="openSaveMenu"
          class="px-3 py-1 bg-sand-light/10 hover:bg-sand-light/20 rounded text-sm font-bold transition-colors border border-amber-gold/30"
          title="存档管理"
        >
          📂 存档
        </button>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="showSaveMenu"
      class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      @click.self="closeSaveMenu"
    >
      <div class="bg-sand-dark text-sand-light p-6 rounded-xl border-2 border-amber-gold shadow-2xl w-96">
        <h2 class="text-xl font-bold text-amber-gold font-cinzel text-center mb-2">
          📂 存档管理
        </h2>
        <p class="text-xs text-center opacity-50 mb-4">点击「保存」写入当前进度 | 点击「删除」清除存档</p>

        <div class="space-y-2">
          <div
            v-for="slot in saveSlots"
            :key="slot.slot"
            class="p-3 bg-sand-light/5 border border-amber-gold/30 rounded-lg text-left"
          >
            <div class="flex items-center justify-between">
              <div>
                <div class="font-bold">存档 {{ slot.slot }}</div>
                <div v-if="slot.exists" class="text-sm opacity-70 mt-1">
                  第 {{ slot.day }} 天 | {{ slot.gold }} 金币
                </div>
                <div v-else class="text-sm opacity-50 mt-1">空存档</div>
              </div>
              <div class="flex gap-2">
                <button
                  @click="saveToSlot(slot.slot)"
                  class="px-3 py-1 bg-amber-gold/30 hover:bg-amber-gold/50 rounded text-xs font-bold transition-colors border border-amber-gold/50"
                >
                  {{ slot.exists ? '覆盖' : '保存' }}
                </button>
                <button
                  v-if="slot.exists"
                  @click="deleteSlot(slot.slot)"
                  class="px-3 py-1 bg-red-900/30 hover:bg-red-900/50 rounded text-xs font-bold transition-colors border border-red-500/30"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
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
</template>

<style scoped>
.hud-bar {
  font-family: 'Cinzel', 'Noto Sans SC', sans-serif;
}
.font-cinzel {
  font-family: 'Cinzel', serif;
}
</style>
