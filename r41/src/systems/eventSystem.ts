import type { GameEvent, Ship, Truck } from '@/types'

const EVENT_TYPES = [
  {
    type: 'congestion' as const,
    messages: ['港口出现交通拥堵！', '道路堵塞，集卡运输速度下降', '堆场入口拥堵']
  },
  {
    type: 'weather' as const,
    messages: ['恶劣天气来袭！', '大雾天气，作业效率降低', '强风警报，注意安全']
  },
  {
    type: 'equipment_failure' as const,
    messages: ['设备故障！', '吊机需要紧急维修', '集卡出现故障']
  },
  {
    type: 'surge' as const,
    messages: ['订单激增！', '货运高峰期到来', '紧急订单大量到达']
  }
]

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11)
}

export const triggerRandomEvent = (currentTime: number): GameEvent | null => {
  const eventType = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)]
  const message = eventType.messages[Math.floor(Math.random() * eventType.messages.length)]
  
  let effect: Record<string, number> = {}
  let duration = 30 + Math.random() * 30
  
  switch (eventType.type) {
    case 'congestion':
      effect = { speedMultiplier: 0.5 }
      duration = 20 + Math.random() * 20
      break
    case 'weather':
      effect = { efficiencyMultiplier: 0.6 }
      duration = 40 + Math.random() * 30
      break
    case 'equipment_failure':
      effect = { craneEfficiency: 0.4 }
      duration = 25 + Math.random() * 15
      break
    case 'surge':
      effect = { orderFrequency: 2 }
      duration = 35 + Math.random() * 25
      break
  }
  
  return {
    id: `event-${generateId()}`,
    type: eventType.type,
    message,
    duration,
    effect,
    startTime: currentTime
  }
}

export const checkCongestion = (ships: Ship[], trucks: Truck[]): boolean => {
  const waitingShips = ships.filter(s => s.status === 'waiting').length
  const movingTrucks = trucks.filter(t => t.status === 'moving').length
  const totalTrucks = trucks.length
  
  const congestionThreshold = totalTrucks * 0.7
  const isCongested = waitingShips > 2 || movingTrucks > congestionThreshold
  
  return isCongested
}

export const getEventColor = (type: GameEvent['type']): string => {
  const colors: Record<GameEvent['type'], string> = {
    congestion: '#f59e0b',
    weather: '#6366f1',
    equipment_failure: '#ef4444',
    surge: '#10b981'
  }
  return colors[type]
}

export const getEventIcon = (type: GameEvent['type']): string => {
  const icons: Record<GameEvent['type'], string> = {
    congestion: '🚦',
    weather: '🌧️',
    equipment_failure: '⚠️',
    surge: '📈'
  }
  return icons[type]
}
