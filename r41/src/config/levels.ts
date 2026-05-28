import type { LevelConfig } from '@/types'

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: '新手港口',
    difficulty: 'easy',
    duration: 300,
    targetOrders: 8,
    targetRevenue: 5000,
    initialMoney: 10000,
    initialTrucks: 3,
    initialCranes: 2,
    orderFrequency: 25,
    eventChance: 0.05
  },
  {
    id: 2,
    name: '繁忙码头',
    difficulty: 'medium',
    duration: 480,
    targetOrders: 15,
    targetRevenue: 12000,
    initialMoney: 15000,
    initialTrucks: 4,
    initialCranes: 3,
    orderFrequency: 18,
    eventChance: 0.1
  },
  {
    id: 3,
    name: '国际枢纽',
    difficulty: 'hard',
    duration: 600,
    targetOrders: 25,
    targetRevenue: 25000,
    initialMoney: 20000,
    initialTrucks: 5,
    initialCranes: 4,
    orderFrequency: 12,
    eventChance: 0.15
  }
]

export const getLevelById = (id: number): LevelConfig | undefined => {
  return LEVELS.find(l => l.id === id)
}
