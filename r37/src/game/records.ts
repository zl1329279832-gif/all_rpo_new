import type { BattleResult } from '@/types/game'

const KEY = 'r37.battle.records'

export interface StoredRecords {
  battles: BattleResult[]
  updatedAt: number
}

export function loadRecords(): StoredRecords {
  if (typeof localStorage === 'undefined') return { battles: [], updatedAt: 0 }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { battles: [], updatedAt: 0 }
    const parsed = JSON.parse(raw) as StoredRecords
    return parsed
  } catch {
    return { battles: [], updatedAt: 0 }
  }
}

export function appendRecord(result: BattleResult) {
  if (typeof localStorage === 'undefined') return
  const current = loadRecords()
  current.battles.unshift(result)
  if (current.battles.length > 100) {
    current.battles.length = 100
  }
  current.updatedAt = Date.now()
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
    // ignore
  }
}

export function clearRecords() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(KEY)
}
