import * as THREE from 'three';
import { BuildingData, EnergyLevel, BuildingMeshData, PickResult } from '@/types';
import {
  ENERGY_COLOR_HEX,
  HOVER_COLOR,
  SELECTION_COLOR,
  createBuildingGeometry,
  createBuildingMaterials,
  createBuildingMaterial,
  createOutlineMesh,
  createRoofGeometry,
  createRoofMaterial,
  createEntranceGeometry,
  createEntranceMaterial,
  createRoadMarkings,
  pulseValue,
  disposeObject
} from './utils';

interface BuildingComponents {
  mainMesh: THREE.Mesh;
  roofMesh: THREE.Mesh;
  entranceMesh: THREE.Mesh;
  outline: THREE.Mesh;
  allMeshes: THREE.Mesh[];
}

export class BuildingManager {
  private scene: THREE.Scene;
  private buildingGroup: THREE.Group;
  private buildingMap: Map<string, BuildingMeshData> = new Map();
  private buildingMeshList: THREE.Mesh[] = [];
  private buildingComponents: Map<string, BuildingComponents> = new Map();

  private selectedBuildingId: string | null = null;
  private hoveredBuildingId: string | null = null;
  private animationTime: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.buildingGroup = new THREE.Group();
    this.scene.add(this.buildingGroup);
    
    this.addRoads();
  }

  private addRoads(): void {
    const roads = createRoadMarkings(200);
    this.buildingGroup.add(roads);
  }

  public createBuildings(buildings: BuildingData[]): void {
    buildings.forEach(building => this.createBuilding(building));
  }

  private createBuilding(building: BuildingData): void {
    const { width, depth, height } = building.size;
    const color = ENERGY_COLOR_HEX[building.energyLevel];
    const seed = parseInt(building.id.split('_')[1] as unknown as number, 10);

    const geometry = createBuildingGeometry(width, depth, height, building.floors);
    const materials = createBuildingMaterials(color, width, depth, building.floors, seed);

    const mesh = new THREE.Mesh(geometry, materials);
    mesh.position.set(
      building.position.x,
      height / 2,
      building.position.z
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.buildingId = building.id;

    const allMeshes: THREE.Mesh[] = [mesh];

    const roofGeometry = createRoofGeometry(width, depth, seed);
    const roofMaterial = createRoofMaterial(color);
    const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
    roofMesh.position.set(
      building.position.x,
      height,
      building.position.z
    );
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    roofMesh.userData.buildingId = building.id;
    allMeshes.push(roofMesh);

    const entranceGeometry = createEntranceGeometry(width, seed);
    const entranceMaterial = createEntranceMaterial();
    const entranceMesh = new THREE.Mesh(entranceGeometry, entranceMaterial);
    entranceMesh.position.set(
      building.position.x,
      1.5,
      building.position.z + depth / 2 + 0.25
    );
    entranceMesh.castShadow = true;
    entranceMesh.userData.buildingId = building.id;
    allMeshes.push(entranceMesh);

    const outline = createOutlineMesh(width, depth, height, SELECTION_COLOR);
    outline.position.set(
      building.position.x,
      height / 2,
      building.position.z
    );
    outline.visible = false;

    const buildingMeshData: BuildingMeshData = {
      buildingId: building.id,
      mesh,
      outline,
      data: building,
      isHovered: false,
      isSelected: false,
      originalColor: color
    };

    this.buildingComponents.set(building.id, {
      mainMesh: mesh,
      roofMesh,
      entranceMesh,
      outline,
      allMeshes
    });

    this.buildingMap.set(building.id, buildingMeshData);
    this.buildingMeshList.push(...allMeshes);

    this.buildingGroup.add(mesh);
    this.buildingGroup.add(roofMesh);
    this.buildingGroup.add(entranceMesh);
    this.buildingGroup.add(outline);

    this.addBuildingDetails(building, mesh.position, height, seed);
  }

  private addBuildingDetails(
    building: BuildingData,
    basePosition: THREE.Vector3,
    buildingHeight: number,
    seed: number
  ): void {
    const energyLevel = building.energyLevel;
    
    if (energyLevel === EnergyLevel.HIGH || energyLevel === EnergyLevel.CRITICAL) {
      const lightColor = energyLevel === EnergyLevel.CRITICAL ? 0xff3333 : 0xff8800;
      
      const warningLight = new THREE.PointLight(lightColor, 0.4, 25);
      warningLight.position.set(
        basePosition.x,
        buildingHeight + 3,
        basePosition.z
      );
      this.buildingGroup.add(warningLight);

      const warningGeometry = new THREE.ConeGeometry(0.5, 1, 4);
      const warningMaterial = new THREE.MeshBasicMaterial({
        color: lightColor,
        transparent: true,
        opacity: 0.8
      });
      const beacon = new THREE.Mesh(warningGeometry, warningMaterial);
      beacon.position.set(
        basePosition.x,
        buildingHeight + 2.5,
        basePosition.z
      );
      beacon.userData.buildingId = building.id;
      this.buildingGroup.add(beacon);
    }

    const lightCount = Math.floor(Math.abs(Math.sin(seed * 1.7)) * 4) + 2;
    for (let i = 0; i < lightCount; i++) {
      const spotLight = new THREE.PointLight(0x818cf8, 0.15, 15);
      const xOffset = (Math.abs(Math.sin(seed * 2.3 + i)) - 0.5) * 8;
      const zOffset = (Math.abs(Math.cos(seed * 2.3 + i)) - 0.5) * 8;
      
      spotLight.position.set(
        basePosition.x + xOffset,
        Math.abs(Math.sin(seed * 3.1 + i)) * buildingHeight * 0.6 + 2,
        basePosition.z + zOffset
      );
      this.buildingGroup.add(spotLight);
    }
  }

  public getBuildingMeshes(): THREE.Mesh[] {
    return this.buildingMeshList;
  }

  public getBuildingById(id: string): BuildingMeshData | undefined {
    return this.buildingMap.get(id);
  }

  public getBuildingByMesh(mesh: THREE.Mesh): BuildingMeshData | undefined {
    const buildingId = mesh.userData.buildingId;
    if (buildingId) {
      return this.buildingMap.get(buildingId);
    }
    
    for (const [, data] of this.buildingMap) {
      if (data.mesh === mesh) {
        return data;
      }
    }
    return undefined;
  }

  private getAllMeshesForBuilding(buildingId: string): THREE.Mesh[] {
    const components = this.buildingComponents.get(buildingId);
    return components ? components.allMeshes : [];
  }

  public setHovered(buildingId: string | null): void {
    if (this.hoveredBuildingId === buildingId) return;

    if (this.hoveredBuildingId) {
      this.removeHoverEffect(this.hoveredBuildingId);
    }

    if (buildingId && buildingId !== this.selectedBuildingId) {
      this.applyHoverEffect(buildingId);
    }

    this.hoveredBuildingId = buildingId;
  }

  private applyHoverEffect(buildingId: string): void {
    const buildingData = this.buildingMap.get(buildingId);
    if (!buildingData) return;

    buildingData.isHovered = true;
    
    const meshes = this.getAllMeshesForBuilding(buildingId);
    meshes.forEach(mesh => {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.emissive = new THREE.Color(HOVER_COLOR);
            mat.emissiveIntensity = 0.2;
          }
        });
      } else if (mesh.material instanceof THREE.MeshStandardMaterial) {
        mesh.material.emissive = new THREE.Color(HOVER_COLOR);
        mesh.material.emissiveIntensity = 0.2;
      }
    });
  }

  private removeHoverEffect(buildingId: string): void {
    const buildingData = this.buildingMap.get(buildingId);
    if (!buildingData || buildingData.isSelected) return;

    buildingData.isHovered = false;
    
    const meshes = this.getAllMeshesForBuilding(buildingId);
    meshes.forEach(mesh => {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.emissive = new THREE.Color(0x000000);
            mat.emissiveIntensity = 0;
          }
        });
      } else if (mesh.material instanceof THREE.MeshStandardMaterial) {
        mesh.material.emissive = new THREE.Color(0x000000);
        mesh.material.emissiveIntensity = 0;
      }
    });
  }

  public setSelected(buildingId: string | null): PickResult | null {
    if (this.hoveredBuildingId === this.selectedBuildingId && this.selectedBuildingId) {
      this.applyHoverEffect(this.selectedBuildingId);
    }

    if (this.selectedBuildingId) {
      this.removeSelectionEffect(this.selectedBuildingId);
    }

    if (buildingId) {
      this.applySelectionEffect(buildingId);
    }

    this.selectedBuildingId = buildingId;

    if (buildingId) {
      const buildingData = this.buildingMap.get(buildingId);
      if (buildingData) {
        return {
          buildingId,
          data: buildingData.data,
          point: buildingData.mesh.position.clone(),
          distance: 0
        };
      }
    }

    return null;
  }

  private applySelectionEffect(buildingId: string): void {
    const buildingData = this.buildingMap.get(buildingId);
    if (!buildingData) return;

    buildingData.isSelected = true;
    buildingData.outline.visible = true;
    
    const meshes = this.getAllMeshesForBuilding(buildingId);
    meshes.forEach(mesh => {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.emissive = new THREE.Color(SELECTION_COLOR);
            mat.emissiveIntensity = 0.15;
          }
        });
      } else if (mesh.material instanceof THREE.MeshStandardMaterial) {
        mesh.material.emissive = new THREE.Color(SELECTION_COLOR);
        mesh.material.emissiveIntensity = 0.15;
      }
    });
  }

  private removeSelectionEffect(buildingId: string): void {
    const buildingData = this.buildingMap.get(buildingId);
    if (!buildingData) return;

    buildingData.isSelected = false;
    buildingData.outline.visible = false;
    
    const meshes = this.getAllMeshesForBuilding(buildingId);
    meshes.forEach(mesh => {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.emissive = new THREE.Color(0x000000);
            mat.emissiveIntensity = 0;
          }
        });
      } else if (mesh.material instanceof THREE.MeshStandardMaterial) {
        mesh.material.emissive = new THREE.Color(0x000000);
        mesh.material.emissiveIntensity = 0;
      }
    });
  }

  public getSelectedBuilding(): BuildingMeshData | undefined {
    if (!this.selectedBuildingId) return undefined;
    return this.buildingMap.get(this.selectedBuildingId);
  }

  public getHoveredBuilding(): BuildingMeshData | undefined {
    if (!this.hoveredBuildingId) return undefined;
    return this.buildingMap.get(this.hoveredBuildingId);
  }

  public updateAnimations(time: number): void {
    this.animationTime = time;

    if (this.selectedBuildingId) {
      this.pulseSelectedBuilding();
    }

    this.pulseBeacons();
  }

  private pulseSelectedBuilding(): void {
    const components = this.selectedBuildingId
      ? this.buildingComponents.get(this.selectedBuildingId)
      : undefined;

    if (!components) return;

    const outline = components.outline;
    const pulseIntensity = pulseValue(this.animationTime, 2, 0.5, 1);
    
    const outlineMaterial = outline.material as THREE.MeshBasicMaterial;
    outlineMaterial.opacity = 0.6 * pulseIntensity;

    const scale = 1 + 0.015 * pulseValue(this.animationTime, 3, 0, 1);
    outline.scale.set(scale, scale, scale);
  }

  private pulseBeacons(): void {
    this.buildingComponents.forEach((components, id) => {
      const buildingData = this.buildingMap.get(id);
      if (!buildingData) return;
      
      if (buildingData.data.energyLevel === EnergyLevel.HIGH || 
          buildingData.data.energyLevel === EnergyLevel.CRITICAL) {
        const pulse = pulseValue(this.animationTime + parseInt(id) * 0.1, 1.5, 0, 1);
        const scale = 1 + pulse * 0.2;
        
        this.buildingGroup.children.forEach(child => {
          if (child instanceof THREE.Mesh && child.userData.buildingId === id) {
            if (child.geometry instanceof THREE.ConeGeometry) {
              child.rotation.y = this.animationTime * 2;
              child.scale.setScalar(scale);
              const material = child.material as THREE.MeshBasicMaterial;
              material.opacity = 0.4 + pulse * 0.4;
            }
          }
        });
      }
    });
  }

  public filterByEnergyLevel(levels: EnergyLevel[]): void {
    this.buildingMap.forEach((data, id) => {
      const visible = levels.includes(data.data.energyLevel);
      const components = this.buildingComponents.get(id);
      
      if (components) {
        components.allMeshes.forEach(mesh => {
          mesh.visible = visible;
        });
        components.outline.visible = visible && data.isSelected;
      }

      if (!visible && (id === this.selectedBuildingId || id === this.hoveredBuildingId)) {
        if (id === this.selectedBuildingId) {
          this.setSelected(null);
        }
        if (id === this.hoveredBuildingId) {
          this.setHovered(null);
        }
      }
    });
  }

  public showAll(): void {
    this.buildingComponents.forEach((components, id) => {
      const data = this.buildingMap.get(id);
      components.allMeshes.forEach(mesh => {
        mesh.visible = true;
      });
      if (data?.isSelected) {
        components.outline.visible = true;
      }
    });
  }

  public dispose(): void {
    this.buildingMap.forEach(data => {
      disposeObject(data.mesh);
      disposeObject(data.outline);
    });
    this.buildingComponents.forEach(components => {
      components.allMeshes.forEach(mesh => disposeObject(mesh));
      disposeObject(components.outline);
    });
    
    this.buildingMap.clear();
    this.buildingComponents.clear();
    this.buildingMeshList = [];

    if (this.buildingGroup.parent) {
      this.scene.remove(this.buildingGroup);
    }
    disposeObject(this.buildingGroup);
  }
}
