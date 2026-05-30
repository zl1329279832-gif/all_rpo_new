import type { GameState } from '../types';

const SAVE_KEY_PREFIX = 'caravan_trade_save_';
const SAVE_VERSION = 1;

interface SaveData {
  version: number;
  state: GameState;
}

export function saveGame(slot: number, state: GameState): void {
  const data: SaveData = { version: SAVE_VERSION, state };
  localStorage.setItem(SAVE_KEY_PREFIX + slot, JSON.stringify(data));
}

export function loadGame(slot: number): GameState | null {
  const raw = localStorage.getItem(SAVE_KEY_PREFIX + slot);
  if (!raw) return null;

  try {
    const data: SaveData = JSON.parse(raw);
    if (data.version !== SAVE_VERSION) return null;
    return data.state;
  } catch {
    return null;
  }
}

export function deleteSave(slot: number): void {
  localStorage.removeItem(SAVE_KEY_PREFIX + slot);
}

export function hasSave(slot: number): boolean {
  return localStorage.getItem(SAVE_KEY_PREFIX + slot) !== null;
}

export function getSaveSlots(): { slot: number; exists: boolean; day: number; gold: number }[] {
  const slots = [1, 2, 3];
  return slots.map((slot) => {
    const state = loadGame(slot);
    return {
      slot,
      exists: state !== null,
      day: state?.caravan.day ?? 0,
      gold: state?.caravan.gold ?? 0,
    };
  });
}
