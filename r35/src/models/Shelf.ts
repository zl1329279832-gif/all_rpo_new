import * as THREE from 'three';
import { SCENE_CONFIG, COLORS } from '@/config';
import type { ShelfData } from '@/types';
import { getUtilizationColor } from '@/utils';

export class ShelfBuilder {
  private static shelfGeometry: THREE.BoxGeometry | null = null;
  private static levelGeometry: THREE.BoxGeometry | null = null;
  private static frameMaterial: THREE.MeshStandardMaterial | null = null;

  static createShelf(data: ShelfData): THREE.Group {
    const shelfGroup = new THREE.Group();
    shelfGroup.name = `shelf_${data.id}`;
    shelfGroup.userData = {
      type: 'shelf',
      id: data.id,
      data: data,
    };

    const { shelfWidth, shelfDepth, shelfHeight, levels } = SCENE_CONFIG;
    const levelHeight = shelfHeight / levels;
    const frameThickness = 0.15;

    if (!ShelfBuilder.frameMaterial) {
      ShelfBuilder.frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.7,
        metalness: 0.3,
      });
    }

    const leftFrame = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, shelfHeight, shelfDepth),
      ShelfBuilder.frameMaterial
    );
    leftFrame.position.set(-shelfWidth / 2 + frameThickness / 2, shelfHeight / 2, 0);
    leftFrame.castShadow = true;
    leftFrame.receiveShadow = true;
    shelfGroup.add(leftFrame);

    const rightFrame = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, shelfHeight, shelfDepth),
      ShelfBuilder.frameMaterial
    );
    rightFrame.position.set(shelfWidth / 2 - frameThickness / 2, shelfHeight / 2, 0);
    rightFrame.castShadow = true;
    rightFrame.receiveShadow = true;
    shelfGroup.add(rightFrame);

    for (let i = 0; i <= levels; i++) {
      const levelY = i * levelHeight;
      const level = new THREE.Mesh(
        new THREE.BoxGeometry(shelfWidth, frameThickness, shelfDepth),
        ShelfBuilder.frameMaterial
      );
      level.position.y = levelY;
      level.castShadow = true;
      level.receiveShadow = true;
      shelfGroup.add(level);
    }

    const usedRatio = data.usedSlots / data.capacity;
    const filledLevels = Math.floor(usedRatio * levels);
    const partialFill = (usedRatio * levels) - filledLevels;

    const boxSize = 0.8;
    const boxGap = 0.2;
    const boxesPerRow = Math.floor(shelfWidth / (boxSize + boxGap));
    const boxesPerDepth = Math.floor(shelfDepth / (boxSize + boxGap));

    for (let level = 0; level < filledLevels; level++) {
      for (let row = 0; row < boxesPerDepth; row++) {
        for (let col = 0; col < boxesPerRow; col++) {
          const box = ShelfBuilder.createBox(
            boxSize,
            boxSize,
            boxSize,
            data.utilization
          );
          box.position.set(
            -shelfWidth / 2 + (boxSize + boxGap) * col + boxSize / 2 + frameThickness,
            level * levelHeight + frameThickness + boxSize / 2,
            -shelfDepth / 2 + (boxSize + boxGap) * row + boxSize / 2
          );
          shelfGroup.add(box);
        }
      }
    }

    if (partialFill > 0.1 && filledLevels < levels) {
      const totalBoxes = Math.floor(boxesPerRow * boxesPerDepth * partialFill);
      for (let i = 0; i < totalBoxes; i++) {
        const row = Math.floor(i / boxesPerRow);
        const col = i % boxesPerRow;
        const box = ShelfBuilder.createBox(
          boxSize,
          boxSize,
          boxSize,
          data.utilization
        );
        box.position.set(
          -shelfWidth / 2 + (boxSize + boxGap) * col + boxSize / 2 + frameThickness,
          filledLevels * levelHeight + frameThickness + boxSize / 2,
          -shelfDepth / 2 + (boxSize + boxGap) * row + boxSize / 2
        );
        shelfGroup.add(box);
      }
    }

    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: data.status === 'alarm' ? COLORS.danger : data.status === 'warning' ? COLORS.warning : COLORS.primary,
      emissive: data.status === 'alarm' ? COLORS.danger : data.status === 'warning' ? COLORS.warning : COLORS.primary,
      emissiveIntensity: data.status === 'normal' ? 0.2 : 0.5,
      transparent: true,
      opacity: 0.8,
    });

    const edges = new THREE.EdgesGeometry(
      new THREE.BoxGeometry(shelfWidth, shelfHeight, shelfDepth)
    );
    const edgeLines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
      color: edgeMaterial.color,
      transparent: true,
      opacity: 0.9,
    }));
    edgeLines.position.y = shelfHeight / 2;
    edgeLines.name = 'shelf_edges';
    shelfGroup.add(edgeLines);

    shelfGroup.position.set(data.position.x, data.floor * SCENE_CONFIG.floorHeight, data.position.z);

    return shelfGroup;
  }

  private static createBox(width: number, height: number, depth: number, utilization: number): THREE.Mesh {
    const color = new THREE.Color(getUtilizationColor(utilization));
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.5,
      metalness: 0.3,
      transparent: true,
      opacity: 0.9,
      emissive: color,
      emissiveIntensity: 0.1,
    });

    const geometry = new THREE.BoxGeometry(width * 0.9, height * 0.9, depth * 0.9);
    const box = new THREE.Mesh(geometry, material);
    box.castShadow = true;
    box.receiveShadow = true;

    return box;
  }

  static updateShelf(shelfGroup: THREE.Group, data: ShelfData): void {
    shelfGroup.userData.data = data;

    const edges = shelfGroup.getObjectByName('shelf_edges') as THREE.LineSegments;
    if (edges) {
      const material = edges.material as THREE.LineBasicMaterial;
      const newColor = data.status === 'alarm'
        ? new THREE.Color(COLORS.danger)
        : data.status === 'warning'
          ? new THREE.Color(COLORS.warning)
          : new THREE.Color(COLORS.primary);
      material.color.copy(newColor);
    }

    const boxes = shelfGroup.children.filter(child =>
      child instanceof THREE.Mesh && child.geometry instanceof THREE.BoxGeometry && child !== shelfGroup.children[0] && child !== shelfGroup.children[1]
    );

    boxes.forEach(box => {
      const material = (box as THREE.Mesh).material as THREE.MeshStandardMaterial;
      const newColor = new THREE.Color(getUtilizationColor(data.utilization));
      material.color.copy(newColor);
      material.emissive.copy(newColor);
    });
  }

  static createShelvesInstanced(shelvesData: ShelfData[]): THREE.InstancedMesh {
    const { shelfWidth, shelfHeight, shelfDepth } = SCENE_CONFIG;
    const geometry = new THREE.BoxGeometry(shelfWidth, shelfHeight, shelfDepth);
    const material = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.7,
      metalness: 0.3,
      transparent: true,
      opacity: 0.9,
    });

    const instancedMesh = new THREE.InstancedMesh(geometry, material, shelvesData.length);
    instancedMesh.name = 'shelves_instanced';
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const colors = new Float32Array(shelvesData.length * 3);

    shelvesData.forEach((data, index) => {
      dummy.position.set(
        data.position.x,
        data.floor * SCENE_CONFIG.floorHeight + shelfHeight / 2,
        data.position.z
      );
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(index, dummy.matrix);

      const color = new THREE.Color(getUtilizationColor(data.utilization));
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    });

    instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);

    return instancedMesh;
  }

  static dispose(): void {
    if (ShelfBuilder.shelfGeometry) {
      ShelfBuilder.shelfGeometry.dispose();
      ShelfBuilder.shelfGeometry = null;
    }
    if (ShelfBuilder.levelGeometry) {
      ShelfBuilder.levelGeometry.dispose();
      ShelfBuilder.levelGeometry = null;
    }
    if (ShelfBuilder.frameMaterial) {
      ShelfBuilder.frameMaterial.dispose();
      ShelfBuilder.frameMaterial = null;
    }
  }
}
