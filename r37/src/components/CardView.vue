
<template>
  <div
    class="card"
    :class="[`card-${def.type}`, { playable, selected, disabled: !canPlay, dragging, hidden }]"
    :draggable="canPlay && draggable"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @click="onClick"
  >
    <div class="card-cost">
      <span>{{ def.cost }}</span>
    </div>
    <div class="card-header">
      <span class="card-icon">{{ def.icon ?? typeIcon }}</span>
      <span class="card-name">{{ def.name }}</span>
    </div>
    <div class="card-art">
      <div class="art-glow"></div>
      <span class="art-type">{{ typeLabel }}</span>
    </div>
    <div class="card-desc">{{ def.description }}</div>
    <div v-if="def.flavor" class="card-flavor">{{ def.flavor }}</div>
    <div class="card-footer">
      <span class="card-type">{{ typeLabel }}</span>
      <span v-if="def.rarity" class="card-rarity">{{ rarityLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CardDef, CardInstance } from '@/types/game'

const props = withDefaults(
  defineProps<{
    def: CardDef
    instance: CardInstance
    canPlay?: boolean
    selected?: boolean
    draggable?: boolean
    hidden?: boolean
  }>(),
  {
    canPlay: true,
    selected: false,
    draggable: true,
    hidden: false
  }
)

const emit = defineEmits<{
  (e: 'play', uid: string): void
  (e: 'dragstart', uid: string, ev: DragEvent): void
  (e: 'dragend', uid: string): void
}>()

const typeIcon = computed(() => {
  switch (props.def.type) {
    case 'attack':
      return '⚔'
    case 'defense':
      return '🛡'
    case 'heal':
      return '✚'
    case 'buff':
      return '✦'
    case 'debuff':
      return '☠'
  }
})
const typeLabel = computed(() => {
  switch (props.def.type) {
    case 'attack':
      return '攻击'
    case 'defense':
      return '防御'
    case 'heal':
      return '治疗'
    case 'buff':
      return '增益'
    case 'debuff':
      return '控制'
  }
})
const rarityLabel = computed(() => {
  switch (props.def.rarity) {
    case 'common':
      return '普通'
    case 'rare':
      return '稀有'
    case 'epic':
      return '史诗'
    default:
      return ''
  }
})

const playable = computed(() => props.canPlay && !props.hidden)

let dragging = false
function onDragStart(e: DragEvent) {
  if (!props.canPlay || props.hidden) {
    e.preventDefault()
    return
  }
  dragging = true
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', props.instance.uid)
  }
  emit('dragstart', props.instance.uid, e)
}
function onDragEnd() {
  dragging = false
  emit('dragend', props.instance.uid)
}
function onClick() {
  if (!playable.value) return
  emit('play', props.instance.uid)
}
</script>

<style scoped>
.card {
  position: relative;
  width: 150px;
  height: clamp(170px, 25vh, 220px);
  min-height: 170px;
  max-height: 220px;
  border-radius: 12px;
  border: 1px solid var(--card-edge);
  background: linear-gradient(160deg, #2a2f5c 0%, #161a36 100%);
  padding: 10px 10px 8px;
  box-shadow: var(--shadow);
  color: var(--text);
  cursor: grab;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease,
    opacity 0.25s ease;
  overflow: hidden;
  flex: 0 0 auto;
}
.card.hidden {
  background: linear-gradient(160deg, #1c1f40 0%, #0e1028 100%);
  color: transparent;
  cursor: default;
}
.card.hidden .card-cost,
.card.hidden .card-desc,
.card.hidden .card-flavor,
.card.hidden .card-footer {
  visibility: hidden;
}
.card.hidden::before {
  content: '✶';
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 64px;
  color: #3b4278;
  text-shadow: 0 0 20px rgba(122, 167, 255, 0.4);
}
.card:hover:not(.disabled):not(.hidden) {
  transform: translateY(-14px) scale(1.04);
  box-shadow: 0 20px 38px rgba(111, 243, 198, 0.28);
  border-color: var(--accent);
}
.card.selected {
  transform: translateY(-16px) scale(1.06);
  box-shadow: 0 22px 44px rgba(255, 209, 102, 0.35);
  border-color: var(--gold);
}
.card.disabled {
  opacity: 0.55;
  filter: grayscale(0.5);
  cursor: not-allowed;
}
.card.dragging {
  opacity: 0.7;
  transform: scale(0.95);
}
.card-attack {
  background: linear-gradient(160deg, #4a1f26 0%, #1a0d18 100%);
  border-color: #7c3a47;
}
.card-defense {
  background: linear-gradient(160deg, #1f2f4a 0%, #0d1728 100%);
  border-color: #4b6aa6;
}
.card-heal {
  background: linear-gradient(160deg, #2a4a34 0%, #0f2018 100%);
  border-color: #5aa073;
}
.card-buff {
  background: linear-gradient(160deg, #3f2f55 0%, #1a1430 100%);
  border-color: #9b6cd1;
}
.card-debuff {
  background: linear-gradient(160deg, #3a2c4a 0%, #18102a 100%);
  border-color: #8a5bb3;
}
.card-cost {
  position: absolute;
  top: -8px;
  left: -8px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #7aa7ff, #3154a7);
  display: grid;
  place-items: center;
  font-weight: 700;
  color: #fff;
  box-shadow: 0 4px 12px rgba(122, 167, 255, 0.5);
  border: 2px solid #101328;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding-left: 6px;
}
.card-icon {
  font-size: 16px;
}
.card-name {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.card-art {
  position: relative;
  margin-top: 6px;
  height: 68px;
  border-radius: 8px;
  background: radial-gradient(circle at 50% 40%, rgba(255, 255, 255, 0.08), transparent 60%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(0, 0, 0, 0.4));
  display: grid;
  place-items: center;
  overflow: hidden;
}
.art-glow {
  position: absolute;
  width: 120%;
  height: 120%;
  top: -10%;
  left: -10%;
  background: radial-gradient(circle at 50% 40%, rgba(111, 243, 198, 0.25), transparent 60%);
  animation: pulse 3s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}
.art-type {
  position: relative;
  font-size: 28px;
  opacity: 0.35;
  letter-spacing: 2px;
}
.card-desc {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.4;
  color: #d8def5;
  min-height: 34px;
}
.card-flavor {
  margin-top: 4px;
  font-size: 10px;
  color: var(--muted);
  font-style: italic;
}
.card-footer {
  position: absolute;
  bottom: 6px;
  left: 10px;
  right: 10px;
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--muted);
}
.card-rarity {
  color: var(--gold);
}
</style>
