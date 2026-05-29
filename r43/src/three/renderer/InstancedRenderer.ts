import * as THREE from 'three'
import { DeviceType, DeviceStatus, DeviceData } from '@/types'
import { ModelFactory } from '@/three/models/ModelFactory'

export interface InstanceInfo {
  id: string
  type: DeviceType
  status: DeviceStatus
  index: number
  data: DeviceData
}

export class InstancedRenderer {
  private instancedMeshes: Map<string, THREE.InstancedMesh> = new Map()
  private instanceInfos: Map<string, InstanceInfo[]> = new Map()
  private dummy: THREE.Object3D = new THREE.Object3D()
  private raycastObjects: THREE.Object3D[] = []

  public createInstancedMeshes(devices: DeviceData[]): void {
    this.dispose()

    const groupedDevices = new Map<string, DeviceData[]>()
    
    devices.forEach(device => {
      const key = `${device.type}_${device.status}`
      if (!groupedDevices.has(key)) {
        groupedDevices.set(key, [])
      }
      groupedDevices.get(key)!.push(device)
    })

    groupedDevices.forEach((deviceList, key) => {
      const [typeStr, statusStr] = key.split('_')
      const type = typeStr as DeviceType
      const status = statusStr as DeviceStatus

      let group: THREE.Group

      switch (type) {
        case DeviceType.PV_PANEL:
          group = ModelFactory.createPVPanel(status)
          break
        case DeviceType.INVERTER:
          group = ModelFactory.createInverter(status)
          break
        case DeviceType.COMBINER_BOX:
          group = ModelFactory.createCombinerBox(status)
          break
        case DeviceType.ALARM_DEVICE:
          group = ModelFactory.createAlarmDevice(status)
          break
        default:
          return
      }

      const geometry = this.mergeGroupGeometry(group)
      const material = ModelFactory.getMaterial(type, status)

      if (!geometry.getAttribute('position') || geometry.attributes.position.count === 0) {
        console.warn(`Empty geometry for ${type}:${status}${key}`)
        return
      }

      const instancedMesh = new THREE.InstancedMesh(
        geometry,
        material,
        Math.max(deviceList.length, 1)
      )
      instancedMesh.name = `instanced_${key}`
      instancedMesh.castShadow = type !== DeviceType.PV_PANEL
      instancedMesh.receiveShadow = true
      instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
      instancedMesh.frustumCulled = true

      const infos: InstanceInfo[] = []
      deviceList.forEach((device, index) => {
        this.dummy.position.set(device.position.x, device.position.y, device.position.z)
        this.dummy.rotation.set(0, 0, 0)
        this.dummy.scale.set(1, 1, 1)
        this.dummy.updateMatrix()
        instancedMesh.setMatrixAt(index, this.dummy.matrix)
        
        infos.push({
          id: device.id,
          type: device.type,
          status: device.status,
          index: index,
          data: device
        })
      })

      instancedMesh.instanceMatrix.needsUpdate = true
      this.instancedMeshes.set(key, instancedMesh)
      this.instanceInfos.set(key, infos)
      this.raycastObjects.push(instancedMesh)
    })
  }

  private mergeGroupGeometry(group: THREE.Group): THREE.BufferGeometry {
    const geometries: THREE.BufferGeometry[] = []
    
    group.updateMatrixWorld(true)
    
    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const clonedGeo = child.geometry.clone()
        clonedGeo.applyMatrix4(child.matrixWorld)
        geometries.push(clonedGeo)
      }
    })

    if (geometries.length === 0) {
      return new THREE.BufferGeometry()
    }

    if (geometries.length === 1) {
      return geometries[0]
    }

    return this.mergeGeometries(geometries)
  }

  private mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
    const positions: number[] = []
    const normals: number[] = []
    const uvs: number[] = []
    const indices: number[] = []
    let vertexOffset = 0

    geometries.forEach((geo) => {
      const posAttr = geo.getAttribute('position') as THREE.BufferAttribute
      if (!posAttr) return

      const normalAttr = geo.getAttribute('normal') as THREE.BufferAttribute
      const uvAttr = geo.getAttribute('uv') as THREE.BufferAttribute

      const hasNormals = !!normalAttr
      const hasUVs = !!uvAttr

      for (let i = 0; i < posAttr.count; i++) {
        positions.push(
          posAttr.getX(i),
          posAttr.getY(i),
          posAttr.getZ(i)
        )
        
        if (hasNormals) {
          normals.push(
            normalAttr.getX(i),
            normalAttr.getY(i),
            normalAttr.getZ(i)
          )
        }
        
        if (hasUVs) {
          uvs.push(uvAttr.getX(i), uvAttr.getY(i))
        }
      }

      if (geo.index) {
        for (let i = 0; i < geo.index.count; i++) {
          indices.push(geo.index.getX(i) + vertexOffset)
        }
      } else {
        for (let i = 0; i < posAttr.count; i++) {
          indices.push(i + vertexOffset)
        }
      }

      vertexOffset += posAttr.count
    })

    const mergedGeo = new THREE.BufferGeometry()
    
    if (positions.length > 0) {
      mergedGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    }
    
    if (normals.length > 0) {
      mergedGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    }
    
    if (uvs.length > 0) {
      mergedGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    }

    if (indices.length > 0) {
      mergedGeo.setIndex(indices)
    }

    mergedGeo.computeBoundingSphere()

    geometries.forEach(geo => geo.dispose())

    return mergedGeo
  }

  public updateDeviceStatus(deviceId: string, newStatus: DeviceStatus): boolean {
    for (const [key, infos] of this.instanceInfos) {
      const infoIndex = infos.findIndex(info => info.id === deviceId)
      if (infoIndex !== -1) {
        const info = infos[infoIndex]
        
        if (info.status === newStatus) return false
        
        infos.splice(infoIndex, 1)
        
        const oldMesh = this.instancedMeshes.get(key)
        if (oldMesh) {
          this.compressInstancedMesh(key, oldMesh, infos, infoIndex)
        }

        const newKey = `${info.type}_${newStatus}`
        this.addInstance(newKey, info, newStatus)
        
        return true
      }
    }
    return false
  }

  private compressInstancedMesh(
    key: string,
    mesh: THREE.InstancedMesh,
    infos: InstanceInfo[],
    removedIndex: number
  ): void {
    const count = mesh.count
    
    for (let i = removedIndex; i < count - 1; i++) {
      const matrix = new THREE.Matrix4()
      mesh.getMatrixAt(i + 1, matrix)
      mesh.setMatrixAt(i, matrix)
      infos[i].index = i
    }
    
    mesh.count = count - 1
    mesh.instanceMatrix.needsUpdate = true
    
    if (mesh.count === 0) {
      this.instancedMeshes.delete(key)
      this.instanceInfos.delete(key)
      const idx = this.raycastObjects.indexOf(mesh)
      if (idx > -1) {
        this.raycastObjects.splice(idx, 1)
      }
      mesh.geometry.dispose()
    }
  }

  private addInstance(key: string, info: InstanceInfo, status: DeviceStatus): void {
    let mesh = this.instancedMeshes.get(key)
    let infos = this.instanceInfos.get(key) || []
    
    if (!mesh) {
      const type = info.type
      const geometry = this.createGeometryForType(type, status)
      const material = ModelFactory.getMaterial(type, status)
      
      mesh = new THREE.InstancedMesh(geometry, material, 1000)
      mesh.name = `instanced_${key}`
      mesh.castShadow = type !== DeviceType.PV_PANEL
      mesh.receiveShadow = true
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
      mesh.frustumCulled = true
      
      this.instancedMeshes.set(key, mesh)
      this.raycastObjects.push(mesh)
    }

    const newIndex = mesh.count
    this.dummy.position.set(
      info.data.position.x,
      info.data.position.y,
      info.data.position.z
    )
    this.dummy.rotation.set(0, 0, 0)
    this.dummy.scale.set(1, 1, 1)
    this.dummy.updateMatrix()
    mesh.setMatrixAt(newIndex, this.dummy.matrix)
    mesh.count = newIndex + 1
    mesh.instanceMatrix.needsUpdate = true

    infos.push({
      ...info,
      status: status,
      index: newIndex
    })
    this.instanceInfos.set(key, infos)
  }

  private createGeometryForType(type: DeviceType, status: DeviceStatus): THREE.BufferGeometry {
    let group: THREE.Group
    
    switch (type) {
      case DeviceType.PV_PANEL:
        group = ModelFactory.createPVPanel(status)
        break
      case DeviceType.INVERTER:
        group = ModelFactory.createInverter(status)
        break
      case DeviceType.COMBINER_BOX:
        group = ModelFactory.createCombinerBox(status)
        break
      case DeviceType.ALARM_DEVICE:
        group = ModelFactory.createAlarmDevice(status)
        break
      default:
        return new THREE.BufferGeometry()
    }

    return this.mergeGroupGeometry(group)
  }

  public filterByStatus(status: DeviceStatus | null): void {
    this.instancedMeshes.forEach((mesh, key) => {
      if (status === null) {
        mesh.visible = true
      } else {
        const [, meshStatus] = key.split('_')
        mesh.visible = meshStatus === status
      }
    })
  }

  public highlightDevice(_deviceId: string, _highlight: boolean): void {
    // 高亮可以通过改变材质颜色实现
  }

  public getRaycastObjects(): THREE.Object3D[] {
    return this.raycastObjects
  }

  public getInstanceInfo(mesh: THREE.InstancedMesh, instanceId: number): InstanceInfo | null {
    for (const [key, infos] of this.instanceInfos) {
      const instancedMesh = this.instancedMeshes.get(key)
      if (instancedMesh === mesh) {
        return infos.find(info => info.index === instanceId) || null
      }
    }
    return null
  }

  public addToScene(scene: THREE.Scene): void {
    this.instancedMeshes.forEach(mesh => {
      scene.add(mesh)
    })
  }

  public dispose(): void {
    this.instancedMeshes.forEach(mesh => {
      mesh.geometry.dispose()
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose())
      } else {
        mesh.material.dispose()
      }
    })
    this.instancedMeshes.clear()
    this.instanceInfos.clear()
    this.raycastObjects = []
  }
}
