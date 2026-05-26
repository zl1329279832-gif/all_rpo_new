import type { CardInstance } from '@/types/game'

export interface DeckPreset {
  key: string
  name: string
  description: string
  cards: string[]
}

export const DECK_PRESETS: Record<string, DeckPreset> = {
  balanced: {
    key: 'balanced',
    name: '均衡之道',
    description: '攻防兼备，节奏稳定的初学者卡组。',
    cards: [
      'strike', 'strike', 'strike', 'strike',
      'heavy_strike', 'heavy_strike',
      'guard', 'guard', 'guard',
      'iron_wall',
      'heal_small', 'heal_small',
      'heal_big',
      'empower',
      'weaken', 'weaken',
      'draw_card',
      'energize'
    ]
  },
  aggro: {
    key: 'aggro',
    name: '狂战士',
    description: '高爆发、低续航，速战速决的攻击型卡组。',
    cards: [
      'strike', 'strike', 'strike',
      'heavy_strike', 'heavy_strike', 'heavy_strike',
      'double_slash', 'double_slash',
      'empower', 'empower',
      'poison', 'poison',
      'weaken',
      'guard',
      'energize',
      'heal_small'
    ]
  },
  control: {
    key: 'control',
    name: '控场者',
    description: '削弱、中毒与护盾，持久作战的控制型卡组。',
    cards: [
      'strike', 'strike',
      'guard', 'guard', 'guard',
      'iron_wall', 'iron_wall',
      'heal_small', 'heal_small',
      'heal_big',
      'regen',
      'weaken', 'weaken',
      'poison', 'poison',
      'thorns',
      'stun',
      'draw_card'
    ]
  }
}

let uidCounter = 1

export function buildDeck(cardIds: string[]): CardInstance[] {
  return cardIds.map((id) => ({ uid: `c${uidCounter++}`, defId: id }))
}

export function getPresetDeck(key: string): CardInstance[] {
  const preset = DECK_PRESETS[key] ?? DECK_PRESETS.balanced
  return buildDeck(preset.cards)
}
