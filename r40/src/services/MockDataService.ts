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

export class MockDataService {
  private static containerPrefixes = ['MSKU', 'MAEU', 'CSLU', 'NYKU', 'HLCU', 'YMLU', 'ZIMU', 'OOLU']

  public static generateBerths(count: number): Berth[] {
    const vesselNames = ['中远之星', '海蓝鲸', '东方港', '中海号', '太平洋']
    const vesselStatuses: Array<'docking' | 'loading' | 'unloading' | 'departing'> = ['docking', 'loading', 'unloading', 'departing']

    return Array.from({ length: count }, (_, i) => ({
      id: `berth-${i}`,
      type: 'berth' as const,
      name: `${i + 1}号泊位`,
      position: { x: -120 + i * 80, y: 0, z: -180 },
      status: 'normal',
      length: 100,
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
      const isDangerousZone = i === 5 || i === 10

      blocks.push({
        id: `yard-${i}`,
        type: 'yard' as const,
        name: `${String.fromCharCode(65 + row)}${col + 1}区`,
        blockCode: `${String.fromCharCode(65 + row)}${col + 1}`,
        position: {
          x: -150 + col * (SceneConfig.yard.blockWidth + SceneConfig.yard.blockGap),
          y: 0,
          z: -60 + row * (SceneConfig.yard.blockDepth + SceneConfig.yard.blockGap)
        },
        status: isDangerousZone ? 'warning' : 'normal',
        rows: 6,
        bays: 20,
        tiers: 4,
        totalSlots: 6 * 20 * 4,
        occupiedSlots: Math.floor(6 * 20 * 4 * (0.5 + Math.random() * 0.3)),
        isDangerousZone
      })
    }

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
        position: { x: -100 + i * 50, y: 0, z: -160 },
        status: statuses[i % statuses.length],
        currentBerth: `berth-${Math.floor(i / 2)}`,
        workEfficiency: 25 + Math.floor(Math.random() * 15),
        height: 35 + Math.random() * 10
      }
    })
  }

  public static generateTrucks(count: number, yardBlocks: YardBlock[]): Truck[] {
    return Array.from({ length: count }, (_, i) => {
      const statuses: Array<'normal' | 'warning' | 'error' | 'stopped'> = ['normal', 'normal', 'normal', 'normal', 'warning', 'error']
      const yard = yardBlocks[i % yardBlocks.length]
      const path = this.generateTruckPath(yard.position)

      return {
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
      }
    })
  }

  private static readonly horizontalRoadsZ = [-100, -40, 20, 80, 140]
  private static readonly verticalRoadsX = [-150, -85, -20, 45, 110, 175]

  private static generateTruckPath(start: Position3D): Position3D[] {
    const path: Position3D[] = []
    const segments = 4 + Math.floor(Math.random() * 4)
    
    let currentX = start.x
    let currentZ = start.z
    
    path.push({ x: currentX, y: 0, z: currentZ })
    
    for (let i = 0; i < segments; i++) {
      const isHorizontal = Math.random() > 0.5
      
      if (isHorizontal) {
        const targetRoadZ = this.horizontalRoadsZ[Math.floor(Math.random() * this.horizontalRoadsZ.length)]
        path.push({ x: currentX, y: 0, z: targetRoadZ })
        
        const targetX = -180 + Math.random() * 360
        path.push({ x: targetX, y: 0, z: targetRoadZ })
        currentX = targetX
        currentZ = targetRoadZ
      } else {
        const targetRoadX = this.verticalRoadsX[Math.floor(Math.random() * this.verticalRoadsX.length)]
        path.push({ x: targetRoadX, y: 0, z: currentZ })
        
        const targetZ = -100 + Math.random() * 200
        path.push({ x: targetRoadX, y: 0, z: targetZ })
        currentX = targetRoadX
        currentZ = targetZ
      }
    }
    
    return path
  }

  public static generateContainers(count: number, yardBlocks: YardBlock[]): Container[] {
    const containers: Container[] = []
    let containerIndex = 0

    for (const block of yardBlocks) {
      const containerInBlock = Math.floor(count / yardBlocks.length)
      const occupancy = Math.min(0.9, containerInBlock / block.totalSlots)
      
      for (let bay = 0; bay < block.bays && containerIndex < count; bay++) {
        for (let row = 0; row < block.rows && containerIndex < count; row++) {
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
                x: block.position.x - SceneConfig.yard.blockWidth / 2 + 5 + bay * SceneConfig.yard.bayGap,
                y: SceneConfig.container.height / 2 + tier * SceneConfig.container.height + 0.5,
                z: block.position.z - SceneConfig.yard.blockDepth / 2 + 5 + row * 8
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
    const roads: RoadSegment[] = []
    let roadIndex = 0

    for (let i = 0; i < 5; i++) {
      roads.push({
        id: `road-h-${roadIndex}`,
        start: { x: -200, y: 0, z: -100 + i * 60 },
        end: { x: 200, y: 0, z: -100 + i * 60 },
        width: 12,
        congestionLevel: Math.random(),
        averageSpeed: 20 + Math.random() * 20,
        vehicleCount: Math.floor(Math.random() * 10)
      })
      roadIndex++
    }

    for (let i = 0; i < 6; i++) {
      roads.push({
        id: `road-v-${roadIndex}`,
        start: { x: -150 + i * 65, y: 0, z: -120 },
        end: { x: -150 + i * 65, y: 0, z: 120 },
        width: 10,
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
      container: {
        info: '集装箱信息更新',
        warning: '集装箱滞留预警',
        danger: '集装箱超时警告',
        critical: '危险品箱异常'
      },
      truck: {
        info: '车辆状态更新',
        warning: '车辆行驶缓慢',
        danger: '车辆故障警告',
        critical: '车辆紧急停止'
      },
      quayCrane: {
        info: '设备状态更新',
        warning: '设备效率下降',
        danger: '设备故障警告',
        critical: '设备紧急停机'
      }
    }
    return titles[type]?.[level] || '系统告警'
  }

  private static getAlertDescription(type: string, level: AlertLevel): string {
    const descriptions: Record<string, Record<AlertLevel, string>> = {
      container: {
        info: '集装箱位置已更新',
        warning: '集装箱在港时间接近7天',
        danger: '集装箱在港时间已超过7天',
        critical: '危险品集装箱温度异常'
      },
      truck: {
        info: '车辆正在执行运输任务',
        warning: '车辆行驶速度低于正常水平',
        danger: '车辆发动机温度过高',
        critical: '车辆发生故障已停止运行'
      },
      quayCrane: {
        info: '设备正常运行中',
        warning: '设备作业效率低于标准值',
        danger: '设备需要进行维护检查',
        critical: '设备发生严重故障停机'
      }
    }
    return descriptions[type]?.[level] || '请检查相关设备'
  }

  public static generateThroughputData(hours: number = 24): ThroughputData[] {
    const data: ThroughputData[] = []
    
    for (let i = 0; i < hours; i++) {
      const hour = (new Date().getHours() - hours + i + 24) % 24
      const importCount = 50 + Math.floor(Math.random() * 100)
      const exportCount = 60 + Math.floor(Math.random() * 90)
      
      data.push({
        time: `${String(hour).padStart(2, '0')}:00`,
        importCount,
        exportCount,
        total: importCount + exportCount
      })
    }

    return data
  }

  public static generateEquipmentUtilization(cranes: QuayCrane[], trucks: Truck[]): EquipmentUtilization[] {
    const utilization: EquipmentUtilization[] = []

    cranes.forEach(crane => {
      utilization.push({
        equipmentId: crane.id,
        equipmentName: crane.name,
        utilization: 60 + Math.random() * 35,
        status: crane.status
      })
    })

    trucks.slice(0, 10).forEach(truck => {
      utilization.push({
        equipmentId: truck.id,
        equipmentName: truck.name,
        utilization: 40 + Math.random() * 50,
        status: truck.status
      })
    })

    return utilization
  }

  public static generateCongestionData(points: number = 12): CongestionData[] {
    const data: CongestionData[] = []
    
    for (let i = 0; i < points; i++) {
      const level = 0.2 + Math.random() * 0.6
      data.push({
        time: `${i * 2}时`,
        level,
        affectedRoads: level > 0.5 ? ['road-h-1', 'road-v-2'] : []
      })
    }

    return data
  }

  public static getRandomTruckPath(): Position3D[] {
    return [
      { x: -100, y: 0, z: -150 },
      { x: -50, y: 0, z: -100 },
      { x: 0, y: 0, z: -50 },
      { x: 50, y: 0, z: 0 },
      { x: 100, y: 0, z: 50 },
      { x: 50, y: 0, z: 100 },
      { x: 0, y: 0, z: 50 },
      { x: -50, y: 0, z: 0 }
    ]
  }
}
