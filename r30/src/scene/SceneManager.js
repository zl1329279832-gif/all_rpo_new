import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas
    this.scene = null
    this.camera = null
    this.renderer = null
    this.controls = null
    this.clock = new THREE.Clock()
    this.animationCallbacks = []
    this.isRunning = false
    this.boundAnimate = this.animate.bind(this)
  }

  init() {
    this._createScene()
    this._createCamera()
    this._createRenderer()
    this._createControls()
    this._setupResizeHandler()
    return this
  }

  _createScene() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0a0a0f)
  }

  _createCamera() {
    const { clientWidth, clientHeight } = this.canvas
    this.camera = new THREE.PerspectiveCamera(
      45,
      clientWidth / clientHeight,
      0.1,
      1000
    )
    this.camera.position.set(5, 2.5, 8)
  }

  _createRenderer() {
    const { clientWidth, clientHeight } = this.canvas
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    })
    this.renderer.setSize(clientWidth, clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
  }

  _createControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.minDistance = 3
    this.controls.maxDistance = 20
    this.controls.maxPolarAngle = Math.PI / 2.1
    this.controls.target.set(0, 0.8, 0)
  }

  _setupResizeHandler() {
    this._handleResize = () => {
      const { clientWidth, clientHeight } = this.canvas
      this.camera.aspect = clientWidth / clientHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(clientWidth, clientHeight)
    }
    window.addEventListener('resize', this._handleResize)
  }

  addAnimationCallback(callback) {
    this.animationCallbacks.push(callback)
  }

  removeAnimationCallback(callback) {
    const index = this.animationCallbacks.indexOf(callback)
    if (index > -1) {
      this.animationCallbacks.splice(index, 1)
    }
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true
      this.clock.start()
      this.animate()
    }
  }

  stop() {
    this.isRunning = false
  }

  animate() {
    if (!this.isRunning) return

    requestAnimationFrame(this.boundAnimate)

    const delta = this.clock.getDelta()
    const elapsed = this.clock.getElapsedTime()

    this.controls.update()

    for (const callback of this.animationCallbacks) {
      callback(delta, elapsed)
    }

    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.stop()
    window.removeEventListener('resize', this._handleResize)
    this.controls.dispose()
    this.renderer.dispose()

    this.scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose()
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((m) => m.dispose())
        } else {
          object.material.dispose()
        }
      }
    })
  }
}
