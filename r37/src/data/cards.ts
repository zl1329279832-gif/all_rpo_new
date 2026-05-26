import type { CardDef } from '@/types/game'

export const CARD_DEFS: Record<string, CardDef> = {
  strike: {
    id: 'strike',
    name: '普通攻击',
    type: 'attack',
    cost: 1,
    target: 'enemy',
    rarity: 'common',
    icon: '⚔',
    description: '造成 6 点伤害。',
    effects: [{ kind: 'damage', value: 6, target: 'enemy' }]
  },
  heavy_strike: {
    id: 'heavy_strike',
    name: '重击',
    type: 'attack',
    cost: 2,
    target: 'enemy',
    rarity: 'common',
    icon: '🔨',
    description: '造成 12 点伤害。',
    effects: [{ kind: 'damage', value: 12, target: 'enemy' }]
  },
  double_slash: {
    id: 'double_slash',
    name: '双重斩',
    type: 'attack',
    cost: 2,
    target: 'enemy',
    rarity: 'rare',
    icon: '⚔',
    description: '造成 2 次 5 点伤害。',
    effects: [{ kind: 'damage', value: 5, target: 'enemy', times: 2 }]
  },
  guard: {
    id: 'guard',
    name: '防御',
    type: 'defense',
    cost: 1,
    target: 'self',
    rarity: 'common',
    icon: '🛡',
    description: '获得 6 点护盾（持续本回合结束）。',
    effects: [
      {
        kind: 'apply_status',
        target: 'self',
        status: {
          kind: 'shield',
          name: '护盾',
          description: '抵消受到的伤害。',
          value: 6,
          duration: 1,
          stackable: true
        }
      }
    ]
  },
  iron_wall: {
    id: 'iron_wall',
    name: '铁壁',
    type: 'defense',
    cost: 2,
    target: 'self',
    rarity: 'rare',
    icon: '🛡',
    description: '获得 12 点护盾。',
    effects: [
      {
        kind: 'apply_status',
        target: 'self',
        status: {
          kind: 'shield',
          name: '护盾',
          description: '抵消受到的伤害。',
          value: 12,
          duration: 1,
          stackable: true
        }
      }
    ]
  },
  heal_small: {
    id: 'heal_small',
    name: '治疗术',
    type: 'heal',
    cost: 1,
    target: 'self',
    rarity: 'common',
    icon: '✚',
    description: '回复 7 点生命值。',
    effects: [{ kind: 'heal', value: 7, target: 'self' }]
  },
  heal_big: {
    id: 'heal_big',
    name: '圣光术',
    type: 'heal',
    cost: 3,
    target: 'self',
    rarity: 'rare',
    icon: '✚',
    description: '回复 18 点生命值。',
    effects: [{ kind: 'heal', value: 18, target: 'self' }]
  },
  empower: {
    id: 'empower',
    name: '强化',
    type: 'buff',
    cost: 1,
    target: 'self',
    rarity: 'common',
    icon: '✦',
    description: '获得 3 点力量（2 回合）。',
    effects: [
      {
        kind: 'apply_status',
        target: 'self',
        status: {
          kind: 'strength',
          name: '力量',
          description: '造成伤害时额外增加对应数值。',
          value: 3,
          duration: 2,
          stackable: true
        }
      }
    ]
  },
  regen: {
    id: 'regen',
    name: '再生',
    type: 'buff',
    cost: 2,
    target: 'self',
    rarity: 'rare',
    icon: '❈',
    description: '每回合回复 3 点生命，持续 3 回合。',
    effects: [
      {
        kind: 'apply_status',
        target: 'self',
        status: {
          kind: 'regen',
          name: '再生',
          description: '每回合开始时回复生命。',
          value: 3,
          duration: 3,
          stackable: true
        }
      }
    ]
  },
  weaken: {
    id: 'weaken',
    name: '削弱',
    type: 'debuff',
    cost: 1,
    target: 'enemy',
    rarity: 'common',
    icon: '✧',
    description: '敌方获得 2 点虚弱（2 回合）。',
    effects: [
      {
        kind: 'apply_status',
        target: 'enemy',
        status: {
          kind: 'weak',
          name: '虚弱',
          description: '造成的伤害降低 25%。',
          value: 2,
          duration: 2,
          stackable: true
        }
      }
    ]
  },
  poison: {
    id: 'poison',
    name: '毒刃',
    type: 'debuff',
    cost: 1,
    target: 'enemy',
    rarity: 'common',
    icon: '☠',
    description: '敌方获得 4 层中毒（3 回合）。',
    effects: [
      {
        kind: 'apply_status',
        target: 'enemy',
        status: {
          kind: 'poison',
          name: '中毒',
          description: '每回合开始时受到等同于层数的伤害。',
          value: 4,
          duration: 3,
          stackable: true
        }
      }
    ]
  },
  stun: {
    id: 'stun',
    name: '眩晕',
    type: 'debuff',
    cost: 3,
    target: 'enemy',
    rarity: 'epic',
    icon: '✺',
    description: '敌方下回合无法出牌。',
    effects: [
      {
        kind: 'apply_status',
        target: 'enemy',
        status: {
          kind: 'stun',
          name: '眩晕',
          description: '无法出牌。',
          value: 1,
          duration: 1,
          stackable: false
        }
      }
    ]
  },
  draw_card: {
    id: 'draw_card',
    name: '灵感',
    type: 'buff',
    cost: 1,
    target: 'self',
    rarity: 'common',
    icon: '✺',
    description: '抽 2 张牌。',
    effects: [{ kind: 'draw', value: 2, target: 'self' }]
  },
  energize: {
    id: 'energize',
    name: '能量涌动',
    type: 'buff',
    cost: 0,
    target: 'self',
    rarity: 'rare',
    icon: '⚡',
    description: '本回合获得 2 点额外能量。',
    effects: [{ kind: 'energy', value: 2, target: 'self' }]
  },
  thorns: {
    id: 'thorns',
    name: '荆棘护甲',
    type: 'buff',
    cost: 2,
    target: 'self',
    rarity: 'rare',
    icon: '✷',
    description: '获得荆棘 3（2 回合）。',
    effects: [
      {
        kind: 'apply_status',
        target: 'self',
        status: {
          kind: 'thorns',
          name: '荆棘',
          description: '受到攻击时反弹伤害。',
          value: 3,
          duration: 2,
          stackable: true
        }
      }
    ]
  }
}

export function getCardDef(id: string): CardDef {
  const def = CARD_DEFS[id]
  if (!def) {
    throw new Error(`未知的卡牌：${id}`)
  }
  return def
}
