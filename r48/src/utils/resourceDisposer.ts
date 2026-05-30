import * as THREE from 'three'

export function disposeObject(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry?.dispose()
      if (Array.isArray(child.material)) {
        child.material.forEach(m => m.dispose())
      } else {
        child.material?.dispose()
      }
    }
    if (child instanceof THREE.Line) {
      child.geometry?.dispose()
      if (Array.isArray(child.material)) {
        child.material.forEach(m => m.dispose())
      } else {
        child.material?.dispose()
      }
    }
    if (child instanceof THREE.Points) {
      child.geometry?.dispose()
      if (Array.isArray(child.material)) {
        child.material.forEach(m => m.dispose())
      } else {
        child.material?.dispose()
      }
    }
  })
}

export function disposeScene(scene: THREE.Scene, renderer: THREE.WebGLRenderer, controls: any): void {
  disposeObject(scene)
  scene.clear()
  controls?.dispose()
  renderer?.dispose()
  const canvas = renderer?.domElement
  if (canvas && canvas.parentNode) {
    canvas.parentNode.removeChild(canvas)
  }
}
