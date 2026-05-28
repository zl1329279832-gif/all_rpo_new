<template>
  <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg">
    <button
      class="p-2 rounded transition-colors"
      :class="gameStore.isPaused ? 'bg-green-600 hover:bg-green-500' : 'bg-slate-700 hover:bg-slate-600'"
      title="暂停/继续"
      @click="gameStore.togglePause"
    >
      <component :is="gameStore.isPaused ? Play : Pause" class="w-5 h-5 text-white" />
    </button>
    <div class="w-px h-6 bg-slate-700"></div>
    <button
      class="p-2 rounded bg-slate-700 hover:bg-slate-600 transition-colors"
      title="手动存档"
      @click="onSave"
    >
      <Save class="w-5 h-5 text-slate-200" />
    </button>
    <button
      class="p-2 rounded bg-slate-700 hover:bg-slate-600 transition-colors"
      title="科技升级"
      @click="uiStore.toggleTechPanel"
    >
      <Settings class="w-5 h-5 text-slate-200" />
    </button>
    <button
      class="p-2 rounded bg-slate-700 hover:bg-slate-600 transition-colors"
      title="返回主菜单"
      @click="$router.push('/')"
    >
      <Home class="w-5 h-5 text-slate-200" />
    </button>
    <div class="w-px h-6 bg-slate-700"></div>
    <div class="px-3 text-sm text-slate-300">
      <Clock class="w-4 h-4 inline mr-1 text-slate-500" />
      {{ formatTime(gameStore.state?.gameTime ?? 0) }}
    </div>
    <div v-if="gameStore.currentLevelConfig" class="px-3 text-sm text-slate-300 border-l border-slate-700">
      <Target class="w-4 h-4 inline mr-1 text-amber-400" />
      {{ gameStore.currentLevelConfig.name }}
    </div>
    <div v-if="uiStore.showSaveNotification" class="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-600 text-white text-sm rounded whitespace-nowrap">
      ✓ 已保存
    </div>
  </div>
</template>

<script setup lang="ts">
import { Play, Pause, Save, Settings, Home, Clock, Target } from 'lucide-vue-next';
import { useGameStore } from '../stores/gameStore';
import { useUIStore } from '../stores/uiStore';

const gameStore = useGameStore();
const uiStore = useUIStore();

function onSave(): void {
  gameStore.manualSave();
  uiStore.showSaved();
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
</script>
