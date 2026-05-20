import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export class CarModel {
  constructor(sceneManager) {
    this.sceneManager = sceneManager
    this.scene = sceneManager.scene
    this.model = null
    this.bodyMaterial = null
    this.doorMaterials = []
    this.doors = {
      left: { mesh: null, open: false, targetAngle: 0, currentAngle: 0, hinge: new THREE.Vector3() },
      right: { mesh: null, open: false, targetAngle: 0, currentAngle: 0, hinge: new THREE.Vector3() }
    }
    this.interactiveObjects = []
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.onDoorClickCallback = null
    this.boundHandleClick = this._handleClick.bind(this)
  }

  async load(modelPath, onProgress) {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader()

      loader.load(
        modelPath,
        (gltf) => {
          this._processModel(gltf.scene)
          resolve(this.model)
        },
        (xhr) => {
          if (onProgress && xhr.total > 0) {
            const progress = (xhr.loaded / xhr.total) * 100
            onProgress(progress)
          }
        },
        reject
      )
    })
  }

  _processModel(model) {
    this.model = model
    this.model.position.y = 0
    this.model.castShadow = true
    this.model.receiveShadow = true

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true

        const name = child.name.toLowerCase()

        if (name.includes('body') || name.includes('carbody') || name.includes('外壳')) {
          this.bodyMaterial = child.material
        }

        if (name.includes('door') || name.includes('车门')) {
          this.doorMaterials.push(child.material)
          this.interactiveObjects.push(child)

          if (name.includes('left') || name.includes('左')) {
            this.doors.left.mesh = child
            this.doors.left.hinge.copy(child.position)
            this.doors.left.originalRotation = child.rotation.y
          } else if (name.includes('right') || name.includes('右')) {
            this.doors.right.mesh = child
            this.doors.right.hinge.copy(child.position)
            this.doors.right.originalRotation = child.rotation.y
          }
        }
      }
    })

    this.scene.add(this.model)
    this._setupInteraction()
  }

  _setupInteraction() {
    const canvas = this.sceneManager.renderer.domElement
    canvas.addEventListener('click', this.boundHandleClick)
  }

  _handleClick(event) {
    const canvas = this.sceneManager.renderer.domElement
    const rect = canvas.getBoundingClientRect()

    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera)
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true)

    if (intersects.length > 0) {
      const clicked = intersects[0].object
      this._toggleDoor(clicked)
    }
  }

  _toggleDoor(mesh) {
    if (this.doors.left.mesh === mesh || mesh.parent === this.doors.left.mesh) {
      this.toggleDoor('left')
    } else if (this.doors.right.mesh === mesh || mesh.parent === this.doors.right.mesh) {
      this.toggleDoor('right')
    }
  }

  toggleDoor(side) {
    const door = this.doors[side]
    if (!door.mesh) return

    door.open = !door.open
    door.targetAngle = door.open ? Math.PI / 2.5 : 0

    if (this.onDoorClickCallback) {
      this.onDoorClickCallback(side, door.open)
    }
  }

  setBodyColor(color) {
    if (this.bodyMaterial) {
      if (Array.isArray(this.bodyMaterial)) {
        this.bodyMaterial.forEach((m) => {
          m.color.set(color)
          m.needsUpdate = true
        })
      } else {
        this.bodyMaterial.color.set(color)
        this.bodyMaterial.needsUpdate = true
      }
    }
  }

  getBodyColor() {
    if (this.bodyMaterial) {
      const mat = Array.isArray(this.bodyMaterial) ? this.bodyMaterial[0] : this.bodyMaterial
      return '#' + mat.color.getHexString()
    }
    return '#ff0000'
  }

  update(delta) {
    const speed = 5 * delta

    Object.values(this.doors).forEach((door) => {
      if (!door.mesh) return

      const diff = door.targetAngle - door.currentAngle
      if (Math.abs(diff) > 0.001) {
        door.currentAngle += diff * speed

        const direction = door === this.doors.left ? 1 : -1
        door.mesh.rotation.y = (door.originalRotation || 0) + door.currentAngle * direction
      }
    })
  }

  createFallbackCar() {
    const carGroup = new THREE.Group()

    const bodyGeo = new THREE.BoxGeometry(4, 0.8, 2)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xff2200,
      metalness: 0.8,
      roughness: 0.2
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = 0.6
    body.castShadow = true
    carGroup.add(body)
    this.bodyMaterial = bodyMat

    const roofGeo = new THREE.BoxGeometry(2.2, 0.6, 1.8)
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      metalness: 0.5,
      roughness: 0.3
    })
    const roof = new THREE.Mesh(roofGeo, roofMat)
    roof.position.set(-0.3, 1.3, 0)
    roof.castShadow = true
    carGroup.add(roof)

    const doorLeftGeo = new THREE.BoxGeometry(0.05, 0.6, 1.7)
    const doorLeft = new THREE.Mesh(doorLeftGeo, bodyMat.clone())
    doorLeft.position.set(1.95, 0.9, 0)
    doorLeft.castShadow = true
    doorLeft.name = 'door_left'
    carGroup.add(doorLeft)
    this.doors.left.mesh = doorLeft
    this.doors.left.hinge.copy(doorLeft.position)
    this.doors.left.originalRotation = doorLeft.rotation.y
    this.interactiveObjects.push(doorLeft)

    const doorRightGeo = new THREE.BoxGeometry(0.05, 0.6, 1.7)
    const doorRight = new THREE.Mesh(doorRightGeo, bodyMat.clone())
    doorRight.position.set(-1.95, 0.9, 0)
    doorRight.castShadow = true
    doorRight.name = 'door_right'
    carGroup.add(doorRight)
    this.doors.right.mesh = doorRight
    this.doors.right.hinge.copy(doorRight.position)
    this.doors.right.originalRotation = doorRight.rotation.y
    this.interactiveObjects.push(doorRight)

    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32)
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a })

    const wheelPositions = [
      [1.2, 0.4, 0.9],
      [1.2, 0.4, -0.9],
      [-1.2, 0.4, 0.9],
      [-1.2, 0.4, -0.9]
    ]

    wheelPositions.forEach(([x, y, z]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat)
      wheel.rotation.z = Math.PI / 2
      wheel.position.set(x, y, z)
      wheel.castShadow = true
      carGroup.add(wheel)
    })

    const groundGeo = new THREE.CircleGeometry(15, 64)
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0f,
      metalness: 0.9,
      roughness: 0.1
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    carGroup.add(ground)

    this.model = carGroup
    this.scene.add(carGroup)
    this._setupInteraction()

    return carGroup
  }

  onDoorClick(callback) {
    this.onDoorClickCallback = callback
  }

  dispose() {
    const canvas = this.sceneManager.renderer.domElement
    canvas.removeEventListener('click', this.boundHandleClick)

    if (this.model) {
      this.scene.remove(this.model)
      this.model.traverse((child) => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose())
          } else {
            child.material.dispose()
          }
        }
      })
    }
  }
}
