import type { Order, Ship, Container, CargoType } from '@/types'

const SHIP_NAMES = [
  '远洋号', '星辰号', '海风号', '蓝鲸号', '奋进号',
  '和平号', '胜利号', '启航号', '领航者', '开拓者'
]

const CARGO_TYPES: CargoType[] = ['normal', 'normal', 'normal', 'priority', 'cold', 'dangerous']

const DESTINATIONS = [
  '上海港', '新加坡港', '鹿特丹港', '洛杉矶港', '迪拜港',
  '东京港', '汉堡港', '纽约港', '釜山港', '香港港'
]

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11)
}

export const generateOrder = (currentTime: number): Order => {
  const type = CARGO_TYPES[Math.floor(Math.random() * CARGO_TYPES.length)]
  const size = Math.random() > 0.5 ? 40 : 20
  const baseReward = size === 40 ? 800 : 500
  
  let rewardMultiplier = 1
  let deadlineBonus = 0
  
  if (type === 'priority') {
    rewardMultiplier = 1.5
    deadlineBonus = -30
  } else if (type === 'cold') {
    rewardMultiplier = 1.3
    deadlineBonus = -15
  } else if (type === 'dangerous') {
    rewardMultiplier = 1.8
    deadlineBonus = -45
  }
  
  const reward = Math.floor(baseReward * rewardMultiplier * (0.9 + Math.random() * 0.2))
  const penalty = Math.floor(reward * 0.5)
  
  return {
    id: `order-${generateId()}`,
    cargo: {
      id: `cargo-${generateId()}`,
      type,
      size,
      weight: Math.floor(size * 10 + Math.random() * size * 5),
      destination: DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)]
    },
    deadline: currentTime + 120 + deadlineBonus + Math.random() * 60,
    reward,
    penalty,
    status: 'pending',
    createdAt: currentTime
  }
}

export const generateShip = (currentTime: number): Ship => {
  const containerCount = Math.floor(3 + Math.random() * 5)
  const containers: Container[] = []
  
  for (let i = 0; i < containerCount; i++) {
    const type = CARGO_TYPES[Math.floor(Math.random() * CARGO_TYPES.length)]
    containers.push({
      id: `container-${generateId()}`,
      cargo: {
        id: `cargo-${generateId()}`,
        type,
        size: Math.random() > 0.5 ? 40 : 20,
        weight: Math.floor(200 + Math.random() * 300),
        destination: DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)]
      },
      position: { x: 100, y: 150 },
      location: 'ship',
      locationId: ''
    })
  }
  
  return {
    id: `ship-${generateId()}`,
    name: SHIP_NAMES[Math.floor(Math.random() * SHIP_NAMES.length)],
    containers,
    maxCapacity: 10 + Math.floor(Math.random() * 10),
    position: { x: -100, y: 150 + Math.random() * 400 },
    targetBerth: null,
    status: 'arriving',
    eta: 10 + Math.random() * 20
  }
}

export const getCargoTypeName = (type: CargoType): string => {
  const names: Record<CargoType, string> = {
    normal: '普通',
    priority: '优先',
    cold: '冷链',
    dangerous: '危险品'
  }
  return names[type]
}

export const getCargoTypeColor = (type: CargoType): string => {
  const colors: Record<CargoType, string> = {
    normal: '#3b82f6',
    priority: '#f59e0b',
    cold: '#06b6d4',
    dangerous: '#ef4444'
  }
  return colors[type]
}
