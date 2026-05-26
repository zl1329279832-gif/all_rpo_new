import type { PlayerId } from '@/types/game'
import { PlayerState } from './player'
import { RuleEngine } from './engine'
import { getCardDef } from '@/data/cards'

export interface AIThinkResult {
  uid: string | null
  target?: PlayerId
  reason?: string
}

export interface AIHeuristicWeights {
  attack: number
  defense: number
  heal: number
  buff: number
  debuff: number
}

const DEFAULT_WEIGHTS: AIHeuristicWeights = {
  attack: 1.2,
  defense: 1.0,
  heal: 1.0,
  buff: 0.8,
  debuff: 0.9
}

export class SimpleAI {
  engine: RuleEngine
  weights: AIHeuristicWeights

  constructor(engine: RuleEngine, weights: AIHeuristicWeights = DEFAULT_WEIGHTS) {
    this.engine = engine
    this.weights = weights
  }

  think(self: PlayerState, enemy: PlayerState): AIThinkResult {
    const playable = self.hand.filter((c) => {
      return this.engine.canPlay(self, c.uid).ok
    })
    if (playable.length === 0) return { uid: null }

    const hpRatio = self.hp / self.maxHp
    const enemyHpRatio = enemy.hp / enemy.maxHp

    let best: { uid: string; score: number; target?: PlayerId; reason: string } | null = null

    for (const card of playable) {
      const def = getCardDef(card.defId)
      let score = 0
      let target: PlayerId | undefined
      let reason = ''

      switch (def.type) {
        case 'attack': {
          let total = 0
          for (const eff of def.effects) {
            if (eff.kind === 'damage') {
              const base = eff.value ?? 0
              const times = eff.times ?? 1
              total += this.engine.computeAttackDamage(self, base) * times
            }
          }
          score = total * this.weights.attack
          if (enemyHpRatio < 0.3) score *= 1.4
          target = enemy.id
          reason = `预期伤害 ${total}`
          break
        }
        case 'defense': {
          let total = 0
          for (const eff of def.effects) {
            if (eff.kind === 'apply_status' && eff.status?.kind === 'shield') {
              total += eff.status.value
            }
            if (eff.kind === 'shield') total += eff.value ?? 0
          }
          const shieldVal = self.statuses.find((s) => s.kind === 'shield')?.value ?? 0
          score = Math.max(0, total - shieldVal * 0.6) * this.weights.defense
          if (hpRatio < 0.5) score *= 1.3
          target = self.id
          reason = `获得护盾 ${total}`
          break
        }
        case 'heal': {
          let total = 0
          for (const eff of def.effects) {
            if (eff.kind === 'heal') total += eff.value ?? 0
          }
          const missing = self.maxHp - self.hp
          const effective = Math.min(missing, total)
          score = effective * this.weights.heal
          if (hpRatio < 0.4) score *= 1.6
          else if (hpRatio > 0.85) score *= 0.2
          target = self.id
          reason = `回复 ${effective} 生命`
          break
        }
        case 'buff': {
          let baseScore = 0
          for (const eff of def.effects) {
            if (eff.kind === 'draw') baseScore += (eff.value ?? 0) * 1.2
            if (eff.kind === 'energy') baseScore += (eff.value ?? 0) * 2
            if (eff.kind === 'apply_status') {
              if (eff.status?.kind === 'strength') baseScore += eff.status.value * 1.5
              if (eff.status?.kind === 'regen') baseScore += eff.status.value * 1.1
              if (eff.status?.kind === 'thorns') baseScore += eff.status.value * 0.9
            }
          }
          score = baseScore * this.weights.buff
          target = self.id
          reason = `增强自身`
          break
        }
        case 'debuff': {
          let baseScore = 0
          for (const eff of def.effects) {
            if (eff.kind === 'apply_status') {
              if (eff.status?.kind === 'weak') baseScore += eff.status.value * 1.3
              if (eff.status?.kind === 'poison') baseScore += eff.status.value * 1.4
              if (eff.status?.kind === 'stun') baseScore += 10
            }
          }
          score = baseScore * this.weights.debuff
          target = enemy.id
          reason = `削弱敌人`
          break
        }
      }

      if (!best || score > best.score) {
        best = { uid: card.uid, score, target, reason }
      }
    }

    if (!best) return { uid: null }
    return { uid: best.uid, target: best.target, reason: best.reason }
  }
}
