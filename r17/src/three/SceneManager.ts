import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SceneConfig, CameraConfig, AnimationState } from '@/types';
import { createGround, createGrid, disposeObject, easeInOutCubic } from './utils';

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;
  public container: HTMLElement;

  private animationId: number | null = null;
  private animationState: AnimationState | null = null;
  private onRenderCallbacks: Set<() => void> = new Set();
  private isDisposed = false;

  private sceneConfig: SceneConfig = {
    container: null as unknown as HTMLElement,
    width: 0,
    height: 0,
    backgroundColor: 0x0a0a1a,
    gridSize: 200,
    gridDivisions: 50
  };

  private cameraConfig: CameraConfig = {
    fov: 60,
    near: 0.1,
    far: 1000,
    initialPosition: new THREE.Vector3(80, 60, 80),
    initialTarget: new THREE.Vector3(0, 0, 0)
  };

  constructor(container: HTMLElement) {
    this.container = container;
    this.sceneConfig.container = container;
    this.sceneConfig.width = container.clientWidth;
    this.sceneConfig.height = container.clientHeight;

    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    this.controls = this.createControls();

    this.setupLighting();
    this.setupEnvironment();
    this.setupResizeListener();
    this.startAnimationLoop();
  }

  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(this.sceneConfig.backgroundColor);
    scene.fog = new THREE.Fog(this.sceneConfig.backgroundColor, 50, 200);
    return scene;
  }

  private createCamera(): THREE.PerspectiveCamera {
    const aspect = this.sceneConfig.width / this.sceneConfig.height;
    const camera = new THREE.PerspectiveCamera(
      this.cameraConfig.fov,
      aspect,
      this.cameraConfig.near,
      this.cameraConfig.far
    );
    camera.position.copy(this.cameraConfig.initialPosition);
    return camera;
  }

  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(this.sceneConfig.width, this.sceneConfig.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    this.container.appendChild(renderer.domElement);
    return renderer;
  }

  private createControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.minDistance = 20;
    controls.maxDistance = 200;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.minPolarAngle = Math.PI / 6;
    controls.target.copy(this.cameraConfig.initialTarget);
    return controls;
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x404080, 0.4);
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(50, 100, 50);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 300;
    mainLight.shadow.camera.left = -100;
    mainLight.shadow.camera.right = 100;
    mainLight.shadow.camera.top = 100;
    mainLight.shadow.camera.bottom = -100;
    this.scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x6080ff, 0.3);
    fillLight.position.set(-50, 50, -50);
    this.scene.add(fillLight);

    const hemisphericLight = new THREE.HemisphereLight(0x4080ff, 0x004040, 0.3);
    this.scene.add(hemisphericLight);
  }

  private setupEnvironment(): void {
    const ground = createGround(this.sceneConfig.gridSize);
    this.scene.add(ground);

    const grid = createGrid(this.sceneConfig.gridSize, this.sceneConfig.gridDivisions);
    this.scene.add(grid);

    this.createCityLights();
  }

  private createCityLights(): void {
    const pointLightPositions = [
      [-50, 2, -50],
      [50, 2, -50],
      [-50, 2, 50],
      [50, 2, 50]
    ];

    pointLightPositions.forEach(([x, y, z]) => {
      const pointLight = new THREE.PointLight(0x4080ff, 0.5, 50);
      pointLight.position.set(x, y, z);
      this.scene.add(pointLight);
    });
  }

  private setupResizeListener(): void {
    const handleResize = () => {
      if (this.isDisposed) return;
      
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;

      this.sceneConfig.width = width;
      this.sceneConfig.height = height;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);
  }

  private startAnimationLoop(): void {
    const animate = () => {
      if (this.isDisposed) return;

      this.animationId = requestAnimationFrame(animate);

      this.updateCameraAnimation();
      this.controls.update();

      this.onRenderCallbacks.forEach(callback => callback());

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  private updateCameraAnimation(): void {
    if (!this.animationState || !this.animationState.isAnimating) return;

    this.animationState.progress += 0.016;
    
    if (this.animationState.progress >= 1) {
      this.animationState.isAnimating = false;
      this.camera.position.copy(this.animationState.targetPosition);
      this.controls.target.copy(this.animationState.targetTarget);
      return;
    }

    const t = easeInOutCubic(this.animationState.progress);

    this.camera.position.lerpVectors(
      this.animationState.startPosition,
      this.animationState.targetPosition,
      t
    );

    this.controls.target.lerpVectors(
      this.animationState.startTarget,
      this.animationState.targetTarget,
      t
    );
  }

  public moveCameraTo(position: THREE.Vector3, target: THREE.Vector3, animate: boolean = true): void {
    if (animate) {
      this.animationState = {
        targetPosition: position.clone(),
        targetTarget: target.clone(),
        isAnimating: true,
        progress: 0,
        startPosition: this.camera.position.clone(),
        startTarget: this.controls.target.clone()
      };
    } else {
      this.camera.position.copy(position);
      this.controls.target.copy(target);
    }
  }

  public resetCamera(animate: boolean = true): void {
    this.moveCameraTo(
      this.cameraConfig.initialPosition,
      this.cameraConfig.initialTarget,
      animate
    );
  }

  public onRender(callback: () => void): () => void {
    this.onRenderCallbacks.add(callback);
    return () => this.onRenderCallbacks.delete(callback);
  }

  public dispose(): void {
    this.isDisposed = true;
    
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    this.onRenderCallbacks.clear();

    disposeObject(this.scene);

    if (this.controls) {
      this.controls.dispose();
    }

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }

  public getRaycaster(): THREE.Raycaster {
    return new THREE.Raycaster();
  }

  public getMouseVector(clientX: number, clientY: number): THREE.Vector2 {
    const rect = this.renderer.domElement.getBoundingClientRect();
    return new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
  }
}
