import type { Good } from '../types'

export const GOODS: Good[] = [
  {
    id: 'silk',
    name: '丝绸',
    basePrice: 120,
    weight: 1,
    shelfLife: 30,
    profitRate: 0.4,
    riskLevel: 0.2,
  },
  {
    id: 'spice',
    name: '香料',
    basePrice: 80,
    weight: 2,
    shelfLife: 20,
    profitRate: 0.35,
    riskLevel: 0.3,
  },
  {
    id: 'porcelain',
    name: '瓷器',
    basePrice: 150,
    weight: 3,
    shelfLife: 999,
    profitRate: 0.5,
    riskLevel: 0.4,
  },
  {
    id: 'gem',
    name: '宝石',
    basePrice: 200,
    weight: 0.5,
    shelfLife: 999,
    profitRate: 0.45,
    riskLevel: 0.5,
  },
  {
    id: 'horse',
    name: '马匹',
    basePrice: 100,
    weight: 5,
    shelfLife: 15,
    profitRate: 0.3,
    riskLevel: 0.35,
  },
  {
    id: 'leather',
    name: '皮革',
    basePrice: 40,
    weight: 3,
    shelfLife: 25,
    profitRate: 0.25,
    riskLevel: 0.15,
  },
  {
    id: 'gold',
    name: '黄金',
    basePrice: 300,
    weight: 0.3,
    shelfLife: 999,
    profitRate: 0.55,
    riskLevel: 0.6,
  },
  {
    id: 'wine',
    name: '葡萄酒',
    basePrice: 60,
    weight: 2,
    shelfLife: 18,
    profitRate: 0.3,
    riskLevel: 0.2,
  },
]

export function getGoodById(id: string): Good | undefined {
  return GOODS.find((g) => g.id === id)
}
