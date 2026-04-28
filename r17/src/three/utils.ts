import * as THREE from 'three';
import { EnergyLevel, EnergyColorMap } from '@/types';

export const ENERGY_COLOR_HEX: EnergyColorMap = {
  [EnergyLevel.LOW]: 0x10b981,
  [EnergyLevel.MEDIUM]: 0x3b82f6,
  [EnergyLevel.HIGH]: 0xf59e0b,
  [EnergyLevel.CRITICAL]: 0xef4444
};

export const HOVER_COLOR = 0xffffff;
export const SELECTION_COLOR = 0xffd700;

const WINDOW_ON_COLOR = 0xffeaa0;
const WINDOW_OFF_COLOR = 0x1a1a2e;
const BUILDING_BASE_COLOR = 0x2d3748;

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function lerpColor(
  color1: THREE.Color,
  color2: THREE.Color,
  t: number
): THREE.Color {
  return new THREE.Color().lerpColors(color1, color2, t);
}

export function pulseValue(time: number, speed: number, min: number, max: number): number {
  const t = (Math.sin(time * speed) + 1) / 2;
  return min + t * (max - min);
}

function createWindowTexture(
  width: number,
  depth: number,
  floors: number,
  seed: number,
  isNight: boolean = true
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  const canvasWidth = 256;
  const canvasHeight = 512;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d')!;

  const windowsPerFloor = Math.floor(width / 1.5);
  const windowWidth = canvasWidth / windowsPerFloor;
  const windowHeight = canvasHeight / floors;

  ctx.fillStyle = isNight ? '#0a0a15' : '#1a1a2e';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  for (let floor = 0; floor < floors; floor++) {
    for (let col = 0; col < windowsPerFloor; col++) {
      const windowSeed = seed * 137.5 + floor * 31 + col * 17;
      const isLit = isNight && (Math.abs(Math.sin(windowSeed)) > 0.4);
      
      const x = col * windowWidth + 4;
      const y = floor * windowHeight + 4;
      const w = windowWidth - 8;
      const h = windowHeight - 8;

      if (isLit) {
        const brightness = 0.6 + Math.abs(Math.sin(windowSeed * 2.3)) * 0.4;
        const gradient = ctx.createLinearGradient(x, y, x, y + h);
        gradient.addColorStop(0, `rgba(255, 234, 160, ${brightness})`);
        gradient.addColorStop(0.5, `rgba(255, 220, 130, ${brightness * 0.9})`);
        gradient.addColorStop(1, `rgba(255, 200, 100, ${brightness * 0.8})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, w, h);

        ctx.shadowColor = 'rgba(255, 234, 160, 0.8)';
        ctx.shadowBlur = 8;
        ctx.fillRect(x, y, w, h);
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = isNight ? '#1a1a2e' : '#2a2a3e';
        ctx.fillRect(x, y, w, h);
      }

      ctx.strokeStyle = isLit ? 'rgba(255, 234, 160, 0.3)' : 'rgba(100, 100, 120, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
    }
  }

  ctx.fillStyle = '#4a5568';
  for (let i = 1; i < floors; i++) {
    const y = i * windowHeight;
    ctx.fillRect(0, y - 2, canvasWidth, 4);
  }

  ctx.fillStyle = '#374151';
  ctx.fillRect(0, 0, canvasWidth, 8);
  ctx.fillRect(0, canvasHeight - 8, canvasWidth, 8);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 8;
  texture.needsUpdate = true;

  return texture;
}

export function createBuildingGeometry(
  width: number,
  depth: number,
  height: number,
  floors: number
): THREE.BufferGeometry {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  
  const uvAttribute = geometry.attributes.uv;
  if (uvAttribute) {
    const uvs = uvAttribute.array as Float32Array;
    for (let i = 0; i < uvs.length; i += 2) {
      uvs[i] = uvs[i] * 2;
    }
    uvAttribute.needsUpdate = true;
  }

  geometry.computeVertexNormals();
  return geometry;
}

export function createBuildingMaterials(
  energyColor: number,
  width: number,
  depth: number,
  floors: number,
  seed: number
): THREE.MeshStandardMaterial[] {
  const windowTexture = createWindowTexture(width, depth, Math.min(floors, 40), seed, true);
  
  const buildingColor = new THREE.Color(energyColor);
  const darkerColor = buildingColor.clone().multiplyScalar(0.6);

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: BUILDING_BASE_COLOR,
    roughness: 0.8,
    metalness: 0.1,
    flatShading: false,
    transparent: false
  });

  const frontMaterial = new THREE.MeshStandardMaterial({
    map: windowTexture,
    roughness: 0.6,
    metalness: 0.2,
    emissive: darkerColor,
    emissiveIntensity: 0.15,
    transparent: false
  });

  const topMaterial = new THREE.MeshStandardMaterial({
    color: darkerColor,
    roughness: 0.9,
    metalness: 0.1,
    flatShading: false,
    transparent: false
  });

  const materials: THREE.MeshStandardMaterial[] = [
    frontMaterial,
    frontMaterial,
    topMaterial,
    bodyMaterial,
    frontMaterial,
    frontMaterial
  ];

  return materials;
}

export function createBuildingMaterial(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.8,
    metalness: 0.2,
    flatShading: false,
    transparent: false,
    vertexColors: false
  });
}

export function createRoofGeometry(
  width: number,
  depth: number,
  seed: number
): THREE.BufferGeometry {
  const group = new THREE.Group();

  const baseHeight = 1.5 + Math.abs(Math.sin(seed * 0.5)) * 2;
  const baseGeometry = new THREE.BoxGeometry(width * 0.9, baseHeight, depth * 0.9);
  
  const base = new THREE.Mesh(baseGeometry);
  group.add(base);

  const towerCount = Math.floor(Math.abs(Math.sin(seed * 2.1)) * 3) + 1;
  for (let i = 0; i < towerCount; i++) {
    const towerWidth = 1 + Math.abs(Math.sin(seed * 3.1 + i)) * 2;
    const towerDepth = 1 + Math.abs(Math.cos(seed * 3.1 + i)) * 2;
    const towerHeight = 2 + Math.abs(Math.sin(seed * 4.1 + i)) * 4;
    
    const towerGeometry = new THREE.BoxGeometry(towerWidth, towerHeight, towerDepth);
    const tower = new THREE.Mesh(towerGeometry);
    
    const xOffset = (i - towerCount / 2) * 3;
    const zOffset = (Math.abs(Math.sin(seed * 5.1 + i)) - 0.5) * 4;
    
    tower.position.set(
      xOffset,
      baseHeight / 2 + towerHeight / 2,
      zOffset
    );
    group.add(tower);
  }

  const acUnits = Math.floor(Math.abs(Math.cos(seed * 6.1)) * 4) + 1;
  for (let i = 0; i < acUnits; i++) {
    const acWidth = 0.8 + Math.random() * 0.5;
    const acDepth = 1.2 + Math.random() * 0.5;
    const acHeight = 0.6;
    
    const acGeometry = new THREE.BoxGeometry(acWidth, acHeight, acDepth);
    const ac = new THREE.Mesh(acGeometry);
    
    ac.position.set(
      (Math.abs(Math.sin(seed * 7.1 + i)) - 0.5) * width * 0.7,
      baseHeight / 2 + acHeight / 2 + 0.1,
      (Math.abs(Math.cos(seed * 7.1 + i)) - 0.5) * depth * 0.7
    );
    group.add(ac);
  }

  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];

  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const childGeometry = child.geometry.clone();
      childGeometry.translate(child.position.x, child.position.y, child.position.z);
      
      const childPositions = childGeometry.attributes.position.array;
      positions.push(...Array.from(childPositions));
      
      childGeometry.computeVertexNormals();
      const childNormals = childGeometry.attributes.normal.array;
      normals.push(...Array.from(childNormals));
      
      childGeometry.dispose();
    }
  });

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  group.children.forEach(child => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
    }
  });

  return geometry;
}

export function createRoofMaterial(baseColor: number): THREE.MeshStandardMaterial {
  const color = new THREE.Color(baseColor).multiplyScalar(0.7);
  
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.95,
    metalness: 0.1,
    flatShading: false,
    transparent: false
  });
}

export function createEntranceGeometry(
  width: number,
  seed: number
): THREE.BufferGeometry {
  const entranceWidth = Math.min(width * 0.3, 4);
  const entranceHeight = 3 + Math.abs(Math.sin(seed)) * 2;
  
  const geometry = new THREE.BoxGeometry(entranceWidth, entranceHeight, 0.5);
  return geometry;
}

export function createEntranceMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x1a1a2e,
    roughness: 0.7,
    metalness: 0.3,
    emissive: 0x2a2a3e,
    emissiveIntensity: 0.3,
    transparent: false
  });
}

export function createOutlineMesh(width: number, depth: number, height: number, color: number): THREE.Mesh {
  const outlineGeometry = new THREE.BoxGeometry(
    width + 0.3,
    height + 0.3,
    depth + 0.3
  );
  
  const outlineMaterial = new THREE.MeshBasicMaterial({
    color,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.6
  });

  return new THREE.Mesh(outlineGeometry, outlineMaterial);
}

export function createGround(size: number): THREE.Mesh {
  const groundGeometry = new THREE.PlaneGeometry(size, size, 1, 1);
  
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x0f0f1a,
    roughness: 0.95,
    metalness: 0.05
  });

  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;

  return ground;
}

export function createGrid(size: number, divisions: number): THREE.GridHelper {
  const grid = new THREE.GridHelper(size, divisions, 0x252540, 0x1a1a30);
  grid.position.y = 0.01;
  return grid;
}

export function createRoadMarkings(size: number): THREE.Group {
  const group = new THREE.Group();
  
  const roadMaterial = new THREE.MeshStandardMaterial({
    color: 0x333344,
    roughness: 0.9
  });

  const roadWidth = 8;
  const mainRoadGeo1 = new THREE.BoxGeometry(size, 0.1, roadWidth);
  const mainRoad1 = new THREE.Mesh(mainRoadGeo1, roadMaterial);
  mainRoad1.position.set(0, 0.05, 0);
  mainRoad1.receiveShadow = true;
  group.add(mainRoad1);

  const mainRoadGeo2 = new THREE.BoxGeometry(roadWidth, 0.1, size);
  const mainRoad2 = new THREE.Mesh(mainRoadGeo2, roadMaterial);
  mainRoad2.position.set(0, 0.05, 0);
  mainRoad2.receiveShadow = true;
  group.add(mainRoad2);

  const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffaa });
  
  for (let i = -size / 2; i < size / 2; i += 20) {
    if (Math.abs(i) > 5) {
      const lineGeo = new THREE.BoxGeometry(6, 0.15, 0.2);
      const lineX = new THREE.Mesh(lineGeo, lineMaterial);
      lineX.position.set(i, 0.15, 0);
      group.add(lineX);

      const lineZ = new THREE.Mesh(lineGeo, lineMaterial);
      lineZ.position.set(0, 0.15, i);
      lineZ.rotation.y = Math.PI / 2;
      group.add(lineZ);
    }
  }

  return group;
}

export function disposeObject(obj: THREE.Object3D): void {
  if (obj instanceof THREE.Mesh) {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => {
          if (m.map) m.map.dispose();
          m.dispose();
        });
      } else {
        if (obj.material.map) obj.material.map.dispose();
        obj.material.dispose();
      }
    }
  }
  
  while (obj.children.length > 0) {
    disposeObject(obj.children[0]);
    obj.remove(obj.children[0]);
  }
}
