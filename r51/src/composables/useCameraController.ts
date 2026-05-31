import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useSceneStore } from '@/store/sceneStore';

export function useCameraController(renderer: THREE.WebGLRenderer) {
  const store = useSceneStore();

  const topCamera = new THREE.OrthographicCamera(-100, 100, 100, -100, 0.1, 1000);
  topCamera.position.set(0, 150, 0.1);
  topCamera.lookAt(0, 0, 0);

  const drivingCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  drivingCamera.position.set(0, 3, -10);

  const freeCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  freeCamera.position.set(80, 60, 80);

  const controls = new OrbitControls(freeCamera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.minDistance = 10;
  controls.maxDistance = 300;
  controls.target.set(0, 5, 0);

  const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false
  };

  let currentCamera: THREE.Camera = topCamera;

  function getCurrentCamera(): THREE.Camera {
    return currentCamera;
  }

  function setCameraMode(mode: 'top' | 'driving' | 'free') {
    store.setCameraMode(mode);

    switch (mode) {
      case 'top':
        currentCamera = topCamera;
        controls.enabled = false;
        break;
      case 'driving':
        currentCamera = drivingCamera;
        controls.enabled = false;
        break;
      case 'free':
        currentCamera = freeCamera;
        controls.enabled = true;
        break;
    }
  }

  function updateDrivingCamera(vehiclePosition: THREE.Vector3 | null, vehicleForward: THREE.Vector3) {
    if (!vehiclePosition) return;

    const cameraOffset = new THREE.Vector3(
      -vehicleForward.x * 8,
      3,
      -vehicleForward.z * 8
    );

    const targetPosition = vehiclePosition.clone().add(cameraOffset);
    drivingCamera.position.lerp(targetPosition, 0.1);

    const lookTarget = vehiclePosition.clone().add(
      new THREE.Vector3(vehicleForward.x * 10, 1, vehicleForward.z * 10)
    );
    drivingCamera.lookAt(lookTarget);
  }

  function handleKeyDown(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    if (key in keys) {
      keys[key as keyof typeof keys] = true;
    }
    if (event.shiftKey) {
      keys.shift = true;
    }

    if (key === '1') setCameraMode('top');
    if (key === '2') setCameraMode('driving');
    if (key === '3') setCameraMode('free');
  }

  function handleKeyUp(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    if (key in keys) {
      keys[key as keyof typeof keys] = false;
    }
    if (!event.shiftKey) {
      keys.shift = false;
    }
  }

  function updateFreeCamera(deltaTime: number) {
    if (store.state.cameraMode !== 'free') return;

    const speed = keys.shift ? 80 : 40;
    const direction = new THREE.Vector3();

    const forward = new THREE.Vector3();
    freeCamera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    if (keys.w) direction.add(forward);
    if (keys.s) direction.sub(forward);
    if (keys.d) direction.add(right);
    if (keys.a) direction.sub(right);

    if (direction.length() > 0) {
      direction.normalize();
      freeCamera.position.addScaledVector(direction, speed * deltaTime);
    }

    controls.update();
  }

  function handleResize(width: number, height: number) {
    const aspect = width / height;

    topCamera.left = -120 * aspect;
    topCamera.right = 120 * aspect;
    topCamera.top = 120;
    topCamera.bottom = -120;
    topCamera.updateProjectionMatrix();

    drivingCamera.aspect = aspect;
    drivingCamera.updateProjectionMatrix();

    freeCamera.aspect = aspect;
    freeCamera.updateProjectionMatrix();
  }

  function setupEventListeners() {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
  }

  function cleanupEventListeners() {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  }

  return {
    getCurrentCamera,
    setCameraMode,
    updateDrivingCamera,
    updateFreeCamera,
    handleResize,
    setupEventListeners,
    cleanupEventListeners,
    topCamera,
    drivingCamera,
    freeCamera,
    controls
  };
}
