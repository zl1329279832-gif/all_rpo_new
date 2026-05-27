
<template>
  <div class="battle-view" v-if="store.snap">
    <canvas ref="bgCanvas" class="bg-canvas"></canvas>

    <div class="top-bar">
      <router-link class="btn" to="/">← 返回</router-link>
      <div class="turn-info">
        第 {{ turnNumber }} 回合 · {{ activeName }} 的回合
        <span v-if="store.aiThinking" class="tag">AI 思考中…</span>
      </div>
      <button class="btn" :disabled="!canEnd" @click="onEndTurn">结束回合</button>
    </div>

    <div class="arena">
      <!-- Enemy Panel (top) -->
      <div class="panel-wrapper enemy-panel-wrapper">
        <PlayerPanel
          :player="store.enemy!"
          :active="store.activePlayer === 1"
          :targetable="pendingEnemyTarget"
          @drop-card="onDropOnEnemy"
        />
      </div>

      <!-- Enemy Hand -->
      <div class="hand-wrapper enemy-hand-wrapper">
        <div class="hand-container">
          <HandArea
            v-if="!store.enemy!.isAI"
            :cards="store.enemy!.hand"
            :energy="store.enemy!.energy"
            :hidden="store.activePlayer !== 1"
            :stun="enemyStunned"
            :max-visible="5"
            @play="onPlayEnemy"
            @show-all="() => openCardModal(1)"
          />
          <div v-else class="enemy-hand-fan">
            <div
              v-for="c in store.enemy!.hand.slice(0, 8)"
              :key="c.uid"
              class="hidden-card"
            ></div>
            <button
              v-if="store.enemy!.hand.length > 8"
              class="more-btn"
              @click="openCardModal(1)"
            >
              +{{ store.enemy!.hand.length - 8 }}
            </button>
          </div>
        </div>
      </div>

      <div class="vs">VS</div>

      <!-- Player Hand -->
      <div class="hand-wrapper player-hand-wrapper">
        <div class="hand-container">
          <HandArea
            :cards="store.player!.hand"
            :energy="store.player!.energy"
            :selected-uid="selectedUid"
            :stun="playerStunned"
            :hidden="false"
            :max-visible="5"
            @play="onPlayCard"
            @show-all="() => openCardModal(0)"
          />
        </div>
      </div>

      <!-- Player Panel (bottom) -->
      <div class="panel-wrapper player-panel-wrapper">
        <PlayerPanel
          :player="store.player!"
          :active="store.activePlayer === 0"
          :targetable="false"
          @drop-card="onDropOnSelf"
        />
      </div>
    </div>

    <aside class="sidebar">
      <BattleLog :entries="store.logs" />
    </aside>

    <ResultModal
      v-if="store.result"
      :result="store.result"
      @rematch="onRematch"
      @records="goRecords"
      @home="goHome"
    />

    <CardModal
      v-if="cardModalOpen"
      :cards="cardModalCards"
      :energy="cardModalEnergy"
      :stun="cardModalStun"
      :player-id="cardModalPlayerId"
      @close="cardModalOpen = false"
      @play="onCardFromModal"
    />
  </div>
  <div v-else class="empty">
    <div>未开始战斗，<router-link to="/">返回首页</router-link>开始新一局。</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import PlayerPanel from '@/components/PlayerPanel.vue'
import HandArea from '@/components/HandArea.vue'
import BattleLog from '@/components/BattleLog.vue'
import ResultModal from '@/components/ResultModal.vue'
import CardModal from '@/components/CardModal.vue'
import { useBattleStore, getCardDef } from '@/stores/battle'
import { sfx } from '@/composables/sfx'
import type { PlayerId } from '@/types/game'

const router = useRouter()
const store = useBattleStore()

const turnNumber = computed(() => Math.ceil((store.snap?.turn ?? 0) / 2) || 1)
const activeName = computed(() => {
  if (store.activePlayer === 0) return store.player?.name
  return store.enemy?.name
})
const canEnd = computed(() => !store.aiThinking && (store.activePlayer === 0 || !store.enemy?.isAI))
const playerStunned = computed(
  () => !!store.player?.statuses.find((s) => s.kind === 'stun')
)
const enemyStunned = computed(
  () => !!store.enemy?.statuses.find((s) => s.kind === 'stun')
)

const selectedUid = ref<string | null>(null)
const pendingEnemyTarget = ref(false)

// Card modal state
const cardModalOpen = ref(false)
const cardModalPlayerId = ref<PlayerId>(0)
const cardModalCards = computed(() => {
  const player = cardModalPlayerId.value === 0 ? store.player : store.enemy
  return player?.hand ?? []
})
const cardModalEnergy = computed(() => {
  const player = cardModalPlayerId.value === 0 ? store.player : store.enemy
  return player?.energy ?? 0
})
const cardModalStun = computed(() => {
  const player = cardModalPlayerId.value === 0 ? store.player : store.enemy
  return !!player?.statuses.find((s) => s.kind === 'stun')
})

function openCardModal(pid: PlayerId) {
  cardModalPlayerId.value = pid
  cardModalOpen.value = true
}
function onCardFromModal(uid: string) {
  const pid = cardModalPlayerId.value
  cardModalOpen.value = false
  if (pid === 0) onPlayCard(uid)
  else onPlayEnemy(uid)
}

// target tracking
watch(selectedUid, (uid) => {
  if (!uid) {
    pendingEnemyTarget.value = false
    return
  }
  const inst = store.player?.hand.find((c) => c.uid === uid)
  if (!inst) {
    pendingEnemyTarget.value = false
    return
  }
  const def = getCardDef(inst.defId)
  pendingEnemyTarget.value = def.target === 'enemy' || def.target === 'any'
})

function onPlayCard(uid: string) {
  if (store.activePlayer !== 0) return
  const inst = store.player?.hand.find((c) => c.uid === uid)
  if (!inst) return
  const def = getCardDef(inst.defId)
  if (def.target === 'self' || def.effects.every((e) => (e.target ?? def.target) === 'self')) {
    doPlay(uid, 0)
  } else if (def.target === 'enemy') {
    doPlay(uid, 1)
  } else {
    // 点击即默认对敌方使用
    doPlay(uid, 1)
  }
}

function onPlayEnemy(uid: string) {
  if (store.activePlayer !== 1 || store.enemy?.isAI) return
  const inst = store.enemy?.hand.find((c) => c.uid === uid)
  if (!inst) return
  const def = getCardDef(inst.defId)
  if (def.target === 'self' || def.effects.every((e) => (e.target ?? def.target) === 'self')) {
    doPlay(uid, 1)
  } else {
    doPlay(uid, 0)
  }
}

function onDropOnEnemy(uid: string) {
  // 对敌方的拖放：当前出牌者是谁，对"对手"目标使用
  const actor = store.activePlayer
  const enemyId: PlayerId = actor === 0 ? 1 : 0
  doPlay(uid, enemyId)
}
function onDropOnSelf(uid: string) {
  // 拖放到自己面板：对自身使用
  const actor = store.activePlayer
  doPlay(uid, actor as PlayerId)
}

function doPlay(uid: string, target: PlayerId) {
  const actor = store.activePlayer
  if (actor !== 0 && actor !== 1) return
  const ctrl = store.controller
  if (!ctrl) return
  if (ctrl.state.phase !== 'player-turn') return
  if (ctrl.state.activePlayer !== actor) return
  const selfHand = actor === 0 ? ctrl.player.hand : ctrl.enemy.hand
  const info = selfHand.find((c) => c.uid === uid)
  if (!info) return
  const def = getCardDef(info.defId)
  // 目标必须与实际出牌者一致
  const realTarget = target === actor ? actor : (actor === 0 ? 1 : 0)
  sfx.playCard()
  if (def.type === 'attack') sfx.attack()
  else if (def.type === 'heal') sfx.heal()
  else if (def.type === 'defense') sfx.shield()
  else sfx.status()
  ctrl.playCard(uid, realTarget as PlayerId)
  store.refresh()
  if (ctrl.state.result) store.saveResult()
  selectedUid.value = null
  pendingEnemyTarget.value = false
}

function onEndTurn() {
  if (store.aiThinking) return
  const ctrl = store.controller
  if (!ctrl) return
  if (ctrl.state.phase !== 'player-turn') return
  sfx.turn()
  store.endTurn()
  // endTurn 内部会自动触发 AI 行动（如需要）
}

function onRematch() {
  store.reset()
  router.push({ name: 'Home' })
}
function goRecords() {
  router.push({ name: 'Records' })
}
function goHome() {
  router.push({ name: 'Home' })
}

// result sfx
watch(
  () => store.result,
  (r) => {
    if (!r) return
    if (r.winner === 0) sfx.victory()
    else if (r.winner === 1) sfx.defeat()
  }
)

// ===== background canvas animation =====
const bgCanvas = ref<HTMLCanvasElement | null>(null)
let rafId = 0
let stopped = false
const particles: { x: number; y: number; vx: number; vy: number; r: number; hue: number }[] = []

function resize() {
  const c = bgCanvas.value
  if (!c) return
  c.width = c.clientWidth * window.devicePixelRatio
  c.height = c.clientHeight * window.devicePixelRatio
}

function spawnParticles() {
  const c = bgCanvas.value
  if (!c) return
  const count = 60
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * c.width,
      y: Math.random() * c.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 0.5,
      hue: 180 + Math.random() * 80
    })
  }
}

function draw() {
  const c = bgCanvas.value
  if (!c || stopped) return
  const ctx = c.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, c.width, c.height)
  for (const p of particles) {
    p.x += p.vx
    p.y += p.vy
    if (p.x < 0) p.x = c.width
    if (p.x > c.width) p.x = 0
    if (p.y < 0) p.y = c.height
    if (p.y > c.height) p.y = 0
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r * window.devicePixelRatio, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${p.hue}, 70%, 70%, 0.35)`
    ctx.fill()
  }
  rafId = requestAnimationFrame(draw)
}

onMounted(() => {
  resize()
  spawnParticles()
  draw()
  window.addEventListener('resize', resize)
})
onBeforeUnmount(() => {
  stopped = true
  cancelAnimationFrame(rafId)
  window.removeEventListener('resize', resize)
})
</script>

<style scoped>
.battle-view {
  position: relative;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 320px;
  grid-template-rows: 54px 1fr;
  grid-template-areas:
    'top top'
    'arena side';
  background:
    radial-gradient(circle at 20% 20%, rgba(111, 243, 198, 0.08), transparent 40%),
    radial-gradient(circle at 80% 80%, rgba(122, 167, 255, 0.08), transparent 40%),
    linear-gradient(180deg, #0a0b14 0%, #0c0f22 100%);
}
.bg-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}
.top-bar {
  grid-area: top;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 18px;
  background: rgba(10, 11, 20, 0.65);
  border-bottom: 1px solid var(--card-edge);
  z-index: 2;
  height: 54px;
  min-height: 54px;
  max-height: 54px;
  overflow: hidden;
}
.turn-info {
  font-size: 14px;
  color: var(--text);
  letter-spacing: 1px;
}
.arena {
  grid-area: arena;
  position: relative;
  padding: 10px 18px 18px;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 92px 1fr 28px 1fr 92px;
  grid-template-areas:
    'enemy-panel'
    'enemy-hand'
    'vs'
    'player-hand'
    'player-panel';
  gap: 2px;
  z-index: 2;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}
.panel-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}
.enemy-panel-wrapper {
  grid-area: enemy-panel;
  align-items: flex-start;
}
.player-panel-wrapper {
  grid-area: player-panel;
  align-items: flex-end;
}
.hand-wrapper {
  width: 100%;
  height: 100%;
  min-height: 0;
  max-height: 100%;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.enemy-hand-wrapper {
  grid-area: enemy-hand;
  align-items: flex-end;
}
.player-hand-wrapper {
  grid-area: player-hand;
  align-items: flex-end;
}
.vs {
  grid-area: vs;
  text-align: center;
  font-size: 22px;
  color: var(--gold);
  letter-spacing: 4px;
  opacity: 0.7;
  line-height: 28px;
  padding: 0;
  pointer-events: none;
  z-index: 3;
  margin: 0;
}
.hand-container {
  width: 100%;
  height: 100%;
  min-height: 0;
  max-height: 100%;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.enemy-hand-fan {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 0;
  height: 100%;
  max-height: 100%;
  padding-bottom: 10px;
  overflow: hidden;
  min-height: 0;
}
.hidden-card {
  width: 36px;
  height: 52px;
  border-radius: 5px;
  border: 1px solid var(--card-edge);
  background: linear-gradient(160deg, #1c1f40 0%, #0e1028 100%);
  margin: 0 -12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.35);
  position: relative;
  flex-shrink: 0;
}
.hidden-card::after {
  content: '✶';
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #3b4278;
  font-size: 16px;
}
.more-btn {
  appearance: none;
  border: 1px solid var(--accent);
  background: rgba(111, 243, 198, 0.15);
  color: var(--accent);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  cursor: pointer;
  margin-left: 6px;
  align-self: flex-end;
  margin-bottom: 10px;
  flex-shrink: 0;
}
.more-btn:hover {
  background: rgba(111, 243, 198, 0.3);
}
.sidebar {
  grid-area: side;
  padding: 14px 14px 14px 0;
  z-index: 2;
  min-width: 0;
}
.empty {
  height: 100vh;
  display: grid;
  place-items: center;
  color: var(--muted);
}
</style>
