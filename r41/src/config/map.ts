import type { Position, Berth, YardSlot } from '@/types'

export const MAP_WIDTH = 1200
export const MAP_HEIGHT = 700

export const BERTHS: Berth[] = [
  { id: 'berth-1', position: { x: 120, y: 120 }, ship: null, crane: null, queue: [] },
  { id: 'berth-2', position: { x: 120, y: 270 }, ship: null, crane: null, queue: [] },
  { id: 'berth-3', position: { x: 120, y: 420 }, ship: null, crane: null, queue: [] },
  { id: 'berth-4', position: { x: 120, y: 570 }, ship: null, crane: null, queue: [] }
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
          x: 420 + col * 85,
          y: 80 + row * 120
        },
        container: null,
        zone,
        row,
        col
      })
    }
  }
  return slots
}

export const TRUCK_SPAWN: Position = { x: 1050, y: 350 }
export const GATE_POSITION: Position = { x: 1100, y: 350 }

export const getDistance = (p1: Position, p2: Position): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

export const findPath = (from: Position, to: Position): Position[] => {
  const path: Position[] = []
  const midX = 300
  
  if (from.x > midX && to.x <= midX) {
    path.push({ x: midX, y: from.y })
    path.push({ x: midX, y: to.y })
  } else if (from.x <= midX && to.x > midX) {
    path.push({ x: midX, y: from.y })
    path.push({ x: midX, y: to.y })
  } else if (Math.abs(to.y - from.y) > 100) {
    path.push({ x: from.x, y: to.y })
  }
  
  path.push(to)
  return path
}
