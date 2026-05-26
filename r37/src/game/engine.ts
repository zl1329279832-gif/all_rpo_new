import type {
  CardEffect,
  CardInstance,
  PlayerId,
  PlayerSnapshot,
  StatusEffect,
  StatusKind
} from '@/types/game'
import { PlayerState } from './player'
import { getCardDef } from '@/data/cards'

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function newStatusId() {
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

export interface RuleLogEntry {
  kind: 'info' | 'damage' | 'heal' | 'status' | 'draw' | 'turn' | 'system'
  actor: PlayerId | 'system'
  text: string
}

export interface RuleContext {
  log: (entry: RuleLogEntry) => void
}

export interface PlayCardOptions {
  actor: PlayerId
  uid: string
  targetOverride?: PlayerId
}

export class RuleEngine {
  ctx: RuleContext

  constructor(ctx: RuleContext) {
    this.ctx = ctx
  }

  shuffleDeck(player: PlayerState) {
    player.deck = shuffle(player.deck)
  }

  reshuffleDiscardIntoDeck(player: PlayerState) {
    if (player.deck.length === 0 && player.discard.length > 0) {
      player.deck = shuffle(player.discard)
      player.discard = []
      this.ctx.log({
        kind: 'info',
        actor: player.id,
        text: `${player.name} 的弃牌堆被洗入牌库。`
      })
    }
  }

  drawCards(player: PlayerState, count: number) {
    for (let i = 0; i < count; i++) {
      if (player.deck.length === 0) {
        this.reshuffleDiscardIntoDeck(player)
        if (player.deck.length === 0) break
      }
      const card = player.deck.shift()
      if (card) {
        player.hand.push(card)
      }
    }
    if (count > 0) {
      this.ctx.log({
        kind: 'draw',
        actor: player.id,
        text: `${player.name} 抽了 ${count} 张牌。`
      })
    }
  }

  addStatus(player: PlayerState, spec: Omit<StatusEffect, 'id'>) {
    const existing = player.statuses.find((s) => s.kind === spec.kind)
    if (existing && spec.stackable) {
      existing.value += spec.value
      existing.duration = Math.max(existing.duration, spec.duration)
    } else if (existing && !spec.stackable) {
      existing.value = Math.max(existing.value, spec.value)
      existing.duration = Math.max(existing.duration, spec.duration)
    } else {
      player.statuses.push({ ...spec, id: newStatusId() })
    }
    this.ctx.log({
      kind: 'status',
      actor: player.id,
      text: `${player.name} 获得 [${spec.name}] ${spec.value}（${spec.duration} 回合）。`
    })
  }

  removeStatus(player: PlayerState, kind: StatusKind) {
    const idx = player.statuses.findIndex((s) => s.kind === kind)
    if (idx >= 0) {
      const removed = player.statuses.splice(idx, 1)[0]
      this.ctx.log({
        kind: 'status',
        actor: player.id,
        text: `${player.name} 失去 [${removed.name}]。`
      })
    }
  }

  getStatusValue(player: PlayerState, kind: StatusKind): number {
    return player.statuses.find((s) => s.kind === kind)?.value ?? 0
  }

  hasStatus(player: PlayerState, kind: StatusKind): boolean {
    return this.getStatusValue(player, kind) > 0
  }

  tickStatusesStartOfTurn(player: PlayerState) {
    const poison = player.statuses.find((s) => s.kind === 'poison')
    if (poison && poison.value > 0) {
      this.applyRawDamage(player, poison.value, { ignoreShield: true, cause: 'poison' })
    }
    const regen = player.statuses.find((s) => s.kind === 'regen')
    if (regen && regen.value > 0) {
      this.heal(player, regen.value)
    }
  }

  tickStatusesEndOfTurn(player: PlayerState) {
    const stun = player.statuses.find((s) => s.kind === 'stun')
    if (stun && stun.duration <= 1) {
      this.removeStatus(player, 'stun')
    }
    const shield = player.statuses.find((s) => s.kind === 'shield')
    if (shield && shield.duration <= 1) {
      this.removeStatus(player, 'shield')
    }
    player.statuses = player.statuses
      .map((s) => ({ ...s, duration: s.duration - 1 }))
      .filter((s) => s.duration > 0)
  }

  heal(player: PlayerState, amount: number) {
    const before = player.hp
    player.hp = Math.min(player.maxHp, player.hp + amount)
    const healed = player.hp - before
    if (healed > 0) {
      this.ctx.log({
        kind: 'heal',
        actor: player.id,
        text: `${player.name} 回复 ${healed} 点生命。`
      })
    }
  }

  applyRawDamage(
    player: PlayerState,
    amount: number,
    opts: { ignoreShield?: boolean; cause?: 'attack' | 'poison' | 'thorns' } = {}
  ) {
    let dmg = amount
    if (!opts.ignoreShield) {
      const shield = player.statuses.find((s) => s.kind === 'shield')
      if (shield && shield.value > 0) {
        const absorbed = Math.min(shield.value, dmg)
        shield.value -= absorbed
        dmg -= absorbed
        if (shield.value <= 0) this.removeStatus(player, 'shield')
        this.ctx.log({
          kind: 'info',
          actor: player.id,
          text: `${player.name} 的护盾抵挡了 ${absorbed} 点伤害。`
        })
      }
    }
    if (dmg > 0) {
      player.hp = Math.max(0, player.hp - dmg)
      this.ctx.log({
        kind: 'damage',
        actor: player.id,
        text: `${player.name} 受到 ${dmg} 点伤害${opts.cause ? `（${opts.cause}）` : ''}。`
      })
    }
  }

  computeAttackDamage(attacker: PlayerState, base: number): number {
    const strength = this.getStatusValue(attacker, 'strength')
    const weak = this.getStatusValue(attacker, 'weak')
    let dmg = base + strength
    if (weak > 0) dmg = Math.floor(dmg * 0.75)
    return Math.max(0, dmg)
  }

  canPlay(player: PlayerState, uid: string): { ok: boolean; reason?: string } {
    const info = player.getDef(uid)
    if (!info) return { ok: false, reason: '卡牌不在手牌中' }
    if (player.energy < info.def.cost) return { ok: false, reason: '能量不足' }
    if (this.hasStatus(player, 'stun')) return { ok: false, reason: '被眩晕，无法出牌' }
    return { ok: true }
  }

  resolveTarget(
    actor: PlayerState,
    opponent: PlayerState,
    target: 'self' | 'enemy' | 'any' | undefined,
    override?: PlayerId
  ): PlayerState {
    if (override !== undefined) {
      return override === actor.id ? actor : opponent
    }
    if (target === 'self') return actor
    if (target === 'enemy') return opponent
    return actor
  }

  playCard(actor: PlayerState, opponent: PlayerState, opts: PlayCardOptions) {
    const info = actor.getDef(opts.uid)
    if (!info) throw new Error('卡牌不在手牌中')
    const { instance, def } = info
    if (actor.energy < def.cost) throw new Error('能量不足')
    actor.energy -= def.cost
    const idx = actor.hand.findIndex((c) => c.uid === instance.uid)
    if (idx >= 0) actor.hand.splice(idx, 1)
    actor.discard.push(instance)

    this.ctx.log({
      kind: 'info',
      actor: actor.id,
      text: `${actor.name} 使用 [${def.name}]。`
    })

    for (const eff of def.effects) {
      this.applyEffect(actor, opponent, eff, opts.targetOverride)
    }
  }

  applyEffect(
    actor: PlayerState,
    opponent: PlayerState,
    eff: CardEffect,
    targetOverride?: PlayerId
  ) {
    const target = this.resolveTarget(actor, opponent, eff.target, targetOverride)
    const times = eff.times ?? 1
    switch (eff.kind) {
      case 'damage': {
        const base = eff.value ?? 0
        for (let i = 0; i < times; i++) {
          const dmg = this.computeAttackDamage(actor, base)
          this.applyRawDamage(target, dmg, { cause: 'attack' })
          if (target !== actor) {
            const thorns = this.getStatusValue(target, 'thorns')
            if (thorns > 0) {
              this.applyRawDamage(actor, thorns, { cause: 'thorns' })
            }
          }
        }
        break
      }
      case 'heal': {
        this.heal(target, eff.value ?? 0)
        break
      }
      case 'shield': {
        this.addStatus(target, {
          kind: 'shield',
          name: '护盾',
          description: '抵挡伤害。',
          value: eff.value ?? 0,
          duration: 1,
          stackable: true
        })
        break
      }
      case 'draw': {
        this.drawCards(target, eff.value ?? 0)
        break
      }
      case 'energy': {
        target.energy = Math.min(target.maxEnergy + 5, target.energy + (eff.value ?? 0))
        this.ctx.log({
          kind: 'info',
          actor: target.id,
          text: `${target.name} 获得 ${eff.value} 点能量。`
        })
        break
      }
      case 'apply_status': {
        if (eff.status) this.addStatus(target, eff.status)
        break
      }
      case 'remove_status': {
        // 预留扩展
        break
      }
      case 'discard': {
        const n = eff.value ?? 0
        for (let i = 0; i < n; i++) {
          const c = target.hand.shift()
          if (c) target.discard.push(c)
        }
        this.ctx.log({
          kind: 'info',
          actor: target.id,
          text: `${target.name} 弃掉了 ${n} 张牌。`
        })
        break
      }
    }
  }
}
