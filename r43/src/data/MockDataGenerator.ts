import { DeviceData, DeviceType, DeviceStatus, ArrayData, AlarmData, PowerGenerationData, FaultRankingData, PatrolRoute, StatisticsData, PatrolPoint } from '@/types'

export class MockDataGenerator {
  public static generatePVStationData(): {
    devices: DeviceData[]
    arrays: ArrayData[]
    patrolRoutes: PatrolRoute[]
  } {
    const devices: DeviceData[] = []
    const arrays: ArrayData[] = []
    
    const arrayCount = 4
    const panelsPerRow = 15
    const rowsPerArray = 10
    
    const arrayPositions = [
      { x: -120, z: -80 },
      { x: 30, z: -80 },
      { x: -120, z: 50 },
      { x: 30, z: 50 }
    ]

    for (let arrayIdx = 0; arrayIdx < arrayCount; arrayIdx++) {
      const arrayId = `array_${arrayIdx + 1}`
      const arrayPos = arrayPositions[arrayIdx]
      let arrayPower = 0
      let arrayDeviceCount = 0
      let hasFault = false
      let worstStatus: DeviceStatus = DeviceStatus.NORMAL

      for (let row = 0; row < rowsPerArray; row++) {
        for (let col = 0; col < panelsPerRow; col++) {
          const status = this.getRandomStatus(0.85)
          if (status !== DeviceStatus.NORMAL) {
            hasFault = true
            if (this.getStatusPriority(status) > this.getStatusPriority(worstStatus)) {
              worstStatus = status
            }
          }

          const device: DeviceData = {
            id: `pv_${arrayIdx + 1}_${row}_${col}`,
            name: `光伏板 ${arrayIdx + 1}-${row + 1}-${col + 1}`,
            type: DeviceType.PV_PANEL,
            status,
            arrayId,
            position: {
              x: arrayPos.x + col * 2.5,
              y: 0,
              z: arrayPos.z + row * 3
            },
            power: status === DeviceStatus.NORMAL 
              ? 0.4 + Math.random() * 0.1 
              : status === DeviceStatus.LOW_POWER 
                ? 0.15 + Math.random() * 0.1 
                : 0.05 + Math.random() * 0.05,
            temperature: status === DeviceStatus.TEMP_ABNORMAL
              ? 65 + Math.random() * 15
              : 35 + Math.random() * 15,
            voltage: status === DeviceStatus.OFFLINE ? 0 : 30 + Math.random() * 5,
            current: status === DeviceStatus.OFFLINE ? 0 : 8 + Math.random() * 3,
            efficiency: status === DeviceStatus.NORMAL
              ? 0.85 + Math.random() * 0.1
              : 0.3 + Math.random() * 0.3,
            lastUpdate: Date.now()
          }

          arrayPower += device.power
          arrayDeviceCount++
          devices.push(device)
        }
      }

      for (let i = 0; i < 2; i++) {
        const status = this.getRandomStatus(0.7)
        if (status !== DeviceStatus.NORMAL) {
          hasFault = true
          if (this.getStatusPriority(status) > this.getStatusPriority(worstStatus)) {
            worstStatus = status
          }
        }

        const inverter: DeviceData = {
          id: `inverter_${arrayIdx + 1}_${i + 1}`,
          name: `逆变器 ${arrayIdx + 1}-${i + 1}`,
          type: DeviceType.INVERTER,
          status,
          arrayId,
          position: {
            x: arrayPos.x + (i === 0 ? -5 : panelsPerRow * 2.5 + 5),
            y: 0,
            z: arrayPos.z + rowsPerArray * 3 / 2
          },
          power: status === DeviceStatus.NORMAL
            ? 80 + Math.random() * 20
            : status === DeviceStatus.LOW_POWER
              ? 30 + Math.random() * 20
              : 10 + Math.random() * 10,
          temperature: status === DeviceStatus.TEMP_ABNORMAL
            ? 70 + Math.random() * 15
            : 40 + Math.random() * 15,
          voltage: status === DeviceStatus.OFFLINE ? 0 : 400 + Math.random() * 50,
          current: status === DeviceStatus.OFFLINE ? 0 : 150 + Math.random() * 50,
          efficiency: status === DeviceStatus.NORMAL
            ? 0.92 + Math.random() * 0.05
            : 0.4 + Math.random() * 0.3,
          lastUpdate: Date.now()
        }

        arrayPower += inverter.power
        arrayDeviceCount++
        devices.push(inverter)
      }

      for (let i = 0; i < 4; i++) {
        const status = this.getRandomStatus(0.8)
        if (status !== DeviceStatus.NORMAL) {
          hasFault = true
          if (this.getStatusPriority(status) > this.getStatusPriority(worstStatus)) {
            worstStatus = status
          }
        }

        const combiner: DeviceData = {
          id: `combiner_${arrayIdx + 1}_${i + 1}`,
          name: `汇流箱 ${arrayIdx + 1}-${i + 1}`,
          type: DeviceType.COMBINER_BOX,
          status,
          arrayId,
          position: {
            x: arrayPos.x + (i % 2) * panelsPerRow * 2.5,
            y: 0,
            z: arrayPos.z + Math.floor(i / 2) * rowsPerArray * 3
          },
          power: status === DeviceStatus.NORMAL
            ? 20 + Math.random() * 5
            : status === DeviceStatus.LOW_POWER
              ? 8 + Math.random() * 5
              : 2 + Math.random() * 3,
          temperature: status === DeviceStatus.TEMP_ABNORMAL
            ? 55 + Math.random() * 15
            : 35 + Math.random() * 10,
          voltage: status === DeviceStatus.OFFLINE ? 0 : 500 + Math.random() * 50,
          current: status === DeviceStatus.OFFLINE ? 0 : 30 + Math.random() * 10,
          efficiency: status === DeviceStatus.NORMAL
            ? 0.95 + Math.random() * 0.03
            : 0.5 + Math.random() * 0.3,
          lastUpdate: Date.now()
        }

        arrayPower += combiner.power
        arrayDeviceCount++
        devices.push(combiner)
      }

      for (let i = 0; i < 2; i++) {
        const status = hasFault ? this.getRandomStatus(0.3) : DeviceStatus.NORMAL
        
        const alarm: DeviceData = {
          id: `alarm_${arrayIdx + 1}_${i + 1}`,
          name: `告警设备 ${arrayIdx + 1}-${i + 1}`,
          type: DeviceType.ALARM_DEVICE,
          status,
          arrayId,
          position: {
            x: arrayPos.x + (i === 0 ? -10 : panelsPerRow * 2.5 + 10),
            y: 0,
            z: arrayPos.z + (i === 0 ? -10 : rowsPerArray * 3 + 10)
          },
          power: 0.05,
          temperature: 25 + Math.random() * 5,
          voltage: 12,
          current: 0.5,
          efficiency: 1,
          lastUpdate: Date.now()
        }

        arrayDeviceCount++
        devices.push(alarm)
      }

      arrays.push({
        id: arrayId,
        name: `光伏方阵 ${arrayIdx + 1}`,
        position: {
          x: arrayPos.x + panelsPerRow * 2.5 / 2,
          y: 0,
          z: arrayPos.z + rowsPerArray * 3 / 2
        },
        deviceCount: arrayDeviceCount,
        totalPower: arrayPower,
        efficiency: arrayPower / (arrayDeviceCount * 0.5),
        status: hasFault ? worstStatus : DeviceStatus.NORMAL
      })
    }

    const patrolRoutes = this.generatePatrolRoutes(arrays, devices)

    return { devices, arrays, patrolRoutes }
  }

  private static getStatusPriority(status: DeviceStatus): number {
    const priorities: Record<DeviceStatus, number> = {
      [DeviceStatus.NORMAL]: 0,
      [DeviceStatus.LOW_POWER]: 1,
      [DeviceStatus.MAINTENANCE]: 2,
      [DeviceStatus.OFFLINE]: 3,
      [DeviceStatus.TEMP_ABNORMAL]: 4
    }
    return priorities[status]
  }

  private static getRandomStatus(normalProbability: number): DeviceStatus {
    const rand = Math.random()
    if (rand < normalProbability) return DeviceStatus.NORMAL
    
    const faultRand = Math.random()
    if (faultRand < 0.35) return DeviceStatus.LOW_POWER
    if (faultRand < 0.6) return DeviceStatus.TEMP_ABNORMAL
    if (faultRand < 0.85) return DeviceStatus.OFFLINE
    return DeviceStatus.MAINTENANCE
  }

  public static updateDeviceData(devices: DeviceData[]): { updated: DeviceData[], alarms: AlarmData[] } {
    const updated: DeviceData[] = []
    const alarms: AlarmData[] = []

    devices.forEach(device => {
      const rand = Math.random()
      let newStatus = device.status

      if (rand < 0.02) {
        if (device.status === DeviceStatus.NORMAL) {
          newStatus = this.getRandomStatus(0)
        } else if (rand < 0.01) {
          newStatus = DeviceStatus.NORMAL
        }
      }

      const updatedDevice: DeviceData = {
        ...device,
        status: newStatus,
        power: newStatus === DeviceStatus.NORMAL
          ? device.type === DeviceType.PV_PANEL
            ? 0.4 + Math.random() * 0.1
            : device.type === DeviceType.INVERTER
              ? 80 + Math.random() * 20
              : device.type === DeviceType.COMBINER_BOX
                ? 20 + Math.random() * 5
                : 0.05
          : newStatus === DeviceStatus.LOW_POWER
            ? device.type === DeviceType.PV_PANEL
              ? 0.15 + Math.random() * 0.1
              : device.type === DeviceType.INVERTER
                ? 30 + Math.random() * 20
                : 8 + Math.random() * 5
            : 0.05 + Math.random() * 0.05,
        temperature: newStatus === DeviceStatus.TEMP_ABNORMAL
          ? 65 + Math.random() * 15
          : 35 + Math.random() * 15,
        voltage: newStatus === DeviceStatus.OFFLINE ? 0 : device.voltage + (Math.random() - 0.5) * 2,
        current: newStatus === DeviceStatus.OFFLINE ? 0 : device.current + (Math.random() - 0.5) * 0.5,
        efficiency: newStatus === DeviceStatus.NORMAL
          ? 0.85 + Math.random() * 0.1
          : 0.3 + Math.random() * 0.3,
        lastUpdate: Date.now()
      }

      if (newStatus !== device.status && newStatus !== DeviceStatus.NORMAL) {
        alarms.push({
          id: `alarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          deviceId: device.id,
          deviceName: device.name,
          type: newStatus,
          message: `${device.name} 状态变更为 ${this.getStatusName(newStatus)}`,
          timestamp: Date.now(),
          level: newStatus === DeviceStatus.TEMP_ABNORMAL ? 'critical' : newStatus === DeviceStatus.OFFLINE ? 'error' : 'warning'
        })
      }

      updated.push(updatedDevice)
    })

    return { updated, alarms }
  }

  private static getStatusName(status: DeviceStatus): string {
    const names: Record<DeviceStatus, string> = {
      [DeviceStatus.NORMAL]: '正常',
      [DeviceStatus.LOW_POWER]: '发电偏低',
      [DeviceStatus.TEMP_ABNORMAL]: '温度异常',
      [DeviceStatus.OFFLINE]: '设备离线',
      [DeviceStatus.MAINTENANCE]: '待维修'
    }
    return names[status]
  }

  public static generatePowerGenerationData(): PowerGenerationData[] {
    const data: PowerGenerationData[] = []
    const now = new Date()
    
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000)
      const hour = time.getHours()
      
      const solarFactor = Math.max(0, Math.sin((hour - 6) * Math.PI / 12))
      const irradiance = solarFactor * (800 + Math.random() * 200)
      const temperature = 15 + solarFactor * 25 + Math.random() * 5
      const power = solarFactor * (50 + Math.random() * 10)
      
      data.push({
        time: `${time.getHours().toString().padStart(2, '0')}:00`,
        power: parseFloat(power.toFixed(2)),
        irradiance: parseFloat(irradiance.toFixed(0)),
        temperature: parseFloat(temperature.toFixed(1))
      })
    }

    return data
  }

  public static generateFaultRankingData(devices: DeviceData[]): FaultRankingData[] {
    const faultCounts: Record<string, { count: number; type: DeviceStatus }> = {}
    
    devices.forEach(device => {
      if (device.status !== DeviceStatus.NORMAL) {
        const key = this.getStatusName(device.status)
        if (!faultCounts[key]) {
          faultCounts[key] = { count: 0, type: device.status }
        }
        faultCounts[key].count++
      }
    })

    return Object.entries(faultCounts)
      .map(([name, { count, type }]) => ({ name, count, type }))
      .sort((a, b) => b.count - a.count)
  }

  public static generateStatisticsData(devices: DeviceData[]): StatisticsData {
    const totalDevices = devices.length
    const onlineDevices = devices.filter(d => d.status !== DeviceStatus.OFFLINE).length
    const faultDevices = devices.filter(d => d.status !== DeviceStatus.NORMAL).length
    const maintenanceDevices = devices.filter(d => d.status === DeviceStatus.MAINTENANCE).length

    return {
      totalPower: devices.reduce((sum, d) => sum + d.power, 0),
      onlineRate: onlineDevices / totalDevices,
      faultCount: faultDevices,
      maintenanceProgress: maintenanceDevices > 0 ? 0.3 + Math.random() * 0.5 : 1,
      todayGeneration: parseFloat((450 + Math.random() * 50).toFixed(2)),
      monthGeneration: parseFloat((12000 + Math.random() * 1000).toFixed(2))
    }
  }

  private static generatePatrolRoutes(arrays: ArrayData[], devices: DeviceData[]): PatrolRoute[] {
    const routes: PatrolRoute[] = []

    const mainRoutePoints: PatrolPoint[] = []
    arrays.forEach((array, idx) => {
      mainRoutePoints.push({
        id: `route1_point_${idx}`,
        name: array.name,
        position: array.position,
        type: DeviceType.PV_PANEL
      })

      const inverter = devices.find(d => d.arrayId === array.id && d.type === DeviceType.INVERTER)
      if (inverter) {
        mainRoutePoints.push({
          id: `route1_inverter_${idx}`,
          name: inverter.name,
          position: inverter.position,
          type: DeviceType.INVERTER
        })
      }

      const alarm = devices.find(d => d.arrayId === array.id && d.type === DeviceType.ALARM_DEVICE)
      if (alarm) {
        mainRoutePoints.push({
          id: `route1_alarm_${idx}`,
          name: alarm.name,
          position: alarm.position,
          type: DeviceType.ALARM_DEVICE
        })
      }
    })

    routes.push({
      id: 'route_main',
      name: '主巡检路线',
      points: mainRoutePoints,
      estimatedTime: 30
    })

    const faultPoints = devices
      .filter(d => d.status !== DeviceStatus.NORMAL)
      .slice(0, 10)
      .map(d => ({
        id: `fault_${d.id}`,
        name: d.name,
        position: d.position,
        type: d.type
      }))

    if (faultPoints.length > 0) {
      routes.push({
        id: 'route_fault',
        name: '故障巡检路线',
        points: faultPoints,
        estimatedTime: faultPoints.length * 5
      })
    }

    return routes
  }
}
