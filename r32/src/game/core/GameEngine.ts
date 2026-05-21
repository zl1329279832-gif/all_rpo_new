import type { GameState, SaveData, EnemyType, ItemType, Vector2 } from '@/types/game'
import { GAME_CONFIG } from '@/game/config/GameConfig'
import { MapGenerator } from '@/game/map/MapGenerator'
import { Player } from '@/game/entity/Player'
import { Enemy } from '@/game/entity/Enemy'
import { Item } from '@/game/entity/Item'
import { Projectile } from '@/game/entity/Projectile'
import { CombatSystem } from '@/game/combat/CombatSystem'
import { inputManager } from '@/game/core/InputManager'
import { eventBus } from '@/game/core/EventBus'
import { saveManager } from '@/game/core/SaveManager'
import { COLORS, ENEMIES, ITEMS } from '@/game/config/GameConfig'

export class GameEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private gameState: GameState = 'menu'
  private lastTime: number = 0
  private deltaTime: number = 0
  private animationId: number = 0

  private player!: Player
  private enemies: Enemy[] = []
  private items: Item[] = []
  private projectiles: Projectile[] = []
  private map!: MapGenerator
  private combatSystem: CombatSystem = new CombatSystem()

  private cameraX: number = 0
  private cameraY: number = 0
  private currentLevel: number = 1
  private enemySpawnTimer: number = 0
  private itemSpawnTimer: number = 0

  private onStateChange: ((state: GameState) => void) | null = null
  private onPlayerUpdate: ((player: Player) => void) | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    eventBus.on('playerDied', () => {
      this.gameState = 'gameOver'
      this.onStateChange?.('gameOver')
    })

    eventBus.on('playerLevelUp', () => {
      this.onPlayerUpdate?.(this.player)
    })
  }

  init(): void {
    inputManager.init(this.canvas)
    this.startNewGame()
  }

  startNewGame(): void {
    this.currentLevel = 1
    this.player = new Player(0, 0)
    this.generateLevel()
    this.gameState = 'playing'
    this.onStateChange?.('playing')
    this.onPlayerUpdate?.(this.player)
    saveManager.deleteSave()
  }

  private generateLevel(): void {
    this.map = new MapGenerator(this.currentLevel)
    this.map.generate()

    const spawnPos = this.map.getSpawnPosition()
    this.player.x = spawnPos.x
    this.player.y = spawnPos.y

    this.enemies = []
    this.items = []
    this.projectiles = []

    const enemyCount = 3 + this.currentLevel * 2
    for (let i = 0; i < enemyCount; i++) {
      const pos = this.map.getRandomFloorPosition()
      const enemyTypes: EnemyType[] = this.currentLevel >= 5
        ? ['slime', 'skeleton', 'bat', 'goblin', 'boss']
        : ['slime', 'skeleton', 'bat', 'goblin']
      const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)]
      const enemy = new Enemy(pos.x, pos.y, type)
      this.enemies.push(enemy)
    }

    const itemCount = 2 + Math.floor(this.currentLevel / 2)
    for (let i = 0; i < itemCount; i++) {
      const pos = this.map.getRandomFloorPosition()
      const itemTypes: ItemType[] = ['health_potion', 'attack_boost', 'defense_boost', 'speed_boost', 'coin', 'coin', 'coin']
      const type = itemTypes[Math.floor(Math.random() * itemTypes.length)]
      const item = new Item(pos.x, pos.y, type, type === 'coin' ? Math.floor(Math.random() * 10) + 1 : 1)
      this.items.push(item)
    }
  }

  start(): void {
    this.lastTime = performance.now()
    this.gameLoop()
  }

  private gameLoop = (): void => {
    const currentTime = performance.now()
    this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1)
    this.lastTime = currentTime

    if (this.gameState === 'playing') {
      this.update(this.deltaTime)
    }

    this.render()
    this.animationId = requestAnimationFrame(this.gameLoop)
  }

  private update(dt: number): void {
    this.player.update(dt, { isWalkable: (x, y) => this.map.isWalkable(x, y) })

    if (inputManager.isKeyPressed(' ') || inputManager.isKeyPressed('j')) {
      this.combatSystem.playerAttack(this.player, this.enemies)
    }

    if (inputManager.isKeyPressed('1')) this.player.useSkill('slash')
    if (inputManager.isKeyPressed('2')) {
      if (this.player.useSkill('fireball')) {
        this.createFireballProjectile()
      }
    }
    if (inputManager.isKeyPressed('3')) this.player.useSkill('heal')
    if (inputManager.isKeyPressed('4')) {
      if (this.player.useSkill('dash')) {
        this.performDash()
      }
    }

    for (const enemy of this.enemies) {
      if (!enemy.alive) continue
      enemy.update(dt, this.player, { isWalkable: (x, y) => this.map.isWalkable(x, y) })

      if (enemy.canAttack() && enemy.distanceTo(this.player) <= enemy.attackRange) {
        this.combatSystem.enemyAttack(enemy, this.player)
      }
    }

    for (const projectile of this.projectiles) {
      projectile.update(dt, { isWalkable: (x, y) => this.map.isWalkable(x, y) })

      if (projectile.isPlayerProjectile) {
        for (const enemy of this.enemies) {
          if (enemy.alive && projectile.intersects(enemy)) {
            this.combatSystem.projectileHit(projectile, enemy)
            if (!enemy.alive) {
              this.player.addExp(enemy.expReward)
            }
            break
          }
        }
      } else {
        if (projectile.intersects(this.player)) {
          this.combatSystem.projectileHit(projectile, this.player)
        }
      }
    }

    for (const item of this.items) {
      if (!item.alive) continue
      item.update(dt)

      if (item.intersects(this.player)) {
        this.pickupItem(item)
      }
    }

    this.projectiles = this.projectiles.filter(p => p.alive)
    this.enemies = this.enemies.filter(e => e.alive)
    this.items = this.items.filter(i => i.alive)

    this.combatSystem.updateParticles(dt)

    this.updateCamera()

    if (this.map.isStairs(this.player.centerX, this.player.centerY)) {
      this.nextLevel()
    }

    if (this.player.stats.hp <= 0) {
      this.gameState = 'gameOver'
      this.onStateChange?.('gameOver')
    }

    this.onPlayerUpdate?.(this.player)
    inputManager.endFrame()
  }

  private createFireballProjectile(): void {
    let dx = 0, dy = 0
    switch (this.player.facing) {
      case 'left': dx = -1; break
      case 'right': dx = 1; break
      case 'up': dy = -1; break
      case 'down': dy = 1; break
    }

    const skill = this.player.skills.find(s => s.id === 'fireball')
    const damage = skill ? this.player.getEffectiveStat('attack') * skill.damage : this.player.getEffectiveStat('attack')

    const projectile = new Projectile(
      this.player.centerX, this.player.centerY,
      dx, dy,
      damage,
      this.player.id,
      true
    )
    this.projectiles.push(projectile)
  }

  private performDash(): void {
    const movement = inputManager.getMovement()
    const dashDistance = 150

    let dx = movement.x
    let dy = movement.y

    if (dx === 0 && dy === 0) {
      switch (this.player.facing) {
        case 'left': dx = -1; break
        case 'right': dx = 1; break
        case 'up': dy = -1; break
        case 'down': dy = 1; break
      }
    }

    const newX = this.player.x + dx * dashDistance
    const newY = this.player.y + dy * dashDistance

    if (this.map.isWalkable(newX, this.player.y)) {
      this.player.x = newX
    }
    if (this.map.isWalkable(this.player.x, newY)) {
      this.player.y = newY
    }

    this.player.invulnerableTime = 0.3
  }

  private pickupItem(item: Item): void {
    item.alive = false

    if (item.itemType === 'coin') {
      this.player.gold += item.quantity * 10
    } else {
      const config = ITEMS[item.itemType]
      this.player.addItem({
        id: `${item.itemType}_${Date.now()}`,
        type: item.itemType,
        name: config.name,
        description: config.description,
        icon: config.icon,
        quantity: item.quantity,
        effect: config.effect,
        duration: config.duration,
      })
    }
  }

  private updateCamera(): void {
    const targetX = this.player.centerX - GAME_CONFIG.canvasWidth / 2
    const targetY = this.player.centerY - GAME_CONFIG.canvasHeight / 2

    this.cameraX += (targetX - this.cameraX) * 0.1
    this.cameraY += (targetY - this.cameraY) * 0.1

    const maxX = GAME_CONFIG.mapWidth * GAME_CONFIG.tileSize - GAME_CONFIG.canvasWidth
    const maxY = GAME_CONFIG.mapHeight * GAME_CONFIG.tileSize - GAME_CONFIG.canvasHeight
    this.cameraX = Math.max(0, Math.min(this.cameraX, maxX))
    this.cameraY = Math.max(0, Math.min(this.cameraY, maxY))
  }

  private render(): void {
    this.ctx.fillStyle = '#1a1a2e'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    if (this.gameState === 'menu') {
      this.renderMenu()
      return
    }

    this.renderMap()

    for (const item of this.items) {
      item.draw(this.ctx, this.cameraX, this.cameraY)
    }

    for (const enemy of this.enemies) {
      enemy.draw(this.ctx, this.cameraX, this.cameraY)
    }

    this.player.draw(this.ctx, this.cameraX, this.cameraY)

    for (const projectile of this.projectiles) {
      projectile.draw(this.ctx, this.cameraX, this.cameraY)
    }

    this.combatSystem.drawParticles(this.ctx, this.cameraX, this.cameraY)
    this.combatSystem.drawDamageTexts(this.ctx, this.cameraX, this.cameraY)

    this.renderMinimap()
  }

  private renderMenu(): void {
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = 'bold 48px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText('Roguelike', this.canvas.width / 2, this.canvas.height / 2 - 50)

    this.ctx.font = '20px Arial'
    this.ctx.fillText('按任意键开始', this.canvas.width / 2, this.canvas.height / 2 + 30)
  }

  private renderMap(): void {
    const tiles = this.map.getTiles()
    const tileSize = GAME_CONFIG.tileSize

    const startX = Math.max(0, Math.floor(this.cameraX / tileSize))
    const startY = Math.max(0, Math.floor(this.cameraY / tileSize))
    const endX = Math.min(GAME_CONFIG.mapWidth, Math.ceil((this.cameraX + this.canvas.width) / tileSize) + 1)
    const endY = Math.min(GAME_CONFIG.mapHeight, Math.ceil((this.cameraY + this.canvas.height) / tileSize) + 1)

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tile = tiles[y][x]
        const screenX = x * tileSize - this.cameraX
        const screenY = y * tileSize - this.cameraY

        if (tile.type === 'wall') {
          this.ctx.fillStyle = COLORS.wall
          this.ctx.fillRect(screenX, screenY, tileSize, tileSize)
          this.ctx.strokeStyle = COLORS.wallBorder
          this.ctx.lineWidth = 1
          this.ctx.strokeRect(screenX, screenY, tileSize, tileSize)
        } else if (tile.type === 'floor') {
          this.ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.floor : COLORS.floorAlt
          this.ctx.fillRect(screenX, screenY, tileSize, tileSize)
        } else if (tile.type === 'stairs') {
          this.ctx.fillStyle = COLORS.floor
          this.ctx.fillRect(screenX, screenY, tileSize, tileSize)
          this.ctx.fillStyle = COLORS.stairs
          this.ctx.font = 'bold 20px Arial'
          this.ctx.textAlign = 'center'
          this.ctx.textBaseline = 'middle'
          this.ctx.fillText('▼', screenX + tileSize / 2, screenY + tileSize / 2)
        }
      }
    }
  }

  private renderMinimap(): void {
    const minimapSize = 150
    const padding = 10
    const x = this.canvas.width - minimapSize - padding
    const y = padding

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(x, y, minimapSize, minimapSize)

    const tiles = this.map.getTiles()
    const scaleX = minimapSize / GAME_CONFIG.mapWidth
    const scaleY = minimapSize / GAME_CONFIG.mapHeight

    for (let ty = 0; ty < GAME_CONFIG.mapHeight; ty++) {
      for (let tx = 0; tx < GAME_CONFIG.mapWidth; tx++) {
        const tile = tiles[ty][tx]
        if (tile.type !== 'wall') {
          this.ctx.fillStyle = tile.type === 'stairs' ? '#ffd700' : '#4a4a4a'
          this.ctx.fillRect(x + tx * scaleX, y + ty * scaleY, Math.ceil(scaleX), Math.ceil(scaleY))
        }
      }
    }

    const playerTileX = Math.floor(this.player.centerX / GAME_CONFIG.tileSize)
    const playerTileY = Math.floor(this.player.centerY / GAME_CONFIG.tileSize)
    this.ctx.fillStyle = COLORS.player
    this.ctx.fillRect(x + playerTileX * scaleX - 1, y + playerTileY * scaleY - 1, 3, 3)

    for (const enemy of this.enemies) {
      const enemyTileX = Math.floor(enemy.centerX / GAME_CONFIG.tileSize)
      const enemyTileY = Math.floor(enemy.centerY / GAME_CONFIG.tileSize)
      this.ctx.fillStyle = COLORS.enemy
      this.ctx.fillRect(x + enemyTileX * scaleX, y + enemyTileY * scaleY, 2, 2)
    }
  }

  pause(): void {
    if (this.gameState === 'playing') {
      this.gameState = 'paused'
      this.onStateChange?.('paused')
    }
  }

  resume(): void {
    if (this.gameState === 'paused') {
      this.gameState = 'playing'
      this.onStateChange?.('playing')
      this.lastTime = performance.now()
    }
  }

  nextLevel(): void {
    this.currentLevel++
    this.generateLevel()
    this.gameState = 'levelComplete'
    this.onStateChange?.('levelComplete')
    this.saveGame()
  }

  continueToNextLevel(): void {
    this.gameState = 'playing'
    this.onStateChange?.('playing')
    this.lastTime = performance.now()
  }

  saveGame(): void {
    const saveData: SaveData = {
      player: {
        stats: this.player.stats,
        level: this.player.level,
        position: { x: this.player.x, y: this.player.y },
        gold: this.player.gold,
        inventory: this.player.inventory,
        skills: this.player.skills,
      },
      map: {
        level: this.currentLevel,
        seed: this.map.getSeed(),
        rooms: this.map.getRooms(),
        tiles: this.map.getTiles(),
      },
      timestamp: Date.now(),
    }
    saveManager.save(saveData)
  }

  loadGame(): boolean {
    const saveData = saveManager.load()
    if (!saveData) return false

    this.currentLevel = saveData.map.level
    this.player = new Player(saveData.player.position.x, saveData.player.position.y)
    Object.assign(this.player.stats, saveData.player.stats)
    Object.assign(this.player.level, saveData.player.level)
    this.player.gold = saveData.player.gold
    this.player.inventory = saveData.player.inventory
    this.player.skills = saveData.player.skills

    this.map = new MapGenerator(this.currentLevel, saveData.map.seed)
    this.map['tiles'] = saveData.map.tiles
    this.map['rooms'] = saveData.map.rooms

    this.gameState = 'playing'
    this.onStateChange?.('playing')
    this.onPlayerUpdate?.(this.player)

    return true
  }

  useInventoryItem(itemId: string): boolean {
    return this.player.useItem(itemId)
  }

  getGameState(): GameState {
    return this.gameState
  }

  getPlayer(): Player {
    return this.player
  }

  getCurrentLevel(): number {
    return this.currentLevel
  }

  setOnStateChange(callback: (state: GameState) => void): void {
    this.onStateChange = callback
  }

  setOnPlayerUpdate(callback: (player: Player) => void): void {
    this.onPlayerUpdate = callback
  }

  destroy(): void {
    cancelAnimationFrame(this.animationId)
    inputManager.destroy()
    eventBus.clear()
  }
}
