import type { LevelConfig } from '@/types'

export const CANVAS_WIDTH = 800
export const CANVAS_HEIGHT = 600

export function getLevelConfig(level: number): LevelConfig {
  const baseConfig: LevelConfig = {
    rows: 4,
    cols: 8,
    brickWidth: 75,
    brickHeight: 25,
    brickPadding: 10,
    offsetTop: 60,
    offsetLeft: 75,
    ballSpeed: 4,
    unbreakableChance: 0,
    multiHpChance: 0,
    powerUpChance: 0.15
  }

  const levelMultiplier = Math.min(level, 10)
  
  return {
    ...baseConfig,
    rows: Math.min(4 + Math.floor(level / 2), 8),
    cols: Math.min(8 + Math.floor(level / 3), 12),
    offsetLeft: Math.floor((CANVAS_WIDTH - (8 + Math.floor(level / 3)) * 85) / 2),
    ballSpeed: 4 + levelMultiplier * 0.3,
    unbreakableChance: level > 2 ? Math.min(0.05 + (level - 2) * 0.02, 0.2) : 0,
    multiHpChance: level > 1 ? Math.min(0.1 + (level - 1) * 0.03, 0.3) : 0,
    powerUpChance: Math.min(0.15 + level * 0.01, 0.25)
  }
}

export function getBrickColor(type: string, hp: number, maxHp: number): string {
  if (type === 'unbreakable') {
    return '#6c757d'
  }
  if (type === 'multihp' && maxHp > 1) {
    const hpRatio = hp / maxHp
    if (hpRatio >= 1) return '#e74c3c'
    if (hpRatio >= 0.5) return '#f39c12'
    return '#f1c40f'
  }
  
  const colors = [
    '#e74c3c',
    '#e67e22',
    '#f39c12',
    '#2ecc71',
    '#3498db',
    '#9b59b6',
    '#e91e63',
    '#00bcd4'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export function getPowerUpColor(type: string): string {
  const colors: Record<string, string> = {
    paddle_longer: '#27ae60',
    paddle_shorter: '#c0392b',
    ball_speed_up: '#8e44ad',
    extra_life: '#e74c3c',
    piercing: '#3498db',
    multi_ball: '#f39c12'
  }
  return colors[type] || '#ffffff'
}

export function getPowerUpName(type: string): string {
  const names: Record<string, string> = {
    paddle_longer: '挡板变长',
    paddle_shorter: '挡板变短',
    ball_speed_up: '小球加速',
    extra_life: '额外生命',
    piercing: '穿透球',
    multi_ball: '多球模式'
  }
  return names[type] || '未知道具'
}
