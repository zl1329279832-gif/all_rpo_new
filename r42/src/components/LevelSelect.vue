<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-16 px-4">
    <div class="max-w-5xl mx-auto">
      <div class="text-center mb-12">
        <div class="flex items-center justify-center gap-3 mb-4">
          <Rocket class="w-10 h-10 text-blue-400" />
          <h1 class="text-5xl font-bold text-white tracking-wider" style="font-family: Orbitron, sans-serif;">太空采矿</h1>
        </div>
        <p class="text-slate-400 text-lg">指挥舰队，征服星辰大海</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          v-for="(level, index) in levels"
          :key="level.id"
          class="group relative bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden hover:border-blue-500 transition-all cursor-pointer"
          @click="selectLevel(level.id)"
        >
          <div class="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div class="p-6">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center text-2xl font-bold text-blue-400" style="font-family: Orbitron, sans-serif;">
                  {{ index + 1 }}
                </div>
                <div>
                  <h3 class="text-xl font-semibold text-white">{{ level.name }}</h3>
                  <div class="flex gap-1 mt-1">
                    <Star
                      v-for="s in 3"
                      :key="s"
                      class="w-4 h-4"
                      :class="s <= (levelScores[level.id]?.stars ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'"
                    />
                  </div>
                </div>
              </div>
              <Lock
                v-if="index > 0 && !isUnlocked(index)"
                class="w-5 h-5 text-slate-500"
              />
              <Play
                v-else
                class="w-8 h-8 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
            <p class="text-slate-400 text-sm mb-4">{{ level.description }}</p>
            <div class="space-y-2">
              <div class="text-xs text-slate-500">关卡目标:</div>
              <div class="flex gap-2 flex-wrap">
                <div
                  v-for="obj in level.objectives"
                  :key="obj.type"
                  class="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-300 flex items-center gap-1"
                >
                  <span
                    class="w-2 h-2 rounded-full"
                    :class="getResourceColor(obj.type)"
                  ></span>
                  {{ getResourceName(obj.type) }} × {{ obj.amount }}
                </div>
              </div>
            </div>
            <div v-if="hasSave(level.id)" class="mt-4 pt-4 border-t border-slate-700">
              <button
                class="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1"
                @click.stop="continueGame(level.id)"
              >
                <RefreshCcw class="w-4 h-4" /> 继续上次进度 ({{ formatSaveTime(level.id) }})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Rocket, Star, Lock, Play, RefreshCcw } from 'lucide-vue-next';
import { LEVEL_CONFIGS } from '../game/levels/levelData';
import { StorageService } from '../services/StorageService';
import { ResourceType } from '../types';
import type { LevelConfig } from '../types';

const router = useRouter();
const levels = LEVEL_CONFIGS;
const levelScores = ref<Record<string, { stars: number }>>({});

onMounted(() => {
  for (const level of levels) {
    const best = localStorage.getItem(`space-mining-best-${level.id}`);
    if (best) {
      const grade = JSON.parse(best).grade;
      levelScores.value[level.id] = { stars: grade === 'S' ? 3 : grade === 'A' ? 2 : grade === 'B' ? 1 : 0 };
    }
  }
});

function isUnlocked(index: number): boolean {
  if (index === 0) return true;
  const prevLevel = levels[index - 1];
  return !!localStorage.getItem(`space-mining-best-${prevLevel.id}`);
}

function getResourceColor(type: ResourceType): string {
  const colors: Record<string, string> = {
    iron: 'bg-slate-400',
    crystal: 'bg-blue-400',
    deuterium: 'bg-green-400',
    dark_matter: 'bg-purple-500'
  };
  return colors[type] || 'bg-slate-400';
}

function getResourceName(type: ResourceType): string {
  const names: Record<string, string> = {
    iron: '铁矿',
    crystal: '水晶',
    deuterium: '氘',
    dark_matter: '暗物质'
  };
  return names[type] || type;
}

function hasSave(levelId: string): boolean {
  return StorageService.hasSave(levelId);
}

function formatSaveTime(levelId: string): string {
  const t = StorageService.getSaveTime(levelId);
  if (!t) return '';
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function selectLevel(levelId: string): void {
  const index = levels.findIndex(l => l.id === levelId);
  if (!isUnlocked(index)) return;
  StorageService.deleteSave(levelId);
  router.push(`/game/${levelId}`);
}

function continueGame(levelId: string): void {
  router.push(`/game/${levelId}?continue=1`);
}
</script>
