import { Entity } from './Entity'
import type { Stats } from '@/types/game'
import { COLORS } from '@/game/config/GameConfig'

export class Projectile extends Entity {
  damage: number
  ownerId: string
  isPlayerProjectile: boolean
  lifetime: number = 3
  speed: number = 300

  constructor(x: number, y: number, directionX: number, directionY: number,
              damage: number, ownerId: string, isPlayerProjectile: boolean) {
    super('projectile', x - 4, y - 4, 8, 8, {
      maxHp: 1, hp: 1, attack: 0, defense: 0, speed: 0,
      attackSpeed: 1, critRate: 0, critDamage: 1,
    })

    const len = Math.sqrt(directionX * directionX + directionY * directionY)
    this.velocityX = (directionX / len) * this.speed
    this.velocityY = (directionY / len) * this.speed
    this.damage = damage
    this.ownerId = ownerId
    this.isPlayerProjectile = isPlayerProjectile
  }

  update(dt: number, map: { isWalkable: (x: number, y: number) => boolean }): void {
    super.update(dt)

    this.lifetime -= dt
    if (this.lifetime <= 0) {
      this.alive = false
      return
    }

    const newX = this.x + this.velocityX * dt
    const newY = this.y + this.velocityY * dt

    if (!map.isWalkable(newX, newY)) {
      this.alive = false
      return
    }

    this.x = newX
    this.y = newY
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    const screenX = this.x - cameraX + this.width / 2
    const screenY = this.y - cameraY + this.height / 2

    const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, this.width)
    if (this.isPlayerProjectile) {
      gradient.addColorStop(0, '#fff')
      gradient.addColorStop(0.5, COLORS.projectile)
      gradient.addColorStop(1, 'rgba(255, 235, 59, 0)')
    } else {
      gradient.addColorStop(0, '#fff')
      gradient.addColorStop(0.5, '#f44336')
      gradient.addColorStop(1, 'rgba(244, 67, 54, 0)')
    }

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(screenX, screenY, this.width, 0, Math.PI * 2)
    ctx.fill()
  }
}
