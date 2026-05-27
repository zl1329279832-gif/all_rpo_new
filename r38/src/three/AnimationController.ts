import * as THREE from 'three'
import * as TWEEN from '@tweenjs/tween.js'

export interface TweenOptions {
  duration: number
  easing?: (k: number) => number
  onUpdate?: (value: any) => void
  onComplete?: () => void
}

export class AnimationController {
  private scene: THREE.Scene
  private animationFrameId: number | null = null
  private customAnimations: Map<string, (delta: number) => void> = new Map()
  private isPlaying = false
  private lastTime = 0

  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  start(): void {
    if (this.isPlaying) return
    this.isPlaying = true
    this.lastTime = performance.now()
    this.animate()
  }

  stop(): void {
    this.isPlaying = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  private animate(): void {
    if (!this.isPlaying) return

    const currentTime = performance.now()
    const delta = (currentTime - this.lastTime) / 1000
    this.lastTime = currentTime

    TWEEN.update(currentTime)

    this.customAnimations.forEach((anim) => {
      anim(delta)
    })

    this.updatePulseAnimations(delta)

    this.animationFrameId = requestAnimationFrame(() => this.animate())
  }

  private updatePulseAnimations(delta: number): void {
    this.scene.traverse((obj) => {
      if (obj.userData.pulseAnimation) {
        const pulse = obj.userData.pulseAnimation
        pulse.time += delta

        const scale = 1 + Math.sin(pulse.time * pulse.speed) * 0.2
        obj.scale.setScalar(scale)

        if (obj instanceof THREE.Mesh) {
          const material = obj.material as THREE.MeshBasicMaterial
          if (material.opacity !== undefined) {
            material.opacity = 0.4 + Math.sin(pulse.time * pulse.speed) * 0.3
          }
        }
      }

      if (obj.userData.rotationAnimation) {
        const rot = obj.userData.rotationAnimation
        obj.rotation.y += rot.speed * delta
      }
    })
  }

  tweenPosition(target: THREE.Object3D, to: THREE.Vector3, options: TweenOptions): TWEEN.Tween {
    const { duration, easing = TWEEN.Easing.Cubic.InOut, onUpdate, onComplete } = options

    const from = { x: target.position.x, y: target.position.y, z: target.position.z }
    const tween = new TWEEN.Tween(from)
      .to({ x: to.x, y: to.y, z: to.z }, duration)
      .easing(easing)
      .onUpdate(() => {
        target.position.set(from.x, from.y, from.z)
        if (onUpdate) onUpdate(from)
      })
      .onComplete(() => {
        if (onComplete) onComplete()
      })

    tween.start()
    return tween
  }

  tweenCameraLookAt(
    camera: THREE.PerspectiveCamera,
    controls: { target: THREE.Vector3 },
    targetPosition: THREE.Vector3,
    lookAtPosition: THREE.Vector3,
    duration: number = 1500
  ): TWEEN.Tween {
    const from = {
      camX: camera.position.x,
      camY: camera.position.y,
      camZ: camera.position.z,
      tarX: controls.target.x,
      tarY: controls.target.y,
      tarZ: controls.target.z
    }

    const tween = new TWEEN.Tween(from)
      .to(
        {
          camX: targetPosition.x,
          camY: targetPosition.y,
          camZ: targetPosition.z,
          tarX: lookAtPosition.x,
          tarY: lookAtPosition.y,
          tarZ: lookAtPosition.z
        },
        duration
      )
      .easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate(() => {
        camera.position.set(from.camX, from.camY, from.camZ)
        controls.target.set(from.tarX, from.tarY, from.tarZ)
      })

    tween.start()
    return tween
  }

  addPulseAnimation(obj: THREE.Object3D, speed: number = 2): void {
    obj.userData.pulseAnimation = {
      time: 0,
      speed
    }
  }

  removePulseAnimation(obj: THREE.Object3D): void {
    delete obj.userData.pulseAnimation
    obj.scale.setScalar(1)
  }

  addRotationAnimation(obj: THREE.Object3D, speed: number = 1): void {
    obj.userData.rotationAnimation = { speed }
  }

  removeRotationAnimation(obj: THREE.Object3D): void {
    delete obj.userData.rotationAnimation
  }

  addCustomAnimation(id: string, anim: (delta: number) => void): void {
    this.customAnimations.set(id, anim)
  }

  removeCustomAnimation(id: string): void {
    this.customAnimations.delete(id)
  }

  flashObject(obj: THREE.Object3D, color: number, duration: number = 500): void {
    const originalColors: Map<THREE.Mesh, THREE.Color> = new Map()

    obj.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshStandardMaterial
        if (material.color) {
          originalColors.set(child, material.color.clone())
          material.emissive = new THREE.Color(color)
          material.emissiveIntensity = 0.8
        }
      }
    })

    setTimeout(() => {
      originalColors.forEach((color, mesh) => {
        const material = mesh.material as THREE.MeshStandardMaterial
        material.emissiveIntensity = 0
      })
    }, duration)
  }

  dispose(): void {
    this.stop()
    this.customAnimations.clear()
    TWEEN.removeAll()
  }
}
