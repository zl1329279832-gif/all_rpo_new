import type { SaveData } from '@/types/game'

const SAVE_KEY = 'roguelike_save_data'

export class SaveManager {
  save(data: SaveData): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data))
    } catch (e) {
      console.error('Failed to save game:', e)
    }
  }

  load(): SaveData | null {
    try {
      const data = localStorage.getItem(SAVE_KEY)
      if (data) {
        return JSON.parse(data) as SaveData
      }
    } catch (e) {
      console.error('Failed to load save:', e)
    }
    return null
  }

  hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null
  }

  deleteSave(): void {
    localStorage.removeItem(SAVE_KEY)
  }

  exportSave(): string | null {
    const data = localStorage.getItem(SAVE_KEY)
    return data
  }

  importSave(data: string): boolean {
    try {
      JSON.parse(data)
      localStorage.setItem(SAVE_KEY, data)
      return true
    } catch {
      return false
    }
  }
}

export const saveManager = new SaveManager()
