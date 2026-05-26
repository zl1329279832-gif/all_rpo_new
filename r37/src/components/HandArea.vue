
<template>
  <div class="hand-area">
    <CardView
      v-for="card in cards"
      :key="card.uid"
      :def="getDef(card.defId)"
      :instance="card"
      :canPlay="canPlayMap[card.uid] ?? true"
      :selected="selectedUid === card.uid"
      :hidden="hidden"
      :draggable="!hidden"
      @play="onPlay"
      @dragstart="onDragStart"
      @dragend="onDragEnd"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CardView from './CardView.vue'
import type { CardInstance } from '@/types/game'
import { getCardDef } from '@/data/cards'

const props = withDefaults(
  defineProps<{
    cards: CardInstance[]
    energy: number
    selectedUid?: string | null
    stun?: boolean
    hidden?: boolean
  }>(),
  { selectedUid: null, stun: false, hidden: false }
)

const emit = defineEmits<{
  (e: 'play', uid: string): void
  (e: 'dragstart', uid: string, ev: DragEvent): void
  (e: 'dragend', uid: string): void
}>()

const canPlayMap = computed<Record<string, boolean>>(() => {
  const map: Record<string, boolean> = {}
  if (props.stun) return map
  for (const c of props.cards) {
    const def = getCardDef(c.defId)
    map[c.uid] = props.energy >= def.cost
  }
  return map
})

function getDef(id: string) {
  return getCardDef(id)
}
function onPlay(uid: string) {
  emit('play', uid)
}
function onDragStart(uid: string, ev: DragEvent) {
  emit('dragstart', uid, ev)
}
function onDragEnd(uid: string) {
  emit('dragend', uid)
}
</script>

<style scoped>
.hand-area {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 8px;
  padding: 12px 14px;
  min-height: 240px;
  overflow-x: auto;
}
</style>
