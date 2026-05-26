import type { CardInstance, PlayerId, PlayerSnapshot, StatusEffect } from '@/types/game'
import { getCardDef } from '@/data/cards'

export interface PlayerOptions {
  id: PlayerId
  name: string
  isAI: boolean
  startHp: number
  startEnergy: number
  maxEnergy: number
  deck: CardInstance[]
}

export class PlayerState {
  id: PlayerId
  name: string
  isAI: boolean
  hp: number
  maxHp: number
  energy = 0
  maxEnergy: number
  hand: CardInstance[] = []
  deck: CardInstance[] = []
  discard: CardInstance[] = []
  statuses: StatusEffect[] = []

  constructor(opts: PlayerOptions) {
    this.id = opts.id
    this.name = opts.name
    this.isAI = opts.isAI
    this.hp = opts.startHp
    this.maxHp = opts.startHp
    this.energy = opts.startEnergy
    this.maxEnergy = opts.maxEnergy
    this.deck = opts.deck.slice()
  }

  cloneHand(): CardInstance[] {
    return this.hand.slice()
  }

  toSnapshot(): PlayerSnapshot {
    return {
      id: this.id,
      name: this.name,
      isAI: this.isAI,
      hp: this.hp,
      maxHp: this.maxHp,
      energy: this.energy,
      maxEnergy: this.maxEnergy,
      hand: this.hand.slice(),
      deck: this.deck.slice(),
      discard: this.discard.slice(),
      statuses: this.statuses.map((s) => ({ ...s }))
    }
  }

  getDef(uid: string) {
    const inst = this.hand.find((c) => c.uid === uid)
    if (!inst) return null
    return { instance: inst, def: getCardDef(inst.defId) }
  }
}
