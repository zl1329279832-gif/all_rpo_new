<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSceneStore, useDeviceStore } from '@/stores'
import { Play, Pause, SkipBack, FastForward, Clock, Droplets, Gauge, Activity, Zap, X } from 'lucide-vue-next'
import type { PlaybackFrame } from '@/types'

const sceneStore = useSceneStore()
const deviceStore = useDeviceStore()

onMounted(() => {
  if (!sceneStore.playbackData) {
    sceneStore.loadPlaybackData()
  }
})

const currentFrame = computed<PlaybackFrame | null>(() => {
  if (!sceneStore.playbackData || !sceneStore.playbackMode) return null
  const idx = Math.floor((sceneStore.playProgress / 100) * (sceneStore.playbackData.frames.length - 1))
  return sceneStore.playbackData.frames[idx] || null
})

const currentTime = computed(() => {
  return currentFrame.value?.timestamp || Date.now()
})

const displayMetrics = computed(() => {
  const frame = currentFrame.value
  if (frame) {
    const flowOut = frame.metrics.flowOut[frame.metrics.flowOut.length - 1]?.value || 0
    const pressure = frame.metrics.pressure['pump-1']?.[frame.metrics.pressure['pump-1'].length - 1]?.value || 0
    const energy = frame.metrics.energyDaily[frame.metrics.energyDaily.length - 1]?.value || 0
    return {
      waterLevel: frame.waterLevel,
      flow: flowOut,
      pressure,
      energy,
      alarmCount: frame.alarms.length,
    }
  }
  return {
    waterLevel: sceneStore.waterLevelData.levels[Math.floor(sceneStore.playProgress)] ?? 3.0,
    flow: sceneStore.stationMetrics.flowOut[sceneStore.stationMetrics.flowOut.length - 1]?.value || 0,
    pressure: sceneStore.stationMetrics.pressure['pump-1']?.[sceneStore.stationMetrics.pressure['pump-1'].length - 1]?.value || 0,
    energy: sceneStore.stationMetrics.energyDaily[sceneStore.stationMetrics.energyDaily.length - 1]?.value || 0,
    alarmCount: deviceStore.devices.reduce((sum, d) => sum + d.alarms.length, 0),
  }
})

const alarmMarkers = computed(() => {
  if (!sceneStore.playbackData) return []
  const frames = sceneStore.playbackData.frames
  return frames
    .map((frame, idx) => ({
      position: (idx / (frames.length - 1)) * 100,
      level: frame.alarms.length > 0 ? frame.alarms[0].level : null,
      count: frame.alarms.length,
    }))
    .filter(m => m.count > 0)
})

function formatDateTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function enterPlayback() {
  sceneStore.enterPlaybackMode()
}

function exitPlayback() {
  sceneStore.exitPlaybackMode()
}

const maxProgress = computed(() => {
  if (sceneStore.playbackMode && sceneStore.playbackData) {
    return 100
  }
  return 23
})

const timeLabels = computed(() => {
  if (sceneStore.playbackMode && sceneStore.playbackData) {
    const frames = sceneStore.playbackData.frames
    const step = Math.floor(frames.length / 6)
    return [0, step, step * 2, step * 3, step * 4, step * 5, frames.length - 1]
      .map(i => frames[i]?.timestamp || 0)
      .filter(t => t > 0)
  }
  return [0, 4, 8, 12, 16, 20, 23].map(i => sceneStore.waterLevelData.timestamps[i] || 0).filter(t => t > 0)
})
</script>

<template>
  <div class="timeline-playback">
    <div class="playback-header">
      <div class="header-left">
        <Clock :size="16" class="header-icon" />
        <span class="header-title">{{ sceneStore.playbackMode ? '历史回放' : '实时监控' }}</span>
        <span class="current-time">{{ formatDateTime(currentTime) }}</span>
      </div>
      <div class="header-right">
        <button v-if="!sceneStore.playbackMode" class="mode-btn" @click="enterPlayback">
          进入回放模式
        </button>
        <button v-else class="mode-btn exit" @click="exitPlayback">
          <X :size="14" />
          退出回放
        </button>
      </div>
    </div>

    <div class="metrics-bar">
      <div class="metric-item">
        <Droplets :size="14" class="metric-icon water" />
        <span class="metric-label">水位</span>
        <span class="metric-value">{{ displayMetrics.waterLevel.toFixed(2) }}<small>m</small></span>
      </div>
      <div class="metric-item">
        <Activity :size="14" class="metric-icon flow" />
        <span class="metric-label">流量</span>
        <span class="metric-value">{{ displayMetrics.flow.toFixed(1) }}<small>m³/h</small></span>
      </div>
      <div class="metric-item">
        <Gauge :size="14" class="metric-icon pressure" />
        <span class="metric-label">压力</span>
        <span class="metric-value">{{ displayMetrics.pressure.toFixed(2) }}<small>MPa</small></span>
      </div>
      <div class="metric-item">
        <Zap :size="14" class="metric-icon energy" />
        <span class="metric-label">能耗</span>
        <span class="metric-value">{{ displayMetrics.energy.toFixed(0) }}<small>kWh</small></span>
      </div>
      <div class="metric-item alarm" v-if="displayMetrics.alarmCount > 0">
        <span class="alarm-badge">{{ displayMetrics.alarmCount }}</span>
        <span class="metric-label">告警</span>
      </div>
    </div>

    <div class="playback-controls">
      <div class="controls-left">
        <button class="ctrl-btn" @click="sceneStore.setProgress(0); sceneStore.isPlaying = false">
          <SkipBack :size="14" />
        </button>
        <button class="ctrl-btn play-btn" @click="sceneStore.togglePlay()">
          <Play v-if="!sceneStore.isPlaying" :size="16" />
          <Pause v-else :size="16" />
        </button>
        <div class="speed-group">
          <button
            v-for="s in [0.5, 1, 2, 4]"
            :key="s"
            class="speed-btn"
            :class="{ active: sceneStore.playSpeed === s }"
            @click="sceneStore.setSpeed(s)"
          >
            {{ s }}x
          </button>
        </div>
      </div>

      <div class="timeline-wrapper">
        <div class="timeline-container">
          <div class="alarm-markers">
            <div
              v-for="(marker, idx) in alarmMarkers"
              :key="idx"
              class="alarm-marker"
              :class="marker.level"
              :style="{ left: `${marker.position}%` }"
              :title="`${marker.count}条告警`"
            />
          </div>
          <input
            type="range"
            min="0"
            :max="maxProgress"
            :value="sceneStore.playProgress"
            class="timeline-slider"
            @input="sceneStore.setProgress(Number(($event.target as HTMLInputElement).value))"
          />
        </div>
        <div class="timeline-labels">
          <span v-for="(ts, idx) in timeLabels" :key="idx" class="time-label">
            {{ formatTime(ts) }}
          </span>
        </div>
      </div>

      <div class="controls-right">
        <span class="progress-text">
          {{ Math.round(sceneStore.playProgress) }}%
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-playback {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(10, 22, 40, 0.92);
  border: 1px solid rgba(30, 144, 255, 0.2);
  border-radius: 10px;
  backdrop-filter: blur(10px);
}

.playback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  color: #00e5ff;
}

.header-title {
  font-size: 13px;
  font-weight: 600;
  color: #e6f7ff;
}

.current-time {
  font-size: 12px;
  color: #8cb8d8;
  font-variant-numeric: tabular-nums;
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border: 1px solid rgba(0, 229, 255, 0.4);
  border-radius: 6px;
  background: rgba(0, 229, 255, 0.1);
  color: #00e5ff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn:hover {
  background: rgba(0, 229, 255, 0.2);
}

.mode-btn.exit {
  border-color: rgba(255, 77, 79, 0.4);
  background: rgba(255, 77, 79, 0.1);
  color: #ff7875;
}

.mode-btn.exit:hover {
  background: rgba(255, 77, 79, 0.2);
}

.metrics-bar {
  display: flex;
  gap: 20px;
  padding: 6px 0;
  border-top: 1px solid rgba(30, 144, 255, 0.1);
  border-bottom: 1px solid rgba(30, 144, 255, 0.1);
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.metric-icon {
  opacity: 0.8;
}

.metric-icon.water { color: #1890ff; }
.metric-icon.flow { color: #52c41a; }
.metric-icon.pressure { color: #faad14; }
.metric-icon.energy { color: #eb2f96; }

.metric-label {
  font-size: 11px;
  color: #6a8caa;
}

.metric-value {
  font-size: 15px;
  font-weight: 600;
  color: #00e5ff;
  font-variant-numeric: tabular-nums;
}

.metric-value small {
  font-size: 10px;
  color: #6a8caa;
  font-weight: 400;
  margin-left: 2px;
}

.metric-item.alarm {
  margin-left: auto;
}

.alarm-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: #ff4d4f;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  border-radius: 10px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.playback-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.controls-left {
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
  margin-left: 4px;
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

.timeline-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.timeline-container {
  position: relative;
  height: 8px;
  display: flex;
  align-items: center;
}

.alarm-markers {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  pointer-events: none;
}

.alarm-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ff4d4f;
}

.alarm-marker.critical { background: #ff4d4f; }
.alarm-marker.major { background: #faad14; }
.alarm-marker.minor { background: #1890ff; }
.alarm-marker.info { background: #8c8c8c; }

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
  z-index: 2;
  position: relative;
}

.timeline-labels {
  display: flex;
  justify-content: space-between;
}

.time-label {
  font-size: 10px;
  color: #6a8caa;
  font-variant-numeric: tabular-nums;
}

.controls-right {
  min-width: 45px;
  text-align: right;
}

.progress-text {
  font-size: 11px;
  color: #8cb8d8;
  font-variant-numeric: tabular-nums;
}
</style>
