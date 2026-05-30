<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { storeToRefs } from 'pinia'
import { getGoodById } from '@/game/economy/goods'

const gameStore = useGameStore()
const { quests } = storeToRefs(gameStore)

function getActiveStep(quest: typeof quests.value[0]) {
  return quest.steps.find((s) => !s.completed)
}

function getProgress(quest: typeof quests.value[0]) {
  const completed = quest.steps.filter((s) => s.completed).length
  return Math.round((completed / quest.steps.length) * 100)
}
</script>

<template>
  <div class="quest-panel bg-sand-dark/95 text-sand-light w-64 flex flex-col shadow-2xl rounded-b-lg border-2 border-amber-gold border-t-0">
    <div class="p-3 border-b border-amber-gold/30">
      <h2 class="text-lg font-bold text-amber-gold font-cinzel">📜 任务委托</h2>
    </div>

    <div class="flex-1 overflow-auto p-3 space-y-4">
      <div
        v-for="quest in quests"
        :key="quest.id"
        class="p-3 bg-sand-light/5 rounded-lg border border-amber-gold/20"
      >
        <div class="font-bold text-amber-gold">{{ quest.name }}</div>
        
        <div class="w-full bg-sand-light/10 rounded-full h-2 mt-2">
          <div
            class="bg-amber-gold h-2 rounded-full transition-all"
            :style="{ width: getProgress(quest) + '%' }"
          ></div>
        </div>
        <div class="text-xs text-right opacity-70 mt-1">{{ getProgress(quest) }}%</div>

        <div v-if="getActiveStep(quest)" class="mt-3 p-2 bg-amber-gold/10 rounded text-sm">
          <div class="font-bold text-amber-gold">当前目标</div>
          <div class="mt-1">{{ getActiveStep(quest)?.description }}</div>
          <div class="text-yellow-400 mt-1">奖励: {{ getActiveStep(quest)?.reward }} 金</div>
        </div>

        <div v-else class="mt-3 text-center text-green-400 font-bold">
          ✅ 任务完成！
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-cinzel {
  font-family: 'Cinzel', serif;
}
</style>
