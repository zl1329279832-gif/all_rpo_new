import { SceneManager } from '@/scene/SceneManager';
import { CameraController } from './CameraController';
import type { ShelfData, Vector3 } from '@/types';
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';

export class SearchLocator {
  private static instance: SearchLocator;
  private sceneManager: SceneManager;
  private cameraController: CameraController;
  private highlightMesh: THREE.Mesh | null = null;
  private searchResults: string[] = [];
  private currentResultIndex: number = -1;

  private constructor() {
    this.sceneManager = SceneManager.getInstance();
    this.cameraController = CameraController.getInstance();
  }

  static getInstance(): SearchLocator {
    if (!SearchLocator.instance) {
      SearchLocator.instance = new SearchLocator();
    }
    return SearchLocator.instance;
  }

  search(query: string, shelves: ShelfData[]): ShelfData[] {
    if (!query.trim()) {
      this.clearSearch();
      return [];
    }

    const lowerQuery = query.toLowerCase().trim();
    const results = shelves.filter(shelf =>
      shelf.code.toLowerCase().includes(lowerQuery) ||
      shelf.id.toLowerCase().includes(lowerQuery)
    );

    this.searchResults = results.map(r => r.id);
    this.currentResultIndex = results.length > 0 ? 0 : -1;

    return results;
  }

  locateById(id: string, shelves: ShelfData[]): ShelfData | null {
    const shelf = shelves.find(s => s.id === id);
    if (!shelf) return null;

    this.focusOnShelf(shelf);
    return shelf;
  }

  locateByCode(code: string, shelves: ShelfData[]): ShelfData | null {
    const shelf = shelves.find(s => s.code === code);
    if (!shelf) return null;

    this.focusOnShelf(shelf);
    return shelf;
  }

  private focusOnShelf(shelf: ShelfData): void {
    const position: Vector3 = {
      x: shelf.position.x,
      y: shelf.position.y,
      z: shelf.position.z,
    };

    this.cameraController.focusOnPosition(position, { x: 15, y: 12, z: 15 });
    this.createHighlight(position);
    this.highlightShelfObject(shelf.id);
  }

  private createHighlight(position: Vector3): void {
    this.clearHighlight();

    const ringGeometry = new THREE.RingGeometry(2, 3, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x1890ff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });

    this.highlightMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    this.highlightMesh.rotation.x = -Math.PI / 2;
    this.highlightMesh.position.set(position.x, 0.1, position.z);
    this.highlightMesh.name = 'search_highlight';

    this.sceneManager.helpersGroup.add(this.highlightMesh);

    this.animateHighlight();
  }

  private animateHighlight(): void {
    if (!this.highlightMesh) return;

    const startScale = 0.5;
    const endScale = 1.5;
    const startOpacity = 0.8;
    const endOpacity = 0;

    new TWEEN.Tween({ t: 0 })
      .to({ t: 1 }, 1500)
      .easing(TWEEN.Easing.Cubic.Out)
      .repeat(3)
      .onUpdate(({ t }) => {
        if (!this.highlightMesh) return;
        const scale = startScale + (endScale - startScale) * t;
        this.highlightMesh.scale.setScalar(scale);
        (this.highlightMesh.material as THREE.MeshBasicMaterial).opacity =
          startOpacity + (endOpacity - startOpacity) * t;
      })
      .onComplete(() => {
        this.clearHighlight();
      })
      .start();
  }

  private highlightShelfObject(shelfId: string): void {
    const shelfGroup = this.sceneManager.shelvesGroup.getObjectByName(`shelf_${shelfId}`);
    if (!shelfGroup) return;

    const originalEmissive = new Map<string, THREE.Color>();

    shelfGroup.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.material) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((material: any, index) => {
          if (material.emissive) {
            const key = `${child.uuid}_${index}`;
            originalEmissive.set(key, material.emissive.clone());
            material.emissive.set(0x1890ff);
            material.emissiveIntensity = 0.8;
          }
        });
      }
    });

    setTimeout(() => {
      shelfGroup.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((material: any, index) => {
            const key = `${child.uuid}_${index}`;
            const original = originalEmissive.get(key);
            if (original && material.emissive) {
              material.emissive.copy(original);
              material.emissiveIntensity = 0.2;
            }
          });
        }
      });
    }, 3000);
  }

  nextResult(): string | null {
    if (this.searchResults.length === 0) return null;
    this.currentResultIndex = (this.currentResultIndex + 1) % this.searchResults.length;
    return this.searchResults[this.currentResultIndex];
  }

  prevResult(): string | null {
    if (this.searchResults.length === 0) return null;
    this.currentResultIndex =
      this.currentResultIndex <= 0
        ? this.searchResults.length - 1
        : this.currentResultIndex - 1;
    return this.searchResults[this.currentResultIndex];
  }

  getSearchResults(): string[] {
    return this.searchResults;
  }

  getCurrentResultIndex(): number {
    return this.currentResultIndex;
  }

  clearSearch(): void {
    this.searchResults = [];
    this.currentResultIndex = -1;
    this.clearHighlight();
  }

  private clearHighlight(): void {
    if (this.highlightMesh) {
      this.sceneManager.helpersGroup.remove(this.highlightMesh);
      (this.highlightMesh.geometry as THREE.BufferGeometry).dispose();
      (this.highlightMesh.material as THREE.Material).dispose();
      this.highlightMesh = null;
    }
  }

  dispose(): void {
    this.clearSearch();
  }
}
