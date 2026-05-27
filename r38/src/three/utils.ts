import * as THREE from 'three'
import type { Position3D } from '@/types'

export function toVector3(pos: Position3D): THREE.Vector3 {
  return new THREE.Vector3(pos.x, pos.y, pos.z)
}

export function createCanvasTexture(
  width: number,
  height: number,
  drawCallback: (ctx: CanvasRenderingContext2D) => void
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  drawCallback(ctx)
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

export function createRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

export function disposeObject3D(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose()
      if (Array.isArray(child.material)) {
        child.material.forEach((mat) => disposeMaterial(mat))
      } else {
        disposeMaterial(child.material)
      }
    }
  })
}

function disposeMaterial(material: THREE.Material): void {
  material.dispose()
  const mat = material as THREE.MeshStandardMaterial
  if (mat.map) mat.map.dispose()
  if (mat.normalMap) mat.normalMap.dispose()
  if (mat.roughnessMap) mat.roughnessMap.dispose()
  if (mat.metalnessMap) mat.metalnessMap.dispose()
  if (mat.emissiveMap) mat.emissiveMap.dispose()
  if (mat.aoMap) mat.aoMap.dispose()
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
