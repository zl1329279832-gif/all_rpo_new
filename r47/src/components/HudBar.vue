<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore'
import { storeToRefs } from 'pinia'

const gameStore = useGameStore()
const { caravan } = storeToRefs(gameStore)
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
    <div class="flex items-center gap-8">
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
    </div>
  </div>
</template>

<style scoped>
.hud-bar {
  font-family: 'Cinzel', 'Noto Sans SC', sans-serif;
}
</style>
