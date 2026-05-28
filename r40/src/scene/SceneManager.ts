import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { SceneConfig } from './config'

export class SceneManager {
  public scene: THREE.Scene
  public camera: THREE.PerspectiveCamera
  public renderer: THREE.WebGLRenderer
  public controls: OrbitControls
  public container: HTMLElement
  public animationId: number | null = null
  public clock: THREE.Clock

  private onRenderCallbacks: Array<(delta: number) => void> = []

  constructor(container: HTMLElement) {
    this.container = container
    this.clock = new THREE.Clock()

    this.scene = this.createScene()
    this.camera = this.createCamera()
    this.renderer = this.createRenderer()
    this.controls = this.createControls()

    this.setupLighting()
    this.setupEnvironment()
    this.setupResize()

    this.animate()
  }

  private createScene(): THREE.Scene {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a1628)
    scene.fog = new THREE.Fog(0x0a1628, 200, 800)
    return scene
  }

  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      2000
    )
    camera.position.set(150, 120, 150)
    return camera
  }

  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    })
    renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    this.container.appendChild(renderer.domElement)
    return renderer
  }

  private createControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 30
    controls.maxDistance = 400
    controls.maxPolarAngle = Math.PI / 2.1
    controls.target.set(0, 0, 0)
    return controls
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.6)
    this.scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2)
    mainLight.position.set(100, 150, 80)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 2048
    mainLight.shadow.mapSize.height = 2048
    mainLight.shadow.camera.near = 0.5
    mainLight.shadow.camera.far = 500
    mainLight.shadow.camera.left = -200
    mainLight.shadow.camera.right = 200
    mainLight.shadow.camera.top = 200
    mainLight.shadow.camera.bottom = -200
    this.scene.add(mainLight)

    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.4)
    fillLight.position.set(-80, 60, -60)
    this.scene.add(fillLight)

    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x1a237e, 0.4)
    this.scene.add(hemisphereLight)
  }

  private setupEnvironment(): void {
    const groundGeometry = new THREE.PlaneGeometry(800, 800)
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: SceneConfig.colors.ground,
      roughness: 0.9,
      metalness: 0.1
    })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    ground.position.y = -0.1
    this.scene.add(ground)

    const waterGeometry = new THREE.PlaneGeometry(800, 300)
    const waterMaterial = new THREE.MeshStandardMaterial({
      color: SceneConfig.colors.water,
      transparent: true,
      opacity: 0.8,
      roughness: 0.1,
      metalness: 0.3
    })
    const water = new THREE.Mesh(waterGeometry, waterMaterial)
    water.rotation.x = -Math.PI / 2
    water.position.set(0, -0.05, -350)
    this.scene.add(water)

    this.addGridHelper()
  }

  private addGridHelper(): void {
    const gridHelper = new THREE.GridHelper(800, 80, 0x1e3a5f, 0x0f1f3d)
    gridHelper.position.y = 0.01
    this.scene.add(gridHelper)
  }

  private setupResize(): void {
    window.addEventListener('resize', this.handleResize)
  }

  private handleResize = (): void => {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate)

    const delta = this.clock.getDelta()

    this.controls.update()

    for (const callback of this.onRenderCallbacks) {
      callback(delta)
    }

    this.renderer.render(this.scene, this.camera)
  }

  public onRender(callback: (delta: number) => void): void {
    this.onRenderCallbacks.push(callback)
  }

  public offRender(callback: (delta: number) => void): void {
    const index = this.onRenderCallbacks.indexOf(callback)
    if (index > -1) {
      this.onRenderCallbacks.splice(index, 1)
    }
  }

  public focusOn(position: THREE.Vector3, distance: number = 50): void {
    const targetPosition = position.clone()
    const direction = new THREE.Vector3(1, 0.8, 1).normalize()
    const newCameraPos = targetPosition.clone().add(direction.multiplyScalar(distance))
    
    this.controls.target.copy(targetPosition)
    this.camera.position.copy(newCameraPos)
    this.controls.update()
  }

  public resetCamera(): void {
    this.camera.position.set(150, 120, 150)
    this.controls.target.set(0, 0, 0)
    this.controls.update()
  }

  public destroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
    }

    window.removeEventListener('resize', this.handleResize)

    this.controls.dispose()
    this.renderer.dispose()
    
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose())
        } else {
          obj.material.dispose()
        }
      }
    })

    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
    }

    this.onRenderCallbacks = []
  }
}
