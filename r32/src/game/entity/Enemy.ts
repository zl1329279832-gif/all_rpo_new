import { Entity } from './Entity'
import type { Stats, EnemyType } from '@/types/game'
import { ENEMIES, COLORS } from '@/game/config/GameConfig'
import { eventBus } from '@/game/core/EventBus'

export class Enemy extends Entity {
  enemyType: EnemyType
  aiType: 'melee' | 'ranged' | 'fast'
  expReward: number
  attackRange: number
  attackCooldown: number = 0
  attackInterval: number = 1.5
  stunTime: number = 0
  aggroRange: number = 200
  patrolTarget: { x: number; y: number } | null = null
  patrolTimer: number = 0

  constructor(x: number, y: number, type: EnemyType) {
    const config = ENEMIES[type]
    const stats: Stats = {
      maxHp: config.stats.maxHp!,
      hp: config.stats.hp!,
      attack: config.stats.attack!,
      defense: config.stats.defense!,
      speed: config.stats.speed!,
      attackSpeed: 1,
      critRate: 0,
      critDamage: 1,
    }
    super('enemy', x, y, type === 'boss' ? 40 : 24, type === 'boss' ? 40 : 24, stats)

    this.enemyType = type
    this.aiType = config.aiType
    this.expReward = config.expReward
    this.attackRange = this.aiType === 'ranged' ? 150 : 40
    this.aggroRange = this.aiType === 'fast' ? 250 : 180
    this.attackInterval = this.aiType === 'fast' ? 0.8 : this.aiType === 'ranged' ? 2 : 1.5
  }

  update(dt: number, player: { centerX: number; centerY: number; x: number; y: number; alive: boolean },
         map: { isWalkable: (x: number, y: number) => boolean }): void {
    super.update(dt)

    if (this.stunTime > 0) {
      this.stunTime -= dt
      return
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt
    }

    if (!player.alive) return

    const distToPlayer = this.distanceToPoint(player.centerX, player.centerY)

    if (distToPlayer <= this.aggroRange) {
      this.chasePlayer(dt, player, map)
    } else {
      this.patrol(dt, map)
    }
  }

  private chasePlayer(dt: number, player: { centerX: number; centerY: number },
                      map: { isWalkable: (x: number, y: number) => boolean }): void {
    const dx = player.centerX - this.centerX
    const dy = player.centerY - this.centerY
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist > this.attackRange) {
      const speed = this.stats.speed * 60 * dt
      const moveX = (dx / dist) * speed
      const moveY = (dy / dist) * speed

      const newX = this.x + moveX
      const newY = this.y + moveY

      if (map.isWalkable(newX, this.y) && map.isWalkable(newX + this.width, this.y) &&
          map.isWalkable(newX, this.y + this.height) && map.isWalkable(newX + this.width, this.y + this.height)) {
        this.x = newX
      }
      if (map.isWalkable(this.x, newY) && map.isWalkable(this.x + this.width, newY) &&
          map.isWalkable(this.x, newY + this.height) && map.isWalkable(this.x + this.width, newY + this.height)) {
        this.y = newY
      }

      if (dx < 0) this.facing = 'left'
      else this.facing = 'right'
    }
  }

  private patrol(dt: number, map: { isWalkable: (x: number, y: number) => boolean }): void {
    this.patrolTimer -= dt

    if (this.patrolTimer <= 0 || !this.patrolTarget) {
      this.patrolTarget = {
        x: this.x + (Math.random() - 0.5) * 100,
        y: this.y + (Math.random() - 0.5) * 100,
      }
      this.patrolTimer = 2 + Math.random() * 2
    }

    const dx = this.patrolTarget.x - this.x
    const dy = this.patrolTarget.y - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist > 5) {
      const speed = this.stats.speed * 0.3 * 60 * dt
      const moveX = (dx / dist) * speed
      const moveY = (dy / dist) * speed

      if (map.isWalkable(this.x + moveX, this.y)) {
        this.x += moveX
      }
      if (map.isWalkable(this.x, this.y + moveY)) {
        this.y += moveY
      }
    }
  }

  distanceToPoint(x: number, y: number): number {
    const dx = this.centerX - x
    const dy = this.centerY - y
    return Math.sqrt(dx * dx + dy * dy)
  }

  canAttack(): boolean {
    return this.attackCooldown <= 0
  }

  performAttack(): void {
    this.attackCooldown = this.attackInterval
  }

  takeDamage(amount: number): void {
    super.takeDamage(amount)
    this.stunTime = 0.1
    if (!this.alive) {
      eventBus.emit('enemyDied', this)
    }
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    const screenX = this.x - cameraX
    const screenY = this.y - cameraY

    const config = ENEMIES[this.enemyType]

    ctx.fillStyle = config.color
    ctx.fillRect(screenX, screenY, this.width, this.height)

    ctx.strokeStyle = COLORS.enemyBorder
    ctx.lineWidth = 2
    ctx.strokeRect(screenX, screenY, this.width, this.height)

    ctx.fillStyle = '#000'
    ctx.fillRect(screenX + this.width * 0.25, screenY + this.height * 0.25, 4, 4)
    ctx.fillRect(screenX + this.width * 0.55, screenY + this.height * 0.25, 4, 4)

    if (this.stunTime > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.fillRect(screenX, screenY, this.width, this.height)
    }

    const hpPercent = this.stats.hp / this.stats.maxHp
    const barWidth = this.width
    const barHeight = 4

    ctx.fillStyle = COLORS.hpBarBg
    ctx.fillRect(screenX, screenY - 8, barWidth, barHeight)

    ctx.fillStyle = COLORS.hpBar
    ctx.fillRect(screenX, screenY - 8, barWidth * hpPercent, barHeight)
  }
}
