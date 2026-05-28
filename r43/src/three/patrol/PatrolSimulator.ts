import * as THREE from 'three'
import * as TWEEN from '@tweenjs/tween.js'
import { PatrolRoute, PatrolPoint } from '@/types'
import { ThreeEngine } from '@/three/core/Engine'
import { ModelFactory } from '@/three/models/ModelFactory'

export interface PatrolProgress {
  routeName: string
  currentPointIndex: number
  currentPointName: string
  progress: number
  isRunning: boolean
}

export class PatrolSimulator {
  private engine: ThreeEngine
  private currentRoute: PatrolRoute | null = null
  private currentPointIndex: number = 0
  private isRunning: boolean = false
  private patrolMarker: THREE.Mesh | null = null
  private routeLine: THREE.Line | null = null
  private waypointMarkers: THREE.Mesh[] = []
  private progressCallbacks: ((progress: PatrolProgress) => void)[] = []
  private completeCallbacks: (() => void)[] = []

  constructor(engine: ThreeEngine) {
    this.engine = engine
  }

  public startPatrol(route: PatrolRoute, followCamera: boolean = true): void {
    this.stopPatrol()
    this.currentRoute = route
    this.currentPointIndex = 0
    this.isRunning = true

    this.createRouteVisualization(route)
    this.createPatrolMarker()

    this.animateToNextPoint(followCamera)
  }

  private createRouteVisualization(route: PatrolRoute): void {
    this.clearRouteVisualization()

    const points = route.points.map(p => 
      new THREE.Vector3(p.position.x, 0.5, p.position.z)
    )

    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineDashedMaterial({
      color: 0xff6600,
      linewidth: 3,
      dashSize: 2,
      gapSize: 1,
      transparent: true,
      opacity: 0.8
    })

    this.routeLine = new THREE.Line(geometry, material)
    this.routeLine.computeLineDistances()
    this.engine.addToScene(this.routeLine)

    route.points.forEach((point, index) => {
      const markerGeometry = new THREE.SphereGeometry(0.8, 16, 16)
      const markerMaterial = new THREE.MeshStandardMaterial({
        color: index === 0 ? 0x00ff00 : index === route.points.length - 1 ? 0xff0000 : 0xffaa00,
        emissive: index === 0 ? 0x00ff00 : index === route.points.length - 1 ? 0xff0000 : 0xffaa00,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8
      })
      const marker = new THREE.Mesh(markerGeometry, markerMaterial)
      marker.position.set(point.position.x, 1, point.position.z)
      
      const ringGeometry = new THREE.RingGeometry(1, 1.5, 32)
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      })
      const ring = new THREE.Mesh(ringGeometry, ringMaterial)
      ring.rotation.x = -Math.PI / 2
      ring.position.y = 0.02
      marker.add(ring)

      this.waypointMarkers.push(marker)
      this.engine.addToScene(marker)
    })
  }

  private createPatrolMarker(): void {
    this.patrolMarker = ModelFactory.createPatrolMarker()
    this.patrolMarker.position.y = 3
    this.engine.addToScene(this.patrolMarker)

    const light = new THREE.PointLight(0xff6600, 2, 20)
    light.position.y = 2
    this.patrolMarker.add(light)
  }

  private animateToNextPoint(followCamera: boolean): void {
    if (!this.currentRoute || !this.isRunning) return

    const currentPoint = this.currentRoute.points[this.currentPointIndex]
    if (!currentPoint) {
      this.completePatrol()
      return
    }

    this.notifyProgress(currentPoint)

    const nextIndex = this.currentPointIndex + 1
    if (nextIndex >= this.currentRoute.points.length) {
      setTimeout(() => this.completePatrol(), 2000)
      return
    }

    const nextPoint = this.currentRoute.points[nextIndex]
    const startPos = new THREE.Vector3(
      currentPoint.position.x,
      3,
      currentPoint.position.z
    )
    const endPos = new THREE.Vector3(
      nextPoint.position.x,
      3,
      nextPoint.position.z
    )

    const distance = startPos.distanceTo(endPos)
    const duration = Math.min(5000, distance * 50)

    if (this.patrolMarker) {
      this.patrolMarker.position.copy(startPos)
    }

    if (followCamera) {
      const cameraOffset = new THREE.Vector3(15, 12, 15)
      const cameraStart = startPos.clone().add(cameraOffset)
      const cameraEnd = endPos.clone().add(cameraOffset)

      new TWEEN.Tween({ t: 0 })
        .to({ t: 1 }, duration)
        .easing(TWEEN.Easing.Linear.None)
        .onUpdate(({ t }) => {
          if (this.patrolMarker) {
            this.patrolMarker.position.lerpVectors(startPos, endPos, t)
            this.patrolMarker.rotation.y += 0.05
          }
          
          const camPos = new THREE.Vector3().lerpVectors(cameraStart, cameraEnd, t)
          const targetPos = new THREE.Vector3().lerpVectors(startPos, endPos, t)
          
          this.engine.getCamera().position.copy(camPos)
          this.engine.getControls().target.copy(targetPos)
        })
        .onComplete(() => {
          this.currentPointIndex = nextIndex
          setTimeout(() => this.animateToNextPoint(followCamera), 1500)
        })
        .start()
    } else {
      new TWEEN.Tween({ t: 0 })
        .to({ t: 1 }, duration)
        .easing(TWEEN.Easing.Linear.None)
        .onUpdate(({ t }) => {
          if (this.patrolMarker) {
            this.patrolMarker.position.lerpVectors(startPos, endPos, t)
            this.patrolMarker.rotation.y += 0.05
          }
        })
        .onComplete(() => {
          this.currentPointIndex = nextIndex
          setTimeout(() => this.animateToNextPoint(followCamera), 1500)
        })
        .start()
    }
  }

  private notifyProgress(currentPoint: PatrolPoint): void {
    if (!this.currentRoute) return

    const progress: PatrolProgress = {
      routeName: this.currentRoute.name,
      currentPointIndex: this.currentPointIndex,
      currentPointName: currentPoint.name,
      progress: (this.currentPointIndex + 1) / this.currentRoute.points.length,
      isRunning: this.isRunning
    }

    this.progressCallbacks.forEach(cb => cb(progress))
  }

  private completePatrol(): void {
    this.isRunning = false
    this.completeCallbacks.forEach(cb => cb())
  }

  public stopPatrol(): void {
    this.isRunning = false
    this.currentRoute = null
    this.currentPointIndex = 0
    this.clearRouteVisualization()
    
    if (this.patrolMarker) {
      this.engine.removeFromScene(this.patrolMarker)
      this.patrolMarker.geometry.dispose()
      if (Array.isArray(this.patrolMarker.material)) {
        this.patrolMarker.material.forEach(m => m.dispose())
      } else {
        this.patrolMarker.material.dispose()
      }
      this.patrolMarker = null
    }
  }

  private clearRouteVisualization(): void {
    if (this.routeLine) {
      this.engine.removeFromScene(this.routeLine)
      this.routeLine.geometry.dispose()
      if (this.routeLine.material instanceof THREE.LineDashedMaterial) {
        this.routeLine.material.dispose()
      }
      this.routeLine = null
    }

    this.waypointMarkers.forEach(marker => {
      this.engine.removeFromScene(marker)
      marker.geometry.dispose()
      if (Array.isArray(marker.material)) {
        marker.material.forEach(m => m.dispose())
      } else {
        marker.material.dispose()
      }
    })
    this.waypointMarkers = []
  }

  public onProgress(callback: (progress: PatrolProgress) => void): void {
    this.progressCallbacks.push(callback)
  }

  public onComplete(callback: () => void): void {
    this.completeCallbacks.push(callback)
  }

  public getIsRunning(): boolean {
    return this.isRunning
  }

  public dispose(): void {
    this.stopPatrol()
    this.progressCallbacks = []
    this.completeCallbacks = []
  }
}
