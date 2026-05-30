import * as THREE from 'three'
import type { DeviceData } from '@/types'
import { STATUS_COLORS } from '@/types'

export function useAnimationLoop(scene: THREE.Scene) {
  let alarmPhase = 0

  const updateAnimations = (time: number, devices: DeviceData[], waterLevel: number) => {
    const t = time * 0.001
    alarmPhase = Math.sin(t * 3) * 0.5 + 0.5

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.name === 'impeller') {
          child.rotation.y += 0.05
        }
        if (child.name === 'indicator') {
          const parentGroup = findDeviceGroup(child)
          if (parentGroup) {
            const device = devices.find(d => d.id === parentGroup.userData.deviceId)
            if (device?.status === 'alarm') {
              const mat = child.material as THREE.MeshStandardMaterial
              mat.emissiveIntensity = 0.3 + alarmPhase * 1.2
            }
          }
        }
      }

      if (child.name === 'water' && child instanceof THREE.Mesh) {
        const geo = child.geometry as THREE.PlaneGeometry
        const pos = geo.attributes.position
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i)
          const z = pos.getY(i)
          const wave = Math.sin(x * 2 + t * 2) * 0.03 + Math.cos(z * 2 + t * 1.5) * 0.02
          pos.setZ(i, wave)
        }
        pos.needsUpdate = true
        child.position.y = -1 + waterLevel * 0.4
      }

      if (child.name === 'pipeParticles' && child instanceof THREE.Points) {
        const pos = child.geometry.attributes.position
        for (let i = 0; i < pos.count; i++) {
          let z = pos.getZ(i)
          z += 0.02
          if (z > 5) z = -5
          pos.setZ(i, z)
        }
        pos.needsUpdate = true
      }
    })

    scene.traverse((child) => {
      if (child instanceof THREE.Group && child.userData?.deviceId) {
        const device = devices.find(d => d.id === child.userData.deviceId)
        if (device?.status === 'alarm') {
          child.traverse((mesh) => {
            if (mesh instanceof THREE.Mesh && mesh.material instanceof THREE.MeshStandardMaterial) {
              if (mesh.name !== 'impeller' && mesh.name !== 'indicator') {
                mesh.material.emissiveIntensity = 0.1 + alarmPhase * 0.8
              }
            }
          })
        }
      }
    })
  }

  const findDeviceGroup = (object: THREE.Object3D): THREE.Group | null => {
    let current = object
    while (current) {
      if (current.userData?.deviceId) return current as THREE.Group
      current = current.parent!
    }
    return null
  }

  return { updateAnimations }
}
