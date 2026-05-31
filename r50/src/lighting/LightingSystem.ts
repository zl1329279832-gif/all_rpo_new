import * as THREE from 'three'
import { LightMode, LightConfig } from '@/types'

export class LightingSystem {
  private scene: THREE.Scene
  private ambientLight!: THREE.AmbientLight
  private directionalLight!: THREE.DirectionalLight
  private hemisphereLight!: THREE.HemisphereLight
  private pointLights: THREE.PointLight[] = []
  private currentMode: LightMode = 'day'

  private lightConfigs: Record<LightMode, LightConfig> = {
    day: {
      ambientIntensity: 0.7,
      ambientColor: 0xffffff,
      directionalIntensity: 1.2,
      directionalColor: 0xfff8e8,
      directionalPosition: { x: 20, y: 35, z: 15 },
      hemisphereIntensity: 0.5,
      hemisphereSkyColor: 0x87ceeb,
      hemisphereGroundColor: 0x8b7355,
      fogColor: 0xcce0f0,
      fogNear: 30,
      fogFar: 100,
      background: 0x87ceeb
    },
    dusk: {
      ambientIntensity: 0.5,
      ambientColor: 0xffd4a3,
      directionalIntensity: 0.8,
      directionalColor: 0xff8c42,
      directionalPosition: { x: -25, y: 20, z: 20 },
      hemisphereIntensity: 0.4,
      hemisphereSkyColor: 0xff7f50,
      hemisphereGroundColor: 0x4a3728,
      fogColor: 0xffb380,
      fogNear: 25,
      fogFar: 80,
      background: 0xff6b35
    },
    night: {
      ambientIntensity: 0.15,
      ambientColor: 0x2a3a5c,
      directionalIntensity: 0.3,
      directionalColor: 0x6b7db3,
      directionalPosition: { x: 15, y: 25, z: -10 },
      hemisphereIntensity: 0.2,
      hemisphereSkyColor: 0x0a1628,
      hemisphereGroundColor: 0x1a1a2e,
      pointLights: [
        { position: { x: 0, y: 3.5, z: 5 }, color: 0xff6633, intensity: 2, distance: 12 },
        { position: { x: -9, y: 3, z: 5 }, color: 0xff6633, intensity: 1.5, distance: 10 },
        { position: { x: 9, y: 3, z: 5 }, color: 0xff6633, intensity: 1.5, distance: 10 },
        { position: { x: 0, y: 5.5, z: -11 }, color: 0xff6633, intensity: 2, distance: 12 }
      ],
      fogColor: 0x0a0f1a,
      fogNear: 15,
      fogFar: 50,
      background: 0x0a0f1a
    }
  }

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.initLights()
    this.setMode('day')
  }

  private initLights(): void {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(this.ambientLight)

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    this.directionalLight.castShadow = true
    this.directionalLight.shadow.mapSize.width = 2048
    this.directionalLight.shadow.mapSize.height = 2048
    this.directionalLight.shadow.camera.near = 0.5
    this.directionalLight.shadow.camera.far = 100
    this.directionalLight.shadow.camera.left = -30
    this.directionalLight.shadow.camera.right = 30
    this.directionalLight.shadow.camera.top = 30
    this.directionalLight.shadow.camera.bottom = -30
    this.directionalLight.shadow.bias = -0.0005
    this.scene.add(this.directionalLight)

    this.hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x8b7355, 0.4)
    this.scene.add(this.hemisphereLight)
  }

  setMode(mode: LightMode): void {
    this.currentMode = mode
    const config = this.lightConfigs[mode]

    this.ambientLight.intensity = config.ambientIntensity
    this.ambientLight.color.setHex(config.ambientColor)

    this.directionalLight.intensity = config.directionalIntensity
    this.directionalLight.color.setHex(config.directionalColor)
    this.directionalLight.position.set(
      config.directionalPosition.x,
      config.directionalPosition.y,
      config.directionalPosition.z
    )

    if (config.hemisphereIntensity !== undefined) {
      this.hemisphereLight.intensity = config.hemisphereIntensity
    }
    if (config.hemisphereSkyColor !== undefined) {
      this.hemisphereLight.color.setHex(config.hemisphereSkyColor)
    }
    if (config.hemisphereGroundColor !== undefined) {
      this.hemisphereLight.groundColor.setHex(config.hemisphereGroundColor)
    }

    this.pointLights.forEach(light => {
      this.scene.remove(light)
      light.dispose()
    })
    this.pointLights = []

    if (config.pointLights) {
      config.pointLights.forEach(pl => {
        const pointLight = new THREE.PointLight(pl.color, pl.intensity, pl.distance, 2)
        pointLight.position.set(pl.position.x, pl.position.y, pl.position.z)
        pointLight.castShadow = true
        pointLight.shadow.mapSize.width = 512
        pointLight.shadow.mapSize.height = 512
        this.scene.add(pointLight)
        this.pointLights.push(pointLight)
      })
    }

    this.scene.background = new THREE.Color(config.background)
    this.scene.fog = new THREE.Fog(config.fogColor, config.fogNear, config.fogFar)
  }

  getMode(): LightMode {
    return this.currentMode
  }

  getConfigs(): Record<LightMode, LightConfig> {
    return this.lightConfigs
  }

  update(time: number): void {
    if (this.currentMode === 'night') {
      this.pointLights.forEach((light, index) => {
        light.intensity = 1.5 + Math.sin(time * 2 + index) * 0.2
      })
    }
  }

  dispose(): void {
    this.pointLights.forEach(light => light.dispose())
  }
}
