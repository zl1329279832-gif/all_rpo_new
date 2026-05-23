import * as THREE from 'three';
import { SCENE_CONFIG, COLORS } from '@/config';
import type { ShelfData } from '@/types';
import { getUtilizationColor } from '@/utils';

export class ShelfBuilder {
  private static frameGeometry: THREE.BoxGeometry | null = null;
  private static levelGeometry: THREE.BoxGeometry | null = null;
  private static frameMaterial: THREE.MeshStandardMaterial | null = null;
  private static boxGeometry: THREE.BoxGeometry | null = null;
  private static edgeGeometry: THREE.BoxGeometry | null = null;

  private static readonly LOW_POLY_SEGMENTS = 1;
  private static readonly BOX_SIZE = 0.8;
  private static readonly BOX_GAP = 0.2;

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

    if (!ShelfBuilder.frameGeometry) {
      ShelfBuilder.frameGeometry = new THREE.BoxGeometry(
        frameThickness,
        shelfHeight,
        shelfDepth,
        ShelfBuilder.LOW_POLY_SEGMENTS,
        ShelfBuilder.LOW_POLY_SEGMENTS,
        ShelfBuilder.LOW_POLY_SEGMENTS
      );
    }

    if (!ShelfBuilder.levelGeometry) {
      ShelfBuilder.levelGeometry = new THREE.BoxGeometry(
        shelfWidth,
        frameThickness,
        shelfDepth,
        ShelfBuilder.LOW_POLY_SEGMENTS,
        ShelfBuilder.LOW_POLY_SEGMENTS,
        ShelfBuilder.LOW_POLY_SEGMENTS
      );
    }

    if (!ShelfBuilder.boxGeometry) {
      ShelfBuilder.boxGeometry = new THREE.BoxGeometry(
        ShelfBuilder.BOX_SIZE * 0.9,
        ShelfBuilder.BOX_SIZE * 0.9,
        ShelfBuilder.BOX_SIZE * 0.9,
        ShelfBuilder.LOW_POLY_SEGMENTS,
        ShelfBuilder.LOW_POLY_SEGMENTS,
        ShelfBuilder.LOW_POLY_SEGMENTS
      );
    }

    const leftFrame = new THREE.Mesh(ShelfBuilder.frameGeometry, ShelfBuilder.frameMaterial);
    leftFrame.position.set(-shelfWidth / 2 + frameThickness / 2, shelfHeight / 2, 0);
    leftFrame.castShadow = false;
    leftFrame.receiveShadow = true;
    leftFrame.frustumCulled = true;
    shelfGroup.add(leftFrame);

    const rightFrame = new THREE.Mesh(ShelfBuilder.frameGeometry, ShelfBuilder.frameMaterial);
    rightFrame.position.set(shelfWidth / 2 - frameThickness / 2, shelfHeight / 2, 0);
    rightFrame.castShadow = false;
    rightFrame.receiveShadow = true;
    rightFrame.frustumCulled = true;
    shelfGroup.add(rightFrame);

    for (let i = 0; i <= levels; i++) {
      const levelY = i * levelHeight;
      const level = new THREE.Mesh(ShelfBuilder.levelGeometry, ShelfBuilder.frameMaterial);
      level.position.y = levelY;
      level.castShadow = false;
      level.receiveShadow = true;
      level.frustumCulled = true;
      shelfGroup.add(level);
    }

    const usedRatio = data.usedSlots / data.capacity;
    const boxesPerRow = Math.floor(shelfWidth / (ShelfBuilder.BOX_SIZE + ShelfBuilder.BOX_GAP));
    const boxesPerDepth = Math.floor(shelfDepth / (ShelfBuilder.BOX_SIZE + ShelfBuilder.BOX_GAP));
    const totalBoxesPerLevel = boxesPerRow * boxesPerDepth;
    const filledLevels = Math.floor(usedRatio * levels);
    const partialFill = (usedRatio * levels) - filledLevels;
    const partialBoxes = Math.floor(totalBoxesPerLevel * partialFill);

    const totalBoxCount = filledLevels * totalBoxesPerLevel + (partialFill > 0.1 ? partialBoxes : 0);

    if (totalBoxCount > 0) {
      const boxColor = new THREE.Color(getUtilizationColor(data.utilization));

      const instancedMesh = new THREE.InstancedMesh(
        ShelfBuilder.boxGeometry,
        ShelfBuilder.createBoxMaterial(boxColor),
        totalBoxCount
      );
      instancedMesh.name = 'boxes_instanced';
      instancedMesh.castShadow = true;
      instancedMesh.receiveShadow = false;
      instancedMesh.frustumCulled = true;
      instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      const dummy = new THREE.Object3D();
      let boxIndex = 0;

      for (let level = 0; level < filledLevels; level++) {
        for (let row = 0; row < boxesPerDepth; row++) {
          for (let col = 0; col < boxesPerRow; col++) {
            dummy.position.set(
              -shelfWidth / 2 + (ShelfBuilder.BOX_SIZE + ShelfBuilder.BOX_GAP) * col + ShelfBuilder.BOX_SIZE / 2 + frameThickness,
              level * levelHeight + frameThickness + ShelfBuilder.BOX_SIZE / 2,
              -shelfDepth / 2 + (ShelfBuilder.BOX_SIZE + ShelfBuilder.BOX_GAP) * row + ShelfBuilder.BOX_SIZE / 2
            );
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(boxIndex++, dummy.matrix);
          }
        }
      }

      if (partialFill > 0.1 && partialBoxes > 0) {
        for (let i = 0; i < partialBoxes; i++) {
          const row = Math.floor(i / boxesPerRow);
          const col = i % boxesPerRow;
          dummy.position.set(
            -shelfWidth / 2 + (ShelfBuilder.BOX_SIZE + ShelfBuilder.BOX_GAP) * col + ShelfBuilder.BOX_SIZE / 2 + frameThickness,
            filledLevels * levelHeight + frameThickness + ShelfBuilder.BOX_SIZE / 2,
            -shelfDepth / 2 + (ShelfBuilder.BOX_SIZE + ShelfBuilder.BOX_GAP) * row + ShelfBuilder.BOX_SIZE / 2
          );
          dummy.updateMatrix();
          instancedMesh.setMatrixAt(boxIndex++, dummy.matrix);
        }
      }

      instancedMesh.instanceMatrix.needsUpdate = true;
      shelfGroup.add(instancedMesh);
    }

    const edgeColor = data.status === 'alarm' ? COLORS.danger : data.status === 'warning' ? COLORS.warning : COLORS.primary;
    const edgeLines = ShelfBuilder.createEdgeLines(shelfWidth, shelfHeight, shelfDepth, edgeColor);
    edgeLines.name = 'shelf_edges';
    shelfGroup.add(edgeLines);

    shelfGroup.position.set(data.position.x, data.floor * SCENE_CONFIG.floorHeight, data.position.z);
    shelfGroup.frustumCulled = true;

    return shelfGroup;
  }

  private static createBoxMaterial(color: THREE.Color): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.5,
      metalness: 0.3,
      transparent: true,
      opacity: 0.9,
      emissive: color,
      emissiveIntensity: 0.05,
    });
  }

  private static createEdgeLines(width: number, height: number, depth: number, color: string): THREE.LineSegments {
    if (!ShelfBuilder.edgeGeometry) {
      ShelfBuilder.edgeGeometry = new THREE.BoxGeometry(1, 1, 1);
    }

    const edges = new THREE.EdgesGeometry(ShelfBuilder.edgeGeometry);
    const edgeLines = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.9,
      })
    );
    edgeLines.scale.set(width, height, depth);
    edgeLines.position.y = height / 2;
    edgeLines.frustumCulled = true;

    return edgeLines;
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

    const instancedBoxes = shelfGroup.getObjectByName('boxes_instanced') as THREE.InstancedMesh;
    if (instancedBoxes) {
      const material = instancedBoxes.material as THREE.MeshStandardMaterial;
      const newColor = new THREE.Color(getUtilizationColor(data.utilization));
      material.color.copy(newColor);
      material.emissive.copy(newColor);
    }
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
    instancedMesh.castShadow = false;
    instancedMesh.receiveShadow = true;
    instancedMesh.frustumCulled = true;

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
    if (ShelfBuilder.frameGeometry) {
      ShelfBuilder.frameGeometry.dispose();
      ShelfBuilder.frameGeometry = null;
    }
    if (ShelfBuilder.levelGeometry) {
      ShelfBuilder.levelGeometry.dispose();
      ShelfBuilder.levelGeometry = null;
    }
    if (ShelfBuilder.frameMaterial) {
      ShelfBuilder.frameMaterial.dispose();
      ShelfBuilder.frameMaterial = null;
    }
    if (ShelfBuilder.boxGeometry) {
      ShelfBuilder.boxGeometry.dispose();
      ShelfBuilder.boxGeometry = null;
    }
    if (ShelfBuilder.edgeGeometry) {
      ShelfBuilder.edgeGeometry.dispose();
      ShelfBuilder.edgeGeometry = null;
    }
  }
}
