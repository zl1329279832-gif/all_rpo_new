import type { City } from '../types'

export const cities: City[] = [
  {
    id: 'changan',
    name: '长安',
    description: '东方古都，丝绸与瓷器之源',
    x: 0.85,
    y: 0.35,
    specialties: ['silk', 'porcelain'],
  },
  {
    id: 'dunhuang',
    name: '敦煌',
    description: '沙漠绿洲，宝石与香料的交汇点',
    x: 0.68,
    y: 0.30,
    specialties: ['spice', 'gem'],
  },
  {
    id: 'samarkand',
    name: '撒马尔罕',
    description: '中亚明珠，马匹与皮革的贸易中心',
    x: 0.45,
    y: 0.28,
    specialties: ['horse', 'leather'],
  },
  {
    id: 'baghdad',
    name: '巴格达',
    description: '智慧之城，香料与黄金的汇聚地',
    x: 0.25,
    y: 0.45,
    specialties: ['spice', 'gold'],
  },
  {
    id: 'constantinople',
    name: '君士坦丁堡',
    description: '帝国之都，黄金与酒的最大市场',
    x: 0.10,
    y: 0.30,
    specialties: ['gold', 'wine'],
  },
  {
    id: 'kashgar',
    name: '喀什',
    description: '天山脚下的玉石之城',
    x: 0.55,
    y: 0.22,
    specialties: ['gem', 'horse'],
  },
]
