import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { BattleController } from '@/game/controller'
import type { BattleConfig, BattleResult, PlayerId } from '@/types/game'
import { getCardDef } from '@/data/cards'
import { appendRecord } from '@/game/records'

export const useBattleStore = defineStore('battle', () => {
  const controller = ref<BattleController | null>(null)
  const snap = ref<ReturnType<BattleController['snapshot']> | null>(null)
  const aiThinking = ref(false)

  function refresh() {
    if (controller.value) {
      snap.value = controller.value.snapshot()
    }
  }

  function start(config: BattleConfig) {
    const ctrl = new BattleController(config)
    controller.value = ctrl
    ctrl.setup()
    refresh()
    if (ctrl.state.activePlayer === 1 && ctrl.enemy.isAI) {
      runAITurn()
    }
  }

  function playCard(uid: string, target?: PlayerId) {
    if (!controller.value) return
    controller.value.playCard(uid, target)
    refresh()
    if (controller.value?.state.result) {
      saveResult()
    }
  }

  function endTurn() {
    if (!controller.value) return
    controller.value.endTurn()
    refresh()
    if (controller.value?.enemy.isAI && controller.value.state.activePlayer === 1) {
      runAITurn()
    }
  }

  async function runAITurn() {
    if (!controller.value) return
    aiThinking.value = true
    const steps = controller.value.aiTurn()
    refresh()
    // 如果 AI 出牌后游戏直接结束，立即保存
    if (controller.value.state.result) {
      saveResult()
      aiThinking.value = false
      return
    }
    if (steps.length > 0) {
      let i = 0
      const tick = () => {
        if (!controller.value) return
        if (i >= steps.length) {
          controller.value.endTurn()
          refresh()
          aiThinking.value = false
          if (controller.value.state.result) saveResult()
          return
        }
        i++
        refresh()
        setTimeout(tick, 450)
      }
      setTimeout(tick, 400)
    } else {
      controller.value.endTurn()
      refresh()
      aiThinking.value = false
      if (controller.value.state.result) saveResult()
    }
  }

  function saveResult() {
    if (!controller.value?.state.result) return
    appendRecord(controller.value.state.result)
  }

  function reset() {
    controller.value = null
    snap.value = null
    aiThinking.value = false
  }

  const phase = computed(() => snap.value?.phase)
  const activePlayer = computed(() => snap.value?.activePlayer)
  const logs = computed(() => snap.value?.log ?? [])
  const result = computed(() => snap.value?.result)
  const player = computed(() => snap.value?.player)
  const enemy = computed(() => snap.value?.enemy)

  return {
    controller,
    snap,
    aiThinking,
    phase,
    activePlayer,
    logs,
    result,
    player,
    enemy,
    start,
    playCard,
    endTurn,
    runAITurn,
    saveResult,
    reset,
    refresh
  }
})

export { getCardDef }
