
<template>
  <div class="result-modal-backdrop" @click.self="onClose">
    <div class="result-modal" :class="cls">
      <div class="result-banner">{{ banner }}</div>
      <div class="result-stats">
        <div>胜者：<strong>{{ winnerText }}</strong></div>
        <div>回合数：<strong>{{ result.turnCount }}</strong></div>
        <div>玩家剩余生命：<strong>{{ result.playerHpLeft }}</strong></div>
        <div>AI 剩余生命：<strong>{{ result.enemyHpLeft }}</strong></div>
      </div>
      <div class="result-actions">
        <button class="btn primary" @click="$emit('rematch')">再来一局</button>
        <button class="btn" @click="$emit('records')">查看战绩</button>
        <button class="btn" @click="$emit('home')">返回首页</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BattleResult } from '@/types/game'

const props = defineProps<{
  result: BattleResult
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'rematch'): void
  (e: 'records'): void
  (e: 'home'): void
}>()

const cls = computed(() => (props.result.winner === 0 ? 'win' : props.result.winner === 1 ? 'lose' : 'draw'))
const banner = computed(() => {
  if (props.result.winner === 0) return '🎉 胜利！'
  if (props.result.winner === 1) return '💀 失败…'
  return '⚖ 平局'
})
const winnerText = computed(() => {
  if (props.result.winner === 'draw') return '平局'
  return props.result.winner === 0 ? '玩家' : 'AI'
})

function onClose() {
  // noop; modal is closed via actions
}
</script>

<style scoped>
.result-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(5, 7, 18, 0.7);
  backdrop-filter: blur(6px);
  display: grid;
  place-items: center;
  z-index: 50;
}
.result-modal {
  width: 360px;
  padding: 22px 24px;
  border-radius: 16px;
  background: linear-gradient(160deg, #242a5c 0%, #12152f 100%);
  border: 1px solid var(--card-edge);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  text-align: center;
}
.result-modal.win { border-color: var(--accent); box-shadow: 0 20px 60px rgba(111, 243, 198, 0.35); }
.result-modal.lose { border-color: var(--danger); box-shadow: 0 20px 60px rgba(255, 107, 107, 0.35); }
.result-banner {
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 14px;
  letter-spacing: 2px;
}
.result-modal.win .result-banner { color: var(--accent); }
.result-modal.lose .result-banner { color: var(--danger); }
.result-modal.draw .result-banner { color: var(--gold); }
.result-stats {
  font-size: 14px;
  color: var(--text);
  line-height: 1.9;
  margin-bottom: 16px;
}
.result-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}
</style>
