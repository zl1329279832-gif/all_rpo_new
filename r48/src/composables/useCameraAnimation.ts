import * as THREE from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { AreaType } from '@/types'
import { AREA_CAMERA_POSITIONS } from '@/types'

export function useCameraAnimation(camera: THREE.PerspectiveCamera, controls: OrbitControls) {
  let animating = false
  let startPos = new THREE.Vector3()
  let endPos = new THREE.Vector3()
  let startTarget = new THREE.Vector3()
  let endTarget = new THREE.Vector3()
  let progress = 0
  const duration = 1500
  let startTime = 0

  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  const flyTo = (area: AreaType) => {
    const pos = AREA_CAMERA_POSITIONS[area]
    startPos.copy(camera.position)
    endPos.set(pos.x, pos.y, pos.z)
    startTarget.copy(controls.target)

    const targetMap: Record<AreaType, { x: number; y: number; z: number }> = {
      intake: { x: -10, y: 0, z: 2 },
      pumpHouse: { x: 0, y: 1, z: 0 },
      outlet: { x: 10, y: 0, z: 0 },
    }
    endTarget.set(targetMap[area].x, targetMap[area].y, targetMap[area].z)

    progress = 0
    startTime = performance.now()
    animating = true
  }

  const flyToPosition = (position: THREE.Vector3, target: THREE.Vector3) => {
    startPos.copy(camera.position)
    endPos.copy(position)
    startTarget.copy(controls.target)
    endTarget.copy(target)
    progress = 0
    startTime = performance.now()
    animating = true
  }

  const update = (): boolean => {
    if (!animating) return false
    const elapsed = performance.now() - startTime
    progress = Math.min(elapsed / duration, 1)
    const eased = easeInOutCubic(progress)

    camera.position.lerpVectors(startPos, endPos, eased)
    controls.target.lerpVectors(startTarget, endTarget, eased)
    controls.update()

    if (progress >= 1) {
      animating = false
    }
    return animating
  }

  const isAnimating = () => animating

  return { flyTo, flyToPosition, update, isAnimating }
}
