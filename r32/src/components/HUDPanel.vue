<template>
  <div class="hud">
    <div class="player-stats">
      <div class="stat-row">
        <span class="stat-label">等级</span>
        <span class="stat-value">{{ player.level.level }}</span>
      </div>
      <div class="hp-bar">
        <div class="bar-label">HP</div>
        <div class="bar-container">
          <div class="bar-fill hp-fill" :style="{ width: hpPercent + '%' }"></div>
          <span class="bar-text">{{ player.stats.hp }}/{{ player.stats.maxHp }}</span>
        </div>
      </div>
      <div class="exp-bar">
        <div class="bar-label">EXP</div>
        <div class="bar-container">
          <div class="bar-fill exp-fill" :style="{ width: expPercent + '%' }"></div>
          <span class="bar-text">{{ player.level.exp }}/{{ player.level.expToNext }}</span>
        </div>
      </div>
    </div>
    <div class="player-info">
      <div class="info-item">
        <span class="info-icon">⚔️</span>
        <span>{{ player.stats.attack }}</span>
      </div>
      <div class="info-item">
        <span class="info-icon">🛡️</span>
        <span>{{ player.stats.defense }}</span>
      </div>
      <div class="info-item">
        <span class="info-icon">💰</span>
        <span>{{ player.gold }}</span>
      </div>
      <div class="info-item">
        <span class="info-icon">📍</span>
        <span>第 {{ level }} 层</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '@/game/entity/Player'
import { computed } from 'vue'

const props = defineProps<{
  player: Player
  level: number
}>()

const hpPercent = computed(() => (props.player.stats.hp / props.player.stats.maxHp) * 100)
const expPercent = computed(() => (props.player.level.exp / props.player.level.expToNext) * 100)
</script>

<style scoped>
.hud {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.8);
  padding: 12px 16px;
  border-radius: 8px;
  border: 2px solid #4fc3f7;
  color: white;
  font-family: Arial, sans-serif;
  min-width: 200px;
}

.player-stats {
  margin-bottom: 10px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.stat-label {
  color: #b0bec5;
}

.stat-value {
  font-weight: bold;
  color: #4fc3f7;
}

.hp-bar, .exp-bar {
  margin-bottom: 8px;
}

.bar-label {
  font-size: 11px;
  color: #b0bec5;
  margin-bottom: 2px;
}

.bar-container {
  position: relative;
  height: 16px;
  background: #424242;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.hp-fill {
  background: linear-gradient(90deg, #e53935, #ff7043);
}

.exp-fill {
  background: linear-gradient(90deg, #7e57c2, #b39ddb);
}

.bar-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.player-info {
  display: flex;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid #37474f;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.info-icon {
  font-size: 14px;
}
</style>
