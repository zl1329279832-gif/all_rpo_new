<script setup lang="ts">
import { ref, computed } from 'vue';
import { useWarehouseStore } from '@/data/warehouseStore';
import { FLOOR_NAMES, DATA_REFRESH_INTERVAL } from '@/config';
import type { CameraView, AlarmLevel } from '@/types';
import { Search, Layers, Eye, Bell, Play, Pause, SkipBack, FastForward, Settings, Maximize2 } from 'lucide-vue-next';

const store = useWarehouseStore();

const searchInput = ref('');
const showViewMenu = ref(false);
const showAlarmFilter = ref(false);
const showPlayback = ref(false);

const cameraViews: { value: CameraView; label: string }[] = [
  { value: 'perspective', label: '透视视图' },
  { value: 'top', label: '顶视图' },
  { value: 'front', label: '正视图' },
  { value: 'side', label: '侧视图' },
];

const alarmFilters: { value: AlarmLevel | 'all'; label: string; color: string }[] = [
  { value: 'all', label: '全部', color: '#1890FF' },
  { value: 'critical', label: '严重', color: '#FF4D4F' },
  { value: 'warning', label: '警告', color: '#FAAD14' },
  { value: 'info', label: '提示', color: '#1890FF' },
];

const currentFloorName = computed(() => FLOOR_NAMES[store.currentFloor]);
const currentViewName = computed(() => cameraViews.find(v => v.value === store.currentCameraView)?.label || '透视视图');
const currentAlarmFilter = computed(() => alarmFilters.find(f => f.value === store.alarmFilter) || alarmFilters[0]);

const playbackTime = ref(0);
const playbackDuration = ref(3600);

function handleSearch() {
  store.setSearchQuery(searchInput.value);
}

function handleFloorChange(floor: number) {
  store.setFloor(floor);
}

function handleViewChange(view: CameraView) {
  store.setCameraView(view);
  showViewMenu.value = false;
}

function handleAlarmFilter(filter: AlarmLevel | 'all') {
  store.setAlarmFilter(filter);
  showAlarmFilter.value = false;
}

function handlePlaybackToggle() {
  if (store.isPlaying) {
    store.pausePlayback();
  } else {
    store.startPlayback();
  }
}

function handleResetPlayback() {
  store.resetPlayback();
  playbackTime.value = 0;
}

function handlePlaybackSpeed(speed: number) {
  store.setPlaybackSpeed(speed);
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

const currentTime = ref(new Date());
setInterval(() => {
  currentTime.value = new Date();
}, 1000);

const emit = defineEmits<{
  (e: 'toggleFullscreen'): void;
}>();
</script>

<template>
  <div class="toolbar glass-panel animate-slide-in-top">
    <div class="toolbar-left">
      <div class="logo">
        <div class="logo-icon">
          <Layers :size="24" />
        </div>
        <div class="logo-text">
          <span class="gradient-text font-bold text-lg">数字孪生</span>
          <span class="text-xs text-gray-400">物流仓库监控系统</span>
        </div>
      </div>

      <div class="divider-vertical"></div>

      <div class="floor-selector">
        <button
          v-for="(name, index) in FLOOR_NAMES"
          :key="index"
          :class="['floor-btn', { active: store.currentFloor === index }]"
          @click="handleFloorChange(index)"
        >
          {{ name }}
        </button>
      </div>

      <div class="divider-vertical"></div>

      <div class="search-box">
        <Search :size="16" class="search-icon" />
        <input
          v-model="searchInput"
          type="text"
          placeholder="搜索货架编号..."
          @keyup.enter="handleSearch"
        />
      </div>
    </div>

    <div class="toolbar-center">
      <div class="time-display">
        <span class="time font-mono text-xl">{{ currentTime.toLocaleTimeString('zh-CN') }}</span>
        <span class="date text-sm text-gray-400">{{ currentTime.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) }}</span>
      </div>
    </div>

    <div class="toolbar-right">
      <div class="stats-badge">
        <div class="stat-item">
          <span class="stat-value text-green-400">{{ store.stats.activeForklifts }}/{{ store.stats.totalForklifts }}</span>
          <span class="stat-label">叉车</span>
        </div>
        <div class="stat-item">
          <span class="stat-value" :class="store.stats.criticalAlarms > 0 ? 'text-red-400 animate-pulse' : 'text-green-400'">
            {{ store.stats.activeAlarms }}
          </span>
          <span class="stat-label">告警</span>
        </div>
        <div class="stat-item">
          <span class="stat-value text-cyan-400">{{ (store.stats.utilizationRate * 100).toFixed(1) }}%</span>
          <span class="stat-label">利用率</span>
        </div>
      </div>

      <div class="divider-vertical"></div>

      <div class="toolbar-btn" :title="currentViewName" @click="showViewMenu = !showViewMenu">
        <Eye :size="18" />
        <span class="btn-text">{{ currentViewName }}</span>
        <div v-if="showViewMenu" class="dropdown-menu view-menu">
          <div
            v-for="view in cameraViews"
            :key="view.value"
            :class="['dropdown-item', { active: store.currentCameraView === view.value }]"
            @click="handleViewChange(view.value)"
          >
            {{ view.label }}
          </div>
        </div>
      </div>

      <div class="toolbar-btn" :title="'告警过滤'" @click="showAlarmFilter = !showAlarmFilter">
        <Bell :size="18" />
        <span
          class="badge-dot"
          :style="{ backgroundColor: currentAlarmFilter.color }"
        ></span>
        <div v-if="showAlarmFilter" class="dropdown-menu alarm-menu">
          <div
            v-for="filter in alarmFilters"
            :key="filter.value"
            :class="['dropdown-item', { active: store.alarmFilter === filter.value }]"
            @click="handleAlarmFilter(filter.value)"
          >
            <span class="color-dot" :style="{ backgroundColor: filter.color }"></span>
            {{ filter.label }}
          </div>
        </div>
      </div>

      <div class="toolbar-btn" :title="'回放控制'" @click="showPlayback = !showPlayback">
        <Play :size="18" />
      </div>

      <div class="toolbar-btn" :title="'全屏'" @click="emit('toggleFullscreen')">
        <Maximize2 :size="18" />
      </div>
    </div>

    <div v-if="showPlayback" class="playback-panel glass-panel-light">
      <div class="playback-controls">
        <button class="playback-btn" @click="handleResetPlayback">
          <SkipBack :size="16" />
        </button>
        <button class="playback-btn play-btn" @click="handlePlaybackToggle">
          <Play v-if="!store.isPlaying" :size="20" />
          <Pause v-else :size="20" />
        </button>
        <button class="playback-btn" @click="handlePlaybackSpeed(store.playbackSpeed >= 2 ? 1 : store.playbackSpeed + 0.5)">
          <FastForward :size="16" />
          <span class="speed-text">{{ store.playbackSpeed }}x</span>
        </button>

        <div class="playback-slider">
          <span class="time-label">{{ formatTime(playbackTime) }}</span>
          <input
            type="range"
            :value="playbackTime"
            :max="playbackDuration"
            @input="playbackTime = Number(($event.target as HTMLInputElement).value); store.setPlaybackTime(playbackTime)"
          />
          <span class="time-label">{{ formatTime(playbackDuration) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.toolbar {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 100;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;

  .logo-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, var(--color-primary), var(--color-info));
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
  }

  .logo-text {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
  }
}

.divider-vertical {
  width: 1px;
  height: 32px;
  background: var(--border-secondary);
}

.floor-selector {
  display: flex;
  gap: 4px;
  background: var(--bg-tertiary);
  padding: 4px;
  border-radius: 6px;

  .floor-btn {
    padding: 6px 14px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 13px;
    font-weight: 500;

    &:hover {
      background: var(--bg-glass-light);
      color: var(--text-primary);
    }

    &.active {
      background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
      color: white;
      box-shadow: 0 2px 8px rgba(24, 144, 255, 0.4);
    }
  }
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;

  .search-icon {
    position: absolute;
    left: 12px;
    color: var(--text-tertiary);
  }

  input {
    width: 200px;
    padding-left: 36px;
    font-size: 13px;
  }
}

.time-display {
  display: flex;
  flex-direction: column;
  align-items: center;

  .time {
    font-weight: 600;
    color: var(--color-primary-light);
    letter-spacing: 0.05em;
  }
}

.stats-badge {
  display: flex;
  gap: 20px;

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;

    .stat-value {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      font-size: 15px;
    }

    .stat-label {
      font-size: 11px;
      color: var(--text-tertiary);
    }
  }
}

.toolbar-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--bg-glass-light);
    color: var(--text-primary);
    border-color: var(--color-primary);
  }

  .btn-text {
    font-size: 13px;
  }

  .badge-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    position: absolute;
    top: 6px;
    right: 6px;
  }
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 4px;
  min-width: 140px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 200;

  .dropdown-item {
    padding: 10px 14px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    color: var(--text-secondary);
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;

    &:hover {
      background: var(--bg-glass-light);
      color: var(--text-primary);
    }

    &.active {
      background: rgba(24, 144, 255, 0.15);
      color: var(--color-primary-light);
    }

    .color-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
  }
}

.playback-panel {
  position: absolute;
  bottom: -70px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 20px;

  .playback-controls {
    display: flex;
    align-items: center;
    gap: 12px;

    .playback-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-primary);
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;

      &:hover {
        background: var(--color-primary);
        border-color: var(--color-primary);
        color: white;
      }

      &.play-btn {
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
        border: none;
        color: white;
        box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);

        &:hover {
          transform: scale(1.1);
        }
      }

      .speed-text {
        position: absolute;
        bottom: -16px;
        font-size: 10px;
        color: var(--text-tertiary);
      }
    }

    .playback-slider {
      display: flex;
      align-items: center;
      gap: 12px;

      .time-label {
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        color: var(--text-secondary);
        min-width: 50px;
      }

      input[type='range'] {
        width: 300px;
        height: 4px;
        padding: 0;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        cursor: pointer;

        &::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--color-primary);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(24, 144, 255, 0.6);
        }
      }
    }
  }
}
</style>
