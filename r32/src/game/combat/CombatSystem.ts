import type { DamageInfo, Particle } from '@/types/game'
import { COLORS } from '@/game/config/GameConfig'
import { eventBus } from '@/game/core/EventBus'
import type { Player } from '../entity/Player'
import type { Enemy } from '../entity/Enemy'
import type { Projectile } from '../entity/Projectile'

export class CombatSystem {
  private damageTexts: DamageInfo[] = []
  private particles: Particle[] = []

  playerAttack(player: Player, enemies: Enemy[]): void {
    if (!player.canAttack()) return

    const attackRange = 50
    const attackDamage = player.getEffectiveStat('attack')
    const critRate = player.getEffectiveStat('critRate')
    const critDamage = player.getEffectiveStat('critDamage')

    player.performAttack()

    let hitDirection = { x: 0, y: 0 }
    switch (player.facing) {
      case 'left': hitDirection = { x: -1, y: 0 }; break
      case 'right': hitDirection = { x: 1, y: 0 }; break
      case 'up': hitDirection = { x: 0, y: -1 }; break
      case 'down': hitDirection = { x: 0, y: 1 }; break
    }

    const attackX = player.centerX + hitDirection.x * attackRange * 0.5
    const attackY = player.centerY + hitDirection.y * attackRange * 0.5

    this.spawnAttackParticles(attackX, attackY, hitDirection)

    for (const enemy of enemies) {
      if (!enemy.alive) continue

      const dist = enemy.distanceToPoint(attackX, attackY)
      if (dist > attackRange) continue

      const angle = Math.atan2(enemy.centerY - player.centerY, enemy.centerX - player.centerX)
      const facingAngle = Math.atan2(hitDirection.y, hitDirection.x)
      const angleDiff = Math.abs(angle - facingAngle)
      if (angleDiff > Math.PI / 2 && angleDiff < Math.PI * 1.5) continue

      const isCrit = Math.random() < critRate
      const damage = Math.floor(attackDamage * (isCrit ? critDamage : 1))

      enemy.takeDamage(damage)
      this.addDamageText(damage, isCrit, enemy.centerX, enemy.y)

      if (!enemy.alive) {
        player.addExp(enemy.expReward)
        this.spawnDeathParticles(enemy.centerX, enemy.centerY)
      }
    }
  }

  enemyAttack(enemy: Enemy, player: Player): void {
    if (!enemy.canAttack()) return

    const dist = enemy.distanceTo(player)
    if (dist > enemy.attackRange) return

    enemy.performAttack()

    const damage = Math.max(1, enemy.stats.attack - player.getEffectiveStat('defense'))
    player.takeDamage(damage)
    player.invulnerableTime = 0.5

    this.addDamageText(damage, false, player.centerX, player.y)
    this.spawnHitParticles(player.centerX, player.centerY)
  }

  createProjectile(
    x: number, y: number,
    directionX: number, directionY: number,
    damage: number, ownerId: string, isPlayer: boolean
  ): Projectile {
    const Projectile = require('../entity/Projectile').Projectile
    return new Projectile(x, y, directionX, directionY, damage, ownerId, isPlayer)
  }

  projectileHit(projectile: Projectile, target: Player | Enemy): void {
    if (!target.alive) return

    const isCrit = Math.random() < 0.1
    const damage = Math.floor(projectile.damage * (isCrit ? 1.5 : 1))

    target.takeDamage(damage)
    projectile.alive = false

    this.addDamageText(damage, isCrit, target.centerX, target.y)
    this.spawnHitParticles(target.centerX, target.centerY)
  }

  private addDamageText(damage: number, isCrit: boolean, x: number, y: number): void {
    this.damageTexts.push({
      damage,
      isCrit,
      position: { x, y },
      timestamp: Date.now(),
    })
  }

  private spawnAttackParticles(x: number, y: number, direction: { x: number; y: number }): void {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.random() - 0.5) * Math.PI / 2
      const speed = 100 + Math.random() * 100
      this.particles.push({
        x, y,
        vx: (direction.x * Math.cos(angle) - direction.y * Math.sin(angle)) * speed,
        vy: (direction.x * Math.sin(angle) + direction.y * Math.cos(angle)) * speed,
        life: 0.3,
        maxLife: 0.3,
        color: COLORS.player,
        size: 3 + Math.random() * 3,
      })
    }
  }

  private spawnHitParticles(x: number, y: number): void {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 50 + Math.random() * 100
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5,
        maxLife: 0.5,
        color: '#ff6b6b',
        size: 2 + Math.random() * 3,
      })
    }
  }

  private spawnDeathParticles(x: number, y: number): void {
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 80 + Math.random() * 150
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.8,
        maxLife: 0.8,
        color: COLORS.enemy,
        size: 3 + Math.random() * 4,
      })
    }
  }

  updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vx *= 0.95
      p.vy *= 0.95
      p.life -= dt

      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }

    const now = Date.now()
    this.damageTexts = this.damageTexts.filter(t => now - t.timestamp < 1000)
  }

  drawParticles(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife
      ctx.fillStyle = p.color
      ctx.globalAlpha = alpha
      ctx.beginPath()
      ctx.arc(p.x - cameraX, p.y - cameraY, p.size * alpha, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  drawDamageTexts(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    const now = Date.now()
    for (const t of this.damageTexts) {
      const elapsed = now - t.timestamp
      const alpha = 1 - elapsed / 1000
      const offsetY = -elapsed / 20

      ctx.font = t.isCrit ? 'bold 20px Arial' : 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = t.isCrit ? '#ffd700' : '#ff5252'
      ctx.globalAlpha = alpha
      ctx.fillText(`${t.isCrit ? '暴击! ' : ''}-${t.damage}`, t.position.x - cameraX, t.position.y - cameraY + offsetY)
    }
    ctx.globalAlpha = 1
  }
}
