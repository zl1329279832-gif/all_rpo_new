import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { COLORS, SCENE_CONFIG, CAMERA_PRESETS } from '@/config';
import type { CameraView, Vector3 } from '@/types';

export class SceneManager {
  private static instance: SceneManager;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;
  public container: HTMLElement | null = null;
  public animationId: number | null = null;
  public isInitialized: boolean = false;

  public warehouseGroup: THREE.Group;
  public shelvesGroup: THREE.Group;
  public forkliftsGroup: THREE.Group;
  public sensorsGroup: THREE.Group;
  public docksGroup: THREE.Group;
  public channelsGroup: THREE.Group;
  public helpersGroup: THREE.Group;

  private resizeObserver: ResizeObserver | null = null;
  private clock: THREE.Clock;

  private constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera();
    this.renderer = new THREE.WebGLRenderer();
    this.controls = new OrbitControls(this.camera, document.createElement('div'));
    this.warehouseGroup = new THREE.Group();
    this.shelvesGroup = new THREE.Group();
    this.forkliftsGroup = new THREE.Group();
    this.sensorsGroup = new THREE.Group();
    this.docksGroup = new THREE.Group();
    this.channelsGroup = new THREE.Group();
    this.helpersGroup = new THREE.Group();
    this.clock = new THREE.Clock();
  }

  static getInstance(): SceneManager {
    if (!SceneManager.instance) {
      SceneManager.instance = new SceneManager();
    }
    return SceneManager.instance;
  }

  init(container: HTMLElement): void {
    if (this.isInitialized) return;
    this.container = container;

    this.setupScene();
    this.setupCamera();
    this.setupRenderer();
    this.setupLights();
    this.setupGroups();
    this.setupControls();
    this.setupEventListeners();

    this.isInitialized = true;
  }

  private setupScene(): void {
    this.scene.background = new THREE.Color(COLORS.background);
    this.scene.fog = new THREE.Fog(COLORS.background, 100, 300);
  }

  private setupCamera(): void {
    const { clientWidth, clientHeight } = this.container!;
    this.camera.fov = 50;
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.near = 0.1;
    this.camera.far = 1000;

    const preset = CAMERA_PRESETS.perspective;
    this.camera.position.set(preset.position.x, preset.position.y, preset.position.z);
    this.camera.lookAt(preset.target.x, preset.target.y, preset.target.z);
    this.camera.updateProjectionMatrix();
  }

  private setupRenderer(): void {
    const { clientWidth, clientHeight } = this.container!;

    this.renderer.setSize(clientWidth, clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';

    this.container!.appendChild(this.renderer.domElement);
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(50, 80, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(2048, 2048);
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    this.scene.add(directionalLight);

    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x363636, 0.3);
    this.scene.add(hemisphereLight);

    const fillLight = new THREE.DirectionalLight(0x40a9ff, 0.3);
    fillLight.position.set(-50, 30, -50);
    this.scene.add(fillLight);
  }

  private setupGroups(): void {
    this.warehouseGroup.name = 'warehouse';
    this.shelvesGroup.name = 'shelves';
    this.forkliftsGroup.name = 'forklifts';
    this.sensorsGroup.name = 'sensors';
    this.docksGroup.name = 'docks';
    this.channelsGroup.name = 'channels';
    this.helpersGroup.name = 'helpers';

    this.warehouseGroup.add(this.shelvesGroup);
    this.warehouseGroup.add(this.forkliftsGroup);
    this.warehouseGroup.add(this.sensorsGroup);
    this.warehouseGroup.add(this.docksGroup);
    this.warehouseGroup.add(this.channelsGroup);
    this.scene.add(this.warehouseGroup);
    this.scene.add(this.helpersGroup);
  }

  private setupControls(): void {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 200;
    this.controls.maxPolarAngle = Math.PI / 2.1;
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  private setupEventListeners(): void {
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container!);

    this.renderer.domElement.addEventListener('webglcontextlost', this.onContextLost);
  }

  handleResize(): void {
    if (!this.container) return;
    const { clientWidth, clientHeight } = this.container;
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(clientWidth, clientHeight);
  }

  private onContextLost = (event: Event): void => {
    event.preventDefault();
    console.error('WebGL context lost');
  };

  setCameraView(view: CameraView): void {
    const preset = CAMERA_PRESETS[view];
    if (!preset) return;

    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const endPos = new THREE.Vector3(preset.position.x, preset.position.y, preset.position.z);
    const endTarget = new THREE.Vector3(preset.target.x, preset.target.y, preset.target.z);

    let progress = 0;
    const duration = 1000;
    const startTime = performance.now();

    const animateCamera = () => {
      progress = Math.min(1, (performance.now() - startTime) / duration);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      this.camera.position.lerpVectors(startPos, endPos, easeProgress);
      this.controls.target.lerpVectors(startTarget, endTarget, easeProgress);
      this.controls.update();

      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      }
    };

    animateCamera();
  }

  focusOnObject(position: Vector3, offset: Vector3 = { x: 20, y: 15, z: 20 }): void {
    const target = new THREE.Vector3(position.x, position.y, position.z);
    const cameraPos = new THREE.Vector3(
      position.x + offset.x,
      position.y + offset.y,
      position.z + offset.z
    );

    let progress = 0;
    const duration = 800;
    const startTime = performance.now();
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();

    const animateCamera = () => {
      progress = Math.min(1, (performance.now() - startTime) / duration);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      this.camera.position.lerpVectors(startPos, cameraPos, easeProgress);
      this.controls.target.lerpVectors(startTarget, target, easeProgress);
      this.controls.update();

      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      }
    };

    animateCamera();
  }

  getDelta(): number {
    return this.clock.getDelta();
  }

  getElapsedTime(): number {
    return this.clock.getElapsedTime();
  }

  render(): void {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  clearGroup(group: THREE.Group): void {
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      this.disposeObject(child);
    }
  }

  private disposeObject(object: THREE.Object3D): void {
    if ((object as THREE.Mesh).geometry) {
      (object as THREE.Mesh).geometry.dispose();
    }

    const material = (object as THREE.Mesh).material;
    if (material) {
      if (Array.isArray(material)) {
        material.forEach(m => m.dispose());
      } else {
        material.dispose();
      }
    }

    object.children.forEach(child => this.disposeObject(child));
  }

  setFloorVisible(floor: number): void {
    const floorY = floor * SCENE_CONFIG.floorHeight;
    const floorHeight = SCENE_CONFIG.floorHeight;

    this.shelvesGroup.visible = true;
    this.sensorsGroup.visible = true;

    this.shelvesGroup.children.forEach(shelf => {
      const shelfY = shelf.position.y;
      shelf.visible = Math.abs(shelfY - floorY) < floorHeight / 2;
    });

    this.sensorsGroup.children.forEach(sensor => {
      const sensorY = sensor.position.y;
      sensor.visible = Math.abs(sensorY - (floorY + 2)) < floorHeight / 2;
    });
  }

  dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.renderer.domElement.removeEventListener('webglcontextlost', this.onContextLost);

    this.clearGroup(this.warehouseGroup);
    this.clearGroup(this.helpersGroup);

    this.scene.traverse(object => {
      this.disposeObject(object);
    });

    this.renderer.dispose();
    this.controls.dispose();

    if (this.container && this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }

    this.isInitialized = false;
  }
}
