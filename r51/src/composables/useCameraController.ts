import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useSceneStore } from '@/store/sceneStore';

export function useCameraController(renderer: THREE.WebGLRenderer) {
  const store = useSceneStore();

  const aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;

  const topCamera = new THREE.OrthographicCamera(
    -150 * aspect,
    150 * aspect,
    150,
    -150,
    0.1,
    1000
  );
  topCamera.position.set(0, 200, 0.01);
  topCamera.lookAt(0, 0, 0);

  const drivingCamera = new THREE.PerspectiveCamera(
    75,
    aspect,
    0.1,
    1000
  );
  drivingCamera.position.set(0, 3, 8);
  drivingCamera.lookAt(0, 0, 0);

  const freeCamera = new THREE.PerspectiveCamera(
    60,
    aspect,
    0.1,
    1000
  );
  freeCamera.position.set(100, 80, 100);
  freeCamera.lookAt(0, 0, 0);

  const controls = new OrbitControls(freeCamera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 20;
  controls.maxDistance = 300;
  controls.maxPolarAngle = Math.PI / 2.1;
  controls.target.set(0, 5, 0);

  const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false
  };

  function handleKeyDown(event: KeyboardEvent) {
    switch (event.key.toLowerCase()) {
      case 'w':
        keys.forward = true;
        break;
      case 's':
        keys.backward = true;
        break;
      case 'a':
        keys.left = true;
        break;
      case 'd':
        keys.right = true;
        break;
      case 'q':
        keys.down = true;
        break;
      case 'e':
        keys.up = true;
        break;
      case '1':
        setCameraMode('top');
        break;
      case '2':
        setCameraMode('driving');
        break;
      case '3':
        setCameraMode('free');
        break;
    }
  }

  function handleKeyUp(event: KeyboardEvent) {
    switch (event.key.toLowerCase()) {
      case 'w':
        keys.forward = false;
        break;
      case 's':
        keys.backward = false;
        break;
      case 'a':
        keys.left = false;
        break;
      case 'd':
        keys.right = false;
        break;
      case 'q':
        keys.down = false;
        break;
      case 'e':
        keys.up = false;
        break;
    }
  }

  function getCurrentCamera(): THREE.Camera {
    switch (store.state.cameraMode) {
      case 'top':
        return topCamera;
      case 'driving':
        return drivingCamera;
      case 'free':
        return freeCamera;
      default:
        return freeCamera;
    }
  }

  function setCameraMode(mode: 'top' | 'driving' | 'free') {
    store.setCameraMode(mode);

    if (mode === 'free') {
      controls.enabled = true;
    } else {
      controls.enabled = false;
    }
  }

  let currentVehiclePosition = new THREE.Vector3();
  let currentVehicleForward = new THREE.Vector3(0, 0, 1);

  function updateDrivingCamera(
    vehiclePosition: THREE.Vector3,
    vehicleForward: THREE.Vector3
  ) {
    currentVehiclePosition.lerp(vehiclePosition, 0.1);
    currentVehicleForward.lerp(vehicleForward, 0.1);

    const cameraOffset = new THREE.Vector3(0, 4, -8);
    cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(vehicleForward.x, vehicleForward.z));

    const targetPosition = currentVehiclePosition.clone().add(cameraOffset);

    drivingCamera.position.lerp(targetPosition, 0.08);

    const lookAtPoint = currentVehiclePosition.clone().add(
      currentVehicleForward.clone().multiplyScalar(20)
    );
    lookAtPoint.y = currentVehiclePosition.y + 2;

    drivingCamera.lookAt(lookAtPoint);
  }

  function updateFreeCamera(deltaTime: number) {
    const speed = 60 * deltaTime;
    const direction = new THREE.Vector3();

    freeCamera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(direction, new THREE.Vector3(0, 1, 0));

    if (keys.forward) {
      freeCamera.position.add(direction.clone().multiplyScalar(speed));
    }
    if (keys.backward) {
      freeCamera.position.add(direction.clone().multiplyScalar(-speed));
    }
    if (keys.left) {
      freeCamera.position.add(right.clone().multiplyScalar(-speed));
    }
    if (keys.right) {
      freeCamera.position.add(right.clone().multiplyScalar(speed));
    }
    if (keys.up) {
      freeCamera.position.y += speed;
    }
    if (keys.down) {
      freeCamera.position.y -= speed;
    }

    controls.update();
  }

  function handleResize(width: number, height: number) {
    const aspect = width / height;

    topCamera.left = -150 * aspect;
    topCamera.right = 150 * aspect;
    topCamera.top = 150;
    topCamera.bottom = -150;
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
