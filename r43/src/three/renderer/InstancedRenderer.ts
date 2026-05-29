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

      let geometry: THREE.BufferGeometry
      let material: THREE.MeshStandardMaterial

      switch (type) {
        case DeviceType.PV_PANEL:
          const panelGroup = ModelFactory.createPVPanel(status)
          geometry = this.mergeGroupGeometry(panelGroup)
          material = ModelFactory.getMaterial(type, status)
          break
        case DeviceType.INVERTER:
          const inverterGroup = ModelFactory.createInverter(status)
          geometry = this.mergeGroupGeometry(inverterGroup)
          material = ModelFactory.getMaterial(type, status)
          break
        case DeviceType.COMBINER_BOX:
          const boxGroup = ModelFactory.createCombinerBox(status)
          geometry = this.mergeGroupGeometry(boxGroup)
          material = ModelFactory.getMaterial(type, status)
          break
        case DeviceType.ALARM_DEVICE:
          const alarmGroup = ModelFactory.createAlarmDevice(status)
          geometry = this.mergeGroupGeometry(alarmGroup)
          material = ModelFactory.getMaterial(type, status)
          break
        default:
          return
      }

      const instancedMesh = new THREE.InstancedMesh(
        geometry,
        material,
        deviceList.length
      )
      instancedMesh.name = `instanced_${key}`
      instancedMesh.castShadow = true
      instancedMesh.receiveShadow = true
      instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)

      const infos: InstanceInfo[] = []
      deviceList.forEach((device, index) => {
        this.dummy.position.set(device.position.x, device.position.y, device.position.z)
        this.dummy.rotation.set(0, 0, 0)
        this.dummy.scale.set(1, 1, 1)
        this.dummy.updateMatrix()
        instancedMesh.setMatrixAt(index, this.dummy.matrix)
        
        infos.push({
          id: device.id,
          type,
          status,
          index,
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
      if (child instanceof THREE.Mesh) {
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
    const attributes: Record<string, number[]> = {}
    let indexOffset = 0
    const indices: number[] = []

    geometries.forEach((geo) => {
      const positionAttr = geo.getAttribute('position') as THREE.BufferAttribute
      if (!positionAttr) return

      if (!attributes.position) {
        attributes.position = []
      }
      if (geo.getAttribute('normal') && !attributes.normal) {
        attributes.normal = []
      }
      if (geo.getAttribute('uv') && !attributes.uv) {
        attributes.uv = []
      }

      for (let i = 0; i < positionAttr.count; i++) {
        attributes.position.push(
          positionAttr.getX(i),
          positionAttr.getY(i),
          positionAttr.getZ(i)
        )
        
        if (attributes.normal) {
          const normalAttr = geo.getAttribute('normal') as THREE.BufferAttribute
          attributes.normal.push(
            normalAttr.getX(i),
            normalAttr.getY(i),
            normalAttr.getZ(i)
          )
        }
        
        if (attributes.uv) {
          const uvAttr = geo.getAttribute('uv') as THREE.BufferAttribute
          attributes.uv.push(uvAttr.getX(i), uvAttr.getY(i))
        }
      }

      if (geo.index) {
        for (let i = 0; i < geo.index.count; i++) {
          indices.push(geo.index.getX(i) + indexOffset)
        }
      } else {
        for (let i = 0; i < positionAttr.count; i++) {
          indices.push(i + indexOffset)
        }
      }

      indexOffset += positionAttr.count
    })

    const mergedGeo = new THREE.BufferGeometry()
    
    mergedGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(attributes.position, 3)
    )
    
    if (attributes.normal) {
      mergedGeo.setAttribute(
        'normal',
        new THREE.Float32BufferAttribute(attributes.normal, 3)
      )
    }
    
    if (attributes.uv) {
      mergedGeo.setAttribute(
        'uv',
        new THREE.Float32BufferAttribute(attributes.uv, 2)
      )
    }

    mergedGeo.setIndex(indices)

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

        const newKey = `${info.type}_${newStatus}`
        if (!this.instanceInfos.has(newKey)) {
          this.createNewInstancedMesh(info.type, newStatus)
        }

        const newInfos = this.instanceInfos.get(newKey)!
        const newMesh = this.instancedMeshes.get(newKey)!
        const newIndex = newInfos.length

        const oldMesh = this.instancedMeshes.get(key)!
        const matrix = new THREE.Matrix4()
        oldMesh.getMatrixAt(info.index, matrix)

        this.dummy.applyMatrix4(matrix)
        this.dummy.updateMatrix()
        newMesh.setMatrixAt(newIndex, this.dummy.matrix)
        newMesh.instanceMatrix.needsUpdate = true

        const deviceData = { ...info.data, status: newStatus }
        newInfos.push({
          id: info.id,
          type: info.type,
          status: newStatus,
          index: newIndex,
          data: deviceData
        })

        this.compressInstancedMesh(key, infoIndex)

        return true
      }
    }
    return false
  }

  private createNewInstancedMesh(type: DeviceType, status: DeviceStatus): void {
    const key = `${type}_${status}`
    let geometry: THREE.BufferGeometry

    switch (type) {
      case DeviceType.PV_PANEL:
        geometry = this.mergeGroupGeometry(ModelFactory.createPVPanel(status))
        break
      case DeviceType.INVERTER:
        geometry = this.mergeGroupGeometry(ModelFactory.createInverter(status))
        break
      case DeviceType.COMBINER_BOX:
        geometry = this.mergeGroupGeometry(ModelFactory.createCombinerBox(status))
        break
      case DeviceType.ALARM_DEVICE:
        geometry = this.mergeGroupGeometry(ModelFactory.createAlarmDevice(status))
        break
      default:
        return
    }

    const material = ModelFactory.getMaterial(type, status)
    const instancedMesh = new THREE.InstancedMesh(geometry, material, 1000)
    instancedMesh.name = `instanced_${key}`
    instancedMesh.castShadow = true
    instancedMesh.receiveShadow = true
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)

    this.instancedMeshes.set(key, instancedMesh)
    this.instanceInfos.set(key, [])
    this.raycastObjects.push(instancedMesh)
  }

  private compressInstancedMesh(key: string, removedIndex: number): void {
    const mesh = this.instancedMeshes.get(key)
    const infos = this.instanceInfos.get(key)
    
    if (!mesh || !infos) return

    const lastIndex = infos.length
    
    if (removedIndex < lastIndex) {
      const matrix = new THREE.Matrix4()
      mesh.getMatrixAt(lastIndex, matrix)
      mesh.setMatrixAt(removedIndex, matrix)
      mesh.instanceMatrix.needsUpdate = true

      const movedInfo = infos[lastIndex]
      if (movedInfo) {
        movedInfo.index = removedIndex
      }
    }

    mesh.count = lastIndex
  }

  public getInstanceInfoAt(intersect: THREE.Intersection): InstanceInfo | null {
    const mesh = intersect.object as THREE.InstancedMesh
    if (!(mesh instanceof THREE.InstancedMesh)) return null
    if (intersect.instanceId === undefined) return null

    for (const [key, infos] of this.instanceInfos) {
      if (mesh.name === `instanced_${key}`) {
        return infos.find(info => info.index === intersect.instanceId) || null
      }
    }
    return null
  }

  public getRaycastObjects(): THREE.Object3D[] {
    return this.raycastObjects
  }

  public getMeshes(): THREE.InstancedMesh[] {
    return Array.from(this.instancedMeshes.values())
  }

  public getDeviceData(deviceId: string): DeviceData | null {
    for (const infos of this.instanceInfos.values()) {
      const info = infos.find(i => i.id === deviceId)
      if (info) return info.data
    }
    return null
  }

  public getAllDeviceData(): DeviceData[] {
    const devices: DeviceData[] = []
    for (const infos of this.instanceInfos.values()) {
      infos.forEach(info => devices.push(info.data))
    }
    return devices
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

  public highlightDevice(deviceId: string, highlight: boolean): void {
    for (const [key, mesh] of this.instancedMeshes) {
      const infos = this.instanceInfos.get(key)
      if (!infos) continue

      const info = infos.find(i => i.id === deviceId)
      if (info) {
        const color = highlight 
          ? new THREE.Color(0xffffff)
          : new THREE.Color(ModelFactory.getMaterial(info.type, info.status).color)
        
        mesh.setColorAt(info.index, color)
        mesh.instanceColor!.needsUpdate = true
        break
      }
    }
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
