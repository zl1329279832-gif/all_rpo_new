import type { GameState } from '../types';

const STORAGE_PREFIX = 'space_mining_save_';

export class StorageService {
  static save(levelId: string, state: GameState): void {
    try {
      const key = STORAGE_PREFIX + levelId;
      const data = JSON.stringify(state);
      localStorage.setItem(key, data);
    } catch (e) {
      console.error('Failed to save game state:', e);
    }
  }

  static load(levelId: string): GameState | null {
    try {
      const key = STORAGE_PREFIX + levelId;
      const data = localStorage.getItem(key);
      if (!data) return null;
      return JSON.parse(data) as GameState;
    } catch (e) {
      console.error('Failed to load game state:', e);
      return null;
    }
  }

  static deleteSave(levelId: string): void {
    try {
      const key = STORAGE_PREFIX + levelId;
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Failed to delete save:', e);
    }
  }

  static hasSave(levelId: string): boolean {
    try {
      const key = STORAGE_PREFIX + levelId;
      return localStorage.getItem(key) !== null;
    } catch (e) {
      return false;
    }
  }

  static getSaveTime(levelId: string): number | null {
    try {
      const key = STORAGE_PREFIX + levelId;
      const data = localStorage.getItem(key);
      if (!data) return null;
      const state = JSON.parse(data);
      return state.lastSaveTime || null;
    } catch (e) {
      return null;
    }
  }
}
