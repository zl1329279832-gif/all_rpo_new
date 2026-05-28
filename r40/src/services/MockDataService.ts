import type {
  Berth,
  YardBlock,
  QuayCrane,
  Truck,
  Container,
  RoadSegment,
  Alert,
  AlertLevel,
  ThroughputData,
  EquipmentUtilization,
  CongestionData,
  Position3D
} from '@/types'
import { SceneConfig } from '@/scene/config'

const L = SceneConfig.layout

interface RoadNode {
  id: string
  x: number
  z: number
  connections: string[]
}

interface RoadEdge {
  id: string
  from: string
  to: string
  direction: 'forward' | 'backward'
  lane: number
}

export class RoadNetwork {
  public nodes: Map<string, RoadNode> = new Map()
  public edges: RoadEdge[] = []
  
  private horizontalRoadsZ: number[] = []
  private verticalRoadsX: number[] = []

  constructor(yardBlocks: YardBlock[]) {
    this.buildNetwork(yardBlocks)
  }

  private buildNetwork(yardBlocks: YardBlock[]): void {
    this.horizontalRoadsZ = []
    this.verticalRoadsX = []

    const firstRowZ = L.yardStartZ - L.roadWidth / 2
    this.horizontalRoadsZ.push(firstRowZ)
    this.horizontalRoadsZ.push(L.berthFrontRoadZ)

    const rowSet = new Set<number>()
    yardBlocks.forEach(block => {
      const bottomEdge = block.position.z + L.yardBlockDepth / 2 + L.roadWidth / 2
      const topEdge = block.position.z - L.yardBlockDepth / 2 - L.roadWidth / 2
      rowSet.add(Math.round(bottomEdge * 10) / 10)
      rowSet.add(Math.round(topEdge * 10) / 10)
    })
    rowSet.forEach(z => {
      if (!this.horizontalRoadsZ.includes(z)) {
        this.horizontalRoadsZ.push(z)
      }
    })
    this.horizontalRoadsZ.sort((a, b) => a - b)

    this.verticalRoadsX = []
    const colSet = new Set<number>()
    yardBlocks.forEach(block => {
      const rightEdge = block.position.x + L.yardBlockWidth / 2 + L.roadWidth / 2
      const leftEdge = block.position.x - L.yardBlockWidth / 2 - L.roadWidth / 2
      colSet.add(Math.round(rightEdge * 10) / 10)
      colSet.add(Math.round(leftEdge * 10) / 10)
    })
    colSet.forEach(x => {
      this.verticalRoadsX.push(x)
    })
    this.verticalRoadsX.sort((a, b) => a - b)

    let nodeId = 0
    for (const z of this.horizontalRoadsZ) {
      for (const x of this.verticalRoadsX) {
        const id = `node-${nodeId++}`
        this.nodes.set(id, { id, x, z, connections: [] })
      }
    }

    const cols = this.verticalRoadsX.length
    
    this.nodes.forEach((node, id) => {
      const colIdx = this.verticalRoadsX.indexOf(node.x)
      const rowIdx = this.horizontalRoadsZ.indexOf(node.z)

      if (colIdx < cols - 1) {
        const rightId = this.getNodeAt(rowIdx, colIdx + 1)
        if (rightId) {
          node.connections.push(rightId)
          const rightNode = this.nodes.get(rightId)!
          rightNode.connections.push(id)
        }
      }

      if (rowIdx < this.horizontalRoadsZ.length - 1) {
        const bottomId = this.getNodeAt(rowIdx + 1, colIdx)
        if (bottomId) {
          node.connections.push(bottomId)
          const bottomNode = this.nodes.get(bottomId)!
          bottomNode.connections.push(id)
        }
      }
    })
  }

  private getNodeAt(row: number, col: number): string | null {
    const cols = this.verticalRoadsX.length
    const idx = row * cols + col
    const keys = Array.from(this.nodes.keys())
    return keys[idx] || null
  }

  public getHorizontalRoadsZ(): number[] {
    return this.horizontalRoadsZ
  }

  public getVerticalRoadsX(): number[] {
    return this.verticalRoadsX
  }

  public findNearestNode(x: number, z: number): RoadNode | null {
    let nearest: RoadNode | null = null
    let minDist = Infinity

    this.nodes.forEach(node => {
      const dist = Math.abs(node.x - x) + Math.abs(node.z - z)
      if (dist < minDist) {
        minDist = dist
        nearest = node
      }
    })

    return nearest
  }

  public findPath(startNodeId: string, endNodeId: string): string[] {
    if (startNodeId === endNodeId) return [startNodeId]

    const visited = new Set<string>()
    const queue: string[][] = [[startNodeId]]
    visited.add(startNodeId)

    while (queue.length > 0) {
      const path = queue.shift()!
      const current = path[path.length - 1]
      const node = this.nodes.get(current)

      if (!node) continue

      for (const connId of node.connections) {
        if (connId === endNodeId) {
          return [...path, connId]
        }
        if (!visited.has(connId)) {
          visited.add(connId)
          queue.push([...path, connId])
        }
      }
    }

    return [startNodeId]
  }

  public generateRandomRoute(startX: number, startZ: number, segmentCount: number): Position3D[] {
    const startNode = this.findNearestNode(startX, startZ)
    if (!startNode) return [{ x: startX, y: 0, z: startZ }]

    const path: Position3D[] = [{ x: startNode.x, y: 0, z: startNode.z }]
    let currentNode = startNode

    for (let seg = 0; seg < segmentCount; seg++) {
      const connections = currentNode.connections
      if (connections.length === 0) break

      let nextNodeId: string
      const forwardCandidates = connections.filter(id => {
        const n = this.nodes.get(id)!
        return !path.some(p => Math.abs(p.x - n.x) < 1 && Math.abs(p.z - n.z) < 1)
      })

      if (forwardCandidates.length > 0) {
        nextNodeId = forwardCandidates[Math.floor(Math.random() * forwardCandidates.length)]
      } else {
        nextNodeId = connections[Math.floor(Math.random() * connections.length)]
      }

      const nextNode = this.nodes.get(nextNodeId)!
      const dx = nextNode.x - currentNode.x
      const dz = nextNode.z - currentNode.z

      const laneOffset = L.laneWidth / 2

      if (Math.abs(dx) > 1) {
        const laneZ = dz > 0 ? currentNode.z + laneOffset : currentNode.z - laneOffset
        path.push({ x: currentNode.x, y: 0, z: laneZ })
        path.push({ x: nextNode.x, y: 0, z: laneZ })
      } else if (Math.abs(dz) > 1) {
        const laneX = dx > 0 ? currentNode.x + laneOffset : currentNode.x - laneOffset
        path.push({ x: laneX, y: 0, z: currentNode.z })
        path.push({ x: laneX, y: 0, z: nextNode.z })
      }

      path.push({ x: nextNode.x, y: 0, z: nextNode.z })
      currentNode = nextNode
    }

    return path
  }
}

export class MockDataService {
  private static containerPrefixes = ['MSKU', 'MAEU', 'CSLU', 'NYKU', 'HLCU', 'YMLU', 'ZIMU', 'OOLU']
  private static roadNetwork: RoadNetwork | null = null

  public static getRoadNetwork(): RoadNetwork | null {
    return this.roadNetwork
  }

  public static generateBerths(count: number): Berth[] {
    const vesselNames = ['中远之星', '海蓝鲸', '东方港', '中海号', '太平洋']
    const vesselStatuses: Array<'docking' | 'loading' | 'unloading' | 'departing'> = ['docking', 'loading', 'unloading', 'departing']

    return Array.from({ length: count }, (_, i) => ({
      id: `berth-${i}`,
      type: 'berth' as const,
      name: `${i + 1}号泊位`,
      position: { x: -80 + i * 80, y: 0, z: L.berthZ },
      status: 'normal',
      length: 80,
      width: 30,
      vesselName: i < 3 ? vesselNames[i % vesselNames.length] : undefined,
      vesselStatus: vesselStatuses[i % vesselStatuses.length]
    }))
  }

  public static generateYardBlocks(count: number): YardBlock[] {
    const blocks: YardBlock[] = []
    const cols = 4
    const rows = Math.ceil(count / cols)

    for (let i = 0; i < count; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)
      const isDangerousZone = i === 5

      blocks.push({
        id: `yard-${i}`,
        type: 'yard' as const,
        name: `${String.fromCharCode(65 + row)}${col + 1}区`,
        blockCode: `${String.fromCharCode(65 + row)}${col + 1}`,
        position: {
          x: L.yardStartX + col * (L.yardBlockWidth + L.yardGapX),
          y: 0,
          z: L.yardStartZ + row * (L.yardBlockDepth + L.yardGapZ)
        },
        status: isDangerousZone ? 'warning' : 'normal',
        rows: 6,
        bays: 10,
        tiers: 4,
        totalSlots: 6 * 10 * 4,
        occupiedSlots: Math.floor(6 * 10 * 4 * (0.5 + Math.random() * 0.3)),
        isDangerousZone
      })
    }

    this.roadNetwork = new RoadNetwork(blocks)

    return blocks
  }

  public static generateQuayCranes(count: number): QuayCrane[] {
    return Array.from({ length: count }, (_, i) => {
      const statuses: Array<'normal' | 'warning' | 'error' | 'stopped'> = ['normal', 'normal', 'normal', 'warning', 'error', 'stopped']
      return {
        id: `crane-${i}`,
        type: 'quayCrane' as const,
        name: `QC-${String(i + 1).padStart(2, '0')}`,
        craneId: `QC-${String(i + 1).padStart(2, '0')}`,
        position: { x: -80 + i * 80, y: 0, z: L.berthZ + 20 },
        status: statuses[i % statuses.length],
        currentBerth: `berth-${Math.floor(i / 2)}`,
        workEfficiency: 25 + Math.floor(Math.random() * 15),
        height: 35 + Math.random() * 10
      }
    })
  }

  public static generateTrucks(count: number, yardBlocks: YardBlock[]): Truck[] {
    if (!this.roadNetwork) {
      this.roadNetwork = new RoadNetwork(yardBlocks)
    }

    const trucks: Truck[] = []
    const allPaths: Position3D[][] = []

    for (let i = 0; i < count; i++) {
      const statuses: Array<'normal' | 'warning' | 'error' | 'stopped'> = ['normal', 'normal', 'normal', 'normal', 'warning', 'error']
      const yard = yardBlocks[i % yardBlocks.length]
      const startNode = this.roadNetwork.findNearestNode(yard.position.x, yard.position.z)
      const startX = startNode ? startNode.x : yard.position.x
      const startZ = startNode ? startNode.z : yard.position.z

      let path: Position3D[]
      let attempts = 0
      do {
        path = this.roadNetwork.generateRandomRoute(startX, startZ, 3 + Math.floor(Math.random() * 3))
        attempts++
      } while (path.length < 3 && attempts < 5)

      const tooClose = allPaths.some(existingPath => {
        const eStart = existingPath[0]
        return Math.abs(eStart.x - path[0].x) < SceneConfig.truck.minFollowingDistance &&
               Math.abs(eStart.z - path[0].z) < SceneConfig.truck.minFollowingDistance
      })

      if (tooClose && path.length > 2) {
        const offset = (i % 3 - 1) * SceneConfig.truck.minFollowingDistance
        path = path.map(p => ({
          x: p.x,
          y: p.y,
          z: p.z + offset
        }))
      }

      allPaths.push(path)

      trucks.push({
        id: `truck-${i}`,
        type: 'truck' as const,
        name: `集卡-${String(i + 1).padStart(3, '0')}`,
        plateNumber: `沪A${String(Math.floor(Math.random() * 90000) + 10000)}`,
        position: path[0],
        status: statuses[i % statuses.length],
        speed: 15 + Math.random() * 10,
        currentTask: i % 3 === 0 ? `运输至${yard.blockCode}区` : undefined,
        path,
        pathProgress: 0
      })
    }

    return trucks
  }

  public static generateContainers(count: number, yardBlocks: YardBlock[]): Container[] {
    const containers: Container[] = []
    let containerIndex = 0

    for (const block of yardBlocks) {
      const containerInBlock = Math.floor(count / yardBlocks.length)
      const occupancy = Math.min(0.85, containerInBlock / block.totalSlots)

      const halfW = SceneConfig.yard.blockWidth / 2
      const halfD = SceneConfig.yard.blockDepth / 2
      const containerDepth = SceneConfig.container.depth
      const containerHeight = SceneConfig.container.height
      const bayGap = SceneConfig.yard.bayGap
      const rowGap = SceneConfig.yard.rowGap

      const maxBays = Math.floor((halfW * 2 - 4) / bayGap)
      const maxRows = Math.floor((halfD * 2 - 4) / (containerDepth + rowGap))

      for (let bay = 0; bay < maxBays && containerIndex < count; bay++) {
        for (let row = 0; row < maxRows && containerIndex < count; row++) {
          let maxTierForStack = Math.floor(Math.random() * (block.tiers + 1))

          if (Math.random() > occupancy) {
            maxTierForStack = 0
          }

          for (let tier = 0; tier < maxTierForStack && containerIndex < count; tier++) {
            const isOvertime = Math.random() < 0.08
            const isDangerous = block.isDangerousZone && Math.random() < 0.3

            const size: '20ft' | '40ft' = Math.random() > 0.6 ? '40ft' : '20ft'

            containers.push({
              id: `container-${containerIndex}`,
              type: 'container' as const,
              name: this.generateContainerNumber(),
              containerNumber: this.generateContainerNumber(),
              size,
              weight: 10 + Math.floor(Math.random() * 20),
              inTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
              owner: ['中远海运', '马士基', '达飞', '赫伯罗特'][Math.floor(Math.random() * 4)],
              status: isOvertime ? 'overtime' : 'normal',
              isDangerous,
              dangerousLevel: isDangerous ? Math.floor(Math.random() * 3) + 1 : undefined,
              stackPosition: {
                block: block.blockCode,
                bay,
                row,
                tier
              },
              position: {
                x: block.position.x - halfW + 3 + bay * bayGap,
                y: containerHeight / 2 + tier * containerHeight + 0.5,
                z: block.position.z - halfD + 2 + row * (containerDepth + rowGap)
              }
            })

            containerIndex++
          }
        }
      }
    }

    return containers
  }

  private static generateContainerNumber(): string {
    const prefix = this.containerPrefixes[Math.floor(Math.random() * this.containerPrefixes.length)]
    const number = String(Math.floor(Math.random() * 900000) + 100000)
    return `${prefix}${number}`
  }

  public static generateRoads(yardBlocks: YardBlock[]): RoadSegment[] {
    if (!this.roadNetwork) {
      this.roadNetwork = new RoadNetwork(yardBlocks)
    }

    const roads: RoadSegment[] = []
    let roadIndex = 0

    const hRoads = this.roadNetwork.getHorizontalRoadsZ()
    const vRoads = this.roadNetwork.getVerticalRoadsX()

    for (const z of hRoads) {
      roads.push({
        id: `road-h-${roadIndex}`,
        start: { x: -200, y: 0, z },
        end: { x: 200, y: 0, z },
        width: L.roadWidth,
        congestionLevel: Math.random(),
        averageSpeed: 20 + Math.random() * 20,
        vehicleCount: Math.floor(Math.random() * 10)
      })
      roadIndex++
    }

    for (const x of vRoads) {
      roads.push({
        id: `road-v-${roadIndex}`,
        start: { x, y: 0, z: L.berthZ - 30 },
        end: { x, y: 0, z: 120 },
        width: L.roadWidth,
        congestionLevel: Math.random(),
        averageSpeed: 15 + Math.random() * 20,
        vehicleCount: Math.floor(Math.random() * 8)
      })
      roadIndex++
    }

    return roads
  }

  public static generateAlerts(count: number, containers: Container[], trucks: Truck[], cranes: QuayCrane[]): Alert[] {
    const alerts: Alert[] = []
    const levels: AlertLevel[] = ['info', 'warning', 'danger', 'critical']
    const allObjects = [
      ...containers.slice(0, 5).map(c => ({ id: c.id, type: 'container' as const })),
      ...trucks.slice(0, 3).map(t => ({ id: t.id, type: 'truck' as const })),
      ...cranes.slice(0, 2).map(c => ({ id: c.id, type: 'quayCrane' as const }))
    ]

    for (let i = 0; i < count && i < allObjects.length * 2; i++) {
      const obj = allObjects[i % allObjects.length]
      const level = levels[Math.floor(Math.random() * levels.length)]

      alerts.push({
        id: `alert-${i}`,
        level,
        title: this.getAlertTitle(obj.type, level),
        description: this.getAlertDescription(obj.type, level),
        objectId: obj.id,
        objectType: obj.type,
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        acknowledged: Math.random() > 0.7
      })
    }

    return alerts
  }

  private static getAlertTitle(type: string, level: AlertLevel): string {
    const titles: Record<string, Record<AlertLevel, string>> = {
      container: { info: '集装箱信息更新', warning: '集装箱滞留预警', danger: '集装箱超时警告', critical: '危险品箱异常' },
      truck: { info: '车辆状态更新', warning: '车辆行驶缓慢', danger: '车辆故障警告', critical: '车辆紧急停止' },
      quayCrane: { info: '设备状态更新', warning: '设备效率下降', danger: '设备故障警告', critical: '设备紧急停机' }
    }
    return titles[type]?.[level] || '系统告警'
  }

  private static getAlertDescription(type: string, level: AlertLevel): string {
    const descriptions: Record<string, Record<AlertLevel, string>> = {
      container: { info: '集装箱位置已更新', warning: '集装箱在港时间接近7天', danger: '集装箱在港时间已超过7天', critical: '危险品集装箱温度异常' },
      truck: { info: '车辆正在执行运输任务', warning: '车辆行驶速度低于正常水平', danger: '车辆发动机温度过高', critical: '车辆发生故障已停止运行' },
      quayCrane: { info: '设备正常运行中', warning: '设备作业效率低于标准值', danger: '设备需要进行维护检查', critical: '设备发生严重故障停机' }
    }
    return descriptions[type]?.[level] || '请检查相关设备'
  }

  public static generateThroughputData(hours: number = 24): ThroughputData[] {
    const data: ThroughputData[] = []
    for (let i = 0; i < hours; i++) {
      const hour = (new Date().getHours() - hours + i + 24) % 24
      const importCount = 50 + Math.floor(Math.random() * 100)
      const exportCount = 60 + Math.floor(Math.random() * 90)
      data.push({ time: `${String(hour).padStart(2, '0')}:00`, importCount, exportCount, total: importCount + exportCount })
    }
    return data
  }

  public static generateEquipmentUtilization(cranes: QuayCrane[], trucks: Truck[]): EquipmentUtilization[] {
    const utilization: EquipmentUtilization[] = []
    cranes.forEach(crane => {
      utilization.push({ equipmentId: crane.id, equipmentName: crane.name, utilization: 60 + Math.random() * 35, status: crane.status })
    })
    trucks.slice(0, 10).forEach(truck => {
      utilization.push({ equipmentId: truck.id, equipmentName: truck.name, utilization: 40 + Math.random() * 50, status: truck.status })
    })
    return utilization
  }

  public static generateCongestionData(points: number = 12): CongestionData[] {
    const data: CongestionData[] = []
    for (let i = 0; i < points; i++) {
      const level = 0.2 + Math.random() * 0.6
      data.push({ time: `${i * 2}时`, level, affectedRoads: level > 0.5 ? ['road-h-1', 'road-v-2'] : [] })
    }
    return data
  }

  public static getRandomTruckPath(): Position3D[] {
    if (this.roadNetwork) {
      const nodes = Array.from(this.roadNetwork.nodes.values())
      const startNode = nodes[Math.floor(Math.random() * nodes.length)]
      return this.roadNetwork.generateRandomRoute(startNode.x, startNode.z, 4)
    }
    return [{ x: 0, y: 0, z: 0 }]
  }
}
