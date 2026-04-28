import * as THREE from 'three';
import { BuildingData, EnergyLevel } from './building';

export interface SceneConfig {
  container: HTMLElement;
  width: number;
  height: number;
  backgroundColor: number;
  gridSize: number;
  gridDivisions: number;
}

export interface CameraConfig {
  fov: number;
  near: number;
  far: number;
  initialPosition: THREE.Vector3;
  initialTarget: THREE.Vector3;
}

export interface BuildingMeshData {
  buildingId: string;
  mesh: THREE.Mesh;
  outline: THREE.Mesh;
  data: BuildingData;
  isHovered: boolean;
  isSelected: boolean;
  originalColor: number;
}

export interface PickResult {
  buildingId: string;
  data: BuildingData;
  point: THREE.Vector3;
  distance: number;
}

export interface EnergyColorMap {
  [EnergyLevel.LOW]: number;
  [EnergyLevel.MEDIUM]: number;
  [EnergyLevel.HIGH]: number;
  [EnergyLevel.CRITICAL]: number;
}

export interface HoverTooltip {
  visible: boolean;
  x: number;
  y: number;
  building: BuildingData | null;
}

export interface AnimationState {
  targetPosition: THREE.Vector3;
  targetTarget: THREE.Vector3;
  isAnimating: boolean;
  progress: number;
  startPosition: THREE.Vector3;
  startTarget: THREE.Vector3;
}
