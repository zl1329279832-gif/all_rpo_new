import { Entity } from './Entity'
import type { ItemType, Stats } from '@/types/game'
import { ITEMS } from '@/game/config/GameConfig'

export class Item extends Entity {
  itemType: ItemType
  quantity: number = 1

  constructor(x: number, y: number, type: ItemType, quantity: number = 1) {
    super('item', x, y, 20, 20, {
      maxHp: 1, hp: 1, attack: 0, defense: 0, speed: 0,
      attackSpeed: 1, critRate: 0, critDamage: 1,
    })
    this.itemType = type
    this.quantity = quantity
  }

  getConfig() {
    return ITEMS[this.itemType]
  }

  update(dt: number): void {
    super.update(dt)
    this.animationTime += dt
    if (this.animationTime > 2) {
      this.animationTime = 0
      this.animationFrame = (this.animationFrame + 1) % 2
    }
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    const screenX = this.x - cameraX
    const screenY = this.y - cameraY
    const config = this.getConfig()

    const floatOffset = Math.sin(this.animationTime * 3) * 3

    ctx.shadowColor = '#ffd700'
    ctx.shadowBlur = 10

    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(screenX + this.width / 2, screenY + this.height / 2 + floatOffset, this.width / 2, 0, Math.PI * 2)
    ctx.fill()

    ctx.shadowBlur = 0

    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(config.icon, screenX + this.width / 2, screenY + this.height / 2 + floatOffset)
  }
}
