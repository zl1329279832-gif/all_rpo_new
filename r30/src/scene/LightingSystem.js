import * as THREE from 'three'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'

export class LightingSystem {
  constructor(sceneManager) {
    this.sceneManager = sceneManager
    this.scene = sceneManager.scene
    this.lights = {}
    this.environmentMap = null
  }

  async init(options = {}) {
    this._createAmbientLight(options.ambientIntensity || 0.3)
    this._createKeyLight(options.keyIntensity || 1.5)
    this._createFillLight(options.fillIntensity || 0.6)
    this._createRimLight(options.rimIntensity || 1.2)
    this._createGroundLight(options.groundIntensity || 0.4)

    if (options.hdrPath) {
      await this._loadEnvironmentMap(options.hdrPath)
    }

    return this
  }

  _createAmbientLight(intensity) {
    const ambient = new THREE.AmbientLight(0xffffff, intensity)
    this.scene.add(ambient)
    this.lights.ambient = ambient
  }

  _createKeyLight(intensity) {
    const keyLight = new THREE.DirectionalLight(0xffffff, intensity)
    keyLight.position.set(5, 8, 5)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    keyLight.shadow.camera.near = 0.5
    keyLight.shadow.camera.far = 50
    keyLight.shadow.camera.left = -10
    keyLight.shadow.camera.right = 10
    keyLight.shadow.camera.top = 10
    keyLight.shadow.camera.bottom = -10
    this.scene.add(keyLight)
    this.lights.key = keyLight
  }

  _createFillLight(intensity) {
    const fillLight = new THREE.DirectionalLight(0x88aaff, intensity)
    fillLight.position.set(-5, 4, -3)
    this.scene.add(fillLight)
    this.lights.fill = fillLight
  }

  _createRimLight(intensity) {
    const rimLight = new THREE.DirectionalLight(0xffaa66, intensity)
    rimLight.position.set(0, 6, -8)
    this.scene.add(rimLight)
    this.lights.rim = rimLight
  }

  _createGroundLight(intensity) {
    const groundLight = new THREE.DirectionalLight(0x4488ff, intensity)
    groundLight.position.set(0, -3, 0)
    this.scene.add(groundLight)
    this.lights.ground = groundLight
  }

  async _loadEnvironmentMap(hdrPath) {
    return new Promise((resolve, reject) => {
      const rgbeLoader = new RGBELoader()
      rgbeLoader.load(
        hdrPath,
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping
          this.scene.environment = texture
          this.scene.background = texture
          this.environmentMap = texture
          resolve(texture)
        },
        undefined,
        reject
      )
    })
  }

  setIntensity(lightName, intensity) {
    if (this.lights[lightName]) {
      this.lights[lightName].intensity = intensity
    }
  }

  setColor(lightName, color) {
    if (this.lights[lightName]) {
      this.lights[lightName].color.set(color)
    }
  }

  dispose() {
    Object.values(this.lights).forEach((light) => {
      this.scene.remove(light)
      if (light.dispose) light.dispose()
    })
    if (this.environmentMap) {
      this.environmentMap.dispose()
    }
  }
}
