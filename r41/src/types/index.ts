export type CargoType = 'normal' | 'priority' | 'cold' | 'dangerous'

export type ContainerSize = 20 | 40

export type ContainerStatus = 
  | 'on_ship'
  | 'unloading'
  | 'on_truck'
  | 'in_yard'
  | 'loading_out'
  | 'delivered'

export interface Cargo {
  id: string
  type: CargoType
  size: ContainerSize
  weight: number
  destination: string
}

export interface Order {
  id: string
  containerId: string
  cargo: Cargo
  deadline: number
  reward: number
  penalty: number
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  createdAt: number
  completedAt?: number
}

export interface Ship {
  id: string
  name: string
  containers: Container[]
  maxCapacity: number
  position: Position
  targetBerth: string | null
  status: 'arriving' | 'docking' | 'docked' | 'unloading' | 'departing' | 'waiting'
  eta: number
}

export interface Container {
  id: string
  cargo: Cargo
  position: Position
  status: ContainerStatus
  location: 'ship' | 'crane' | 'truck' | 'yard' | 'gate'
  locationId: string
  orderId?: string
}

export interface Truck {
  id: string
  position: Position
  targetPosition: Position | null
  container: Container | null
  status: 'idle' | 'moving_to_berth' | 'loading' | 'moving_to_yard' | 'unloading' | 'moving_to_gate'
  speed: number
  path: Position[]
  pathIndex: number
  targetYardSlotId?: string
}

export interface Crane {
  id: string
  position: Position
  container: Container | null
  status: 'idle' | 'picking' | 'dropping'
  efficiency: number
  level: number
  targetContainerId?: string
  progress: number
}

export interface Berth {
  id: string
  position: Position
  ship: Ship | null
  crane: Crane | null
  queue: Container[]
}

export interface YardSlot {
  id: string
  position: Position
  container: Container | null
  zone: 'normal' | 'cold' | 'dangerous'
  row: number
  col: number
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
  containersUnloaded: number
  containersDelivered: number
}

export interface SaveData {
  currentLevel: number
  unlockedLevels: number[]
  highScores: Record<number, number>
  totalMoney: number
  upgrades: Record<string, number>
  gameState?: {
    gameTime: number
    money: number
    score: number
    orders: Order[]
    ships: Ship[]
    trucks: Truck[]
    containers: Container[]
    cranes: Crane[]
    yardSlots: YardSlot[]
    stats: GameStats
  }
  timestamp: number
}
