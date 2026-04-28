import type { LeaderboardEntry, GameSettings } from '@/types'

const LEADERBOARD_KEY = 'breakout_leaderboard'
const SETTINGS_KEY = 'breakout_settings'
const LAST_GAME_KEY = 'breakout_last_game'

const defaultSettings: GameSettings = {
  soundEnabled: true,
  theme: 'dark',
  defaultName: '玩家',
  highScore: 0
}

export function getSettings(): GameSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) }
    }
  } catch (e) {
    console.error('Failed to load settings:', e)
  }
  return { ...defaultSettings }
}

export function saveSettings(settings: Partial<GameSettings>): void {
  try {
    const current = getSettings()
    const updated = { ...current, ...settings }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
  } catch (e) {
    console.error('Failed to save settings:', e)
  }
}

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const stored = localStorage.getItem(LEADERBOARD_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load leaderboard:', e)
  }
  return []
}

export function saveLeaderboard(entries: LeaderboardEntry[]): void {
  try {
    const sorted = entries
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(sorted))
  } catch (e) {
    console.error('Failed to save leaderboard:', e)
  }
}

export function addLeaderboardEntry(name: string, score: number, level: number): void {
  const entry: LeaderboardEntry = {
    name,
    score,
    level,
    date: new Date().toLocaleDateString('zh-CN')
  }
  const leaderboard = getLeaderboard()
  leaderboard.push(entry)
  saveLeaderboard(leaderboard)
  
  const settings = getSettings()
  if (score > settings.highScore) {
    saveSettings({ highScore: score })
  }
}

export function getHighScore(): number {
  return getSettings().highScore
}

export function getLastGameData(): { score: number; level: number } | null {
  try {
    const stored = localStorage.getItem(LAST_GAME_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load last game:', e)
  }
  return null
}

export function saveLastGameData(score: number, level: number): void {
  try {
    localStorage.setItem(LAST_GAME_KEY, JSON.stringify({ score, level }))
  } catch (e) {
    console.error('Failed to save last game:', e)
  }
}
