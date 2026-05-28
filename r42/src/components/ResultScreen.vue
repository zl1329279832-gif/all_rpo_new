<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-16 px-4 flex items-center justify-center">
    <div class="w-full max-w-2xl">
      <div class="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
        <div
          class="py-12 text-center border-b border-slate-700"
          :class="gradeBgClass"
        >
          <div class="text-9xl font-black mb-4" :class="gradeColorClass" style="font-family: Orbitron, sans-serif;">
            {{ result?.grade }}
          </div>
          <div class="flex gap-2 justify-center">
            <Star
              v-for="s in 3"
              :key="s"
              class="w-8 h-8"
              :class="s <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-600'"
            />
          </div>
        </div>
        <div class="p-8">
          <h2 class="text-2xl font-bold text-white text-center mb-8">任务完成</h2>
          <div class="grid grid-cols-3 gap-4 mb-8">
            <div class="text-center p-4 bg-slate-900/50 rounded-xl">
              <div class="text-3xl font-bold text-slate-100 mb-1" style="font-family: Orbitron, sans-serif;">{{ result?.stats.totalResources }}</div>
              <div class="text-xs text-slate-500">总采集资源</div>
              <div class="text-xs text-amber-400 mt-1">+{{ result?.resourceScore.toFixed(0) }} 分</div>
            </div>
            <div class="text-center p-4 bg-slate-900/50 rounded-xl">
              <div class="text-3xl font-bold text-slate-100 mb-1" style="font-family: Orbitron, sans-serif;">{{ formatTime(result?.stats.timeSeconds ?? 0) }}</div>
              <div class="text-xs text-slate-500">通关用时</div>
              <div class="text-xs text-amber-400 mt-1">+{{ result?.timeScore.toFixed(0) }} 分</div>
            </div>
            <div class="text-center p-4 bg-slate-900/50 rounded-xl">
              <div class="text-3xl font-bold text-slate-100 mb-1" style="font-family: Orbitron, sans-serif;">{{ result?.stats.shipsLost }}</div>
              <div class="text-xs text-slate-500">舰船损失</div>
              <div class="text-xs text-amber-400 mt-1">+{{ result?.lossScore.toFixed(0) }} 分</div>
            </div>
          </div>
          <div class="text-center mb-8">
            <div class="text-sm text-slate-500 mb-2">综合得分</div>
            <div class="text-5xl font-bold text-amber-400" style="font-family: Orbitron, sans-serif;">{{ Math.floor(result?.totalScore ?? 0) }}</div>
          </div>
          <div class="flex gap-4">
            <button
              class="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              @click="$router.push('/')"
            >
              <Home class="w-5 h-5 inline mr-2" /> 返回主菜单
            </button>
            <button
              class="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              @click="replay"
            >
              <RefreshCcw class="w-5 h-5 inline mr-2" /> 再玩一次
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Star, Home, RefreshCcw } from 'lucide-vue-next';
import { useGameStore } from '../stores/gameStore';
import { StorageService } from '../services/StorageService';

const route = useRoute();
const router = useRouter();
const gameStore = useGameStore();

const result = computed(() => gameStore.getScore());

const stars = computed(() => {
  const g = result.value?.grade;
  return g === 'S' ? 3 : g === 'A' ? 2 : g === 'B' ? 1 : 0;
});

const gradeBgClass = computed(() => {
  const g = result.value?.grade;
  if (g === 'S') return 'bg-gradient-to-b from-amber-500/20 to-transparent';
  if (g === 'A') return 'bg-gradient-to-b from-blue-500/20 to-transparent';
  if (g === 'B') return 'bg-gradient-to-b from-green-500/20 to-transparent';
  return 'bg-gradient-to-b from-slate-600/20 to-transparent';
});

const gradeColorClass = computed(() => {
  const g = result.value?.grade;
  if (g === 'S') return 'text-amber-400';
  if (g === 'A') return 'text-blue-400';
  if (g === 'B') return 'text-green-400';
  return 'text-slate-400';
});

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function replay(): void {
  const levelId = route.params.levelId as string;
  StorageService.deleteSave(levelId);
  router.push(`/game/${levelId}`);
}

onMounted(() => {
  const levelId = route.params.levelId as string;
  const best = localStorage.getItem(`space-mining-best-${levelId}`);
  const currentScore = result.value?.totalScore ?? 0;
  const bestScore = best ? JSON.parse(best).totalScore : 0;
  if (!best || currentScore > bestScore) {
    localStorage.setItem(`space-mining-best-${levelId}`, JSON.stringify(result.value));
  }
});
</script>
