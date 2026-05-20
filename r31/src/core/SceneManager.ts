import * as THREE from 'three'
import { InstancedRackManager } from './InstancedRackManager'
import type { RackData } from './types'

export class SceneManager {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private rackManager: InstancedRackManager
  private needsRender: boolean = true
  private hasActiveAnimation: boolean = false
  private animationId: number | null = null
  private renderCallback: (() => void) | null = null
  private startTime: number = performance.now()
  private clock: THREE.Clock

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0f172a)
    this.scene.fog = new THREE.Fog(0x0f172a, 50, 200)

    const { clientWidth, clientHeight } = canvas
    this.camera = new THREE.PerspectiveCamera(60, clientWidth / clientHeight, 0.1, 1000)
    this.camera.position.set(80, 60, 80)
    this.camera.lookAt(0, 0, 0)

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    })
    this.renderer.setSize(clientWidth, clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    this.rackManager = new InstancedRackManager()
    this.clock = new THREE.Clock()
    this.setupLighting()
    this.setupGround()
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    this.scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8)
    mainLight.position.set(50, 100, 50)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 2048
    mainLight.shadow.mapSize.height = 2048
    mainLight.shadow.camera.near = 0.5
    mainLight.shadow.camera.far = 500
    mainLight.shadow.camera.left = -150
    mainLight.shadow.camera.right = 150
    mainLight.shadow.camera.top = 150
    mainLight.shadow.camera.bottom = -150
    this.scene.add(mainLight)

    const fillLight = new THREE.DirectionalLight(0x64748b, 0.3)
    fillLight.position.set(-50, 50, -50)
    this.scene.add(fillLight)
  }

  private setupGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(300, 300)
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.1,
      roughness: 0.9
    })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    this.scene.add(ground)

    const gridHelper = new THREE.GridHelper(300, 60, 0x334155, 0x1e293b)
    this.scene.add(gridHelper)
  }

  buildRacks(racks: RackData[]): void {
    const mesh = this.rackManager.build(racks)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.scene.add(mesh)
    
    this.hasActiveAnimation = racks.some(rack => rack.alarmProgress > 0.01)
    this.requestRender()
  }

  private updateAnimation(): void {
    if (this.hasActiveAnimation) {
      const elapsed = this.clock.getElapsedTime()
      this.rackManager.updateAnimationTime(elapsed)
      this.needsRender = true
    }
  }

  render(): void {
    this.updateAnimation()
    
    if (!this.needsRender) return
    this.renderer.render(this.scene, this.camera)
    this.needsRender = false
    if (this.renderCallback) {
      this.renderCallback()
    }
  }

  startRenderLoop(updateCallback?: () => void): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate)
      if (updateCallback) {
        updateCallback()
      }
      this.render()
    }
    animate()
  }

  stopRenderLoop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  requestRender(): void {
    this.needsRender = true
  }

  setAnimationActive(active: boolean): void {
    this.hasActiveAnimation = active
  }

  onRender(callback: () => void): void {
    this.renderCallback = callback
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
    this.requestRender()
  }

  getScene(): THREE.Scene {
    return this.scene
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer
  }

  getRackManager(): InstancedRackManager {
    return this.rackManager
  }

  getRackMesh(): THREE.InstancedMesh {
    return this.rackManager.getMesh()
  }

  getElapsedTime(): number {
    return this.clock.getElapsedTime()
  }

  dispose(): void {
    this.stopRenderLoop()
    this.rackManager.dispose()
    this.renderer.dispose()
    this.scene.clear()
  }
}
