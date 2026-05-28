import type { Position, Berth, YardSlot } from '@/types'

export const MAP_WIDTH = 1200
export const MAP_HEIGHT = 700

export const BERTHS: Berth[] = [
  { id: 'berth-1', position: { x: 100, y: 150 }, ship: null, crane: null },
  { id: 'berth-2', position: { x: 100, y: 300 }, ship: null, crane: null },
  { id: 'berth-3', position: { x: 100, y: 450 }, ship: null, crane: null },
  { id: 'berth-4', position: { x: 100, y: 600 }, ship: null, crane: null }
]

export const generateYardSlots = (): YardSlot[] => {
  const slots: YardSlot[] = []
  const zones: Array<'normal' | 'cold' | 'dangerous'> = ['normal', 'normal', 'normal', 'cold', 'dangerous']
  
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 8; col++) {
      const zone = zones[row]
      slots.push({
        id: `yard-${row}-${col}`,
        position: {
          x: 400 + col * 90,
          y: 100 + row * 110
        },
        container: null,
        zone
      })
    }
  }
  return slots
}

export const TRUCK_SPAWN: Position = { x: 1100, y: 350 }
export const GATE_POSITION: Position = { x: 1150, y: 350 }

export const getDistance = (p1: Position, p2: Position): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

export const findPath = (from: Position, to: Position): Position[] => {
  const path: Position[] = []
  const midX = (from.x + to.x) / 2
  
  if (Math.abs(to.x - from.x) > 200) {
    path.push({ x: midX, y: from.y })
    path.push({ x: midX, y: to.y })
  }
  
  path.push(to)
  return path
}
