import { Entity } from './Entity'
import type { Stats, Skill, InventoryItem, LevelData } from '@/types/game'
import { PLAYER_INITIAL_STATS, SKILLS, COLORS } from '@/game/config/GameConfig'
import { inputManager } from '@/game/core/InputManager'
import { eventBus } from '@/game/core/EventBus'

export class Player extends Entity {
  level: LevelData = { level: 1, exp: 0, expToNext: 100 }
  gold: number = 0
  inventory: InventoryItem[] = []
  skills: Skill[] = []
  activeEffects: Map<string, { stats: Partial<Stats>; remainingTime: number }> = new Map()
  invulnerableTime: number = 0
  attackCooldown: number = 0
  currentMana: number = 100
  maxMana: number = 100
  manaRegen: number = 5
  manaRegenCooldown: number = 0

  constructor(x: number, y: number) {
    super('player', x, y, 24, 24, { ...PLAYER_INITIAL_STATS })
    this.skills = SKILLS.map(s => ({ ...s, currentCooldown: 0 }))
  }

  update(dt: number, map: { isWalkable: (x: number, y: number) => boolean }): void {
    super.update(dt)

    if (this.invulnerableTime > 0) {
      this.invulnerableTime -= dt
    }
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt
    }

    this.skills.forEach(skill => {
      if (skill.currentCooldown > 0) {
        skill.currentCooldown -= dt
        if (skill.currentCooldown < 0) skill.currentCooldown = 0
      }
    })

    this.manaRegenCooldown += dt
    if (this.manaRegenCooldown >= 1) {
      this.manaRegenCooldown = 0
      this.currentMana = Math.min(this.maxMana, this.currentMana + this.manaRegen)
    }

    this.activeEffects.forEach((effect, key) => {
      effect.remainingTime -= dt * 1000
      if (effect.remainingTime <= 0) {
        this.activeEffects.delete(key)
        eventBus.emit('effectExpired', key)
      }
    })

    const movement = inputManager.getMovement()
    const speed = this.getEffectiveStat('speed')

    const newX = this.x + movement.x * speed * 60 * dt
    const newY = this.y + movement.y * speed * 60 * dt

    if (map.isWalkable(newX, this.y) && map.isWalkable(newX + this.width, this.y) &&
        map.isWalkable(newX, this.y + this.height) && map.isWalkable(newX + this.width, this.y + this.height)) {
      this.x = newX
    }
    if (map.isWalkable(this.x, newY) && map.isWalkable(this.x + this.width, newY) &&
        map.isWalkable(this.x, newY + this.height) && map.isWalkable(this.x + this.width, newY + this.height)) {
      this.y = newY
    }

    if (movement.x < 0) this.facing = 'left'
    else if (movement.x > 0) this.facing = 'right'
    if (movement.y < 0) this.facing = 'up'
    else if (movement.y > 0) this.facing = 'down'
  }

  getEffectiveStat(stat: keyof Stats): number {
    let base = this.stats[stat]
    this.activeEffects.forEach(effect => {
      if (effect.stats[stat] !== undefined) {
        base += effect.stats[stat] as number
      }
    })
    return base
  }

  canAttack(): boolean {
    return this.attackCooldown <= 0
  }

  performAttack(): void {
    if (this.canAttack()) {
      const attackSpeed = this.getEffectiveStat('attackSpeed')
      this.attackCooldown = 1 / attackSpeed
    }
  }

  useSkill(skillId: string): boolean {
    const skill = this.skills.find(s => s.id === skillId)
    if (!skill || skill.currentCooldown > 0) return false
    if (this.currentMana < skill.manaCost) return false

    this.currentMana -= skill.manaCost
    skill.currentCooldown = skill.cooldown

    if (skillId === 'heal') {
      const healAmount = Math.floor(this.stats.maxHp * 0.3)
      this.heal(healAmount)
      eventBus.emit('playerHeal', healAmount)
    }

    eventBus.emit('skillUsed', skill)
    return true
  }

  addExp(amount: number): boolean {
    this.level.exp += amount
    let leveledUp = false

    while (this.level.exp >= this.level.expToNext) {
      this.level.exp -= this.level.expToNext
      this.level.level++
      this.level.expToNext = this.getExpForLevel(this.level.level)
      this.levelUp()
      leveledUp = true
    }

    return leveledUp
  }

  private getExpForLevel(level: number): number {
    const base = 100
    const growth = 1.5
    return Math.floor(base * Math.pow(growth, level - 1))
  }

  private levelUp(): void {
    this.stats.maxHp += 20
    this.stats.hp = this.stats.maxHp
    this.stats.attack += 3
    this.stats.defense += 2
    this.maxMana += 10
    this.currentMana = this.maxMana
    eventBus.emit('playerLevelUp', this.level.level)
  }

  addItem(item: InventoryItem): void {
    const existing = this.inventory.find(i => i.type === item.type)
    if (existing) {
      existing.quantity += item.quantity
    } else {
      this.inventory.push({ ...item })
    }
  }

  useItem(itemId: string): boolean {
    const itemIndex = this.inventory.findIndex(i => i.id === itemId)
    if (itemIndex === -1) return false

    const item = this.inventory[itemIndex]

    if (item.effect) {
      if (item.effect.hp && item.duration === undefined) {
        this.heal(item.effect.hp)
      } else {
        const effectKey = `${item.type}_${Date.now()}`
        this.activeEffects.set(effectKey, {
          stats: item.effect,
          remainingTime: item.duration || 30000,
        })
      }
    }

    item.quantity--
    if (item.quantity <= 0) {
      this.inventory.splice(itemIndex, 1)
    }

    eventBus.emit('itemUsed', item)
    return true
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    const screenX = this.x - cameraX
    const screenY = this.y - cameraY

    if (this.invulnerableTime > 0 && Math.floor(this.invulnerableTime * 10) % 2 === 0) {
      return
    }

    ctx.fillStyle = COLORS.player
    ctx.fillRect(screenX, screenY, this.width, this.height)

    ctx.strokeStyle = COLORS.playerBorder
    ctx.lineWidth = 2
    ctx.strokeRect(screenX, screenY, this.width, this.height)

    ctx.fillStyle = COLORS.text
    const eyeOffset = this.facing === 'left' ? -4 : this.facing === 'right' ? 4 : 0
    const eyeY = screenY + this.height * 0.3
    ctx.fillRect(screenX + this.width / 2 - 4 + eyeOffset, eyeY, 3, 3)
    ctx.fillRect(screenX + this.width / 2 + 2 + eyeOffset, eyeY, 3, 3)
  }
}
