<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { getEventColor, getEventIcon } from '@/systems/eventSystem'

const gameStore = useGameStore()

const activeEvents = computed(() => gameStore.events)

const getEventDuration = (event: any): number => {
  const elapsed = gameStore.gameTime - event.startTime
  return Math.max(0, event.duration - elapsed)
}

const formatDuration = (seconds: number): string => {
  return `${Math.ceil(seconds)}s`
}
</script>

<template>
  <div class="event-container">
    <TransitionGroup name="event">
      <div 
        v-for="event in activeEvents" 
        :key="event.id"
        class="event-notification"
        :style="{ borderLeftColor: getEventColor(event.type) }"
      >
        <div class="event-icon">{{ getEventIcon(event.type) }}</div>
        <div class="event-content">
          <div class="event-message">{{ event.message }}</div>
          <div class="event-duration">
            剩余 {{ formatDuration(getEventDuration(event)) }}
          </div>
        </div>
        <div class="event-progress">
          <div 
            class="event-progress-fill"
            :style="{ 
              width: ((getEventDuration(event) / event.duration) * 100) + '%',
              background: getEventColor(event.type)
            }"
          ></div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.event-container {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
  width: 100%;
  padding: 0 20px;
}

.event-notification {
  background: rgba(15, 23, 42, 0.95);
  border-radius: 10px;
  padding: 12px 16px;
  border-left: 4px solid;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  overflow: hidden;
}

.event-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.event-content {
  flex: 1;
}

.event-message {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 2px;
}

.event-duration {
  font-size: 12px;
  color: #94a3b8;
}

.event-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
}

.event-progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.event-enter-active,
.event-leave-active {
  transition: all 0.3s ease;
}

.event-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.event-leave-to {
  opacity: 0;
  transform: translateX(100px);
}
</style>
