import * as THREE from 'three'
import * as TWEEN from '@tweenjs/tween.js'
import type { SatelliteData } from '../models/SatelliteBuilder'
import type { SolarPanelData } from '../models/SolarPanel'

export type AnimationType = 'solar_panel_deploy' | 'exploded_view' | 'internal_view'

export interface AnimationProgress {
  type: AnimationType
  progress: number
  isPlaying: boolean
}

export class AnimationSystem {
  private satelliteData: SatelliteData
  private solarPanelData: SolarPanelData
  private tweenGroup: TWEEN.Group
  private activeTweens: Map<string, TWEEN.Tween<unknown>> = new Map()
  private animationFrameId: number | null = null
  private isRunning: boolean = false
  private onProgressCallback: ((progress: AnimationProgress) => void) | null = null

  private solarPanelDeployed: boolean = false
  private explodedViewFactor: number = 0
  private internalViewActive: boolean = false

  constructor(satelliteData: SatelliteData) {
    this.satelliteData = satelliteData
    this.solarPanelData = satelliteData.solarPanelData
    this.tweenGroup = new TWEEN.Group()
  }

  setOnProgressCallback(callback: (progress: AnimationProgress) => void): void {
    this.onProgressCallback = callback
  }

  start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.animate()
  }

  stop(): void {
    this.isRunning = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  private animate = (): void => {
    if (!this.isRunning) return
    this.animationFrameId = requestAnimationFrame(this.animate)
    this.tweenGroup.update()
  }

  playSolarPanelDeployment(duration: number = 3000): Promise<void> {
    return new Promise((resolve) => {
      if (this.activeTweens.has('solar_panel')) {
        this.activeTweens.get('solar_panel')?.stop()
      }

      const targetAngle = this.solarPanelDeployed ? 0 : -Math.PI / 2
      const startLeftAngle = this.solarPanelData.leftYoke.rotation.z
      const startRightAngle = this.solarPanelData.rightYoke.rotation.z
      const targetRightAngle = this.solarPanelDeployed ? 0 : Math.PI / 2

      const progressObj = { value: 0 }

      const tween = new TWEEN.Tween(progressObj, this.tweenGroup)
        .to({ value: 1 }, duration)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => {
          const t = progressObj.value
          this.solarPanelData.leftYoke.rotation.z = startLeftAngle + (targetAngle - startLeftAngle) * t
          this.solarPanelData.rightYoke.rotation.z = startRightAngle + (targetRightAngle - startRightAngle) * t

          this.onProgressCallback?.({
            type: 'solar_panel_deploy',
            progress: t,
            isPlaying: true,
          })
        })
        .onComplete(() => {
          this.solarPanelDeployed = !this.solarPanelDeployed
          this.activeTweens.delete('solar_panel')
          this.onProgressCallback?.({
            type: 'solar_panel_deploy',
            progress: 1,
            isPlaying: false,
          })
          resolve()
        })
        .start()

      this.activeTweens.set('solar_panel', tween)
    })
  }

  playExplodedView(factor: number = 1, duration: number = 2000): Promise<void> {
    return new Promise((resolve) => {
      if (this.activeTweens.has('exploded')) {
        this.activeTweens.get('exploded')?.stop()
      }

      const startFactor = this.explodedViewFactor
      const targetFactor = factor
      const progressObj = { value: 0 }

      const originalPositions = new Map<string, THREE.Vector3>()
      this.satelliteData.parts.forEach((part, id) => {
        originalPositions.set(id, part.position.clone())
      })

      const tween = new TWEEN.Tween(progressObj, this.tweenGroup)
        .to({ value: 1 }, duration)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => {
          const t = progressObj.value
          const currentFactor = startFactor + (targetFactor - startFactor) * t

          this.satelliteData.parts.forEach((part, id) => {
            const offset = this.satelliteData.explodedOffsets.get(id)
            if (offset) {
              const originalPos = this.getOriginalPosition(id)
              if (originalPos) {
                part.position.lerpVectors(
                  originalPos,
                  originalPos.clone().add(offset.clone().multiplyScalar(targetFactor)),
                  t
                )
              }
            }
          })

          this.explodedViewFactor = currentFactor
          this.onProgressCallback?.({
            type: 'exploded_view',
            progress: t,
            isPlaying: true,
          })
        })
        .onComplete(() => {
          this.activeTweens.delete('exploded')
          this.onProgressCallback?.({
            type: 'exploded_view',
            progress: 1,
            isPlaying: false,
          })
          resolve()
        })
        .start()

      this.activeTweens.set('exploded', tween)
    })
  }

  resetExplodedView(duration: number = 1500): Promise<void> {
    return this.playExplodedView(0, duration)
  }

  playInternalView(duration: number = 1500): Promise<void> {
    return new Promise((resolve) => {
      if (this.activeTweens.has('internal')) {
        this.activeTweens.get('internal')?.stop()
      }

      const mainBody = this.satelliteData.parts.get('main_body')
      const internalModules = this.satelliteData.internalModules

      if (!mainBody) {
        resolve()
        return
      }

      const progressObj = { value: 0 }
      const startOpacity = (mainBody.children[0] as THREE.Mesh).material instanceof THREE.Material
        ? ((mainBody.children[0] as THREE.Mesh).material as THREE.Material).opacity
        : 1

      const tween = new TWEEN.Tween(progressObj, this.tweenGroup)
        .to({ value: 1 }, duration)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => {
          const t = progressObj.value
          
          mainBody.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              const material = child.material as THREE.MeshStandardMaterial
              if (material.opacity !== undefined) {
                material.transparent = true
                material.opacity = startOpacity - startOpacity * 0.7 * t
              }
            }
          })

          internalModules.visible = true
          internalModules.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              const material = child.material as THREE.MeshStandardMaterial
              if (material.opacity !== undefined) {
                material.transparent = true
                material.opacity = t
              }
            }
          })

          this.onProgressCallback?.({
            type: 'internal_view',
            progress: t,
            isPlaying: true,
          })
        })
        .onComplete(() => {
          this.internalViewActive = true
          this.activeTweens.delete('internal')
          this.onProgressCallback?.({
            type: 'internal_view',
            progress: 1,
            isPlaying: false,
          })
          resolve()
        })
        .start()

      this.activeTweens.set('internal', tween)
    })
  }

  resetInternalView(duration: number = 1500): Promise<void> {
    return new Promise((resolve) => {
      if (this.activeTweens.has('internal')) {
        this.activeTweens.get('internal')?.stop()
      }

      const mainBody = this.satelliteData.parts.get('main_body')
      const internalModules = this.satelliteData.internalModules

      if (!mainBody) {
        resolve()
        return
      }

      const progressObj = { value: 0 }

      const tween = new TWEEN.Tween(progressObj, this.tweenGroup)
        .to({ value: 1 }, duration)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => {
          const t = progressObj.value
          
          mainBody.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              const material = child.material as THREE.MeshStandardMaterial
              if (material.opacity !== undefined) {
                material.opacity = 0.3 + 0.7 * t
              }
            }
          })

          internalModules.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              const material = child.material as THREE.MeshStandardMaterial
              if (material.opacity !== undefined) {
                material.opacity = 1 - t
              }
            }
          })
        })
        .onComplete(() => {
          this.internalViewActive = false
          internalModules.visible = false
          mainBody.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              const material = child.material as THREE.MeshStandardMaterial
              material.transparent = false
              material.opacity = 1
            }
          })
          this.activeTweens.delete('internal')
          resolve()
        })
        .start()

      this.activeTweens.set('internal', tween)
    })
  }

  stopAllAnimations(): void {
    this.activeTweens.forEach((tween) => tween.stop())
    this.activeTweens.clear()
  }

  isSolarPanelDeployed(): boolean {
    return this.solarPanelDeployed
  }

  isExplodedView(): boolean {
    return this.explodedViewFactor > 0
  }

  isInternalViewActive(): boolean {
    return this.internalViewActive
  }

  private getOriginalPosition(partId: string): THREE.Vector3 | null {
    const offsets: { [key: string]: number[] } = {
      main_body: [0, 0, 0],
      solar_panels: [0, 0, 0],
      antenna: [0, 0, 0],
      sband_antenna: [0, 0, 0],
      thrusters: [0, 0, 0],
      rcs_thrusters: [0, 0, 0],
      sensors: [0, 0, 0],
      heat_sinks: [0, 0, 0],
      radiators: [0, 0, 0],
      supports: [0, 0, 0],
      cables: [0, 0, 0],
      connectors: [0, 0, 0],
      internal_modules: [0, 0, 0],
    }

    const offset = offsets[partId]
    return offset ? new THREE.Vector3(offset[0], offset[1], offset[2]) : null
  }

  dispose(): void {
    this.stopAllAnimations()
    this.stop()
    this.tweenGroup.removeAll()
  }
}
