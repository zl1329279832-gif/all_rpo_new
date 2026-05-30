import { ref } from 'vue'
import * as THREE from 'three'
import type { DeviceData } from '@/types'

export function useDeviceInteraction(
  camera: THREE.PerspectiveCamera,
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  onDeviceClick: (device: DeviceData | null) => void,
  onDeviceHover: (device: DeviceData | null) => void
) {
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  const hoveredObject = ref<THREE.Object3D | null>(null)
  let originalEmissive = new THREE.Color()

  const getDeviceGroup = (object: THREE.Object3D): THREE.Group | null => {
    let current = object
    while (current) {
      if (current.userData?.deviceId) return current as THREE.Group
      current = current.parent!
    }
    return null
  }

  const onMouseMove = (event: MouseEvent) => {
    const container = renderer.domElement.parentElement
    if (!container) return
    const rect = container.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(scene.children, true)

    if (intersects.length > 0) {
      const group = getDeviceGroup(intersects[0].object)
      if (group && group !== hoveredObject.value) {
        if (hoveredObject.value) {
          resetHighlight(hoveredObject.value)
        }
        hoveredObject.value = group
        applyHighlight(group)
        renderer.domElement.style.cursor = 'pointer'
        const deviceData = findDeviceData(group.userData.deviceId)
        onDeviceHover(deviceData)
      }
    } else {
      if (hoveredObject.value) {
        resetHighlight(hoveredObject.value)
        hoveredObject.value = null
        renderer.domElement.style.cursor = 'default'
        onDeviceHover(null)
      }
    }
  }

  const onMouseClick = (event: MouseEvent) => {
    const container = renderer.domElement.parentElement
    if (!container) return
    const rect = container.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(scene.children, true)

    if (intersects.length > 0) {
      const group = getDeviceGroup(intersects[0].object)
      if (group) {
        const deviceData = findDeviceData(group.userData.deviceId)
        onDeviceClick(deviceData)
      }
    } else {
      onDeviceClick(null)
    }
  }

  const applyHighlight = (group: THREE.Object3D) => {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        originalEmissive.copy(child.material.emissive)
        child.material.emissive.setHex(0x1e90ff)
        child.material.emissiveIntensity = 0.6
      }
    })
  }

  const resetHighlight = (group: THREE.Object3D) => {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material.emissive.copy(originalEmissive)
        child.material.emissiveIntensity = child.material.emissiveIntensity
      }
    })
  }

  const findDeviceData = (deviceId: string): DeviceData | null => {
    return null
  }

  const bindEvents = () => {
    renderer.domElement.addEventListener('mousemove', onMouseMove)
    renderer.domElement.addEventListener('click', onMouseClick)
  }

  const unbindEvents = () => {
    renderer.domElement.removeEventListener('mousemove', onMouseMove)
    renderer.domElement.removeEventListener('click', onMouseClick)
  }

  return { bindEvents, unbindEvents, hoveredObject, getDeviceGroup }
}
