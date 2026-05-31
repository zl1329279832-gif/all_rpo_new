<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Settings, Sun, Moon, Car, AlertTriangle, ChevronRight, ChevronLeft, Tag } from 'lucide-vue-next';
import { useSceneStore } from '@/store/sceneStore';

const store = useSceneStore();
const isExpanded = ref(true);

const trafficDensity = computed({
  get: () => store.state.trafficDensity,
  set: (val) => store.setTrafficDensity(val)
});

const isDay = computed({
  get: () => store.state.timeOfDay === 'day',
  set: (val) => store.setTimeOfDay(val ? 'day' : 'night')
});

const roadStatus = computed({
  get: () => store.state.roadStatus,
  set: (val) => store.setRoadStatus(val)
});

const showLabels = computed({
  get: () => store.state.showLabels,
  set: (val) => store.toggleLabels()
});

const emit = defineEmits<{
  (e: 'density-change', density: number): void;
  (e: 'daynight-change', isDay: boolean): void;
  (e: 'labels-change', show: boolean): void;
}>();

watch(trafficDensity, (val) => {
  emit('density-change', val);
});

watch(isDay, (val) => {
  emit('daynight-change', val);
});

watch(showLabels, (val) => {
  emit('labels-change', val);
});

const roadStatusOptions = [
  { id: 'normal', label: '正常', color: 'bg-emerald-500' },
  { id: 'construction', label: '施工', color: 'bg-amber-500' },
  { id: 'congested', label: '拥堵', color: 'bg-red-500' }
] as const;

function getDensityLabel(density: number): string {
  if (density < 0.3) return '稀疏';
  if (density < 0.6) return '适中';
  return '密集';
}
</script>

<template>
  <div
    :class="[
      'absolute top-6 right-28 z-20 transition-all duration-500 ease-out',
      isExpanded ? 'translate-x-0 opacity-100' : 'translate-x-[calc(100%-48px)] opacity-80'
    ]"
  >
    <div class="flex items-start">
      <div class="w-80 backdrop-blur-xl bg-slate-900/80 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Settings class="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 class="text-white font-semibold text-lg">场景控制</h3>
              <p class="text-slate-400 text-xs">调节场景参数</p>
            </div>
          </div>
        </div>

        <div class="p-5 space-y-6">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Car class="w-5 h-5 text-cyan-400" />
                <span class="text-slate-200 font-medium">车流密度</span>
              </div>
              <span
                :class="[
                  'px-3 py-1 rounded-full text-xs font-semibold',
                  trafficDensity < 0.3 ? 'bg-emerald-500/20 text-emerald-400' :
                  trafficDensity < 0.6 ? 'bg-amber-500/20 text-amber-400' :
                  'bg-red-500/20 text-red-400'
                ]"
              >
                {{ getDensityLabel(trafficDensity) }} {{ Math.round(trafficDensity * 100) }}%
              </span>
            </div>
            <div class="relative">
              <input
                v-model.number="trafficDensity"
                type="range"
                min="0"
                max="1"
                step="0.05"
                class="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
            <div class="flex justify-between text-xs text-slate-500">
              <span>0 辆</span>
              <span>60 辆</span>
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <component :is="isDay ? Sun : Moon" class="w-5 h-5 text-amber-400" />
                <span class="text-slate-200 font-medium">昼夜模式</span>
              </div>
              <button
                @click="isDay = !isDay"
                :class="[
                  'relative w-14 h-7 rounded-full transition-all duration-300',
                  isDay ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-indigo-600 to-purple-700'
                ]"
              >
                <span
                  :class="[
                    'absolute top-1 w-5 h-5 rounded-full bg-white shadow-lg transition-all duration-300 flex items-center justify-center',
                    isDay ? 'left-1' : 'left-8'
                  ]"
                >
                  <component :is="isDay ? Sun : Moon" class="w-3 h-3" :class="isDay ? 'text-amber-500' : 'text-indigo-600'" />
                </span>
              </button>
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <AlertTriangle class="w-5 h-5 text-orange-400" />
              <span class="text-slate-200 font-medium">道路状态</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="option in roadStatusOptions"
                :key="option.id"
                @click="roadStatus = option.id"
                :class="[
                  'px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border',
                  roadStatus === option.id
                    ? `${option.color} text-white border-transparent shadow-lg`
                    : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700/50 hover:text-slate-200'
                ]"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Tag class="w-5 h-5 text-emerald-400" />
                <span class="text-slate-200 font-medium">显示标签</span>
              </div>
              <button
                @click="showLabels = !showLabels"
                :class="[
                  'relative w-12 h-6 rounded-full transition-all duration-300',
                  showLabels ? 'bg-emerald-500' : 'bg-slate-700'
                ]"
              >
                <span
                  :class="[
                    'absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300',
                    showLabels ? 'left-7' : 'left-1'
                  ]"
                />
              </button>
            </div>
          </div>
        </div>

        <div class="px-5 py-3 bg-slate-800/50 border-t border-slate-700/50">
          <div class="flex items-center justify-between text-xs text-slate-400">
            <span>快捷键: 1/2/3 切换视角</span>
            <span>WASD 移动自由视角</span>
          </div>
        </div>
      </div>

      <button
        @click="isExpanded = !isExpanded"
        class="w-12 h-12 -ml-px backdrop-blur-xl bg-slate-900/80 border border-slate-700/50 rounded-r-2xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
      >
        <component :is="isExpanded ? ChevronRight : ChevronLeft" class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>
