export interface Vector2 {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export type GameState = 'menu' | 'playing' | 'paused' | 'levelComplete' | 'gameOver'

export type TileType = 'wall' | 'floor' | 'door' | 'stairs'

export interface Tile {
  type: TileType
  x: number
  y: number
  walkable: boolean
}

export interface Room {
  x: number
  y: number
  width: number
  height: number
  centerX: number
  centerY: number
  connected: boolean
}

export type EntityType = 'player' | 'enemy' | 'item' | 'projectile' | 'particle'

export type EnemyType = 'slime' | 'skeleton' | 'bat' | 'goblin' | 'boss'

export type ItemType = 'health_potion' | 'attack_boost' | 'defense_boost' | 'speed_boost' | 'coin' | 'key'

export interface Stats {
  maxHp: number
  hp: number
  attack: number
  defense: number
  speed: number
  attackSpeed: number
  critRate: number
  critDamage: number
}

export interface InventoryItem {
  id: string
  type: ItemType
  name: string
  description: string
  icon: string
  quantity: number
  effect?: Partial<Stats>
  duration?: number
}

export interface Skill {
  id: string
  name: string
  icon: string
  cooldown: number
  currentCooldown: number
  damage: number
  manaCost: number
  description: string
}

export interface LevelData {
  level: number
  exp: number
  expToNext: number
}

export interface SaveData {
  player: {
    stats: Stats
    level: LevelData
    position: Vector2
    gold: number
    inventory: InventoryItem[]
    skills: Skill[]
  }
  map: {
    level: number
    seed: number
    rooms: Room[]
    tiles: Tile[][]
  }
  timestamp: number
}

export interface GameConfig {
  canvasWidth: number
  canvasHeight: number
  tileSize: number
  mapWidth: number
  mapHeight: number
  maxRooms: number
  minRoomSize: number
  maxRoomSize: number
}

export interface DamageInfo {
  damage: number
  isCrit: boolean
  position: Vector2
  timestamp: number
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}
