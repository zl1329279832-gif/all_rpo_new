import type { Ship, Container, CargoType } from '@/types'

const SHIP_NAMES = [
  '远洋号', '星辰号', '海风号', '蓝鲸号', '奋进号',
  '和平号', '胜利号', '启航号', '领航者', '开拓者',
  '盛世号', '长安号', '致远号', '跨越号', '追梦号'
]

const CARGO_TYPES: CargoType[] = ['normal', 'normal', 'normal', 'normal', 'priority', 'cold', 'dangerous']

const DESTINATIONS = [
  '上海港', '新加坡港', '鹿特丹港', '洛杉矶港', '迪拜港',
  '东京港', '汉堡港', '纽约港', '釜山港', '香港港',
  '青岛港', '广州港', '宁波港', '天津港', '大连港'
]

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11)
}

export const generateShip = (currentTime: number): Ship => {
  const containerCount = Math.floor(3 + Math.random() * 4)
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
      position: { x: 120, y: 150 },
      status: 'on_ship',
      location: 'ship',
      locationId: ''
    })
  }
  
  return {
    id: `ship-${generateId()}`,
    name: SHIP_NAMES[Math.floor(Math.random() * SHIP_NAMES.length)],
    containers,
    maxCapacity: 8 + Math.floor(Math.random() * 8),
    position: { x: -100, y: 120 + Math.random() * 450 },
    targetBerth: null,
    status: 'arriving',
    eta: 5 + Math.random() * 10
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

export const getStatusName = (status: string): string => {
  const names: Record<string, string> = {
    on_ship: '在船上',
    unloading: '卸载中',
    on_truck: '运输中',
    in_yard: '已入堆场',
    loading_out: '装货出港',
    delivered: '已交付'
  }
  return names[status] || status
}
