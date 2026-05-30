import type { GameState } from '../types'

const SAVE_KEY_PREFIX = 'caravan_trade_save_'
const AUTOSAVE_KEY = 'caravan_trade_autosave'
const SAVE_VERSION = 1

interface SaveData {
  version: number
  state: GameState
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

export function saveGame(slot: number, state: GameState): void {
  const snapshot = deepClone(state)
  const data: SaveData = { version: SAVE_VERSION, state: snapshot }
  localStorage.setItem(SAVE_KEY_PREFIX + slot, JSON.stringify(data))
}

export function loadGame(slot: number): GameState | null {
  const raw = localStorage.getItem(SAVE_KEY_PREFIX + slot)
  if (!raw) return null

  try {
    const data: SaveData = JSON.parse(raw)
    if (data.version !== SAVE_VERSION) return null
    return data.state
  } catch {
    return null
  }
}

export function deleteSave(slot: number): void {
  localStorage.removeItem(SAVE_KEY_PREFIX + slot)
}

export function hasSave(slot: number): boolean {
  return localStorage.getItem(SAVE_KEY_PREFIX + slot) !== null
}

export function saveAutoSave(state: GameState): void {
  const snapshot = deepClone(state)
  const data: SaveData = { version: SAVE_VERSION, state: snapshot }
  localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data))
}

export function loadAutoSave(): GameState | null {
  const raw = localStorage.getItem(AUTOSAVE_KEY)
  if (!raw) return null

  try {
    const data: SaveData = JSON.parse(raw)
    if (data.version !== SAVE_VERSION) return null
    return data.state
  } catch {
    return null
  }
}

export function hasAutoSave(): boolean {
  return localStorage.getItem(AUTOSAVE_KEY) !== null
}

export function getAutoSaveInfo(): { exists: boolean; day: number; gold: number } {
  const state = loadAutoSave()
  return {
    exists: state !== null,
    day: state?.caravan.day ?? 0,
    gold: state?.caravan.gold ?? 0,
  }
}

export function getSaveSlots(): { slot: number; exists: boolean; day: number; gold: number }[] {
  const slots = [1, 2, 3]
  return slots.map((slot) => {
    const state = loadGame(slot)
    return {
      slot,
      exists: state !== null,
      day: state?.caravan.day ?? 0,
      gold: state?.caravan.gold ?? 0,
    }
  })
}

export function hasAnySave(): boolean {
  if (hasAutoSave()) return true
  return [1, 2, 3].some((slot) => hasSave(slot))
}

export function getLatestSaveSlot(): number | null {
  const autoSave = loadAutoSave()
  const manualSlots = getSaveSlots().filter((s) => s.exists)

  if (manualSlots.length === 0 && !autoSave) return null
  if (manualSlots.length === 0) return -1

  const latestManual = manualSlots.reduce((a, b) => (a.day > b.day ? a : b))
  if (autoSave && autoSave.caravan.day > latestManual.day) return -1

  return latestManual.slot
}
