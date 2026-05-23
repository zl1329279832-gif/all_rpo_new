import * as THREE from 'three';
import { SceneManager } from '@/scene/SceneManager';
import type { PickedObject, ObjectType } from '@/types';
import { debounce, throttle } from '@/utils';

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
  private containerRect: DOMRect | null = null;
  private lastRectUpdate: number = 0;
  private readonly RECT_UPDATE_INTERVAL = 1000;
  private lastHoverObjectId: string | null = null;

  private readonly interactiveTypes: ObjectType[] = ['shelf', 'forklift', 'sensor', 'dock', 'channel'];

  private constructor() {
    this.sceneManager = SceneManager.getInstance();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.raycaster.params.Line = { threshold: 2 };
    this.raycaster.params.Points = { threshold: 2 };
  }

  static getInstance(): RaycasterManager {
    if (!RaycasterManager.instance) {
      RaycasterManager.instance = new RaycasterManager();
    }
    return RaycasterManager.instance;
  }

  init(): void {
    const domElement = this.sceneManager.renderer.domElement;

    this.updateRect();

    domElement.addEventListener('mousemove', this.throttledMouseMove, { passive: true });
    domElement.addEventListener('click', this.handleClick, { passive: true });
    domElement.addEventListener('mouseleave', this.handleMouseLeave, { passive: true });
    domElement.addEventListener('mouseenter', this.handleMouseEnter, { passive: true });
  }

  private updateRect(): void {
    if (this.sceneManager.renderer?.domElement) {
      this.containerRect = this.sceneManager.renderer.domElement.getBoundingClientRect();
      this.lastRectUpdate = performance.now();
    }
  }

  private ensureRectUpdated(): void {
    const now = performance.now();
    if (!this.containerRect || now - this.lastRectUpdate > this.RECT_UPDATE_INTERVAL) {
      this.updateRect();
    }
  }

  private throttledMouseMove = throttle((event: MouseEvent) => {
    if (!this.isEnabled) return;
    this.updateMousePosition(event);
    this.checkIntersection('hover');
  }, 24);

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

  private handleMouseEnter = (): void => {
    this.updateRect();
  };

  private handleMouseLeave = (): void => {
    if (this.hoveredObject) {
      this.resetHoverState();
      this.hoveredObject = null;
      this.lastHoverObjectId = null;
      if (this.onHoverCallback) {
        this.onHoverCallback(null);
      }
    }
  };

  private updateMousePosition(event: MouseEvent): void {
    this.ensureRectUpdated();
    if (!this.containerRect) return;

    const rect = this.containerRect;
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
        const objectId = intersectedObject.userData.id;

        if (type === 'hover') {
          if (this.lastHoverObjectId !== objectId) {
            this.handleHover(intersectedObject);
            this.lastHoverObjectId = objectId;
          }
        } else {
          this.handleClickObject(intersectedObject);
        }
        return;
      }
    }

    if (type === 'hover' && this.hoveredObject) {
      this.resetHoverState();
      this.hoveredObject = null;
      this.lastHoverObjectId = null;
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
    let iterations = 0;
    const maxIterations = 10;

    while (current && iterations < maxIterations) {
      if (current.userData && this.interactiveTypes.includes(current.userData.type)) {
        return current;
      }
      current = current.parent;
      iterations++;
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
        const len = materials.length;
        for (let i = 0; i < len; i++) {
          const material = materials[i] as any;
          if (material.emissive && !material._originalEmissive) {
            material._originalEmissive = material.emissive.clone();
            material.emissive.multiplyScalar(1.3);
          }
          if (material._originalOpacity === undefined) {
            material._originalOpacity = material.opacity;
            material.opacity = Math.min(1, material.opacity + 0.15);
          }
        }
      }
    });
  }

  private resetHoverState(): void {
    if (!this.hoveredObject) return;

    this.hoveredObject.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.material) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const len = materials.length;
        for (let i = 0; i < len; i++) {
          const material = materials[i] as any;
          if (material._originalEmissive) {
            material.emissive.copy(material._originalEmissive);
            delete material._originalEmissive;
          }
          if (material._originalOpacity !== undefined) {
            material.opacity = material._originalOpacity;
            delete material._originalOpacity;
          }
        }
      }
    });

    document.body.style.cursor = 'default';
  }

  private applyClickEffect(object: THREE.Object3D): void {
    const originalScaleX = object.scale.x;
    const originalScaleY = object.scale.y;
    const originalScaleZ = object.scale.z;
    let progress = 0;
    const duration = 200;
    const startTime = performance.now();

    const animateClick = () => {
      progress = Math.min(1, (performance.now() - startTime) / duration);
      const pulse = 1 + Math.sin(progress * Math.PI) * 0.08;
      object.scale.set(
        originalScaleX * pulse,
        originalScaleY * pulse,
        originalScaleZ * pulse
      );

      if (progress < 1) {
        requestAnimationFrame(animateClick);
      } else {
        object.scale.set(originalScaleX, originalScaleY, originalScaleZ);
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
