import * as THREE from 'three';
import { SceneManager } from './SceneManager';
import { BuildingManager } from './BuildingManager';
import { PickResult, HoverTooltip } from '@/types';

export type OnBuildingHoverCallback = (data: HoverTooltip) => void;
export type OnBuildingClickCallback = (result: PickResult | null) => void;

export class InteractionManager {
  private sceneManager: SceneManager;
  private buildingManager: BuildingManager;
  private raycaster: THREE.Raycaster;
  private renderer: THREE.WebGLRenderer;

  private onHoverCallbacks: Set<OnBuildingHoverCallback> = new Set();
  private onClickCallbacks: Set<OnBuildingClickCallback> = new Set();

  private isMouseDown: boolean = false;
  private mouseDownPosition: { x: number; y: number } = { x: 0, y: 0 };

  private boundOnMouseMove: (e: MouseEvent) => void;
  private boundOnMouseDown: (e: MouseEvent) => void;
  private boundOnMouseUp: (e: MouseEvent) => void;
  private boundOnClickEvent: (e: MouseEvent) => void;

  constructor(
    sceneManager: SceneManager,
    buildingManager: BuildingManager
  ) {
    this.sceneManager = sceneManager;
    this.buildingManager = buildingManager;
    this.raycaster = this.sceneManager.getRaycaster();
    this.renderer = this.sceneManager.renderer;

    this.boundOnMouseMove = this.onMouseMove.bind(this);
    this.boundOnMouseDown = this.onMouseDown.bind(this);
    this.boundOnMouseUp = this.onMouseUp.bind(this);
    this.boundOnClickEvent = this.handleClick.bind(this);

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const domElement = this.renderer.domElement;
    
    domElement.addEventListener('mousemove', this.boundOnMouseMove);
    domElement.addEventListener('mousedown', this.boundOnMouseDown);
    domElement.addEventListener('mouseup', this.boundOnMouseUp);
    domElement.addEventListener('click', this.boundOnClickEvent);
  }

  private detachEventListeners(): void {
    const domElement = this.renderer.domElement;
    
    domElement.removeEventListener('mousemove', this.boundOnMouseMove);
    domElement.removeEventListener('mousedown', this.boundOnMouseDown);
    domElement.removeEventListener('mouseup', this.boundOnMouseUp);
    domElement.removeEventListener('click', this.boundOnClickEvent);
  }

  private onMouseDown(e: MouseEvent): void {
    this.isMouseDown = true;
    this.mouseDownPosition = { x: e.clientX, y: e.clientY };
  }

  private onMouseUp(e: MouseEvent): void {
    const dx = e.clientX - this.mouseDownPosition.x;
    const dy = e.clientY - this.mouseDownPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 5) {
      this.isMouseDown = false;
    }
  }

  private onMouseMove(e: MouseEvent): void {
    const mouseVector = this.sceneManager.getMouseVector(e.clientX, e.clientY);
    
    this.raycaster.setFromCamera(mouseVector, this.sceneManager.camera);

    const buildingMeshes = this.buildingManager.getBuildingMeshes();
    const intersects = this.raycaster.intersectObjects(buildingMeshes, false);

    let hoveredId: string | null = null;
    let hoveredData: HoverTooltip = {
      visible: false,
      x: 0,
      y: 0,
      building: null
    };

    if (intersects.length > 0) {
      const intersectedMesh = intersects[0].object as THREE.Mesh;
      const buildingData = this.buildingManager.getBuildingByMesh(intersectedMesh);

      if (buildingData && buildingData.mesh.visible) {
        hoveredId = buildingData.buildingId;
        hoveredData = {
          visible: true,
          x: e.clientX,
          y: e.clientY,
          building: buildingData.data
        };
      }
    }

    this.buildingManager.setHovered(hoveredId);
    this.notifyHover(hoveredData);
    this.updateCursor(hoveredId !== null);
  }

  private handleClick(e: MouseEvent): void {
    if (this.isMouseDown) {
      this.isMouseDown = false;
      return;
    }

    const mouseVector = this.sceneManager.getMouseVector(e.clientX, e.clientY);
    this.raycaster.setFromCamera(mouseVector, this.sceneManager.camera);

    const buildingMeshes = this.buildingManager.getBuildingMeshes();
    const intersects = this.raycaster.intersectObjects(buildingMeshes, false);

    let clickResult: PickResult | null = null;

    if (intersects.length > 0) {
      const intersectedMesh = intersects[0].object as THREE.Mesh;
      const buildingData = this.buildingManager.getBuildingByMesh(intersectedMesh);

      if (buildingData && buildingData.mesh.visible) {
        const currentSelected = this.buildingManager.getSelectedBuilding();
        
        if (currentSelected?.buildingId === buildingData.buildingId) {
          clickResult = this.buildingManager.setSelected(null);
        } else {
          clickResult = this.buildingManager.setSelected(buildingData.buildingId);
          this.animateCameraToBuilding(buildingData);
        }
      }
    } else {
      clickResult = this.buildingManager.setSelected(null);
    }

    this.notifyClick(clickResult);
  }

  private animateCameraToBuilding(buildingData: any): void {
    const buildingPosition = buildingData.mesh.position.clone();
    const buildingHeight = buildingData.data.size.height;

    const cameraOffset = new THREE.Vector3(
      buildingHeight * 1.5,
      buildingHeight * 0.8,
      buildingHeight * 1.5
    );

    const targetPosition = buildingPosition.clone().add(cameraOffset);
    const targetTarget = new THREE.Vector3(
      buildingPosition.x,
      buildingHeight * 0.3,
      buildingPosition.z
    );

    this.sceneManager.moveCameraTo(targetPosition, targetTarget, true);
  }

  private updateCursor(isHovering: boolean): void {
    const domElement = this.renderer.domElement;
    domElement.style.cursor = isHovering ? 'pointer' : 'grab';
  }

  public onHover(callback: OnBuildingHoverCallback): () => void {
    this.onHoverCallbacks.add(callback);
    return () => this.onHoverCallbacks.delete(callback);
  }

  public onClick(callback: OnBuildingClickCallback): () => void {
    this.onClickCallbacks.add(callback);
    return () => this.onClickCallbacks.delete(callback);
  }

  private notifyHover(data: HoverTooltip): void {
    this.onHoverCallbacks.forEach(callback => callback(data));
  }

  private notifyClick(result: PickResult | null): void {
    this.onClickCallbacks.forEach(callback => callback(result));
  }

  public resetSelection(): void {
    this.buildingManager.setSelected(null);
    this.notifyClick(null);
  }

  public dispose(): void {
    this.detachEventListeners();
    this.onHoverCallbacks.clear();
    this.onClickCallbacks.clear();
  }
}
