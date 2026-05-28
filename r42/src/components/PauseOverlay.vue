<template>
  <Teleport to="body">
    <div
      v-if="gameStore.isPaused"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40"
    >
      <div class="text-center">
        <div class="w-20 h-20 mx-auto mb-6 bg-slate-800 rounded-full flex items-center justify-center">
          <Pause class="w-10 h-10 text-slate-300" />
        </div>
        <h2 class="text-4xl font-bold text-white mb-4" style="font-family: Orbitron, sans-serif;">游戏暂停</h2>
        <p class="text-slate-400 mb-8">点击继续按钮恢复游戏</p>
        <button
          class="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors"
          @click="gameStore.togglePause"
        >
          <Play class="w-5 h-5 inline mr-2" /> 继续游戏
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { Play, Pause } from 'lucide-vue-next';
import { useGameStore } from '../stores/gameStore';

const gameStore = useGameStore();
</script>
