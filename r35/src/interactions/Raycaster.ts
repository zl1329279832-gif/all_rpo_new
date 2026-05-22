import * as THREE from 'three';
import { SceneManager } from '@/scene/SceneManager';
import type { PickedObject, ObjectType } from '@/types';
import { debounce } from '@/utils';

export class RaycasterManager {
  private static instance: RaycasterManager;
  private sceneManager: SceneManager;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private hoveredObject: THREE.Object3D | null = null;
  private pickedObject: PickedObject | null = null;
  private onHoverCallback: ((obj: PickedObject | null) => void) | null = null;
  private onClickCallback: ((obj: PickedObject | null) => void) | null = null;
  private isEnabled: boolean = true;

  private readonly interactiveTypes: ObjectType[] = ['shelf', 'forklift', 'sensor', 'dock', 'channel'];

  private constructor() {
    this.sceneManager = SceneManager.getInstance();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  static getInstance(): RaycasterManager {
    if (!RaycasterManager.instance) {
      RaycasterManager.instance = new RaycasterManager();
    }
    return RaycasterManager.instance;
  }

  init(): void {
    const domElement = this.sceneManager.renderer.domElement;

    domElement.addEventListener('mousemove', this.handleMouseMove);
    domElement.addEventListener('click', this.handleClick);
    domElement.addEventListener('mouseleave', this.handleMouseLeave);
  }

  private handleMouseMove = debounce((event: MouseEvent) => {
    if (!this.isEnabled) return;
    this.updateMousePosition(event);
    this.checkIntersection('hover');
  }, 16);

  private handleClick = (event: MouseEvent): void => {
    if (!this.isEnabled) return;
    this.updateMousePosition(event);
    this.checkIntersection('click');
  };

  private handleMouseLeave = (): void => {
    if (this.hoveredObject) {
      this.resetHoverState();
      this.hoveredObject = null;
      if (this.onHoverCallback) {
        this.onHoverCallback(null);
      }
    }
  };

  private updateMousePosition(event: MouseEvent): void {
    const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private checkIntersection(type: 'hover' | 'click'): void {
    this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);

    const interactiveObjects = this.getInteractiveObjects();
    const intersects = this.raycaster.intersectObjects(interactiveObjects, true);

    if (intersects.length > 0) {
      const intersectedObject = this.findParentWithUserData(intersects[0].object);

      if (intersectedObject && intersectedObject.userData.type) {
        if (type === 'hover') {
          this.handleHover(intersectedObject);
        } else {
          this.handleClickObject(intersectedObject);
        }
        return;
      }
    }

    if (type === 'hover' && this.hoveredObject) {
      this.resetHoverState();
      this.hoveredObject = null;
      if (this.onHoverCallback) {
        this.onHoverCallback(null);
      }
    }

    if (type === 'click') {
      this.pickedObject = null;
      if (this.onClickCallback) {
        this.onClickCallback(null);
      }
    }
  }

  private getInteractiveObjects(): THREE.Object3D[] {
    return [
      this.sceneManager.shelvesGroup,
      this.sceneManager.forkliftsGroup,
      this.sceneManager.sensorsGroup,
      this.sceneManager.docksGroup,
      this.sceneManager.channelsGroup,
    ];
  }

  private findParentWithUserData(object: THREE.Object3D): THREE.Object3D | null {
    let current: THREE.Object3D | null = object;
    while (current) {
      if (current.userData && this.interactiveTypes.includes(current.userData.type)) {
        return current;
      }
      current = current.parent;
    }
    return null;
  }

  private handleHover(object: THREE.Object3D): void {
    if (this.hoveredObject !== object) {
      if (this.hoveredObject) {
        this.resetHoverState();
      }

      this.hoveredObject = object;
      this.applyHoverEffect(object);

      const pickedObj = this.createPickedObject(object);
      if (this.onHoverCallback) {
        this.onHoverCallback(pickedObj);
      }

      document.body.style.cursor = 'pointer';
    }
  }

  private handleClickObject(object: THREE.Object3D): void {
    this.pickedObject = this.createPickedObject(object);

    if (this.pickedObject) {
      this.applyClickEffect(object);

      if (this.onClickCallback) {
        this.onClickCallback(this.pickedObject);
      }
    }
  }

  private createPickedObject(object: THREE.Object3D): PickedObject | null {
    const { type, id, data } = object.userData;
    if (!type || !id || !data) return null;

    return {
      type,
      id,
      data,
    };
  }

  private applyHoverEffect(object: THREE.Object3D): void {
    object.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.material) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((material: any) => {
          if (material.emissive && !material._originalEmissive) {
            material._originalEmissive = material.emissive.clone();
            material.emissive.multiplyScalar(1.5);
          }
          if (!material._originalOpacity) {
            material._originalOpacity = material.opacity;
            material.opacity = Math.min(1, material.opacity + 0.2);
          }
        });
      }
    });
  }

  private resetHoverState(): void {
    if (!this.hoveredObject) return;

    this.hoveredObject.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.material) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((material: any) => {
          if (material._originalEmissive) {
            material.emissive.copy(material._originalEmissive);
            delete material._originalEmissive;
          }
          if (material._originalOpacity !== undefined) {
            material.opacity = material._originalOpacity;
            delete material._originalOpacity;
          }
        });
      }
    });

    document.body.style.cursor = 'default';
  }

  private applyClickEffect(object: THREE.Object3D): void {
    const originalScale = object.scale.clone();
    let progress = 0;
    const duration = 300;
    const startTime = performance.now();

    const animateClick = () => {
      progress = Math.min(1, (performance.now() - startTime) / duration);
      const pulse = 1 + Math.sin(progress * Math.PI) * 0.1;
      object.scale.setScalar(originalScale.x * pulse);

      if (progress < 1) {
        requestAnimationFrame(animateClick);
      } else {
        object.scale.copy(originalScale);
      }
    };

    animateClick();
  }

  onHover(callback: (obj: PickedObject | null) => void): void {
    this.onHoverCallback = callback;
  }

  onClick(callback: (obj: PickedObject | null) => void): void {
    this.onClickCallback = callback;
  }

  getPickedObject(): PickedObject | null {
    return this.pickedObject;
  }

  getHoveredObject(): PickedObject | null {
    if (!this.hoveredObject) return null;
    return this.createPickedObject(this.hoveredObject);
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
    this.resetHoverState();
    this.hoveredObject = null;
    if (this.onHoverCallback) {
      this.onHoverCallback(null);
    }
  }

  dispose(): void {
    const domElement = this.sceneManager.renderer.domElement;
    domElement.removeEventListener('mousemove', this.handleMouseMove);
    domElement.removeEventListener('click', this.handleClick);
    domElement.removeEventListener('mouseleave', this.handleMouseLeave);

    this.onHoverCallback = null;
    this.onClickCallback = null;
    this.resetHoverState();
    this.hoveredObject = null;
    this.pickedObject = null;
  }
}
