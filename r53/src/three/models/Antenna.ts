import * as THREE from 'three'
import { materialManager } from '../materials/MaterialManager'

export function buildAntenna(): THREE.Group {
  const antennaGroup = new THREE.Group()
  antennaGroup.name = 'antenna'

  const metalMaterial = materialManager.getMetalMaterial()
  const goldMaterial = materialManager.getGoldMaterial()
  const whiteMaterial = materialManager.getWhiteMaterial()

  const baseGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.15, 16)
  const base = new THREE.Mesh(baseGeometry, metalMaterial)
  base.position.set(0, 0.85, 0)
  base.name = 'antenna_base'
  base.userData.partId = 'antenna'
  antennaGroup.add(base)

  const azimuthJointGeometry = new THREE.SphereGeometry(0.12, 16, 16)
  const azimuthJoint = new THREE.Mesh(azimuthJointGeometry, metalMaterial)
  azimuthJoint.position.set(0, 1.0, 0)
  azimuthJoint.name = 'azimuth_joint'
  azimuthJoint.userData.partId = 'antenna'
  antennaGroup.add(azimuthJoint)

  const boomGeometry = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8)
  const boom = new THREE.Mesh(boomGeometry, metalMaterial)
  boom.position.set(0, 1.6, 0.3)
  boom.rotation.x = Math.PI / 4
  boom.name = 'antenna_boom'
  boom.userData.partId = 'antenna'
  antennaGroup.add(boom)

  const dishGroup = buildDish(goldMaterial, whiteMaterial)
  dishGroup.position.set(0, 1.6, 0.9)
  dishGroup.rotation.x = -Math.PI / 3
  dishGroup.name = 'dish_assembly'
  dishGroup.userData.partId = 'antenna_dish'
  antennaGroup.add(dishGroup)

  const feedSupportGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8)
  const feedSupport1 = new THREE.Mesh(feedSupportGeometry, metalMaterial)
  feedSupport1.position.set(0.2, 1.75, 1.0)
  feedSupport1.rotation.z = Math.PI / 6
  antennaGroup.add(feedSupport1)

  const feedSupport2 = new THREE.Mesh(feedSupportGeometry, metalMaterial)
  feedSupport2.position.set(-0.2, 1.75, 1.0)
  feedSupport2.rotation.z = -Math.PI / 6
  antennaGroup.add(feedSupport2)

  const feedHornGeometry = new THREE.ConeGeometry(0.08, 0.15, 12)
  const feedHorn = new THREE.Mesh(feedHornGeometry, goldMaterial)
  feedHorn.position.set(0, 1.7, 1.15)
  feedHorn.rotation.x = Math.PI / 2
  feedHorn.name = 'feed_horn'
  feedHorn.userData.partId = 'feed_horn'
  antennaGroup.add(feedHorn)

  const omniAntennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8)
  const omniAntenna = new THREE.Mesh(omniAntennaGeometry, whiteMaterial)
  omniAntenna.position.set(0.8, 1.2, 0.8)
  omniAntenna.name = 'omni_antenna'
  omniAntenna.userData.partId = 'omni_antenna'
  antennaGroup.add(omniAntenna)

  const omniBaseGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.08, 12)
  const omniBase = new THREE.Mesh(omniBaseGeometry, metalMaterial)
  omniBase.position.set(0.8, 0.9, 0.8)
  antennaGroup.add(omniBase)

  return antennaGroup
}

function buildDish(goldMaterial: THREE.MeshStandardMaterial, whiteMaterial: THREE.MeshStandardMaterial): THREE.Group {
  const dishGroup = new THREE.Group()

  const dishGeometry = new THREE.CylinderGeometry(0.6, 0.1, 0.1, 32, 4, true)
  const dish = new THREE.Mesh(dishGeometry, goldMaterial)
  dishGroup.add(dish)

  const dishInnerGeometry = new THREE.CircleGeometry(0.55, 32)
  const dishInner = new THREE.Mesh(dishInnerGeometry, whiteMaterial)
  dishInner.position.z = 0.05
  dishInner.rotation.y = Math.PI
  dishGroup.add(dishInner)

  const ribGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.55)
  const ribMaterial = materialManager.getMetalMaterial({ color: 0xaaaaaa })
  
  for (let i = 0; i < 8; i++) {
    const rib = new THREE.Mesh(ribGeometry, ribMaterial)
    rib.position.z = 0.25
    rib.rotation.y = (i * Math.PI) / 4
    dishGroup.add(rib)
  }

  const rimGeometry = new THREE.TorusGeometry(0.58, 0.03, 8, 32)
  const rim = new THREE.Mesh(rimGeometry, goldMaterial)
  rim.rotation.x = Math.PI / 2
  rim.position.z = 0.05
  dishGroup.add(rim)

  return dishGroup
}

export function buildSBandAntenna(): THREE.Group {
  const sbandGroup = new THREE.Group()
  sbandGroup.name = 'sband_antenna'

  const metalMaterial = materialManager.getMetalMaterial()
  
  const patchArrayGeometry = new THREE.BoxGeometry(0.3, 0.02, 0.3)
  const patchArrayMaterial = materialManager.getWhiteMaterial()
  const patchArray = new THREE.Mesh(patchArrayGeometry, patchArrayMaterial)
  patchArray.position.set(0.9, 0.5, 0)
  patchArray.rotation.y = Math.PI / 2
  patchArray.name = 'sband_patch_array'
  patchArray.userData.partId = 'sband_antenna'
  sbandGroup.add(patchArray)

  const patchGeometry = new THREE.BoxGeometry(0.06, 0.01, 0.06)
  const patchMaterial = materialManager.getMetalMaterial({ color: 0xffd700 })
  
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const patch = new THREE.Mesh(patchGeometry, patchMaterial)
      patch.position.set(
        0.91,
        -0.09 + i * 0.08,
        -0.09 + j * 0.08
      )
      sbandGroup.add(patch)
    }
  }

  const bracketGeometry = new THREE.BoxGeometry(0.05, 0.15, 0.3)
  const bracket = new THREE.Mesh(bracketGeometry, metalMaterial)
  bracket.position.set(0.85, 0.5, 0)
  sbandGroup.add(bracket)

  return sbandGroup
}
