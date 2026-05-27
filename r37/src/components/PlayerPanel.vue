
<template>
  <div
    class="player-panel"
    :class="{ active, 'is-ai': player.isAI, dead: player.hp <= 0, targetable }"
    @click="onClick"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >
    <div class="avatar">
      <div class="avatar-core">{{ initial }}</div>
    </div>
    <div class="body">
      <div class="name-row">
        <span class="name">{{ player.name }}</span>
        <span v-if="player.isAI" class="tag">AI</span>
      </div>
      <div class="bar hp">
        <div class="bar-fill hp-fill" :style="{ width: `${hpPct}%` }"></div>
        <span class="bar-text">❤ {{ player.hp }} / {{ player.maxHp }}</span>
      </div>
      <div class="bar energy">
        <div class="bar-fill energy-fill" :style="{ width: `${energyPct}%` }"></div>
        <span class="bar-text">⚡ {{ player.energy }} / {{ player.maxEnergy }}</span>
      </div>
      <div class="meta">
        <span class="meta-item">🂠 牌库 {{ player.deck.length }}</span>
        <span class="meta-item">🗑 弃牌 {{ player.discard.length }}</span>
        <span class="meta-item">✋ 手牌 {{ player.hand.length }}</span>
      </div>
      <div v-if="player.statuses.length" class="statuses">
        <div
          v-for="s in player.statuses"
          :key="s.id"
          class="status-chip"
          :class="`status-${s.kind}`"
          :title="`${s.name}: ${s.description}（${s.duration} 回合）`"
        >
          <span class="status-name">{{ s.name }}</span>
          <span class="status-val">{{ s.value }}</span>
          <span class="status-dur">·{{ s.duration }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PlayerSnapshot } from '@/types/game'

const props = defineProps<{
  player: PlayerSnapshot
  active: boolean
  targetable: boolean
}>()

const emit = defineEmits<{
  (e: 'click'): void
  (e: 'drop-card', uid: string): void
}>()

const hpPct = computed(() => Math.max(0, (props.player.hp / props.player.maxHp) * 100))
const energyPct = computed(() =>
  Math.min(100, (props.player.energy / Math.max(1, props.player.maxEnergy)) * 100)
)

const initial = computed(() => props.player.name.slice(0, 1))

function onClick() {
  emit('click')
}
function onDragOver(e: DragEvent) {
  if (!props.targetable) return
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
}
function onDragLeave() {
  // placeholder
}
function onDrop(e: DragEvent) {
  if (!props.targetable) return
  const uid = e.dataTransfer?.getData('text/plain')
  if (uid) emit('drop-card', uid)
}
</script>

<style scoped>
.player-panel {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  border-radius: 14px;
  background: linear-gradient(160deg, rgba(35, 40, 78, 0.85), rgba(16, 19, 40, 0.85));
  border: 1px solid var(--card-edge);
  box-shadow: var(--shadow);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  min-width: 320px;
  min-height: 92px;
  max-height: 92px;
  overflow: hidden;
}
.player-panel.active {
  border-color: var(--accent);
  box-shadow: 0 0 24px rgba(111, 243, 198, 0.25);
}
.player-panel.targetable {
  cursor: crosshair;
  border-color: var(--danger);
  box-shadow: 0 0 24px rgba(255, 107, 107, 0.35);
}
.player-panel.targetable:hover {
  transform: translateY(-2px);
}
.player-panel.dead {
  opacity: 0.45;
  filter: grayscale(0.6);
}
.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #4a5490, #1a1e3c);
  display: grid;
  place-items: center;
  border: 2px solid var(--card-edge);
}
.avatar-core {
  font-size: 28px;
  font-weight: 800;
  color: var(--accent);
}
.player-panel.is-ai .avatar-core {
  color: var(--danger);
}
.body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.name {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.bar {
  position: relative;
  height: 16px;
  border-radius: 8px;
  background: #0f132a;
  overflow: hidden;
  border: 1px solid var(--card-edge);
}
.bar-fill {
  height: 100%;
  transition: width 0.4s ease;
}
.hp-fill {
  background: linear-gradient(90deg, #ff6b6b, #ffd166);
}
.energy-fill {
  background: linear-gradient(90deg, #7aa7ff, #6ff3c6);
}
.bar-text {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 11px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  font-weight: 600;
}
.meta {
  display: flex;
  gap: 10px;
  font-size: 11px;
  color: var(--muted);
  margin-top: 2px;
}
.meta-item {
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 999px;
}
.statuses {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  overflow-y: hidden;
  margin-top: 4px;
  max-width: 100%;
  scrollbar-width: thin;
  padding-bottom: 2px;
}
.statuses::-webkit-scrollbar {
  height: 3px;
}
.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--card-edge);
}
.status-name {
  font-weight: 600;
}
.status-val {
  color: var(--gold);
}
.status-dur {
  opacity: 0.65;
}
.status-shield {
  color: #7aa7ff;
  border-color: #4b6aa6;
}
.status-poison {
  color: #8bd17c;
  border-color: #3f7a42;
}
.status-weak {
  color: #c78bd1;
  border-color: #6b3f7a;
}
.status-vulnerable {
  color: #ff9f6b;
  border-color: #7a3f3f;
}
.status-strength {
  color: #ffd166;
  border-color: #7a5a2a;
}
.status-regen {
  color: #6ff3c6;
  border-color: #2a7a5a;
}
.status-stun {
  color: #ff6b6b;
  border-color: #7a2a2a;
  animation: blink 1s ease-in-out infinite;
}
.status-thorns {
  color: #d1b07a;
  border-color: #7a5a2a;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
