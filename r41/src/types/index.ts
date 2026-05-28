export type CargoType = 'normal' | 'priority' | 'cold' | 'dangerous'

export type ContainerSize = 20 | 40

export interface Cargo {
  id: string
  type: CargoType
  size: ContainerSize
  weight: number
  destination: string
}

export interface Order {
  id: string
  cargo: Cargo
  deadline: number
  reward: number
  penalty: number
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  createdAt: number
}

export interface Ship {
  id: string
  name: string
  containers: Container[]
  maxCapacity: number
  position: Position
  targetBerth: string | null
  status: 'arriving' | 'docking' | 'loading' | 'unloading' | 'departing' | 'waiting'
  eta: number
}

export interface Container {
  id: string
  cargo: Cargo
  position: Position
  location: 'ship' | 'yard' | 'truck' | 'crane'
  locationId: string
}

export interface Truck {
  id: string
  position: Position
  targetPosition: Position | null
  container: Container | null
  status: 'idle' | 'moving' | 'loading' | 'unloading'
  speed: number
  path: Position[]
  pathIndex: number
}

export interface Crane {
  id: string
  position: Position
  container: Container | null
  status: 'idle' | 'loading' | 'unloading'
  efficiency: number
  level: number
}

export interface Berth {
  id: string
  position: Position
  ship: Ship | null
  crane: Crane | null
}

export interface YardSlot {
  id: string
  position: Position
  container: Container | null
  zone: 'normal' | 'cold' | 'dangerous'
}

export interface Position {
  x: number
  y: number
}

export interface LevelConfig {
  id: number
  name: string
  difficulty: 'easy' | 'medium' | 'hard'
  duration: number
  targetOrders: number
  targetRevenue: number
  initialMoney: number
  initialTrucks: number
  initialCranes: number
  orderFrequency: number
  eventChance: number
}

export interface GameEvent {
  id: string
  type: 'congestion' | 'weather' | 'equipment_failure' | 'surge'
  message: string
  duration: number
  effect: Record<string, number>
  startTime: number
}

export interface GameStats {
  completedOrders: number
  failedOrders: number
  totalRevenue: number
  totalExpenses: number
  congestionEvents: number
  averageDeliveryTime: number
}

export interface SaveData {
  currentLevel: number
  unlockedLevels: number[]
  highScores: Record<number, number>
  totalMoney: number
  upgrades: Record<string, number>
  timestamp: number
}
