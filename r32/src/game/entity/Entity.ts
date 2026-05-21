import type { EntityType, Vector2, Stats } from '@/types/game'

export class Entity {
  id: string
  type: EntityType
  x: number
  y: number
  width: number
  height: number
  velocityX: number = 0
  velocityY: number = 0
  stats: Stats
  alive: boolean = true
  facing: 'left' | 'right' | 'up' | 'down' = 'down'
  animationFrame: number = 0
  animationTime: number = 0

  constructor(type: EntityType, x: number, y: number, width: number, height: number, stats: Stats) {
    this.id = `${type}_${Math.random().toString(36).substr(2, 9)}`
    this.type = type
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.stats = { ...stats }
  }

  get centerX(): number {
    return this.x + this.width / 2
  }

  get centerY(): number {
    return this.y + this.height / 2
  }

  getCenter(): Vector2 {
    return { x: this.centerX, y: this.centerY }
  }

  distanceTo(other: Entity): number {
    const dx = this.centerX - other.centerX
    const dy = this.centerY - other.centerY
    return Math.sqrt(dx * dx + dy * dy)
  }

  intersects(other: Entity): boolean {
    return (
      this.x < other.x + other.width &&
      this.x + this.width > other.x &&
      this.y < other.y + other.height &&
      this.y + this.height > other.y
    )
  }

  intersectsRect(x: number, y: number, width: number, height: number): boolean {
    return (
      this.x < x + width &&
      this.x + this.width > x &&
      this.y < y + height &&
      this.y + this.height > y
    )
  }

  takeDamage(amount: number): void {
    this.stats.hp = Math.max(0, this.stats.hp - amount)
    if (this.stats.hp <= 0) {
      this.alive = false
    }
  }

  heal(amount: number): void {
    this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount)
  }

  update(dt: number): void {
    this.animationTime += dt
    if (this.animationTime > 0.15) {
      this.animationTime = 0
      this.animationFrame = (this.animationFrame + 1) % 4
    }
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    // 子类实现
  }
}
