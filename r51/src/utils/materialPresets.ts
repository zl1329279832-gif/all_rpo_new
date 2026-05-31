import * as THREE from 'three';

export const roadMaterials = {
  asphalt: new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    roughness: 0.9,
    metalness: 0.01
  }),

  asphaltDark: new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.95,
    metalness: 0.01
  }),

  concrete: new THREE.MeshStandardMaterial({
    color: 0x999999,
    roughness: 0.8,
    metalness: 0.05
  }),

  curb: new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.7
  }),

  markingWhite: new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.5,
    emissive: 0x444444,
    emissiveIntensity: 0.1
  }),

  markingYellow: new THREE.MeshStandardMaterial({
    color: 0xffcc00,
    roughness: 0.5,
    emissive: 0x443300,
    emissiveIntensity: 0.1
  }),

  median: new THREE.MeshStandardMaterial({
    color: 0x556633,
    roughness: 0.9
  })
};

export const buildingMaterials = {
  glass: new THREE.MeshPhysicalMaterial({
    color: 0xaaccff,
    metalness: 0,
    roughness: 0,
    transmission: 0.9,
    transparent: true,
    opacity: 0.8,
    ior: 1.5,
    thickness: 0.5
  }),

  concrete: new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.8
  }),

  brick: new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    roughness: 0.9
  }),

  office: new THREE.MeshStandardMaterial({
    color: 0x708090,
    metalness: 0.2,
    roughness: 0.6
  })
};

export const environmentMaterials = {
  grass: new THREE.MeshStandardMaterial({
    color: 0x3d6b2f,
    roughness: 0.9
  }),

  dirt: new THREE.MeshStandardMaterial({
    color: 0x5c4033,
    roughness: 1
  }),

  water: new THREE.MeshPhysicalMaterial({
    color: 0x1e90ff,
    transparent: true,
    opacity: 0.7,
    roughness: 0.1,
    metalness: 0.1,
    transmission: 0.5
  }),

  skyDay: new THREE.MeshBasicMaterial({
    color: 0x87ceeb,
    side: THREE.BackSide
  }),

  skyNight: new THREE.MeshBasicMaterial({
    color: 0x0a0a20,
    side: THREE.BackSide
  })
};

export const vehicleColors = [
  0xe74c3c,
  0x3498db,
  0x2ecc71,
  0xf39c12,
  0x9b59b6,
  0x1abc9c,
  0xe91e63,
  0x34495e,
  0xecf0f1,
  0x2c3e50
];

export function getRandomVehicleColor(): number {
  return vehicleColors[Math.floor(Math.random() * vehicleColors.length)];
}

export function createLineMaterial(color: number, dashed = false, linewidth = 1): THREE.LineBasicMaterial | THREE.LineDashedMaterial {
  if (dashed) {
    return new THREE.LineDashedMaterial({
      color,
      dashSize: 0.5,
      gapSize: 0.5,
      linewidth
    });
  }
  return new THREE.LineBasicMaterial({ color, linewidth });
}

export function updateDayNightMaterials(isDay: boolean, scene: THREE.Scene): void {
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      const mat = obj.material as THREE.MeshStandardMaterial;
      if (mat.emissive) {
        if (isDay) {
          mat.emissiveIntensity = 0.1;
        } else {
          mat.emissiveIntensity = 1;
        }
      }
    }
  });
}
