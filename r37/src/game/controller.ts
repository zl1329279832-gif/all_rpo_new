import type {
  BattleConfig,
  BattleLogEntry,
  BattlePhase,
  BattleResult,
  PlayerId
} from '@/types/game'
import { PlayerState } from './player'
import { RuleEngine, type RuleLogEntry } from './engine'
import { SimpleAI } from './ai'
import { getPresetDeck } from '@/data/decks'

export interface BattleState {
  config: BattleConfig
  players: [PlayerState, PlayerState]
  turn: number
  activePlayer: PlayerId
  phase: BattlePhase
  log: BattleLogEntry[]
  result: BattleResult | null
}

function uid(prefix = 'l'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

export class BattleController {
  state: BattleState
  engine: RuleEngine
  ai: SimpleAI

  constructor(config: BattleConfig) {
    const p0 = new PlayerState({
      id: 0,
      name: config.playerName,
      isAI: false,
      startHp: config.startHp,
      startEnergy: config.startEnergy,
      maxEnergy: config.maxEnergy,
      deck: getPresetDeck(config.playerDeckKey)
    })
    const p1 = new PlayerState({
      id: 1,
      name: config.enemyName,
      isAI: config.enemyIsAI,
      startHp: config.startHp,
      startEnergy: config.startEnergy,
      maxEnergy: config.maxEnergy,
      deck: getPresetDeck(config.enemyDeckKey)
    })

    this.state = {
      config,
      players: [p0, p1],
      turn: 0,
      activePlayer: 0,
      phase: 'idle',
      log: [],
      result: null
    }

    this.engine = new RuleEngine({ log: (e) => this.appendLog(e) })
    this.ai = new SimpleAI(this.engine)
  }

  appendLog(e: RuleLogEntry) {
    this.state.log.push({
      id: uid('lg'),
      ts: Date.now(),
      turn: this.state.turn,
      actor: e.actor,
      text: e.text,
      kind: e.kind
    })
  }

  get player(): PlayerState {
    return this.state.players[0]
  }
  get enemy(): PlayerState {
    return this.state.players[1]
  }

  setup() {
    this.engine.shuffleDeck(this.player)
    this.engine.shuffleDeck(this.enemy)
    this.engine.drawCards(this.player, this.state.config.startingHand)
    this.engine.drawCards(this.enemy, this.state.config.startingHand)
    this.appendLog({ kind: 'system', actor: 'system', text: '战斗开始！' })
    this.startTurn(0)
  }

  opponentOf(pid: PlayerId): PlayerState {
    return this.state.players[pid === 0 ? 1 : 0]
  }

  startTurn(pid: PlayerId) {
    if (this.state.phase === 'ended') return
    this.state.turn += 1
    this.state.activePlayer = pid
    this.state.phase = 'player-turn'
    const p = this.state.players[pid]
    p.energy = Math.min(p.maxEnergy, this.state.config.startEnergy + Math.floor((this.state.turn - 1) / 2))
    if (this.state.turn === 1) p.energy = this.state.config.startEnergy
    this.engine.tickStatusesStartOfTurn(p)
    this.appendLog({
      kind: 'turn',
      actor: pid,
      text: `—— 第 ${Math.ceil(this.state.turn / 2)} 回合 · ${p.name} 的回合 ——`
    })
    if (!this.engine.hasStatus(p, 'stun')) {
      this.engine.drawCards(p, this.state.config.drawPerTurn)
    }
    this.checkGameEnd()
  }

  endTurn() {
    if (this.state.phase !== 'player-turn') return
    const active = this.state.activePlayer
    const p = this.state.players[active]
    this.engine.tickStatusesEndOfTurn(p)
    this.state.phase = 'idle'
    if (this.checkGameEnd()) return
    const next = (active === 0 ? 1 : 0) as PlayerId
    this.startTurn(next)
  }

  playCard(uidStr: string, targetOverride?: PlayerId) {
    if (this.state.phase !== 'player-turn') return
    const pid = this.state.activePlayer
    const p = this.state.players[pid]
    if (p.isAI) return
    const can = this.engine.canPlay(p, uidStr)
    if (!can.ok) {
      this.appendLog({ kind: 'system', actor: 'system', text: `无法出牌：${can.reason}` })
      return
    }
    this.engine.playCard(p, this.opponentOf(pid), {
      actor: pid,
      uid: uidStr,
      targetOverride
    })
    this.checkGameEnd()
  }

  aiTurn(): string[] {
    const steps: string[] = []
    if (this.state.phase !== 'player-turn') return steps
    const pid = this.state.activePlayer
    const p = this.state.players[pid]
    if (!p.isAI) return steps
    let safety = 12
    while (safety-- > 0) {
      if (this.state.phase !== 'player-turn') break
      const think = this.ai.think(p, this.opponentOf(pid))
      if (!think.uid) break
      const can = this.engine.canPlay(p, think.uid)
      if (!can.ok) break
      this.engine.playCard(p, this.opponentOf(pid), {
        actor: pid,
        uid: think.uid,
        targetOverride: think.target
      })
      steps.push(think.uid)
      if (this.checkGameEnd()) break
    }
    return steps
  }

  checkGameEnd(): boolean {
    const p0 = this.player.hp <= 0
    const p1 = this.enemy.hp <= 0
    if (!p0 && !p1) return false
    let winner: BattleResult['winner'] = 'draw'
    if (p0 && !p1) winner = 1
    else if (!p0 && p1) winner = 0
    this.state.phase = 'ended'
    this.state.result = {
      winner,
      turnCount: Math.ceil(this.state.turn / 2),
      timestamp: Date.now(),
      playerHpLeft: this.player.hp,
      enemyHpLeft: this.enemy.hp,
      deckKey: this.state.config.playerDeckKey
    }
    const text =
      winner === 'draw'
        ? '双方同时倒下，战斗平局。'
        : `${this.state.players[winner].name} 获胜！`
    this.appendLog({ kind: 'system', actor: 'system', text })
    return true
  }

  snapshot() {
    return {
      turn: this.state.turn,
      activePlayer: this.state.activePlayer,
      phase: this.state.phase,
      player: this.player.toSnapshot(),
      enemy: this.enemy.toSnapshot(),
      log: this.state.log.slice(),
      result: this.state.result
    }
  }
}
