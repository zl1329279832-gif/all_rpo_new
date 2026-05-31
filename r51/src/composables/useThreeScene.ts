import * as THREE from 'three';
import { useSceneStore } from '@/store/sceneStore';
import { useRoadGenerator } from './useRoadGenerator';
import { useTrafficSystem } from './useTrafficSystem';
import { useCameraController } from './useCameraController';
import { buildings as buildingData } from '@/data/trafficData';
import { createBuildingGeometry } from '@/utils/geometryUtils';
import { environmentMaterials, updateDayNightMaterials } from '@/utils/materialPresets';

export function useThreeScene(container: HTMLElement) {
  const store = useSceneStore();
  const clock = new THREE.Clock();

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x87ceeb, 0.002);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(100, 150, 100);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.set(2048, 2048);
  directionalLight.shadow.camera.left = -200;
  directionalLight.shadow.camera.right = 200;
  directionalLight.shadow.camera.top = 200;
  directionalLight.shadow.camera.bottom = -200;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 500;
  directionalLight.shadow.bias = -0.0001;
  scene.add(directionalLight);

  const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x3d6b2f, 0.4);
  scene.add(hemisphereLight);

  const moonLight = new THREE.DirectionalLight(0x6688cc, 0);
  moonLight.position.set(-100, 150, -100);
  scene.add(moonLight);

  const skyGeo = new THREE.SphereGeometry(500, 32, 32);
  const sky = new THREE.Mesh(skyGeo, environmentMaterials.skyDay);
  scene.add(sky);

  const starsGeometry = new THREE.BufferGeometry();
  const starCount = 1000;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i += 3) {
    const radius = 400 + Math.random() * 100;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    starPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[i + 1] = Math.abs(radius * Math.cos(phi)) + 50;
    starPositions[i + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, transparent: true, opacity: 0 });
  const stars = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(stars);

  const roadGenerator = useRoadGenerator(scene);
  roadGenerator.generateAllRoads();

  const curves = roadGenerator.getCurves();
  const streetLights = roadGenerator.getStreetLights();

  const trafficSystem = useTrafficSystem(scene, curves);
  trafficSystem.updateTrafficDensity(store.state.trafficDensity);

  const cameraController = useCameraController(renderer);
  cameraController.setupEventListeners();

  const buildingsGroup = new THREE.Group();
  buildingsGroup.name = 'buildings';

  for (const b of buildingData) {
    const building = createBuildingGeometry(b.width, b.height, b.depth, b.style);
    building.position.set(b.position.x, 0, b.position.z);
    building.castShadow = true;
    building.receiveShadow = true;
    building.userData = {
      type: 'building',
      buildingId: b.id,
      style: b.style,
      height: b.height
    };

    const windowMat = new THREE.MeshStandardMaterial({
      color: 0xffffcc,
      emissive: 0xffffaa,
      emissiveIntensity: 0
    });

    for (let wy = 1; wy < b.height - 2; wy += 3) {
      for (let wx = -b.width / 2 + 2; wx < b.width / 2; wx += 4) {
        for (let wz = -b.depth / 2 + 2; wz < b.depth / 2; wz += 4) {
          if (Math.random() > 0.3) {
            const windowGeo = new THREE.PlaneGeometry(1.5, 2);
            const windowMesh = new THREE.Mesh(windowGeo, windowMat);
            windowMesh.position.set(wx, wy, wz + (Math.abs(wz) > b.depth / 2 - 2.1 ? 0.01 : b.depth / 2 + 0.01));
            if (Math.abs(wz) > Math.abs(wx)) {
              windowMesh.rotation.y = wz > 0 ? 0 : Math.PI;
            } else {
              windowMesh.rotation.y = wx > 0 ? Math.PI / 2 : -Math.PI / 2;
            }
            building.add(windowMesh);
          }
        }
      }
    }

    buildingsGroup.add(building);
  }
  scene.add(buildingsGroup);

  const labelSprites: Map<string, THREE.Sprite> = new Map();

  function createLabel(text: string, position: THREE.Vector3, color = '#ffffff'): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.roundRect(0, 0, 256, 64, 8);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.roundRect(0, 0, 256, 64, 8);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });

    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.copy(position);
    sprite.position.y += 5;
    sprite.scale.set(10, 2.5, 1);

    return sprite;
  }

  function updateLabels(show: boolean) {
    if (show && labelSprites.size === 0) {
      const mainRoadLabel = createLabel('东西主干道 (地面层)', new THREE.Vector3(0, 0, 0), '#00d4ff');
      labelSprites.set('main-road', mainRoadLabel);
      scene.add(mainRoadLabel);

      const level1Label = createLabel('南北主干道 (一层)', new THREE.Vector3(0, 6, 0), '#ff9500');
      labelSprites.set('level1-road', level1Label);
      scene.add(level1Label);

      const level2Label = createLabel('东西快速路 (二层)', new THREE.Vector3(0, 12, 40), '#34c759');
      labelSprites.set('level2-road', level2Label);
      scene.add(level2Label);
    } else if (!show) {
      for (const sprite of labelSprites.values()) {
        scene.remove(sprite);
        sprite.material.dispose();
        if (sprite.material.map) {
          sprite.material.map.dispose();
        }
      }
      labelSprites.clear();
    }
  }

  function setDayNight(isDay: boolean) {
    store.setTimeOfDay(isDay ? 'day' : 'night');

    const targetFog = isDay ? 0x87ceeb : 0x0a0a20;
    const currentFog = (scene.fog as THREE.FogExp2).color.getHex();
    animateColor(currentFog, targetFog, 1000, (hex) => {
      (scene.fog as THREE.FogExp2).color.setHex(hex);
    });

    sky.material = isDay ? environmentMaterials.skyDay : environmentMaterials.skyNight;

    ambientLight.intensity = isDay ? 0.6 : 0.15;
    directionalLight.intensity = isDay ? 1 : 0;
    hemisphereLight.intensity = isDay ? 0.4 : 0.1;
    moonLight.intensity = isDay ? 0 : 0.3;

    starsMaterial.opacity = isDay ? 0 : 0.8;

    renderer.toneMappingExposure = isDay ? 1 : 0.8;

    for (const { light } of streetLights) {
      light.intensity = isDay ? 0 : 1.5;
    }

    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
        if (obj.material.emissive && obj.material.emissiveIntensity > 0) {
          obj.material.emissiveIntensity = isDay ? 0.1 : 1;
        }
      }
    });

    updateDayNightMaterials(isDay, scene);
  }

  function animateColor(fromHex: number, toHex: number, duration: number, onUpdate: (hex: number) => void) {
    const from = new THREE.Color(fromHex);
    const to = new THREE.Color(toHex);
    const startTime = Date.now();

    function update() {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      const current = from.clone().lerp(to, eased);
      onUpdate(current.getHex());

      if (t < 1) {
        requestAnimationFrame(update);
      }
    }
    update();
  }

  function handleRaycast(event: MouseEvent) {
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraController.getCurrentCamera());

    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
      const obj = intersects[0].object;
      if (obj.userData.type === 'vehicle') {
        store.selectVehicle(obj.userData.vehicleId);
      }
    }
  }

  renderer.domElement.addEventListener('click', handleRaycast);

  let animationId: number;

  function animate() {
    animationId = requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    trafficSystem.updateVehicles(deltaTime, store.state.timeOfDay === 'night', store.state.roadStatus);

    if (store.state.cameraMode === 'driving') {
      const vehiclePos = trafficSystem.getSelectedVehiclePosition();
      const forward = new THREE.Vector3(0, 0, 1);

      const selectedVehicle = store.vehicles.find(v => v.id === store.state.selectedVehicleId);
      if (selectedVehicle) {
        const curve = curves.get(selectedVehicle.pathId);
        if (curve) {
          const tangent = curve.getTangentAt(selectedVehicle.progress);
          forward.set(tangent.x, 0, tangent.z).normalize();
        }
      }

      cameraController.updateDrivingCamera(vehiclePos, forward);
    } else if (store.state.cameraMode === 'free') {
      cameraController.updateFreeCamera(deltaTime);
    }

    for (let i = 0; i < streetLights.length; i++) {
      const { light } = streetLights[i];
      if (light.intensity > 0) {
        const flicker = Math.sin(elapsedTime * 3 + i) * 0.05 + 0.95;
        light.intensity = store.state.timeOfDay === 'night' ? 1.5 * flicker : 0;
      }
    }

    renderer.render(scene, cameraController.getCurrentCamera());
  }

  animate();

  function handleResize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    renderer.setSize(width, height);
    cameraController.handleResize(width, height);
  }

  window.addEventListener('resize', handleResize);

  function dispose() {
    cancelAnimationFrame(animationId);
    window.removeEventListener('resize', handleResize);
    renderer.domElement.removeEventListener('click', handleRaycast);

    cameraController.cleanupEventListeners();
    roadGenerator.dispose();
    trafficSystem.dispose();

    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });

    renderer.dispose();
    container.removeChild(renderer.domElement);
  }

  updateLabels(store.state.showLabels);

  return {
    scene,
    renderer,
    cameraController,
    trafficSystem,
    setDayNight,
    updateLabels,
    dispose,
    getCanvas: () => renderer.domElement
  };
}
