import * as THREE from 'three';
import { SCENE_CONFIG, COLORS } from '@/config';

export class WarehouseBuilder {
  private sceneManager: any;

  constructor(sceneManager: any) {
    this.sceneManager = sceneManager;
  }

  build(): THREE.Group {
    const warehouseGroup = new THREE.Group();
    warehouseGroup.name = 'warehouseStructure';

    warehouseGroup.add(this.createFloor());
    warehouseGroup.add(this.createWalls());
    warehouseGroup.add(this.createRoof());
    warehouseGroup.add(this.createFloorSeparators());
    warehouseGroup.add(this.createGrid());
    warehouseGroup.add(this.createPillars());

    return warehouseGroup;
  }

  private createFloor(): THREE.Mesh {
    const { warehouseWidth, warehouseDepth } = SCENE_CONFIG;

    const geometry = new THREE.PlaneGeometry(warehouseWidth, warehouseDepth);
    const material = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.9,
      metalness: 0.1,
    });

    const floor = new THREE.Mesh(geometry, material);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.name = 'floor';

    return floor;
  }

  private createWalls(): THREE.Group {
    const wallsGroup = new THREE.Group();
    wallsGroup.name = 'walls';

    const { warehouseWidth, warehouseDepth, warehouseHeight } = SCENE_CONFIG;
    const wallThickness = 0.5;
    const wallHeight = warehouseHeight;

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d3436,
      roughness: 0.8,
      metalness: 0.2,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });

    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(warehouseWidth, wallHeight, wallThickness),
      wallMaterial
    );
    backWall.position.set(0, wallHeight / 2, -warehouseDepth / 2);
    backWall.receiveShadow = true;
    wallsGroup.add(backWall);

    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, warehouseDepth),
      wallMaterial
    );
    leftWall.position.set(-warehouseWidth / 2, wallHeight / 2, 0);
    leftWall.receiveShadow = true;
    wallsGroup.add(leftWall);

    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, warehouseDepth),
      wallMaterial
    );
    rightWall.position.set(warehouseWidth / 2, wallHeight / 2, 0);
    rightWall.receiveShadow = true;
    wallsGroup.add(rightWall);

    const frameMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.primary,
      roughness: 0.3,
      metalness: 0.8,
      emissive: COLORS.primary,
      emissiveIntensity: 0.1,
    });

    const frameThickness = 0.3;
    const corners = [
      { x: -warehouseWidth / 2, z: -warehouseDepth / 2 },
      { x: warehouseWidth / 2, z: -warehouseDepth / 2 },
      { x: -warehouseWidth / 2, z: warehouseDepth / 2 },
      { x: warehouseWidth / 2, z: warehouseDepth / 2 },
    ];

    corners.forEach(corner => {
      const pillar = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, wallHeight, frameThickness),
        frameMaterial
      );
      pillar.position.set(corner.x, wallHeight / 2, corner.z);
      pillar.castShadow = true;
      wallsGroup.add(pillar);
    });

    const topBeam1 = new THREE.Mesh(
      new THREE.BoxGeometry(warehouseWidth, frameThickness, frameThickness),
      frameMaterial
    );
    topBeam1.position.set(0, wallHeight, -warehouseDepth / 2);
    wallsGroup.add(topBeam1);

    const topBeam2 = new THREE.Mesh(
      new THREE.BoxGeometry(warehouseWidth, frameThickness, frameThickness),
      frameMaterial
    );
    topBeam2.position.set(0, wallHeight, warehouseDepth / 2);
    wallsGroup.add(topBeam2);

    return wallsGroup;
  }

  private createRoof(): THREE.Mesh {
    const { warehouseWidth, warehouseDepth, warehouseHeight } = SCENE_CONFIG;

    const geometry = new THREE.PlaneGeometry(warehouseWidth, warehouseDepth);
    const material = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.7,
      metalness: 0.3,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });

    const roof = new THREE.Mesh(geometry, material);
    roof.rotation.x = Math.PI / 2;
    roof.position.y = warehouseHeight;
    roof.name = 'roof';

    return roof;
  }

  private createFloorSeparators(): THREE.Group {
    const separatorsGroup = new THREE.Group();
    separatorsGroup.name = 'floorSeparators';

    const { warehouseWidth, warehouseDepth, floorCount, floorHeight } = SCENE_CONFIG;

    const separatorMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.primary,
      roughness: 0.5,
      metalness: 0.5,
      transparent: true,
      opacity: 0.2,
      emissive: COLORS.primary,
      emissiveIntensity: 0.05,
    });

    for (let i = 1; i < floorCount; i++) {
      const separator = new THREE.Mesh(
        new THREE.PlaneGeometry(warehouseWidth, warehouseDepth),
        separatorMaterial
      );
      separator.rotation.x = -Math.PI / 2;
      separator.position.y = i * floorHeight;
      separator.name = `floor_separator_${i}`;
      separatorsGroup.add(separator);
    }

    return separatorsGroup;
  }

  private createGrid(): THREE.GridHelper {
    const { warehouseWidth, warehouseDepth } = SCENE_CONFIG;

    const grid = new THREE.GridHelper(
      Math.max(warehouseWidth, warehouseDepth),
      50,
      new THREE.Color(COLORS.primary),
      new THREE.Color(0x333333)
    );
    grid.position.y = 0.01;
    grid.name = 'grid';

    return grid;
  }

  private createPillars(): THREE.Group {
    const pillarsGroup = new THREE.Group();
    pillarsGroup.name = 'pillars';

    const { warehouseWidth, warehouseDepth, warehouseHeight } = SCENE_CONFIG;
    const pillarSize = 0.6;

    const pillarMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.6,
      metalness: 0.4,
    });

    const pillarPositions = [
      { x: -30, z: -20 }, { x: 0, z: -20 }, { x: 30, z: -20 },
      { x: -30, z: 20 }, { x: 0, z: 20 }, { x: 30, z: 20 },
      { x: -30, z: 0 }, { x: 30, z: 0 },
    ];

    pillarPositions.forEach(pos => {
      const pillar = new THREE.Mesh(
        new THREE.BoxGeometry(pillarSize, warehouseHeight, pillarSize),
        pillarMaterial
      );
      pillar.position.set(pos.x, warehouseHeight / 2, pos.z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      pillarsGroup.add(pillar);
    });

    return pillarsGroup;
  }
}
