import * as THREE from 'three'
import { ThreeEngine } from '@/three/core/Engine'
import { ModelFactory } from '@/three/models/ModelFactory'
import { InstancedRenderer } from '@/three/renderer/InstancedRenderer'
import { Picker, PickResult } from '@/three/interaction/Picker'
import { LabelSystem } from '@/three/labels/LabelSystem'
import { PatrolSimulator, PatrolProgress } from '@/three/patrol/PatrolSimulator'
import { MockDataGenerator } from '@/data/MockDataGenerator'
import { DeviceData, DeviceStatus, ArrayData, PatrolRoute, AlarmData } from '@/types'

export interface SceneCallbacks {
  onDeviceClick?: (device: DeviceData, point: THREE.Vector3) => void
  onDeviceHover?: (device: DeviceData | null) => void
  onAlarm?: (alarm: AlarmData) => void
  onPatrolProgress?: (progress: PatrolProgress) => void
  onPatrolComplete?: () => void
}

export class PVStationScene {
  private engine: ThreeEngine
  private instancedRenderer: InstancedRenderer
  private picker: Picker
  private labelSystem: LabelSystem
  private patrolSimulator: PatrolSimulator
  private labelContainer: HTMLElement
  
  private devices: DeviceData[] = []
  private arrays: ArrayData[] = []
  private patrolRoutes: PatrolRoute[] = []
  
  private dataRefreshInterval: number | null = null
  private callbacks: SceneCallbacks = {}
  private isDisposed: boolean = false

  constructor(container: HTMLElement, callbacks: SceneCallbacks = {}) {
    this.callbacks = callbacks
    this.labelContainer = this.createLabelContainer(container)
    
    this.engine = new ThreeEngine(container)
    this.instancedRenderer = new InstancedRenderer()
    this.labelSystem = new LabelSystem(
      this.labelContainer,
      this.engine.getCamera(),
      this.engine.getDomElement()
    )
    this.patrolSimulator = new PatrolSimulator(this.engine)
    
    this.picker = new Picker({
      domElement: this.engine.getDomElement(),
      camera: this.engine.getCamera(),
      getRaycastObjects: () => this.instancedRenderer.getRaycastObjects(),
      getInstanceInfo: (intersect) => {
        if (intersect.object instanceof THREE.InstancedMesh && intersect.instanceId !== undefined) {
          return this.instancedRenderer.getInstanceInfo(intersect.object, intersect.instanceId)
        }
        return null
      }
    })

    this.setupEventListeners()
    this.initializeScene()
  }

  private createLabelContainer(parent: HTMLElement): HTMLElement {
    const container = document.createElement('div')
    container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
    `
    parent.appendChild(container)
    return container
  }

  private setupEventListeners(): void {
    this.picker.onClick((result: PickResult) => {
      this.callbacks.onDeviceClick?.(result.device, result.point)
    })

    this.picker.onHover((result: PickResult | null) => {
      if (result) {
        this.callbacks.onDeviceHover?.(result.device)
      } else {
        this.callbacks.onDeviceHover?.(null)
      }
    })

    this.patrolSimulator.onProgress((progress) => {
      this.callbacks.onPatrolProgress?.(progress)
    })

    this.patrolSimulator.onComplete(() => {
      this.callbacks.onPatrolComplete?.()
    })
  }

  private initializeScene(): void {
    const ground = ModelFactory.createGround(600)
    this.engine.addToScene(ground)

    const roadPoints = this.createRoadPoints()
    const roads = ModelFactory.createRoad(roadPoints, 6)
    this.engine.addToScene(roads)

    const stationData = MockDataGenerator.generatePVStationData()
    this.devices = stationData.devices
    this.arrays = stationData.arrays
    this.patrolRoutes = stationData.patrolRoutes

    this.instancedRenderer.createInstancedMeshes(this.devices)
    this.instancedRenderer.addToScene(this.engine.getScene())

    this.devices.forEach(device => {
      this.labelSystem.createDeviceLabel(device)
    })

    this.labelSystem.start()
    this.engine.onBeforeRender(() => {
      this.labelSystem.update()
    })
    this.startDataRefresh()
  }

  private createRoadPoints(): THREE.Vector3[] {
    const points: THREE.Vector3[] = []
    
    points.push(new THREE.Vector3(-180, 0, -120))
    points.push(new THREE.Vector3(100, 0, -120))
    points.push(new THREE.Vector3(100, 0, -10))
    points.push(new THREE.Vector3(-180, 0, -10))
    points.push(new THREE.Vector3(-180, 0, 100))
    points.push(new THREE.Vector3(100, 0, 100))
    
    points.push(new THREE.Vector3(-75, 0, -120))
    points.push(new THREE.Vector3(-75, 0, -55))
    points.push(new THREE.Vector3(-45, 0, -55))
    points.push(new THREE.Vector3(-45, 0, -120))
    
    points.push(new THREE.Vector3(-75, 0, -10))
    points.push(new THREE.Vector3(-75, 0, 75))
    points.push(new THREE.Vector3(-45, 0, 75))
    points.push(new THREE.Vector3(-45, 0, -10))

    return points
  }

  private startDataRefresh(): void {
    this.dataRefreshInterval = window.setInterval(() => {
      if (this.isDisposed) return
      
      const { updated, alarms } = MockDataGenerator.updateDeviceData(this.devices)
      
      updated.forEach(device => {
        const oldDevice = this.devices.find(d => d.id === device.id)
        if (oldDevice && oldDevice.status !== device.status) {
          this.instancedRenderer.updateDeviceStatus(device.id, device.status)
          this.labelSystem.updateLabelStatus(device.id, device.status)
        }
      })

      this.devices = updated

      alarms.forEach(alarm => {
        this.callbacks.onAlarm?.(alarm)
      })
    }, 5000)
  }

  public start(): void {
    this.engine.start()
  }

  public flyToArray(arrayId: string): void {
    const array = this.arrays.find(a => a.id === arrayId)
    if (array) {
      const position = new THREE.Vector3(
        array.position.x,
        60,
        array.position.z + 60
      )
      const target = new THREE.Vector3(
        array.position.x,
        0,
        array.position.z
      )
      this.engine.flyTo(position, target)
    }
  }

  public flyToDevice(deviceId: string): void {
    const device = this.devices.find(d => d.id === deviceId)
    if (device) {
      const position = new THREE.Vector3(
        device.position.x + 15,
        15,
        device.position.z + 15
      )
      const target = new THREE.Vector3(
        device.position.x,
        0,
        device.position.z
      )
      this.engine.flyTo(position, target, 1000)
    }
  }

  public filterByStatus(status: DeviceStatus | null): void {
    this.instancedRenderer.filterByStatus(status)
    this.labelSystem.filterByStatus(status)
  }

  public startPatrol(routeId: string, followCamera: boolean = true): void {
    const route = this.patrolRoutes.find(r => r.id === routeId)
    if (route) {
      this.patrolSimulator.startPatrol(route, followCamera)
    }
  }

  public stopPatrol(): void {
    this.patrolSimulator.stopPatrol()
  }

  public getDevices(): DeviceData[] {
    return this.devices
  }

  public getArrays(): ArrayData[] {
    return this.arrays
  }

  public getPatrolRoutes(): PatrolRoute[] {
    return this.patrolRoutes
  }

  public getDeviceById(id: string): DeviceData | undefined {
    return this.devices.find(d => d.id === id)
  }

  public getStatistics() {
    return MockDataGenerator.generateStatisticsData(this.devices)
  }

  public getPowerGenerationData() {
    return MockDataGenerator.generatePowerGenerationData()
  }

  public getFaultRankingData() {
    return MockDataGenerator.generateFaultRankingData(this.devices)
  }

  public resetView(): void {
    const position = new THREE.Vector3(150, 120, 150)
    const target = new THREE.Vector3(0, 0, 0)
    this.engine.flyTo(position, target)
  }

  public dispose(): void {
    this.isDisposed = true
    
    if (this.dataRefreshInterval !== null) {
      clearInterval(this.dataRefreshInterval)
      this.dataRefreshInterval = null
    }

    this.labelSystem.dispose()
    this.picker.dispose()
    this.patrolSimulator.dispose()
    this.instancedRenderer.dispose()
    ModelFactory.disposeMaterials()
    this.engine.dispose()

    if (this.labelContainer.parentNode) {
      this.labelContainer.parentNode.removeChild(this.labelContainer)
    }
  }
}
