import type { TelemetryData } from '../types'

export function generateTelemetryData(prevData?: TelemetryData): TelemetryData {
  const timestamp = Date.now()
  
  const basePower = 18000
  const powerVariation = prevData?.power.solarPanelOutput ?? basePower
  const newSolarOutput = Math.max(0, Math.min(30000, 
    powerVariation + (Math.random() - 0.5) * 200
  ))

  const batteryLevel = prevData?.power.batteryLevel ?? 85
  const newBatteryLevel = Math.max(10, Math.min(100,
    batteryLevel + (Math.random() - 0.3) * 0.1
  ))

  const prevRoll = prevData?.attitude.roll ?? 0
  const prevPitch = prevData?.attitude.pitch ?? 0
  const prevYaw = prevData?.attitude.yaw ?? 0

  return {
    timestamp,
    power: {
      solarPanelOutput: newSolarOutput,
      batteryLevel: newBatteryLevel,
      powerConsumption: 12000 + Math.random() * 3000,
    },
    attitude: {
      roll: prevRoll + (Math.random() - 0.5) * 0.01,
      pitch: prevPitch + (Math.random() - 0.5) * 0.01,
      yaw: prevYaw + (Math.random() - 0.5) * 0.01,
      angularVelocity: {
        x: (Math.random() - 0.5) * 0.001,
        y: (Math.random() - 0.5) * 0.001,
        z: (Math.random() - 0.5) * 0.001,
      },
    },
    temperature: {
      body: 25 + Math.random() * 5,
      solarPanel: 60 + Math.random() * 20,
      battery: 18 + Math.random() * 4,
      cpu: 45 + Math.random() * 8,
    },
    communication: {
      signalStrength: 45 + Math.random() * 10,
      dataRate: 800 + Math.random() * 400,
      linkStatus: Math.random() > 0.02 ? 'connected' : 'degraded',
    },
  }
}

export function getInitialTelemetryData(): TelemetryData {
  return {
    timestamp: Date.now(),
    power: {
      solarPanelOutput: 18000,
      batteryLevel: 85,
      powerConsumption: 13500,
    },
    attitude: {
      roll: 0,
      pitch: 0,
      yaw: 0,
      angularVelocity: { x: 0, y: 0, z: 0 },
    },
    temperature: {
      body: 25,
      solarPanel: 65,
      battery: 20,
      cpu: 50,
    },
    communication: {
      signalStrength: 50,
      dataRate: 1000,
      linkStatus: 'connected',
    },
  }
}

export class TelemetryGenerator {
  private currentData: TelemetryData
  private intervalId: number | null = null
  private callbacks: Set<(data: TelemetryData) => void> = new Set()

  constructor() {
    this.currentData = getInitialTelemetryData()
  }

  start(intervalMs: number = 500): void {
    if (this.intervalId !== null) return
    this.intervalId = window.setInterval(() => {
      this.currentData = generateTelemetryData(this.currentData)
      this.callbacks.forEach((callback) => callback(this.currentData))
    }, intervalMs)
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  subscribe(callback: (data: TelemetryData) => void): () => void {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  getCurrentData(): TelemetryData {
    return this.currentData
  }

  dispose(): void {
    this.stop()
    this.callbacks.clear()
  }
}
