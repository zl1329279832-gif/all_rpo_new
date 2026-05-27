import * as THREE from 'three'
import { ModelFactory } from './ModelFactory'
import { LabelSystem } from './LabelSystem'
import { InteractionManager, PickResult } from './InteractionManager'
import { AnimationController } from './AnimationController'
import { OrbitControls } from './OrbitControls'
import { DEVICE_COLORS, CAMPUS_CONFIG } from './constants'
import { toVector3, disposeObject3D } from './utils'
import type { Building, Device, Alarm, CampusGate, DeviceStatus } from '@/types'

export class SceneManager {
  private container: HTMLElement
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private labelSystem: LabelSystem
  private interactionManager: InteractionManager
  private animationController: AnimationController

  private buildingGroup: THREE.Group = new THREE.Group()
  private deviceGroup: THREE.Group = new THREE.Group()
  private gateGroup: THREE.Group = new THREE.Group()
  private alarmGroup: THREE.Group = new THREE.Group()
  private selectionRing: THREE.Mesh | null = null

  private deviceObjects: Map<string, THREE.Group> = new Map()
  private buildingObjects: Map<string, THREE.Group> = new Map()
  private alarmIndicators: Map<string, THREE.Group> = new Map()

  private onPickCallback?: (result: PickResult) => void
  private animationFrameId: number | null = null

  constructor(container: HTMLElement) {
    this.container = container

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0a0e1a)
    this.scene.fog = new THREE.Fog(0x0a0e1a, 100, 400)

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    this.camera.position.copy(CAMPUS_CONFIG.cameraPosition)
    this.camera.lookAt(CAMPUS_CONFIG.cameraTarget)

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.target.copy(CAMPUS_CONFIG.cameraTarget)

    this.labelSystem = new LabelSystem(this.scene, this.camera, container)
    this.interactionManager = new InteractionManager(this.scene, this.camera, this.renderer)
    this.animationController = new AnimationController(this.scene)

    this.setupLighting()
    this.setupEnvironment()
    this.setupGroups()
    this.setupInteraction()
    this.setupResizeHandler()

    this.animationController.start()
    this.startRenderLoop()
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(100, 150, 100)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 500
    directionalLight.shadow.camera.left = -150
    directionalLight.shadow.camera.right = 150
    directionalLight.shadow.camera.top = 150
    directionalLight.shadow.camera.bottom = -150
    this.scene.add(directionalLight)

    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x2d5a27, 0.3)
    this.scene.add(hemisphereLight)

    const pointLight1 = new THREE.PointLight(0x1890ff, 0.5, 100)
    pointLight1.position.set(50, 30, 50)
    this.scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0x1890ff, 0.5, 100)
    pointLight2.position.set(-50, 30, -50)
    this.scene.add(pointLight2)
  }

  private setupEnvironment(): void {
    const ground = ModelFactory.createGround(CAMPUS_CONFIG.groundSize)
    this.scene.add(ground)

    const grass = ModelFactory.createGrass()
    this.scene.add(grass)

    const roads = ModelFactory.createRoads()
    this.scene.add(roads)
  }

  private setupGroups(): void {
    this.buildingGroup.name = 'buildings'
    this.deviceGroup.name = 'devices'
    this.gateGroup.name = 'gates'
    this.alarmGroup.name = 'alarms'

    this.scene.add(this.buildingGroup)
    this.scene.add(this.deviceGroup)
    this.scene.add(this.gateGroup)
    this.scene.add(this.alarmGroup)
  }

  private setupInteraction(): void {
    this.interactionManager.setOnPickCallback((result) => {
      if (this.onPickCallback) {
        this.onPickCallback(result)
      }
    })
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', this.handleResize.bind(this))
  }

  private handleResize(): void {
    if (!this.container) return

    const width = this.container.clientWidth
    const height = this.container.clientHeight

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(width, height)
  }

  private startRenderLoop(): void {
    const render = () => {
      this.controls.update()
      this.labelSystem.updateAllLabels()
      this.renderer.render(this.scene, this.camera)
      this.animationFrameId = requestAnimationFrame(render)
    }
    render()
  }

  loadBuildings(buildings: Building[]): void {
    buildings.forEach((building) => {
      const buildingObj = ModelFactory.createBuilding(building)
      this.buildingGroup.add(buildingObj)
      this.buildingObjects.set(building.id, buildingObj)

      this.labelSystem.createLabel({
        id: `building_${building.id}`,
        text: building.name,
        position: toVector3(building.position),
        color: '#ffffff',
        type: 'building'
      })
    })
  }

  loadDevices(devices: Device[]): void {
    devices.forEach((device) => {
      const color = DEVICE_COLORS[device.status]
      const deviceObj = ModelFactory.createDevice(device, color)
      this.deviceGroup.add(deviceObj)
      this.deviceObjects.set(device.id, deviceObj)

      if (device.status === 'alarm' || device.status === 'fault') {
        this.animationController.addPulseAnimation(deviceObj, device.status === 'alarm' ? 3 : 2)
      }
    })
  }

  loadGates(gates: CampusGate[]): void {
    gates.forEach((gate) => {
      const gateObj = ModelFactory.createGate(gate)
      this.gateGroup.add(gateObj)

      this.labelSystem.createLabel({
        id: `gate_${gate.id}`,
        text: gate.name,
        position: toVector3(gate.position),
        color: gate.status === 'open' ? '#52c41a' : '#8c8c8c',
        type: 'gate'
      })
    })
  }

  updateDeviceStatus(deviceId: string, status: DeviceStatus): void {
    const deviceObj = this.deviceObjects.get(deviceId)
    if (!deviceObj) return

    const color = DEVICE_COLORS[status]

    deviceObj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshStandardMaterial
        if (material.color && material.emissive) {
          material.color.setHex(color)
          material.emissive.setHex(color)
        }
      }
    })

    if (status === 'alarm' || status === 'fault') {
      this.animationController.addPulseAnimation(deviceObj, status === 'alarm' ? 3 : 2)
    } else {
      this.animationController.removePulseAnimation(deviceObj)
    }
  }

  showAlarm(alarm: Alarm): void {
    const indicator = ModelFactory.createAlarmIndicator(DEVICE_COLORS.alarm)
    indicator.position.set(alarm.position.x, alarm.position.y, alarm.position.z)
    this.alarmGroup.add(indicator)
    this.alarmIndicators.set(alarm.id, indicator)

    this.animationController.addPulseAnimation(indicator, 4)
    this.animationController.addRotationAnimation(indicator.getObjectByName('beacon')!, 2)

    this.labelSystem.createLabel({
      id: `alarm_${alarm.id}`,
      text: alarm.type,
      position: toVector3(alarm.position),
      color: '#ff4d4f',
      type: 'alarm'
    })
  }

  removeAlarm(alarmId: string): void {
    const indicator = this.alarmIndicators.get(alarmId)
    if (indicator) {
      this.animationController.removePulseAnimation(indicator)
      this.alarmGroup.remove(indicator)
      disposeObject3D(indicator)
      this.alarmIndicators.delete(alarmId)
    }

    this.labelSystem.removeLabel(`alarm_${alarmId}`)
  }

  clearAlarms(): void {
    this.alarmIndicators.forEach((indicator, id) => {
      this.animationController.removePulseAnimation(indicator)
      this.alarmGroup.remove(indicator)
      disposeObject3D(indicator)
      this.labelSystem.removeLabel(`alarm_${id}`)
    })
    this.alarmIndicators.clear()
  }

  selectObject(object: THREE.Object3D | null): void {
    if (this.selectionRing) {
      this.scene.remove(this.selectionRing)
      disposeObject3D(this.selectionRing)
      this.selectionRing = null
    }

    if (object) {
      this.selectionRing = ModelFactory.createSelectionRing()
      this.selectionRing.position.set(object.position.x, 0.1, object.position.z)
      this.scene.add(this.selectionRing)

      const targetPosition = new THREE.Vector3(
        object.position.x + 30,
        object.position.y + 25,
        object.position.z + 30
      )
      const lookAtPosition = new THREE.Vector3(object.position.x, object.position.y, object.position.z)

      this.animationController.tweenCameraLookAt(
        this.camera,
        this.controls,
        targetPosition,
        lookAtPosition,
        1000
      )
    }
  }

  focusPosition(position: { x: number; y: number; z: number }, distance: number = 40): void {
    const targetPosition = new THREE.Vector3(
      position.x + distance,
      position.y + distance * 0.8,
      position.z + distance
    )
    const lookAtPosition = new THREE.Vector3(position.x, position.y, position.z)

    this.animationController.tweenCameraLookAt(
      this.camera,
      this.controls,
      targetPosition,
      lookAtPosition,
      1000
    )

    if (this.selectionRing) {
      this.selectionRing.position.set(position.x, 0.1, position.z)
    } else {
      this.selectionRing = ModelFactory.createSelectionRing()
      this.selectionRing.position.set(position.x, 0.1, position.z)
      this.scene.add(this.selectionRing)
    }
  }

  setOnPickCallback(callback: (result: PickResult) => void): void {
    this.onPickCallback = callback
  }

  setLabelsVisible(visible: boolean): void {
    this.labelSystem.setAllLabelsVisible(visible)
  }

  resetView(): void {
    this.controls.reset()

    if (this.selectionRing) {
      this.scene.remove(this.selectionRing)
      disposeObject3D(this.selectionRing)
      this.selectionRing = null
    }
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }

  getControls(): OrbitControls {
    return this.controls
  }

  getAnimationController(): AnimationController {
    return this.animationController
  }

  getBuildingObject(id: string): THREE.Group | undefined {
    return this.buildingObjects.get(id)
  }

  getDeviceObject(id: string): THREE.Group | undefined {
    return this.deviceObjects.get(id)
  }

  dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
    }

    window.removeEventListener('resize', this.handleResize.bind(this))

    this.animationController.dispose()
    this.interactionManager.dispose()
    this.labelSystem.dispose()
    this.controls.dispose()

    disposeObject3D(this.scene)

    this.renderer.dispose()
    this.container.removeChild(this.renderer.domElement)

    this.deviceObjects.clear()
    this.buildingObjects.clear()
    this.alarmIndicators.clear()
  }
}
