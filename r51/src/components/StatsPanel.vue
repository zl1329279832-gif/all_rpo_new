<script setup lang="ts">
import { computed } from 'vue';
import { Car, Gauge, Activity, Route } from 'lucide-vue-next';
import { useSceneStore } from '@/store/sceneStore';

const store = useSceneStore();

const cameraModeLabel = computed(() => {
  const labels = {
    top: '俯视视角',
    driving: '驾驶视角',
    free: '自由视角'
  };
  return labels[store.state.cameraMode];
});

const congestionLabel = computed(() => {
  const level = store.stats.congestionLevel;
  if (level >= 3) return { text: '拥堵', color: 'text-red-400', bg: 'bg-red-500/20' };
  if (level >= 2) return { text: '缓行', color: 'text-amber-400', bg: 'bg-amber-500/20' };
  return { text: '畅通', color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
});

const stats = computed(() => [
  {
    icon: Car,
    label: '车辆总数',
    value: store.stats.totalVehicles,
    unit: '辆',
    color: 'text-cyan-400'
  },
  {
    icon: Gauge,
    label: '平均速度',
    value: store.stats.averageSpeed,
    unit: 'km/h',
    color: 'text-emerald-400'
  },
  {
    icon: Activity,
    label: '拥堵指数',
    value: congestionLabel.value.text,
    unit: '',
    color: congestionLabel.value.color,
    customBg: congestionLabel.value.bg
  },
  {
    icon: Route,
    label: '活跃路线',
    value: store.stats.activeRoutes,
    unit: '条',
    color: 'text-amber-400'
  }
]);
</script>

<template>
  <div class="absolute bottom-6 left-6 z-20">
    <div class="backdrop-blur-xl bg-slate-900/80 border border-slate-700/50 rounded-2xl p-5 shadow-2xl">
      <div class="mb-4 pb-4 border-b border-slate-700/50">
        <div class="flex items-center gap-3">
          <div class="px-3 py-1 bg-cyan-500/20 rounded-lg">
            <span class="text-cyan-400 text-sm font-semibold">{{ cameraModeLabel }}</span>
          </div>
          <div class="h-4 w-px bg-slate-700" />
          <span class="text-slate-400 text-sm">城市立交桥模拟系统</span>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-4">
        <div
          v-for="stat in stats"
          :key="stat.label"
          :class="[
            'flex flex-col items-center p-3 rounded-xl transition-all duration-300',
            stat.customBg || 'bg-slate-800/30 hover:bg-slate-800/50'
          ]"
        >
          <component :is="stat.icon" :class="['w-5 h-5 mb-2', stat.color]" />
          <span class="text-2xl font-bold text-white">{{ stat.value }}</span>
          <div class="flex items-center gap-1 mt-1">
            <span class="text-slate-400 text-xs">{{ stat.label }}</span>
            <span v-if="stat.unit" class="text-slate-500 text-xs">{{ stat.unit }}</span>
          </div>
        </div>
      </div>

      <div class="mt-4 pt-4 border-t border-slate-700/50">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span class="text-slate-400 text-xs">系统运行中</span>
          </div>
          <span class="text-slate-500 text-xs">点击车辆可切换跟车视角</span>
        </div>
      </div>
    </div>
  </div>
</template>
