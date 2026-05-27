
<template>
  <div class="hand-area" ref="handRef">
    <CardView
      v-for="card in visibleCards"
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
    <button
      v-if="hasMore"
      class="more-btn"
      @click="$emit('showAll')"
      :title="`还有 ${hiddenCount} 张卡片`"
    >
      +{{ hiddenCount }}<span class="more-label">更多</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
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
    maxVisible?: number
  }>(),
  { selectedUid: null, stun: false, hidden: false, maxVisible: 5 }
)

const emit = defineEmits<{
  (e: 'play', uid: string): void
  (e: 'dragstart', uid: string, ev: DragEvent): void
  (e: 'dragend', uid: string): void
  (e: 'showAll'): void
}>()

const handRef = ref<HTMLDivElement | null>(null)

const visibleCards = computed(() => {
  const max = Math.max(1, props.maxVisible)
  return props.cards.slice(0, max)
})
const hasMore = computed(() => props.cards.length > props.maxVisible)
const hiddenCount = computed(() => Math.max(0, props.cards.length - props.maxVisible))

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
  gap: 6px;
  padding: 8px 10px;
  height: 100%;
  min-height: 0;
  max-height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
}
.hand-area::-webkit-scrollbar {
  height: 6px;
}
.more-btn {
  appearance: none;
  border: 1px solid var(--accent);
  background: rgba(111, 243, 198, 0.12);
  color: var(--accent);
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: clamp(170px, 25vh, 220px);
  min-height: 170px;
  max-height: 220px;
  min-width: 56px;
  transition: background 0.2s ease, transform 0.2s ease;
  flex-shrink: 0;
  align-self: flex-end;
  margin-bottom: 0;
}
.more-btn:hover {
  background: rgba(111, 243, 198, 0.25);
  transform: translateY(-4px);
}
.more-label {
  font-size: 11px;
  font-weight: 400;
  opacity: 0.75;
  margin-top: 2px;
}
</style>
