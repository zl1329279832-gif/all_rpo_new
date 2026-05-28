import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  Order, Ship, Truck, Crane, Container, 
  GameStats, GameEvent, Position, SaveData, Berth, YardSlot
} from '@/types'
import { LEVELS, getLevelById } from '@/config/levels'
import { BERTHS, generateYardSlots, TRUCK_SPAWN, GATE_POSITION, findPath } from '@/config/map'
import { generateShip, getCargoTypeColor } from '@/systems/orderSystem'
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
  const berths = ref<Berth[]>([])
  const yardSlots = ref<YardSlot[]>([])
  const events = ref<GameEvent[]>([])
  const stats = ref<GameStats>({
    completedOrders: 0,
    failedOrders: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    congestionEvents: 0,
    averageDeliveryTime: 0,
    containersUnloaded: 0,
    containersDelivered: 0
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

  const idleTrucks = computed(() => trucks.value.filter(t => t.status === 'idle'))
  const idleCranes = computed(() => cranes.value.filter(c => c.status === 'idle'))

  const initializeGame = (levelId: number, loadSaved = false) => {
    const level = getLevelById(levelId)
    if (!level) return

    if (loadSaved) {
      const saved = loadGame()
      if (saved && saved.gameState) {
        currentLevelId.value = saved.currentLevel
        gameTime.value = saved.gameState.gameTime
        money.value = saved.gameState.money
        score.value = saved.gameState.score
        orders.value = saved.gameState.orders
        ships.value = saved.gameState.ships
        trucks.value = saved.gameState.trucks
        containers.value = saved.gameState.containers
        cranes.value = saved.gameState.cranes
        yardSlots.value = saved.gameState.yardSlots
        stats.value = saved.gameState.stats
        isRunning.value = true
        isPaused.value = false
        berths.value = BERTHS.map((b, i) => ({
          ...b,
          ship: null,
          crane: cranes.value[i] || null,
          queue: []
        }))
        return
      }
    }

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
    berths.value = BERTHS.map(b => ({ ...b, ship: null, crane: null, queue: [] }))
    yardSlots.value = generateYardSlots()
    
    stats.value = {
      completedOrders: 0,
      failedOrders: 0,
      totalRevenue: 0,
      totalExpenses: 0,
      congestionEvents: 0,
      averageDeliveryTime: 0,
      containersUnloaded: 0,
      containersDelivered: 0
    }

    trucks.value = Array.from({ length: level.initialTrucks }, (_, i) => ({
      id: `truck-${i}`,
      position: { x: TRUCK_SPAWN.x, y: TRUCK_SPAWN.y + i * 50 },
      targetPosition: null,
      container: null,
      status: 'idle' as const,
      speed: 2 + i * 0.3,
      path: [] as Position[],
      pathIndex: 0
    }))

    cranes.value = Array.from({ length: level.initialCranes }, (_, i) => ({
      id: `crane-${i}`,
      position: { x: berths.value[i]?.position.x + 40 || 100, y: berths.value[i]?.position.y || 150 },
      container: null,
      status: 'idle' as const,
      efficiency: 1,
      level: 1,
      progress: 0
    }))

    for (let i = 0; i < Math.min(level.initialCranes, berths.value.length); i++) {
      berths.value[i].crane = cranes.value[i]
    }

    const initialShip = generateShip(0)
    ships.value.push(initialShip)
  }

  const updateGame = (deltaTime: number) => {
    if (!isRunning.value || isPaused.value) return

    gameTime.value += deltaTime

    const level = currentLevel.value
    if (level && ships.value.length < 4 && Math.random() < deltaTime / 40) {
      const newShip = generateShip(gameTime.value)
      ships.value.push(newShip)
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
    updateCranes(deltaTime)
    updateTrucks(deltaTime)
    updateOrders()
    updateEvents()
    checkCongestion(ships.value, trucks.value)
  }

  const updateShips = (deltaTime: number) => {
    ships.value.forEach(ship => {
      if (ship.status === 'arriving') {
        ship.eta -= deltaTime
        ship.position.x = Math.min(100, ship.position.x + deltaTime * 30)
        if (ship.eta <= 0) {
          const availableBerth = berths.value.find(b => !b.ship)
          if (availableBerth) {
            ship.status = 'docking'
            ship.targetBerth = availableBerth.id
            ship.position = { ...availableBerth.position }
            availableBerth.ship = ship
            availableBerth.queue = [...ship.containers]
            setTimeout(() => {
              ship.status = 'docked'
              createOrdersFromShip(ship)
            }, 2000)
          } else {
            ship.status = 'waiting'
          }
        }
      } else if (ship.status === 'docked' && ship.containers.length === 0) {
        ship.status = 'departing'
        ship.eta = 5
      } else if (ship.status === 'departing') {
        ship.eta -= deltaTime
        ship.position.x -= deltaTime * 50
        if (ship.eta <= 0) {
          const berth = berths.value.find(b => b.ship?.id === ship.id)
          if (berth) {
            berth.ship = null
            berth.queue = []
          }
          ships.value = ships.value.filter(s => s.id !== ship.id)
        }
      }
    })
  }

  const createOrdersFromShip = (ship: Ship) => {
    ship.containers.forEach(container => {
      const baseReward = container.cargo.size === 40 ? 800 : 500
      let rewardMultiplier = 1
      let deadlineBonus = 0
      
      if (container.cargo.type === 'priority') {
        rewardMultiplier = 1.5
        deadlineBonus = -60
      } else if (container.cargo.type === 'cold') {
        rewardMultiplier = 1.3
        deadlineBonus = -30
      } else if (container.cargo.type === 'dangerous') {
        rewardMultiplier = 1.8
        deadlineBonus = -90
      }
      
      const reward = Math.floor(baseReward * rewardMultiplier)
      const penalty = Math.floor(reward * 0.5)
      
      const order: Order = {
        id: `order-${container.id}`,
        containerId: container.id,
        cargo: container.cargo,
        deadline: gameTime.value + 180 + deadlineBonus,
        reward,
        penalty,
        status: 'pending',
        createdAt: gameTime.value
      }
      
      orders.value.push(order)
      container.orderId = order.id
    })
  }

  const updateCranes = (deltaTime: number) => {
    cranes.value.forEach(crane => {
      const berth = berths.value.find(b => b.crane?.id === crane.id)
      if (!berth) return

      if (crane.status === 'idle') {
        if (berth.ship && berth.queue.length > 0 && !crane.container) {
          const container = berth.queue.shift()
          if (container) {
            crane.status = 'picking'
            crane.targetContainerId = container.id
            crane.progress = 0
          }
        }
      } else if (crane.status === 'picking') {
        crane.progress += deltaTime * crane.efficiency
        if (crane.progress >= 1) {
          const container = berth.ship?.containers.find(c => c.id === crane.targetContainerId)
          if (container) {
            crane.container = container
            container.status = 'unloading'
            container.location = 'crane'
            container.locationId = crane.id
            berth.ship.containers = berth.ship.containers.filter(c => c.id !== container.id)
          }
          crane.status = 'dropping'
          crane.progress = 0
        }
      } else if (crane.status === 'dropping') {
        crane.progress += deltaTime * crane.efficiency
        if (crane.progress >= 1 && crane.container) {
          const idleTruck = trucks.value.find(t => 
            t.status === 'idle' && 
            Math.abs(t.position.x - berth.position.x) < 150
          )
          
          if (idleTruck) {
            crane.container.position = { ...idleTruck.position }
            crane.container.status = 'on_truck'
            crane.container.location = 'truck'
            crane.container.locationId = idleTruck.id
            idleTruck.container = crane.container
            
            const order = orders.value.find(o => o.containerId === crane.container!.id)
            if (order) {
              order.status = 'in_progress'
            }
            
            dispatchTruckToYard(idleTruck.id, crane.container.cargo.type)
            crane.container = null
            crane.targetContainerId = undefined
            crane.status = 'idle'
            crane.progress = 0
            stats.value.containersUnloaded++
          }
        }
      }
    })
  }

  const dispatchTruckToYard = (truckId: string, cargoType: string) => {
    const truck = trucks.value.find(t => t.id === truckId)
    if (!truck || !truck.container) return false

    const zoneMap: Record<string, string> = {
      normal: 'normal',
      priority: 'normal',
      cold: 'cold',
      dangerous: 'dangerous'
    }
    
    const targetZone = zoneMap[cargoType]
    const availableSlot = yardSlots.value.find(s => 
      s.zone === targetZone && !s.container
    )

    if (availableSlot) {
      truck.targetYardSlotId = availableSlot.id
      truck.targetPosition = availableSlot.position
      truck.path = [{ x: truck.position.x, y: truck.position.y }, ...findPath(truck.position, availableSlot.position)]
      truck.pathIndex = 0
      truck.status = 'moving_to_yard'
      return true
    }
    
    return false
  }

  const updateTrucks = (deltaTime: number) => {
    trucks.value.forEach(truck => {
      if (truck.status === 'moving_to_yard' && truck.path.length > 0) {
        const target = truck.path[truck.pathIndex]
        if (target) {
          const dx = target.x - truck.position.x
          const dy = target.y - truck.position.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist < 5) {
            truck.pathIndex++
            if (truck.pathIndex >= truck.path.length) {
              truck.status = 'unloading'
              setTimeout(() => unloadTruckToYard(truck.id), 1500)
            }
          } else {
            const speed = truck.speed * deltaTime * 60
            truck.position.x += (dx / dist) * speed
            truck.position.y += (dy / dist) * speed
            if (truck.container) {
              truck.container.position = { ...truck.position }
            }
          }
        }
      } else if (truck.status === 'moving_to_gate' && truck.path.length > 0) {
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
              truck.targetPosition = null
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

  const unloadTruckToYard = (truckId: string) => {
    const truck = trucks.value.find(t => t.id === truckId)
    if (!truck || !truck.container || !truck.targetYardSlotId) return

    const slot = yardSlots.value.find(s => s.id === truck.targetYardSlotId)
    if (slot && !slot.container) {
      slot.container = truck.container
      slot.container.status = 'in_yard'
      slot.container.location = 'yard'
      slot.container.locationId = slot.id
      slot.container.position = { ...slot.position }

      completeOrder(truck.container.orderId!)

      setTimeout(() => {
        if (slot.container) {
          slot.container.status = 'delivered'
          slot.container.location = 'gate'
          slot.container = null
          stats.value.containersDelivered++
        }
      }, 1000)

      truck.container = null
      truck.targetYardSlotId = undefined
      
      truck.path = [{ x: truck.position.x, y: truck.position.y }, ...findPath(truck.position, GATE_POSITION)]
      truck.pathIndex = 0
      truck.status = 'moving_to_gate'
    }
  }

  const updateOrders = () => {
    orders.value.forEach(order => {
      if (order.status === 'pending' && gameTime.value > order.deadline) {
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

  const completeOrder = (orderId: string) => {
    const order = orders.value.find(o => o.id === orderId)
    if (!order || order.status === 'completed' || order.status === 'failed') return

    order.status = 'completed'
    order.completedAt = gameTime.value
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
      gameState: {
        gameTime: gameTime.value,
        money: money.value,
        score: score.value,
        orders: orders.value,
        ships: ships.value,
        trucks: trucks.value,
        containers: containers.value,
        cranes: cranes.value,
        yardSlots: yardSlots.value,
        stats: stats.value
      },
      timestamp: Date.now()
    }
    
    localStorage.setItem('port-tycoon-save', JSON.stringify(saveData))
    return saveData
  }

  const loadGame = (): SaveData | null => {
    const saved = localStorage.getItem('port-tycoon-save')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return null
      }
    }
    return null
  }

  const hasSavedGame = (): boolean => {
    const saved = loadGame()
    return saved !== null && saved.gameState !== undefined
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
    idleTrucks,
    idleCranes,
    initializeGame,
    updateGame,
    completeOrder,
    saveGame,
    loadGame,
    hasSavedGame,
    pauseGame,
    resumeGame,
    endGame
  }
})
