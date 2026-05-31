import * as THREE from 'three';
import { useSceneStore } from '@/store/sceneStore';
import { getPointAtProgress } from '@/utils/curveUtils';
import { createCarGeometry } from '@/utils/geometryUtils';
import { vehicleColors } from '@/utils/materialPresets';

interface VehicleMesh {
  group: THREE.Group;
  body: THREE.Mesh;
  wheels: THREE.Mesh[];
  headLightMeshes: THREE.Mesh[];
  tailLightMeshes: THREE.Mesh[];
}

type ThreeCurve = any;

export function useTrafficSystem(scene: THREE.Scene, curves: Map<string, ThreeCurve>) {
  const store = useSceneStore();
  const vehicleMeshes = new Map<string, VehicleMesh>();
  const vehiclesGroup = new THREE.Group();
  vehiclesGroup.name = 'vehicles';
  scene.add(vehiclesGroup);

  const carBodyGeos = {
    car: createCarGeometry('car').body,
    suv: createCarGeometry('suv').body,
    truck: createCarGeometry('truck').body
  };

  const carWheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 10);
  carWheelGeo.rotateZ(Math.PI / 2);

  const vehicleMaterials = vehicleColors.map(color =>
    new THREE.MeshStandardMaterial({
      color,
      metalness: 0.4,
      roughness: 0.3
    })
  );

  const wheelMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.8
  });

  const headLightMat = new THREE.MeshStandardMaterial({
    color: 0xffffcc,
    emissive: 0xffffaa,
    emissiveIntensity: 0.3
  });

  const tailLightMat = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xff0000,
    emissiveIntensity: 0.3
  });

  const headLightGeo = new THREE.SphereGeometry(0.12, 6, 4);
  const tailLightGeo = new THREE.SphereGeometry(0.1, 6, 4);

  function createVehicle(vehicleId: string) {
    const vehicleData = store.vehicles.find(v => v.id === vehicleId);
    if (!vehicleData) return;

    const curve = curves.get(vehicleData.pathId);
    if (!curve) return;

    const group = new THREE.Group();
    group.name = vehicleId;

    const bodyGeo = carBodyGeos[vehicleData.type];
    const bodyMat = vehicleMaterials[Math.floor(Math.random() * vehicleMaterials.length)];
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const wheels: THREE.Mesh[] = [];
    const wheelPositions = vehicleData.type === 'truck'
      ? [[-1.5, 0.4, -0.7], [1.5, 0.4, -0.7], [-1.5, 0.4, 0.7], [1.5, 0.4, 0.7]]
      : [[-1.2, 0.3, -0.6], [1.2, 0.3, -0.6], [-1.2, 0.3, 0.6], [1.2, 0.3, 0.6]];

    for (const pos of wheelPositions) {
      const wheel = new THREE.Mesh(carWheelGeo, wheelMaterial);
      wheel.position.set(pos[0], pos[1], pos[2]);
      group.add(wheel);
      wheels.push(wheel);
    }

    const headLightMeshes: THREE.Mesh[] = [];
    const tailLightMeshes: THREE.Mesh[] = [];

    const hlPositions = vehicleData.type === 'truck'
      ? [[2.2, 0.6, -0.5], [2.2, 0.6, 0.5]]
      : [[1.7, 0.5, -0.4], [1.7, 0.5, 0.4]];

    for (const pos of hlPositions) {
      const hl = new THREE.Mesh(headLightGeo, headLightMat);
      hl.position.set(pos[0], pos[1], pos[2]);
      group.add(hl);
      headLightMeshes.push(hl);

      const tl = new THREE.Mesh(tailLightGeo, tailLightMat);
      tl.position.set(-pos[0], pos[1], pos[2]);
      group.add(tl);
      tailLightMeshes.push(tl);
    }

    group.userData = {
      type: 'vehicle',
      vehicleId: vehicleData.id
    };

    vehiclesGroup.add(group);
    vehicleMeshes.set(vehicleId, {
      group,
      body,
      wheels,
      headLightMeshes,
      tailLightMeshes
    });
  }

  function removeVehicle(vehicleId: string) {
    const mesh = vehicleMeshes.get(vehicleId);
    if (mesh) {
      vehiclesGroup.remove(mesh.group);
      vehicleMeshes.delete(vehicleId);
    }
  }

  function updateVehiclePosition(vehicleId: string, isNight: boolean) {
    const vehicleData = store.vehicles.find(v => v.id === vehicleId);
    if (!vehicleData) return;

    const curve = curves.get(vehicleData.pathId);
    if (!curve) return;

    const mesh = vehicleMeshes.get(vehicleId);
    if (!mesh) {
      createVehicle(vehicleId);
      return;
    }

    const laneOffset = (vehicleData.lane - vehicleData.lanes / 2 + 0.5) / (vehicleData.lanes / 2);
    const { position, tangent } = getPointAtProgress(
      curve,
      vehicleData.progress,
      laneOffset,
      vehicleData.roadWidth
    );

    mesh.group.position.copy(position);

    const angle = Math.atan2(tangent.x, tangent.z);
    mesh.group.rotation.y = angle;

    const wheelRotation = vehicleData.progress * 20;
    for (const wheel of mesh.wheels) {
      wheel.rotation.x = wheelRotation;
    }

    const headIntensity = isNight ? 1 : 0.1;
    const tailIntensity = isNight ? 0.8 : 0.2;
    for (const hl of mesh.headLightMeshes) {
      (hl.material as THREE.MeshStandardMaterial).emissiveIntensity = headIntensity;
    }
    for (const tl of mesh.tailLightMeshes) {
      (tl.material as THREE.MeshStandardMaterial).emissiveIntensity = tailIntensity;
    }

    const bodyMat = mesh.body.material as THREE.MeshStandardMaterial;
    if (store.state.selectedVehicleId === vehicleId) {
      bodyMat.emissive.set(0x00ff00);
      bodyMat.emissiveIntensity = 0.3;
    } else {
      bodyMat.emissive.set(0x000000);
      bodyMat.emissiveIntensity = 0;
    }
  }

  function selectRandomVehicle() {
    const vehicleIds = Array.from(vehicleMeshes.keys());
    if (vehicleIds.length > 0) {
      const randomId = vehicleIds[Math.floor(Math.random() * vehicleIds.length)];
      store.selectVehicle(randomId);
    }
  }

  function getSelectedVehiclePosition(): THREE.Vector3 {
    const selectedId = store.state.selectedVehicleId;
    if (selectedId) {
      const mesh = vehicleMeshes.get(selectedId);
      if (mesh) {
        return mesh.group.position.clone();
      }
    }
    return new THREE.Vector3(0, 2, 0);
  }

  function updateTrafficDensity(density: number) {
    store.setTrafficDensity(density);
  }

  let lastUpdate = 0;
  const updateInterval = 1 / 30;

  function updateVehicles(deltaTime: number, isNight: boolean, roadStatus: string) {
    lastUpdate += deltaTime;

    if (lastUpdate < updateInterval) return;
    lastUpdate = 0;

    const speedMultiplier = roadStatus === 'congested' ? 0.3 : roadStatus === 'construction' ? 0.5 : 1;

    for (const vehicle of store.vehicles) {
      const baseSpeed = vehicle.speed * 0.0003 * speedMultiplier;
      vehicle.progress += baseSpeed;

      if (vehicle.progress >= 1) {
        vehicle.progress = 0;
      }

      updateVehiclePosition(vehicle.id, isNight);
    }

    for (const [vehicleId] of vehicleMeshes) {
      const exists = store.vehicles.some(v => v.id === vehicleId);
      if (!exists) {
        removeVehicle(vehicleId);
      }
    }
  }

  function dispose() {
    for (const mesh of vehicleMeshes.values()) {
      vehiclesGroup.remove(mesh.group);
    }
    vehicleMeshes.clear();

    for (const geo of Object.values(carBodyGeos)) {
      geo.dispose();
    }
    carWheelGeo.dispose();
    headLightGeo.dispose();
    tailLightGeo.dispose();

    for (const mat of vehicleMaterials) {
      mat.dispose();
    }
    wheelMaterial.dispose();
    headLightMat.dispose();
    tailLightMat.dispose();
  }

  return {
    updateVehicles,
    updateTrafficDensity,
    selectRandomVehicle,
    getSelectedVehiclePosition,
    dispose
  };
}
