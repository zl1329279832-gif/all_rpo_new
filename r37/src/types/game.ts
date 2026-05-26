export type PlayerId = 0 | 1

export type CardType = 'attack' | 'defense' | 'heal' | 'buff' | 'debuff'

export type TargetType = 'self' | 'enemy' | 'any'

export type StatusKind =
  | 'shield'
  | 'vulnerable'
  | 'weak'
  | 'strength'
  | 'regen'
  | 'poison'
  | 'stun'
  | 'thorns'

export interface StatusEffect {
  id: string
  kind: StatusKind
  value: number
  duration: number
  stackable: boolean
  name: string
  description: string
}

export type EffectKind =
  | 'damage'
  | 'heal'
  | 'shield'
  | 'draw'
  | 'energy'
  | 'apply_status'
  | 'remove_status'
  | 'discard'

export interface CardEffect {
  kind: EffectKind
  value?: number
  target?: TargetType
  status?: Omit<StatusEffect, 'id'>
  times?: number
}

export interface CardDef {
  id: string
  name: string
  type: CardType
  cost: number
  target: TargetType
  description: string
  icon?: string
  rarity?: 'common' | 'rare' | 'epic'
  effects: CardEffect[]
  flavor?: string
}

export interface CardInstance {
  uid: string
  defId: string
}

export interface PlayerSnapshot {
  id: PlayerId
  name: string
  isAI: boolean
  hp: number
  maxHp: number
  energy: number
  maxEnergy: number
  hand: CardInstance[]
  deck: CardInstance[]
  discard: CardInstance[]
  statuses: StatusEffect[]
}

export type BattlePhase = 'idle' | 'player-turn' | 'enemy-turn' | 'ended'

export interface BattleLogEntry {
  id: string
  ts: number
  turn: number
  actor: PlayerId | 'system'
  text: string
  kind: 'info' | 'damage' | 'heal' | 'status' | 'draw' | 'turn' | 'system'
}

export interface BattleResult {
  winner: PlayerId | 'draw'
  turnCount: number
  timestamp: number
  playerHpLeft: number
  enemyHpLeft: number
  deckKey: string
}

export interface BattleConfig {
  playerName: string
  enemyName: string
  enemyIsAI: boolean
  playerDeckKey: string
  enemyDeckKey: string
  startHp: number
  startEnergy: number
  maxEnergy: number
  drawPerTurn: number
  startingHand: number
}
