import * as THREE from 'three'
import TWEEN from '@tweenjs/tween.js'
import type { Truck, QuayCrane, Position3D } from '@/types'
import { SceneConfig } from './config'

export interface TruckAnimation {
  truck: THREE.Group
  truckId: string
  path: THREE.Vector3[]
  progress: number
  currentSpeed: number
  maxSpeed: number
  currentSegment: number
  segmentProgress: number
  isWaiting: boolean
  waitTimer: number
}

export interface CraneAnimation {
  crane: THREE.Group
  targetX: number
  targetLiftY: number
  currentLiftY: number
  phase: 'idle' | 'moving' | 'lowering' | 'grabbing' | 'lifting' | 'moving_with_load' | 'releasing'
  liftTravel: number
  baseLiftY: number
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
  private truckPositions: Map<string, THREE.Vector3> = new Map()

  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  public addTruckAnimation(
    truckId: string,
    truckGroup: THREE.Group,
    path: Position3D[],
    speed: number = SceneConfig.truck.maxSpeed
  ): void {
    const vectorPath = path.map(p => new THREE.Vector3(p.x, p.y, p.z))
    const anim: TruckAnimation = {
      truck: truckGroup,
      truckId,
      path: vectorPath,
      progress: 0,
      currentSpeed: speed * 0.5,
      maxSpeed: speed,
      currentSegment: 0,
      segmentProgress: 0,
      isWaiting: false,
      waitTimer: 0
    }
    this.truckAnimations.set(truckId, anim)
    this.truckPositions.set(truckId, vectorPath[0].clone())
  }

  public updateTruckPath(truckId: string, path: Position3D[]): void {
    const animation = this.truckAnimations.get(truckId)
    if (animation) {
      animation.path = path.map(p => new THREE.Vector3(p.x, p.y, p.z))
      animation.progress = 0
      animation.currentSegment = 0
      animation.segmentProgress = 0
    }
  }

  public addCraneAnimation(craneId: string, craneGroup: THREE.Group): void {
    const trolley = craneGroup.getObjectByName('trolley')
    const liftGroup = trolley?.getObjectByName('liftGroup')
    const baseLiftY = liftGroup ? liftGroup.position.y : 0

    this.craneAnimations.set(craneId, {
      crane: craneGroup,
      targetX: 0,
      targetLiftY: baseLiftY,
      currentLiftY: baseLiftY,
      phase: 'idle',
      liftTravel: 20,
      baseLiftY,
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
    const truckArray = Array.from(this.truckAnimations.values())

    for (const anim of truckArray) {
      if (anim.path.length < 2) continue

      if (anim.isWaiting) {
        anim.waitTimer -= deltaTime
        if (anim.waitTimer <= 0) {
          anim.isWaiting = false
          anim.currentSpeed = anim.maxSpeed * 0.3
        }
        continue
      }

      const currentPos = this.truckPositions.get(anim.truckId) || anim.truck.position.clone()

      let closestDist = Infinity
      let closestTruckId = ''

      for (const other of truckArray) {
        if (other.truckId === anim.truckId) continue
        const otherPos = this.truckPositions.get(other.truckId) || other.truck.position.clone()
        const dist = currentPos.distanceTo(otherPos)

        if (dist < SceneConfig.truck.safeDistance) {
          const toOther = new THREE.Vector3().subVectors(otherPos, currentPos)
          const truckForward = this.getTruckForward(anim)
          const dot = toOther.dot(truckForward)

          if (dot > 0 && dist < closestDist) {
            closestDist = dist
            closestTruckId = other.truckId
          }
        }
      }

      if (closestTruckId && closestDist < SceneConfig.truck.minFollowingDistance) {
        anim.currentSpeed = 0
        anim.isWaiting = true
        anim.waitTimer = 0.5 + Math.random() * 1.5
      } else if (closestTruckId && closestDist < SceneConfig.truck.safeDistance) {
        const ratio = (closestDist - SceneConfig.truck.minFollowingDistance) /
          (SceneConfig.truck.safeDistance - SceneConfig.truck.minFollowingDistance)
        anim.currentSpeed = anim.maxSpeed * Math.max(0.1, ratio)
      } else {
        if (anim.currentSpeed < anim.maxSpeed) {
          anim.currentSpeed = Math.min(anim.maxSpeed, anim.currentSpeed + SceneConfig.truck.acceleration * deltaTime * 60)
        }
      }

      const moveAmount = anim.currentSpeed * this.speed * deltaTime * 60

      anim.segmentProgress += moveAmount

      const from = anim.path[anim.currentSegment]
      const to = anim.path[Math.min(anim.currentSegment + 1, anim.path.length - 1)]
      const segmentLength = from.distanceTo(to)

      if (segmentLength < 0.1 || anim.segmentProgress >= segmentLength) {
        anim.currentSegment++
        anim.segmentProgress = 0

        if (anim.currentSegment >= anim.path.length - 1) {
          anim.currentSegment = 0
          anim.segmentProgress = 0
          anim.currentSpeed = 0
        }
      }

      const segFrom = anim.path[anim.currentSegment]
      const segTo = anim.path[Math.min(anim.currentSegment + 1, anim.path.length - 1)]
      const segLen = segFrom.distanceTo(segTo)

      let t = 0
      if (segLen > 0.1) {
        t = Math.min(1, anim.segmentProgress / segLen)
      }

      const newPos = new THREE.Vector3().lerpVectors(segFrom, segTo, t)
      anim.truck.position.copy(newPos)
      this.truckPositions.set(anim.truckId, newPos.clone())

      const direction = new THREE.Vector3().subVectors(segTo, segFrom)
      if (direction.length() > 0.1) {
        direction.normalize()
        const targetAngle = -Math.atan2(direction.z, direction.x)
        const currentAngle = anim.truck.rotation.y
        let angleDiff = targetAngle - currentAngle
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
        anim.truck.rotation.y += angleDiff * Math.min(1, deltaTime * 5)
      }
    }
  }

  private getTruckForward(anim: TruckAnimation): THREE.Vector3 {
    const segFrom = anim.path[anim.currentSegment]
    const segTo = anim.path[Math.min(anim.currentSegment + 1, anim.path.length - 1)]
    const dir = new THREE.Vector3().subVectors(segTo, segFrom)
    if (dir.length() > 0.1) {
      return dir.normalize()
    }
    return new THREE.Vector3(0, 0, 1)
  }

  private updateCranes(deltaTime: number): void {
    this.craneAnimations.forEach((anim) => {
      const trolley = anim.crane.getObjectByName('trolley') as THREE.Group | undefined
      if (!trolley) return

      const liftGroup = trolley.getObjectByName('liftGroup') as THREE.Group | undefined
      if (!liftGroup) return

      const moveSpeed = 0.05 * this.speed * deltaTime * 60
      const liftSpeed = 0.04 * this.speed * deltaTime * 60

      switch (anim.phase) {
        case 'idle': {
          anim.targetX = -15 + Math.random() * 30
          anim.phase = 'moving'
          break
        }

        case 'moving': {
          const diffX = anim.targetX - trolley.position.x
          if (Math.abs(diffX) < 0.1) {
            trolley.position.x = anim.targetX
            anim.phase = 'lowering'
            anim.targetLiftY = anim.baseLiftY - anim.liftTravel
          } else {
            trolley.position.x += Math.sign(diffX) * Math.min(moveSpeed, Math.abs(diffX))
          }
          break
        }

        case 'lowering': {
          const diff = anim.targetLiftY - anim.currentLiftY
          if (Math.abs(diff) < 0.1) {
            anim.currentLiftY = anim.targetLiftY
            liftGroup.position.y = anim.currentLiftY
            this.updateRopes(trolley, liftGroup)
            anim.phase = 'grabbing'
          } else {
            const step = Math.sign(diff) * Math.min(liftSpeed, Math.abs(diff))
            anim.currentLiftY += step
            liftGroup.position.y = anim.currentLiftY
            this.updateRopes(trolley, liftGroup)
          }
          break
        }

        case 'grabbing': {
          this.attachContainerToSpreader(liftGroup)
          anim.hasContainer = true
          anim.targetLiftY = anim.baseLiftY
          anim.phase = 'lifting'
          break
        }

        case 'lifting': {
          const diff = anim.targetLiftY - anim.currentLiftY
          if (Math.abs(diff) < 0.1) {
            anim.currentLiftY = anim.targetLiftY
            liftGroup.position.y = anim.currentLiftY
            this.updateRopes(trolley, liftGroup)
            anim.targetX = anim.targetX > 0 ? -15 + Math.random() * 10 : 10 + Math.random() * 10
            anim.phase = 'moving_with_load'
          } else {
            const step = Math.sign(diff) * Math.min(liftSpeed, Math.abs(diff))
            anim.currentLiftY += step
            liftGroup.position.y = anim.currentLiftY
            this.updateRopes(trolley, liftGroup)
          }
          break
        }

        case 'moving_with_load': {
          const diffX = anim.targetX - trolley.position.x
          if (Math.abs(diffX) < 0.1) {
            trolley.position.x = anim.targetX
            anim.phase = 'releasing'
            anim.targetLiftY = anim.baseLiftY - anim.liftTravel
          } else {
            trolley.position.x += Math.sign(diffX) * Math.min(moveSpeed, Math.abs(diffX))
          }
          break
        }

        case 'releasing': {
          const diff = anim.targetLiftY - anim.currentLiftY
          if (Math.abs(diff) < 0.1) {
            anim.currentLiftY = anim.targetLiftY
            liftGroup.position.y = anim.currentLiftY
            this.updateRopes(trolley, liftGroup)
            this.detachContainerFromSpreader(liftGroup)
            anim.hasContainer = false
            anim.targetLiftY = anim.baseLiftY
            anim.phase = 'lifting'
          } else {
            const step = Math.sign(diff) * Math.min(liftSpeed, Math.abs(diff))
            anim.currentLiftY += step
            liftGroup.position.y = anim.currentLiftY
            this.updateRopes(trolley, liftGroup)
          }
          break
        }
      }

      const statusLight = anim.crane.getObjectByName('statusLight')
      if (statusLight) {
        const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7
        statusLight.scale.setScalar(pulse)
      }
    })
  }

  private updateRopes(trolley: THREE.Group, liftGroup: THREE.Group): void {
    const spreader = liftGroup.getObjectByName('spreader')
    if (!spreader) return

    const spreaderY = liftGroup.position.y + spreader.position.y
    const trolleyBottom = -1.5

    liftGroup.children.forEach(child => {
      if (child instanceof THREE.Line && child.name.startsWith('rope-')) {
        const posAttr = child.geometry.getAttribute('position')
        if (posAttr && posAttr.count >= 2) {
          const x = posAttr.getX(0)
          const z = posAttr.getZ(0)
          posAttr.setXYZ(0, x, trolleyBottom, z)
          posAttr.setXYZ(1, x, spreaderY, z)
          posAttr.needsUpdate = true
        }
      }
    })
  }

  private attachContainerToSpreader(liftGroup: THREE.Group): void {
    const existingContainer = liftGroup.getObjectByName('containerOnSpreader')
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
    liftGroup.add(container)
  }

  private detachContainerFromSpreader(liftGroup: THREE.Group): void {
    const container = liftGroup.getObjectByName('containerOnSpreader')
    if (container) {
      liftGroup.remove(container)
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
          child.material.forEach(m => { m.transparent = true; m.opacity = opacity })
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
          child.material.forEach(m => { m.transparent = false; m.opacity = 1 })
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

    animation.currentSegment = 0
    animation.segmentProgress = 0
    animation.currentSpeed = animation.maxSpeed

    const totalLength = animation.path.reduce((sum, p, i) => {
      if (i === 0) return 0
      return sum + p.distanceTo(animation.path[i - 1])
    }, 0)

    const duration = (totalLength / animation.maxSpeed) * 16 / this.speed

    let elapsed = 0

    const animateStep = () => {
      if (!this.enabled || !this.truckAnimations.has(truckId)) {
        if (onComplete) onComplete()
        return
      }

      const anim = this.truckAnimations.get(truckId)!
      anim.currentSpeed = anim.maxSpeed

      const segFrom = anim.path[anim.currentSegment]
      const segTo = anim.path[Math.min(anim.currentSegment + 1, anim.path.length - 1)]
      const direction = new THREE.Vector3().subVectors(segTo, segFrom)
      if (direction.length() > 0.1) {
        direction.normalize()
        const targetAngle = -Math.atan2(direction.z, direction.x)
        anim.truck.rotation.y = targetAngle
      }

      if (anim.currentSegment >= anim.path.length - 1) {
        if (onComplete) onComplete()
        return
      }

      requestAnimationFrame(animateStep)
    }

    animateStep()
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
    this.truckPositions.delete(truckId)
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
    this.truckPositions.clear()
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
