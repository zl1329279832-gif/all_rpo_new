import { SceneManager } from '@/scene/SceneManager';
import type { Vector3, CameraView } from '@/types';
import { CAMERA_PRESETS } from '@/config';
import * as TWEEN from '@tweenjs/tween.js';
import * as THREE from 'three';

export class CameraController {
  private static instance: CameraController;
  private sceneManager: SceneManager;

  private constructor() {
    this.sceneManager = SceneManager.getInstance();
  }

  static getInstance(): CameraController {
    if (!CameraController.instance) {
      CameraController.instance = new CameraController();
    }
    return CameraController.instance;
  }

  setView(view: CameraView, animate: boolean = true): void {
    const preset = CAMERA_PRESETS[view];
    if (!preset) return;

    const targetPosition = {
      x: preset.position.x,
      y: preset.position.y,
      z: preset.position.z,
    };
    const targetLookAt = {
      x: preset.target.x,
      y: preset.target.y,
      z: preset.target.z,
    };

    if (animate) {
      this.animateCamera(targetPosition, targetLookAt, preset.fov);
    } else {
      this.setCameraPosition(targetPosition);
      this.setCameraTarget(targetLookAt);
      this.sceneManager.camera.fov = preset.fov;
      this.sceneManager.camera.updateProjectionMatrix();
    }
  }

  focusOnPosition(position: Vector3, offset: Vector3 = { x: 20, y: 15, z: 20 }): void {
    const targetLookAt = { x: position.x, y: position.y, z: position.z };
    const targetPosition = {
      x: position.x + offset.x,
      y: position.y + offset.y,
      z: position.z + offset.z,
    };

    this.animateCamera(targetPosition, targetLookAt);
  }

  fitToView(objects: THREE.Object3D[], animate: boolean = true): void {
    if (objects.length === 0) return;

    const box = new THREE.Box3();
    objects.forEach(obj => box.expandByObject(obj));

    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.sceneManager.camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 1.5;

    const targetPosition = {
      x: center.x,
      y: center.y + cameraZ * 0.6,
      z: center.z + cameraZ,
    };
    const targetLookAt = { x: center.x, y: center.y, z: center.z };

    if (animate) {
      this.animateCamera(targetPosition, targetLookAt);
    } else {
      this.setCameraPosition(targetPosition);
      this.setCameraTarget(targetLookAt);
    }
  }

  private animateCamera(
    targetPosition: { x: number; y: number; z: number },
    targetLookAt: { x: number; y: number; z: number },
    targetFov?: number
  ): void {
    const startPosition = {
      x: this.sceneManager.camera.position.x,
      y: this.sceneManager.camera.position.y,
      z: this.sceneManager.camera.position.z,
    };
    const startLookAt = {
      x: this.sceneManager.controls.target.x,
      y: this.sceneManager.controls.target.y,
      z: this.sceneManager.controls.target.z,
    };
    const startFov = this.sceneManager.camera.fov;

    new TWEEN.Tween({ t: 0 })
      .to({ t: 1 }, 1000)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate(({ t }) => {
        this.setCameraPosition({
          x: this.lerp(startPosition.x, targetPosition.x, t),
          y: this.lerp(startPosition.y, targetPosition.y, t),
          z: this.lerp(startPosition.z, targetPosition.z, t),
        });

        this.setCameraTarget({
          x: this.lerp(startLookAt.x, targetLookAt.x, t),
          y: this.lerp(startLookAt.y, targetLookAt.y, t),
          z: this.lerp(startLookAt.z, targetLookAt.z, t),
        });

        if (targetFov !== undefined) {
          this.sceneManager.camera.fov = this.lerp(startFov, targetFov, t);
          this.sceneManager.camera.updateProjectionMatrix();
        }
      })
      .start();
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private setCameraPosition(pos: { x: number; y: number; z: number }): void {
    this.sceneManager.camera.position.set(pos.x, pos.y, pos.z);
  }

  private setCameraTarget(target: { x: number; y: number; z: number }): void {
    this.sceneManager.controls.target.set(target.x, target.y, target.z);
    this.sceneManager.controls.update();
  }

  reset(): void {
    this.setView('perspective');
  }

  enableControls(): void {
    this.sceneManager.controls.enabled = true;
  }

  disableControls(): void {
    this.sceneManager.controls.enabled = false;
  }

  getCameraPosition(): Vector3 {
    return {
      x: this.sceneManager.camera.position.x,
      y: this.sceneManager.camera.position.y,
      z: this.sceneManager.camera.position.z,
    };
  }

  getCameraTarget(): Vector3 {
    return {
      x: this.sceneManager.controls.target.x,
      y: this.sceneManager.controls.target.y,
      z: this.sceneManager.controls.target.z,
    };
  }
}
