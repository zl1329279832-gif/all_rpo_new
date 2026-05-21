import type { Room, Tile, TileType } from '@/types/game'
import { GAME_CONFIG } from '@/game/config/GameConfig'

export class MapGenerator {
  private tiles: Tile[][] = []
  private rooms: Room[] = []
  private seed: number
  private level: number

  constructor(level: number = 1, seed?: number) {
    this.level = level
    this.seed = seed || Date.now()
  }

  generate(): { tiles: Tile[][]; rooms: Room[] } {
    this.initializeTiles()
    this.generateRooms()
    this.connectRooms()
    this.placeStairs()
    return { tiles: this.tiles, rooms: this.rooms }
  }

  private initializeTiles(): void {
    this.tiles = []
    for (let y = 0; y < GAME_CONFIG.mapHeight; y++) {
      this.tiles[y] = []
      for (let x = 0; x < GAME_CONFIG.mapWidth; x++) {
        this.tiles[y][x] = {
          type: 'wall',
          x,
          y,
          walkable: false,
        }
      }
    }
  }

  private generateRooms(): void {
    const maxRooms = GAME_CONFIG.maxRooms + Math.floor(this.level / 2)
    let attempts = 0

    while (this.rooms.length < maxRooms && attempts < maxRooms * 3) {
      attempts++

      const width = this.randomRange(GAME_CONFIG.minRoomSize, GAME_CONFIG.maxRoomSize)
      const height = this.randomRange(GAME_CONFIG.minRoomSize, GAME_CONFIG.maxRoomSize)
      const x = this.randomRange(1, GAME_CONFIG.mapWidth - width - 1)
      const y = this.randomRange(1, GAME_CONFIG.mapHeight - height - 1)

      const room: Room = {
        x, y, width, height,
        centerX: Math.floor(x + width / 2),
        centerY: Math.floor(y + height / 2),
        connected: this.rooms.length === 0,
      }

      if (this.roomCollides(room)) continue

      this.carveRoom(room)
      this.rooms.push(room)
    }
  }

  private roomCollides(room: Room): boolean {
    for (const existing of this.rooms) {
      if (
        room.x <= existing.x + existing.width + 1 &&
        room.x + room.width + 1 >= existing.x &&
        room.y <= existing.y + existing.height + 1 &&
        room.y + room.height + 1 >= existing.y
      ) {
        return true
      }
    }
    return false
  }

  private carveRoom(room: Room): void {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (this.isValidTile(x, y)) {
          this.tiles[y][x] = {
            type: 'floor',
            x,
            y,
            walkable: true,
          }
        }
      }
    }
  }

  private connectRooms(): void {
    for (let i = 1; i < this.rooms.length; i++) {
      const current = this.rooms[i]
      let nearestIndex = 0
      let nearestDist = Infinity

      for (let j = 0; j < i; j++) {
        const other = this.rooms[j]
        const dist = Math.abs(current.centerX - other.centerX) + Math.abs(current.centerY - other.centerY)
        if (dist < nearestDist) {
          nearestDist = dist
          nearestIndex = j
        }
      }

      this.createCorridor(this.rooms[nearestIndex], current)
      current.connected = true
    }
  }

  private createCorridor(room1: Room, room2: Room): void {
    if (Math.random() < 0.5) {
      this.carveHorizontalCorridor(room1.centerX, room2.centerX, room1.centerY)
      this.carveVerticalCorridor(room1.centerY, room2.centerY, room2.centerX)
    } else {
      this.carveVerticalCorridor(room1.centerY, room2.centerY, room1.centerX)
      this.carveHorizontalCorridor(room1.centerX, room2.centerX, room2.centerY)
    }
  }

  private carveHorizontalCorridor(x1: number, x2: number, y: number): void {
    const start = Math.min(x1, x2)
    const end = Math.max(x1, x2)

    for (let x = start; x <= end; x++) {
      this.setTile(x, y, 'floor', true)
      this.setTile(x, y + 1, 'floor', true)
    }
  }

  private carveVerticalCorridor(y1: number, y2: number, x: number): void {
    const start = Math.min(y1, y2)
    const end = Math.max(y1, y2)

    for (let y = start; y <= end; y++) {
      this.setTile(x, y, 'floor', true)
      this.setTile(x + 1, y, 'floor', true)
    }
  }

  private setTile(x: number, y: number, type: TileType, walkable: boolean): void {
    if (this.isValidTile(x, y)) {
      this.tiles[y][x] = { type, x, y, walkable }
    }
  }

  private placeStairs(): void {
    if (this.rooms.length > 1) {
      const lastRoom = this.rooms[this.rooms.length - 1]
      this.setTile(lastRoom.centerX, lastRoom.centerY, 'stairs', true)
    }
  }

  private isValidTile(x: number, y: number): boolean {
    return x >= 0 && x < GAME_CONFIG.mapWidth && y >= 0 && y < GAME_CONFIG.mapHeight
  }

  isWalkable(x: number, y: number): boolean {
    const tileX = Math.floor(x / GAME_CONFIG.tileSize)
    const tileY = Math.floor(y / GAME_CONFIG.tileSize)

    if (!this.isValidTile(tileX, tileY)) return false
    return this.tiles[tileY][tileX].walkable
  }

  isStairs(x: number, y: number): boolean {
    const tileX = Math.floor(x / GAME_CONFIG.tileSize)
    const tileY = Math.floor(y / GAME_CONFIG.tileSize)

    if (!this.isValidTile(tileX, tileY)) return false
    return this.tiles[tileY][tileX].type === 'stairs'
  }

  getRandomFloorPosition(): { x: number; y: number } {
    const room = this.rooms[Math.floor(Math.random() * this.rooms.length)]
    const x = (room.x + Math.random() * (room.width - 1)) * GAME_CONFIG.tileSize
    const y = (room.y + Math.random() * (room.height - 1)) * GAME_CONFIG.tileSize
    return { x, y }
  }

  getSpawnPosition(): { x: number; y: number } {
    const room = this.rooms[0]
    return {
      x: room.centerX * GAME_CONFIG.tileSize,
      y: room.centerY * GAME_CONFIG.tileSize,
    }
  }

  private randomRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  getTiles(): Tile[][] {
    return this.tiles
  }

  getRooms(): Room[] {
    return this.rooms
  }

  getLevel(): number {
    return this.level
  }

  getSeed(): number {
    return this.seed
  }
}
