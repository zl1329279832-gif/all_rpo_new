import * as THREE from 'three'
import TWEEN from '@tweenjs/tween.js'
import type { Truck, QuayCrane, Position3D } from '@/types'
import { SceneConfig } from './config'

export interface TruckAnimation {
  truck: THREE.Group
  path: THREE.Vector3[]
  progress: number
  speed: number
}

export interface CraneAnimation {
  crane: THREE.Group
  targetX: number
  targetY: number
  phase: 'idle' | 'moving' | 'lifting' | 'lowering' | 'loading' | 'unloading'
  liftHeight: number
  baseY: number
  hasContainer: boolean
}

export interface BerthAnimation {
  berth: THREE.Group
  vessel?: THREE.Object3D
  phase: 'docking' | 'loading' | 'unloading' | 'departing' | 'idle'
  progress: number
}

export interface AlertAnimation {
  object: THREE.Object3D
  startTime: number
  duration: number
}

export class AnimationManager {
  private scene: THREE.Scene
  private truckAnimations: Map<string, TruckAnimation> = new Map()
  private craneAnimations: Map<string, CraneAnimation> = new Map()
  private berthAnimations: Map<string, BerthAnimation> = new Map()
  private alertAnimations: Map<string, AlertAnimation> = new Map()
  private enabled: boolean = true
  private speed: number = SceneConfig.animationSpeed

  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  public addTruckAnimation(
    truckId: string,
    truckGroup: THREE.Group,
    path: Position3D[],
    speed: number = 0.002
  ): void {
    const vectorPath = path.map(p => new THREE.Vector3(p.x, p.y, p.z))
    this.truckAnimations.set(truckId, {
      truck: truckGroup,
      path: vectorPath,
      progress: 0,
      speed
    })
  }

  public updateTruckPath(truckId: string, path: Position3D[]): void {
    const animation = this.truckAnimations.get(truckId)
    if (animation) {
      animation.path = path.map(p => new THREE.Vector3(p.x, p.y, p.z))
      animation.progress = 0
    }
  }

  public addCraneAnimation(craneId: string, craneGroup: THREE.Group): void {
    const trolley = craneGroup.getObjectByName('trolley')
    const baseY = trolley ? trolley.position.y : 35
    
    this.craneAnimations.set(craneId, {
      crane: craneGroup,
      targetX: 0,
      targetY: baseY,
      phase: 'idle',
      liftHeight: 20,
      baseY,
      hasContainer: false
    })
  }

  public addBerthAnimation(berthId: string, berthGroup: THREE.Group, vessel?: THREE.Object3D): void {
    this.berthAnimations.set(berthId, {
      berth: berthGroup,
      vessel,
      phase: vessel ? 'loading' : 'idle',
      progress: 0
    })
  }

  public addAlertAnimation(objectId: string, object: THREE.Object3D, duration: number = 3000): void {
    this.alertAnimations.set(objectId, {
      object,
      startTime: Date.now(),
      duration
    })
  }

  public update(deltaTime: number): void {
    if (!this.enabled) return

    TWEEN.update()

    this.updateTrucks(deltaTime)
    this.updateCranes(deltaTime)
    this.updateBerths(deltaTime)
    this.updateAlerts()
  }

  private updateTrucks(deltaTime: number): void {
    this.truckAnimations.forEach((anim, id) => {
      if (anim.path.length < 2) return

      const adjustedSpeed = anim.speed * this.speed * deltaTime * 60
      anim.progress += adjustedSpeed

      if (anim.progress >= anim.path.length - 1) {
        anim.progress = 0
      }

      const currentIndex = Math.floor(anim.progress)
      const nextIndex = Math.min(currentIndex + 1, anim.path.length - 1)
      const t = anim.progress - currentIndex

      const currentPos = anim.path[currentIndex]
      const nextPos = anim.path[nextIndex]

      const newPos = new THREE.Vector3().lerpVectors(currentPos, nextPos, t)
      anim.truck.position.copy(newPos)

      const direction = new THREE.Vector3().subVectors(nextPos, currentPos).normalize()
      if (direction.length() > 0.1) {
        anim.truck.rotation.y = Math.atan2(direction.x, direction.z)
      }
    })
  }

  private updateCranes(deltaTime: number): void {
    this.craneAnimations.forEach((anim) => {
      const trolley = anim.crane.getObjectByName('trolley')
      const spreader = trolley?.getObjectByName('spreader')
      const containerOnSpreader = trolley?.getObjectByName('containerOnSpreader')
      if (!trolley || !spreader) return

      const moveSpeed = 0.025 * this.speed * deltaTime * 60
      const liftSpeed = 0.03 * this.speed * deltaTime * 60

      switch (anim.phase) {
        case 'idle':
          anim.targetX = -15 + Math.random() * 30
          anim.phase = 'moving'
          break

        case 'moving':
          const diffX = anim.targetX - trolley.position.x
          if (Math.abs(diffX) < 0.1) {
            trolley.position.x = anim.targetX
            anim.phase = anim.hasContainer ? 'lowering' : 'lifting'
          } else {
            trolley.position.x += Math.sign(diffX) * moveSpeed
          }
          break

        case 'lifting':
          anim.targetY = anim.baseY + anim.liftHeight
          const liftDiff = anim.targetY - trolley.position.y
          if (Math.abs(liftDiff) < 0.1) {
            trolley.position.y = anim.targetY
            if (!anim.hasContainer) {
              this.attachContainerToSpreader(trolley)
              anim.hasContainer = true
            }
            anim.targetX = anim.targetX > 0 ? -15 + Math.random() * 10 : 10 + Math.random() * 10
            anim.phase = 'moving'
          } else {
            trolley.position.y += Math.sign(liftDiff) * liftSpeed
          }
          break

        case 'lowering':
          anim.targetY = anim.baseY
          const lowerDiff = anim.targetY - trolley.position.y
          if (Math.abs(lowerDiff) < 0.1) {
            trolley.position.y = anim.targetY
            if (anim.hasContainer) {
              this.detachContainerFromSpreader(trolley)
              anim.hasContainer = false
            }
            anim.phase = 'idle'
          } else {
            trolley.position.y += Math.sign(lowerDiff) * liftSpeed
          }
          break
      }

      const statusLight = anim.crane.getObjectByName('statusLight')
      if (statusLight) {
        const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7
        statusLight.scale.setScalar(pulse)
      }
    })
  }

  private attachContainerToSpreader(trolley: THREE.Group): void {
    const existingContainer = trolley.getObjectByName('containerOnSpreader')
    if (existingContainer) return

    const containerGeometry = new THREE.BoxGeometry(6, 2.6, 2.5)
    const containerMaterial = new THREE.MeshStandardMaterial({
      color: 0x78909c,
      roughness: 0.7,
      metalness: 0.2
    })
    const container = new THREE.Mesh(containerGeometry, containerMaterial)
    container.name = 'containerOnSpreader'
    container.position.set(0, -8, 0)
    container.castShadow = true
    trolley.add(container)
  }

  private detachContainerFromSpreader(trolley: THREE.Group): void {
    const container = trolley.getObjectByName('containerOnSpreader')
    if (container) {
      trolley.remove(container)
      if (container instanceof THREE.Mesh) {
        container.geometry.dispose()
        if (container.material instanceof THREE.Material) {
          container.material.dispose()
        }
      }
    }
  }

  private updateBerths(deltaTime: number): void {
    this.berthAnimations.forEach((anim) => {
      if (!anim.vessel) return

      const adjustedSpeed = this.speed * deltaTime * 60

      switch (anim.phase) {
        case 'docking':
          anim.progress += 0.001 * adjustedSpeed
          if (anim.progress >= 1) {
            anim.progress = 1
            anim.phase = 'loading'
          }
          anim.vessel.position.z = -80 + anim.progress * 30
          break

        case 'loading':
        case 'unloading':
          anim.progress += 0.0005 * adjustedSpeed
          if (anim.progress >= 1) {
            anim.progress = 0
            anim.phase = Math.random() > 0.5 ? 'loading' : 'unloading'
          }
          const statusLight = anim.vessel.getObjectByName('statusLight')
          if (statusLight) {
            const pulse = Math.sin(Date.now() * 0.003) * 0.3 + 0.7
            statusLight.scale.setScalar(pulse)
          }
          break

        case 'departing':
          anim.progress += 0.001 * adjustedSpeed
          if (anim.progress >= 1) {
            anim.vessel.visible = false
            anim.phase = 'idle'
            setTimeout(() => {
              if (anim.vessel) {
                anim.vessel.visible = true
                anim.phase = 'docking'
                anim.progress = 0
              }
            }, 10000)
          }
          anim.vessel.position.z = -50 - anim.progress * 80
          break
      }
    })
  }

  private updateAlerts(): void {
    const now = Date.now()

    this.alertAnimations.forEach((anim, id) => {
      const elapsed = now - anim.startTime
      if (elapsed > anim.duration) {
        this.alertAnimations.delete(id)
        this.resetObjectOpacity(anim.object)
        return
      }

      const flash = Math.sin(elapsed * 0.01) * 0.5 + 0.5
      this.setObjectOpacity(anim.object, 0.5 + flash * 0.5)
    })
  }

  private setObjectOpacity(object: THREE.Object3D, opacity: number): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => {
            m.transparent = true
            m.opacity = opacity
          })
        } else {
          child.material.transparent = true
          child.material.opacity = opacity
        }
      }
    })
  }

  private resetObjectOpacity(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => {
            m.transparent = false
            m.opacity = 1
          })
        } else {
          child.material.transparent = false
          child.material.opacity = 1
        }
      }
    })
  }

  public playTruckRoute(truckId: string, onComplete?: () => void): void {
    const animation = this.truckAnimations.get(truckId)
    if (!animation) return

    animation.progress = 0
    
    new TWEEN.Tween(animation)
      .to({ progress: animation.path.length - 1 }, 8000 / this.speed)
      .easing(TWEEN.Easing.Linear.None)
      .onUpdate(() => {
        const currentIndex = Math.floor(animation.progress)
        const nextIndex = Math.min(currentIndex + 1, animation.path.length - 1)
        const t = animation.progress - currentIndex

        const currentPos = animation.path[currentIndex]
        const nextPos = animation.path[nextIndex]

        const newPos = new THREE.Vector3().lerpVectors(currentPos, nextPos, t)
        animation.truck.position.copy(newPos)

        const direction = new THREE.Vector3().subVectors(nextPos, currentPos).normalize()
        if (direction.length() > 0.1) {
          animation.truck.rotation.y = Math.atan2(direction.x, direction.z)
        }
      })
      .onComplete(() => {
        if (onComplete) onComplete()
      })
      .start()
  }

  public setSpeed(speed: number): void {
    this.speed = Math.max(0.1, Math.min(5, speed))
  }

  public getSpeed(): number {
    return this.speed
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  public isEnabled(): boolean {
    return this.enabled
  }

  public removeTruckAnimation(truckId: string): void {
    this.truckAnimations.delete(truckId)
  }

  public removeCraneAnimation(craneId: string): void {
    this.craneAnimations.delete(craneId)
  }

  public removeAlertAnimation(objectId: string): void {
    const anim = this.alertAnimations.get(objectId)
    if (anim) {
      this.resetObjectOpacity(anim.object)
      this.alertAnimations.delete(objectId)
    }
  }

  public removeBerthAnimation(berthId: string): void {
    this.berthAnimations.delete(berthId)
  }

  public clearAll(): void {
    this.truckAnimations.clear()
    this.craneAnimations.clear()
    this.berthAnimations.clear()
    this.alertAnimations.forEach(anim => this.resetObjectOpacity(anim.object))
    this.alertAnimations.clear()
    TWEEN.removeAll()
  }

  public destroy(): void {
    this.clearAll()
  }
}
