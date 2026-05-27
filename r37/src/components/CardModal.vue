
<template>
  <div class="card-modal-backdrop" @click.self="$emit('close')">
    <div class="card-modal">
      <div class="card-modal-header">
        <span class="card-modal-title">手牌（{{ cards.length }} 张）</span>
        <div class="card-modal-meta">
          <span class="tag">能量 ⚡ {{ energy }}</span>
          <span v-if="stun" class="tag" style="color: var(--danger)">眩晕中</span>
        </div>
        <button class="btn" @click="$emit('close')">关闭</button>
      </div>
      <div class="card-modal-body">
        <CardView
          v-for="card in cards"
          :key="card.uid"
          :def="getDef(card.defId)"
          :instance="card"
          :can-play="canPlay(card.uid)"
          :selected="false"
          :hidden="false"
          :draggable="false"
          @play="(uid: string) => onPlay(uid)"
        />
      </div>
      <div class="card-modal-footer">
        <span class="hint">点击卡牌使用，仅当前回合可操作</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CardView from './CardView.vue'
import type { CardInstance, PlayerId } from '@/types/game'
import { getCardDef as getDef } from '@/data/cards'

defineProps<{
  cards: CardInstance[]
  energy: number
  stun: boolean
  playerId: PlayerId
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'play', uid: string): void
}>()

function canPlay(uid: string): boolean {
  // canPlay logic handled by store/controller; here we allow click; controller will check
  return true
}

function onPlay(uid: string) {
  emit('play', uid)
}
</script>

<style scoped>
.card-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(5, 7, 18, 0.75);
  backdrop-filter: blur(8px);
  display: grid;
  place-items: center;
  z-index: 60;
  padding: 20px;
}
.card-modal {
  width: min(900px, 100%);
  max-height: 85vh;
  background: linear-gradient(160deg, #1d2042 0%, #0e1128 100%);
  border: 1px solid var(--card-edge);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.card-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 18px;
  border-bottom: 1px solid var(--card-edge);
  background: rgba(255, 255, 255, 0.03);
}
.card-modal-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}
.card-modal-meta {
  display: flex;
  gap: 8px;
}
.card-modal-body {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 16px 18px;
  overflow-y: auto;
  justify-content: center;
  align-content: flex-start;
}
.card-modal-footer {
  padding: 10px 18px;
  border-top: 1px solid var(--card-edge);
  text-align: center;
  font-size: 12px;
  color: var(--muted);
}
.hint {
  opacity: 0.7;
}
</style>
