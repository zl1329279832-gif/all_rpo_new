import { computed } from 'vue'
import { useBattleStore } from '@/stores/battle'

export function useBattle() {
  const store = useBattleStore()
  const turnNumber = computed(() => Math.ceil((store.snap?.turn ?? 0) / 2) || 1)
  return { store, turnNumber }
}
