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
  phase: 'idle' | 'moving' | 'lifting' | 'lowering'
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
    this.craneAnimations.set(craneId, {
      crane: craneGroup,
      targetX: 0,
      phase: 'idle'
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
      if (!trolley) return

      if (anim.phase === 'idle') {
        anim.targetX = (Math.random() - 0.5) * 30
        anim.phase = 'moving'
      } else if (anim.phase === 'moving') {
        const moveSpeed = 0.02 * this.speed * deltaTime * 60
        const diff = anim.targetX - trolley.position.x
        if (Math.abs(diff) < 0.1) {
          trolley.position.x = anim.targetX
          anim.phase = Math.random() > 0.5 ? 'lifting' : 'idle'
        } else {
          trolley.position.x += Math.sign(diff) * moveSpeed
        }
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

  public clearAll(): void {
    this.truckAnimations.clear()
    this.craneAnimations.clear()
    this.alertAnimations.forEach(anim => this.resetObjectOpacity(anim.object))
    this.alertAnimations.clear()
    TWEEN.removeAll()
  }

  public destroy(): void {
    this.clearAll()
  }
}
