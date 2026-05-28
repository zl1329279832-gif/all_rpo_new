import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as TWEEN from '@tweenjs/tween.js'

export class ThreeEngine {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private container: HTMLElement
  private animationId: number | null = null
  private resizeObserver: ResizeObserver | null = null
  private onBeforeRenderCallbacks: (() => void)[] = []

  constructor(container: HTMLElement) {
    this.container = container
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87ceeb)
    this.scene.fog = new THREE.Fog(0x87ceeb, 200, 800)

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      2000
    )
    this.camera.position.set(150, 120, 150)

    this.renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.maxPolarAngle = Math.PI / 2.1
    this.controls.minDistance = 10
    this.controls.maxDistance = 500

    this.setupLighting()
    this.setupEventListeners()
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
    directionalLight.position.set(100, 150, 80)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 4096
    directionalLight.shadow.mapSize.height = 4096
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 500
    directionalLight.shadow.camera.left = -250
    directionalLight.shadow.camera.right = 250
    directionalLight.shadow.camera.top = 250
    directionalLight.shadow.camera.bottom = -250
    directionalLight.shadow.bias = -0.0001
    this.scene.add(directionalLight)

    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x548235, 0.4)
    this.scene.add(hemisphereLight)
  }

  private setupEventListeners(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.onResize()
    })
    this.resizeObserver.observe(this.container)
  }

  private onResize(): void {
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  public onBeforeRender(callback: () => void): void {
    this.onBeforeRenderCallbacks.push(callback)
  }

  public start(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate)
      TWEEN.update()
      this.controls.update()
      this.onBeforeRenderCallbacks.forEach(cb => cb())
      this.renderer.render(this.scene, this.camera)
    }
    animate()
  }

  public stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  public flyTo(position: THREE.Vector3, target: THREE.Vector3, duration: number = 1500): void {
    const startPos = this.camera.position.clone()
    const startTarget = this.controls.target.clone()

    new TWEEN.Tween({ t: 0 })
      .to({ t: 1 }, duration)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate(({ t }) => {
        this.camera.position.lerpVectors(startPos, position, t)
        this.controls.target.lerpVectors(startTarget, target, t)
      })
      .start()
  }

  public getScene(): THREE.Scene {
    return this.scene
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer
  }

  public getControls(): OrbitControls {
    return this.controls
  }

  public getDomElement(): HTMLCanvasElement {
    return this.renderer.domElement
  }

  public addToScene(object: THREE.Object3D): void {
    this.scene.add(object)
  }

  public removeFromScene(object: THREE.Object3D): void {
    this.scene.remove(object)
  }

  public dispose(): void {
    this.stop()
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }

    this.controls.dispose()
    
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        if (Array.isArray(object.material)) {
          object.material.forEach(m => m.dispose())
        } else {
          object.material.dispose()
        }
      }
    })

    this.renderer.dispose()
    this.onBeforeRenderCallbacks = []
  }
}
