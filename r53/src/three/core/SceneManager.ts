import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { buildSatellite } from '../models/SatelliteBuilder'
import type { SatelliteData } from '../models/SatelliteBuilder'
import type { SceneConfig, ViewMode } from '../../types'

export class SceneManager {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private container: HTMLElement
  private satelliteData!: SatelliteData
  private animationId: number | null = null
  private isRunning: boolean = false
  private stars: THREE.Points | null = null

  private originalPositions: Map<string, THREE.Vector3> = new Map()

  constructor(config: SceneConfig) {
    this.container = config.container
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(config.backgroundColor ?? 0x0a0a1a)

    this.camera = new THREE.PerspectiveCamera(
      config.fov ?? 60,
      this.container.clientWidth / this.container.clientHeight,
      config.near ?? 0.1,
      config.far ?? 1000
    )
    this.camera.position.set(8, 6, 10)

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2

    this.container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.minDistance = 3
    this.controls.maxDistance = 30
    this.controls.target.set(0, 0, 0)

    this.setupLighting()
    this.createStarfield()
    this.buildSatelliteModel()

    window.addEventListener('resize', this.handleResize)
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x404050, 0.5)
    this.scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5)
    sunLight.position.set(10, 10, 10)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 2048
    sunLight.shadow.mapSize.height = 2048
    sunLight.shadow.camera.near = 0.5
    sunLight.shadow.camera.far = 50
    sunLight.shadow.camera.left = -15
    sunLight.shadow.camera.right = 15
    sunLight.shadow.camera.top = 15
    sunLight.shadow.camera.bottom = -15
    this.scene.add(sunLight)

    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3)
    fillLight.position.set(-10, 0, -10)
    this.scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0xffaa44, 0.4)
    rimLight.position.set(0, 10, -10)
    this.scene.add(rimLight)
  }

  private createStarfield(): void {
    const starsGeometry = new THREE.BufferGeometry()
    const starCount = 5000
    const positions = new Float32Array(starCount * 3)
    const colors = new Float32Array(starCount * 3)

    for (let i = 0; i < starCount; i++) {
      const radius = 50 + Math.random() * 100
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      const brightness = 0.5 + Math.random() * 0.5
      colors[i * 3] = brightness
      colors[i * 3 + 1] = brightness
      colors[i * 3 + 2] = brightness
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const starsMaterial = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    })

    this.stars = new THREE.Points(starsGeometry, starsMaterial)
    this.scene.add(this.stars)
  }

  private buildSatelliteModel(): void {
    this.satelliteData = buildSatellite()
    this.scene.add(this.satelliteData.group)

    this.satelliteData.parts.forEach((part, id) => {
      this.originalPositions.set(id, part.position.clone())
    })
  }

  private handleResize = (): void => {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
  }

  start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.animate()
  }

  stop(): void {
    this.isRunning = false
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  private animate = (): void => {
    if (!this.isRunning) return

    this.animationId = requestAnimationFrame(this.animate)

    this.controls.update()

    if (this.stars) {
      this.stars.rotation.y += 0.0001
    }

    this.renderer.render(this.scene, this.camera)
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

  getControls(): OrbitControls {
    return this.controls
  }

  getSatelliteData(): SatelliteData {
    return this.satelliteData
  }

  getOriginalPosition(partId: string): THREE.Vector3 | undefined {
    return this.originalPositions.get(partId)
  }

  resetCamera(): void {
    this.camera.position.set(8, 6, 10)
    this.controls.target.set(0, 0, 0)
    this.controls.update()
  }

  setViewMode(viewMode: ViewMode): void {
    switch (viewMode) {
      case 'normal':
        this.camera.position.set(8, 6, 10)
        this.controls.target.set(0, 0, 0)
        break
      case 'exploded':
        this.camera.position.set(12, 10, 15)
        this.controls.target.set(0, 0, 0)
        break
      case 'internal':
        this.camera.position.set(3, 2, 3)
        this.controls.target.set(0, 0, 0)
        break
    }
    this.controls.update()
  }

  dispose(): void {
    this.stop()
    window.removeEventListener('resize', this.handleResize)

    if (this.satelliteData) {
      this.scene.remove(this.satelliteData.group)
    }

    this.renderer.dispose()
    this.container.removeChild(this.renderer.domElement)

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        if (Array.isArray(object.material)) {
          object.material.forEach((m) => m.dispose())
        } else {
          object.material.dispose()
        }
      }
    })
  }
}
