import * as THREE from 'three';

export const roadMaterials = {
  asphalt: new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    roughness: 0.9,
    metalness: 0.05
  }),
  asphaltDark: new THREE.MeshStandardMaterial({
    color: 0x1f1f1f,
    roughness: 0.92,
    metalness: 0.03
  }),
  concrete: new THREE.MeshStandardMaterial({
    color: 0x999999,
    roughness: 0.85,
    metalness: 0.1
  }),
  curb: new THREE.MeshStandardMaterial({
    color: 0x666666,
    roughness: 0.95,
    metalness: 0.05
  }),
  markingWhite: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.5,
    metalness: 0
  }),
  markingYellow: new THREE.MeshStandardMaterial({
    color: 0xffcc00,
    roughness: 0.5,
    metalness: 0
  }),
  median: new THREE.MeshStandardMaterial({
    color: 0x556b2f,
    roughness: 1,
    metalness: 0
  })
};

export const buildingMaterials = {
  glass: new THREE.MeshPhysicalMaterial({
    color: 0xaabbcc,
    metalness: 0.1,
    roughness: 0.1,
    transparent: true,
    opacity: 0.7,
    transmission: 0.6,
    reflectivity: 0.8
  }),
  concrete: new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.9,
    metalness: 0.1
  }),
  brick: new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    roughness: 0.95,
    metalness: 0
  }),
  office: new THREE.MeshStandardMaterial({
    color: 0x778899,
    roughness: 0.3,
    metalness: 0.4
  })
};

export const environmentMaterials = {
  skyDay: new THREE.MeshBasicMaterial({
    color: 0x87ceeb,
    side: THREE.BackSide
  }),
  skyNight: new THREE.MeshBasicMaterial({
    color: 0x0a0a20,
    side: THREE.BackSide
  }),
  ground: new THREE.MeshStandardMaterial({
    color: 0x4a7c3f,
    roughness: 1,
    metalness: 0
  })
};

export const vehicleColors = [
  0xe74c3c,
  0x3498db,
  0x2ecc71,
  0xf39c12,
  0x9b59b6,
  0x1abc9c,
  0xe67e22,
  0x34495e,
  0xecf0f1,
  0x2c3e50,
  0xd35400,
  0x16a085
];

export function createLineMaterial(
  color: number,
  dashed: boolean,
  linewidth: number = 2
): THREE.LineBasicMaterial | THREE.LineDashedMaterial {
  if (dashed) {
    return new THREE.LineDashedMaterial({
      color,
      dashSize: 2,
      gapSize: 1.5,
      linewidth
    });
  }
  return new THREE.LineBasicMaterial({
    color,
    linewidth
  });
}

export function updateDayNightMaterials(isDay: boolean, scene: THREE.Scene) {
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      if (obj.material instanceof THREE.MeshStandardMaterial) {
        if (obj.material.emissive && obj.material.emissiveIntensity > 0) {
          obj.material.emissiveIntensity = isDay ? 0.05 : 0.8;
        }
      }
    }
  });
}
