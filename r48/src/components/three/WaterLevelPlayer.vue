<script setup lang="ts">
import { useSceneStore } from '@/stores'
import { Play, Pause, SkipBack, FastForward } from 'lucide-vue-next'

const store = useSceneStore()

function formatHour(ts: number): string {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:00`
}

const totalSteps = 24
</script>

<template>
  <div class="water-level-player">
    <div class="player-controls">
      <button class="ctrl-btn" @click="store.setProgress(0); store.isPlaying = false">
        <SkipBack :size="14" />
      </button>
      <button class="ctrl-btn play-btn" @click="store.togglePlay()">
        <Play v-if="!store.isPlaying" :size="16" />
        <Pause v-else :size="16" />
      </button>
      <div class="speed-group">
        <button
          v-for="s in [0.5, 1, 2, 4]"
          :key="s"
          class="speed-btn"
          :class="{ active: store.playSpeed === s }"
          @click="store.setSpeed(s)"
        >
          {{ s }}x
        </button>
      </div>
    </div>
    <div class="timeline">
      <input
        type="range"
        min="0"
        :max="totalSteps - 1"
        :value="store.playProgress"
        class="timeline-slider"
        @input="store.setProgress(Number(($event.target as HTMLInputElement).value))"
      />
      <div class="timeline-labels">
        <span v-for="i in [0, 6, 12, 18, 23]" :key="i" class="time-label">
          {{ store.waterLevelData.timestamps[i] ? formatHour(store.waterLevelData.timestamps[i]) : '' }}
        </span>
      </div>
    </div>
    <div class="level-display">
      水位: <strong>{{ store.waterLevelData.levels[Math.floor(store.playProgress)]?.toFixed(2) ?? '-' }}</strong> m
    </div>
  </div>
</template>

<style scoped>
.water-level-player {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 16px;
  background: rgba(10, 22, 40, 0.9);
  border: 1px solid rgba(30, 144, 255, 0.15);
  border-radius: 8px;
  backdrop-filter: blur(8px);
}
.player-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ctrl-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid rgba(30, 144, 255, 0.25);
  border-radius: 6px;
  background: transparent;
  color: #8cb8d8;
  cursor: pointer;
  transition: all 0.2s;
}
.ctrl-btn:hover {
  background: rgba(30, 144, 255, 0.15);
  color: #00e5ff;
}
.play-btn {
  width: 32px;
  height: 32px;
  border-color: rgba(30, 144, 255, 0.4);
  color: #00e5ff;
}
.speed-group {
  display: flex;
  gap: 3px;
}
.speed-btn {
  padding: 2px 6px;
  border: 1px solid rgba(30, 144, 255, 0.15);
  border-radius: 3px;
  background: transparent;
  color: #6a8caa;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.speed-btn.active {
  background: rgba(30, 144, 255, 0.2);
  border-color: rgba(30, 144, 255, 0.4);
  color: #00e5ff;
}
.timeline {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.timeline-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  background: rgba(30, 144, 255, 0.2);
  border-radius: 2px;
  outline: none;
}
.timeline-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #00e5ff;
  cursor: pointer;
  box-shadow: 0 0 8px rgba(0, 229, 255, 0.5);
}
.timeline-labels {
  display: flex;
  justify-content: space-between;
}
.time-label {
  font-size: 10px;
  color: #6a8caa;
}
.level-display {
  font-size: 13px;
  color: #8cb8d8;
  white-space: nowrap;
}
.level-display strong {
  color: #00e5ff;
  font-size: 16px;
  font-variant-numeric: tabular-nums;
}
</style>
