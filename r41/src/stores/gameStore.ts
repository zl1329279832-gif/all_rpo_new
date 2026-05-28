import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  Order, Ship, Truck, Crane, Container, 
  GameStats, GameEvent, Position, SaveData
} from '@/types'
import { LEVELS, getLevelById } from '@/config/levels'
import { BERTHS, generateYardSlots, TRUCK_SPAWN, findPath } from '@/config/map'
import { generateOrder, generateShip } from '@/systems/orderSystem'
import { checkCongestion, triggerRandomEvent } from '@/systems/eventSystem'

export const useGameStore = defineStore('game', () => {
  const isRunning = ref(false)
  const isPaused = ref(false)
  const currentLevelId = ref(1)
  const gameTime = ref(0)
  const money = ref(0)
  const score = ref(0)
  
  const orders = ref<Order[]>([])
  const ships = ref<Ship[]>([])
  const trucks = ref<Truck[]>([])
  const containers = ref<Container[]>([])
  const cranes = ref<Crane[]>([])
  const berths = ref([...BERTHS])
  const yardSlots = ref(generateYardSlots())
  const events = ref<GameEvent[]>([])
  const stats = ref<GameStats>({
    completedOrders: 0,
    failedOrders: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    congestionEvents: 0,
    averageDeliveryTime: 0
  })

  const currentLevel = computed(() => getLevelById(currentLevelId.value))
  
  const timeRemaining = computed(() => {
    if (!currentLevel.value) return 0
    return Math.max(0, currentLevel.value.duration - gameTime.value)
  })

  const isGameOver = computed(() => {
    return timeRemaining.value <= 0 || !isRunning.value
  })

  const isVictory = computed(() => {
    if (!currentLevel.value || timeRemaining.value > 0) return false
    return stats.value.completedOrders >= currentLevel.value.targetOrders &&
           stats.value.totalRevenue >= currentLevel.value.targetRevenue
  })

  const initializeGame = (levelId: number) => {
    const level = getLevelById(levelId)
    if (!level) return

    currentLevelId.value = levelId
    gameTime.value = 0
    money.value = level.initialMoney
    score.value = 0
    isRunning.value = true
    isPaused.value = false

    orders.value = []
    ships.value = []
    containers.value = []
    events.value = []
    berths.value = BERTHS.map(b => ({ ...b, ship: null, crane: null }))
    yardSlots.value = generateYardSlots()
    
    stats.value = {
      completedOrders: 0,
      failedOrders: 0,
      totalRevenue: 0,
      totalExpenses: 0,
      congestionEvents: 0,
      averageDeliveryTime: 0
    }

    trucks.value = Array.from({ length: level.initialTrucks }, (_, i) => ({
      id: `truck-${i}`,
      position: { ...TRUCK_SPAWN },
      targetPosition: null,
      container: null,
      status: 'idle' as const,
      speed: 3 + i * 0.5,
      path: [] as Position[],
      pathIndex: 0
    }))

    cranes.value = Array.from({ length: level.initialCranes }, (_, i) => ({
      id: `crane-${i}`,
      position: berths.value[i]?.position || { x: 100, y: 150 + i * 150 },
      container: null,
      status: 'idle' as const,
      efficiency: 1,
      level: 1
    }))

    for (let i = 0; i < Math.min(level.initialCranes, berths.value.length); i++) {
      berths.value[i].crane = cranes.value[i]
    }
  }

  const updateGame = (deltaTime: number) => {
    if (!isRunning.value || isPaused.value) return

    gameTime.value += deltaTime

    const level = currentLevel.value
    if (level && Math.random() < deltaTime / level.orderFrequency) {
      const newOrder = generateOrder(gameTime.value)
      orders.value.push(newOrder)
    }

    if (level && Math.random() < level.eventChance * deltaTime / 60) {
      const event = triggerRandomEvent(gameTime.value)
      if (event) {
        events.value.push(event)
        if (event.type === 'congestion') {
          stats.value.congestionEvents++
        }
      }
    }

    updateShips(deltaTime)
    updateTrucks(deltaTime)
    updateCranes(deltaTime)
    updateOrders()
    updateEvents()
    checkCongestion(ships.value, trucks.value)
  }

  const updateShips = (deltaTime: number) => {
    ships.value.forEach(ship => {
      if (ship.status === 'arriving') {
        ship.eta -= deltaTime
        if (ship.eta <= 0) {
          const availableBerth = berths.value.find(b => !b.ship)
          if (availableBerth) {
            ship.status = 'docking'
            ship.targetBerth = availableBerth.id
            availableBerth.ship = ship
          } else {
            ship.status = 'waiting'
          }
        }
      } else if (ship.status === 'departing') {
        ship.eta -= deltaTime
        if (ship.eta <= 0) {
          const berth = berths.value.find(b => b.ship?.id === ship.id)
          if (berth) berth.ship = null
          ships.value = ships.value.filter(s => s.id !== ship.id)
        }
      }
    })

    if (ships.value.length < 3 && Math.random() < deltaTime / 30) {
      const newShip = generateShip(gameTime.value)
      ships.value.push(newShip)
    }
  }

  const updateTrucks = (deltaTime: number) => {
    trucks.value.forEach(truck => {
      if (truck.status === 'moving' && truck.path.length > 0) {
        const target = truck.path[truck.pathIndex]
        if (target) {
          const dx = target.x - truck.position.x
          const dy = target.y - truck.position.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist < 5) {
            truck.pathIndex++
            if (truck.pathIndex >= truck.path.length) {
              truck.status = 'idle'
              truck.path = []
              truck.pathIndex = 0
            }
          } else {
            const speed = truck.speed * deltaTime * 60
            truck.position.x += (dx / dist) * speed
            truck.position.y += (dy / dist) * speed
          }
        }
      }
    })
  }

  const updateCranes = (deltaTime: number) => {
    cranes.value.forEach(crane => {
      if (crane.status !== 'idle') {
        crane.efficiency -= deltaTime * 0.1
        if (crane.efficiency <= 0) {
          crane.status = 'idle'
          crane.efficiency = 1
        }
      }
    })
  }

  const updateOrders = () => {
    orders.value.forEach(order => {
      if (order.status === 'in_progress' && gameTime.value > order.deadline) {
        order.status = 'failed'
        money.value -= order.penalty
        stats.value.failedOrders++
        stats.value.totalExpenses += order.penalty
      }
    })
  }

  const updateEvents = () => {
    events.value = events.value.filter(event => {
      return gameTime.value - event.startTime < event.duration
    })
  }

  const dispatchTruck = (truckId: string, targetPosition: Position) => {
    const truck = trucks.value.find(t => t.id === truckId)
    if (!truck || truck.status !== 'idle') return false

    truck.targetPosition = targetPosition
    truck.path = [{ x: truck.position.x, y: truck.position.y }, ...findPath(truck.position, targetPosition)]
    truck.pathIndex = 0
    truck.status = 'moving'
    return true
  }

  const completeOrder = (orderId: string) => {
    const order = orders.value.find(o => o.id === orderId)
    if (!order || order.status === 'completed' || order.status === 'failed') return

    order.status = 'completed'
    money.value += order.reward
    score.value += order.reward
    stats.value.completedOrders++
    stats.value.totalRevenue += order.reward
    
    const deliveryTime = gameTime.value - order.createdAt
    const totalCompleted = stats.value.completedOrders
    stats.value.averageDeliveryTime = 
      (stats.value.averageDeliveryTime * (totalCompleted - 1) + deliveryTime) / totalCompleted
  }

  const saveGame = (): SaveData => {
    const saveData: SaveData = {
      currentLevel: currentLevelId.value,
      unlockedLevels: LEVELS.filter(l => l.id <= currentLevelId.value).map(l => l.id),
      highScores: { [currentLevelId.value]: score.value },
      totalMoney: money.value,
      upgrades: {},
      timestamp: Date.now()
    }
    
    localStorage.setItem('port-tycoon-save', JSON.stringify(saveData))
    return saveData
  }

  const loadGame = (): SaveData | null => {
    const saved = localStorage.getItem('port-tycoon-save')
    if (saved) {
      return JSON.parse(saved)
    }
    return null
  }

  const pauseGame = () => {
    isPaused.value = true
  }

  const resumeGame = () => {
    isPaused.value = false
  }

  const endGame = () => {
    isRunning.value = false
  }

  return {
    isRunning,
    isPaused,
    currentLevelId,
    gameTime,
    money,
    score,
    orders,
    ships,
    trucks,
    containers,
    cranes,
    berths,
    yardSlots,
    events,
    stats,
    currentLevel,
    timeRemaining,
    isGameOver,
    isVictory,
    initializeGame,
    updateGame,
    dispatchTruck,
    completeOrder,
    saveGame,
    loadGame,
    pauseGame,
    resumeGame,
    endGame
  }
})
