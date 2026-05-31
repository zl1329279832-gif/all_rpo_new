import * as THREE from 'three';
import type { Vehicle } from '@/types';
import { useSceneStore } from '@/store/sceneStore';
import { vehiclePaths } from '@/data/trafficData';
import { getRandomVehicleColor } from '@/utils/materialPresets';
import { getPointAtProgress } from '@/utils/curveUtils';

interface VehicleMesh {
  id: string;
  group: THREE.Group;
  body: THREE.Mesh;
  wheels: THREE.Mesh[];
  headLights: THREE.SpotLight[];
}

type ThreeCurve = any;

export function useTrafficSystem(scene: THREE.Scene, curves: Map<string, ThreeCurve>) {
  const store = useSceneStore();
  const vehicleMeshes = new Map<string, VehicleMesh>();
  const vehiclesGroup = new THREE.Group();
  vehiclesGroup.name = 'vehicles';
  scene.add(vehiclesGroup);

  function createVehicleMesh(type: 'car' | 'suv' | 'truck', color: number): VehicleMesh {
    const group = new THREE.Group();
    const wheelRadius = type === 'truck' ? 0.35 : 0.3;

    let bodyWidth: number, bodyHeight: number, bodyLength: number;

    if (type === 'car') {
      bodyWidth = 1.8;
      bodyHeight = 0.6;
      bodyLength = 4;
    } else if (type === 'suv') {
      bodyWidth = 2;
      bodyHeight = 0.8;
      bodyLength = 4.5;
    } else {
      bodyWidth = 2.2;
      bodyHeight = 1.5;
      bodyLength = 6;
    }

    const bodyGeo = new THREE.BoxGeometry(bodyLength, bodyHeight, bodyWidth);
    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.2,
      roughness: 0.6
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = bodyHeight / 2 + wheelRadius;
    body.castShadow = true;
    group.add(body);

    const roofHeight = type === 'car' ? 0.5 : type === 'suv' ? 0.6 : 0.8;
    const roofLength = type === 'truck' ? bodyLength * 0.4 : bodyLength * 0.6;
    const roofGeo = new THREE.BoxGeometry(roofLength, roofHeight, bodyWidth * 0.9);
    const roofMat = new THREE.MeshStandardMaterial({
      color: color * 0.9,
      metalness: 0.3,
      roughness: 0.5
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = bodyHeight + roofHeight / 2 + wheelRadius;
    roof.position.x = type === 'truck' ? -bodyLength * 0.3 : 0;
    roof.castShadow = true;
    group.add(roof);

    const wheels: THREE.Mesh[] = [];
    const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.25, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });

    const wheelPositions = type === 'truck'
      ? [[-1.8, -1], [1.8, -1], [-1.8, 1], [1.8, 1]]
      : [[-1.2, -0.8], [1.2, -0.8], [-1.2, 0.8], [1.2, 0.8]];

    for (const [x, z] of wheelPositions) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(x, wheelRadius, z);
      wheel.castShadow = true;
      group.add(wheel);
      wheels.push(wheel);
    }

    const headLights: THREE.SpotLight[] = [];
    const lightGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const lightMat = new THREE.MeshStandardMaterial({
      color: 0xffffaa,
      emissive: 0xffff88,
      emissiveIntensity: 0.3
    });

    for (const z of [-bodyWidth / 3, bodyWidth / 3]) {
      const lightMesh = new THREE.Mesh(lightGeo, lightMat);
      lightMesh.position.set(bodyLength / 2 - 0.1, wheelRadius + bodyHeight * 0.3, z);
      group.add(lightMesh);

      const spotLight = new THREE.SpotLight(0xffffcc, 0, 30, Math.PI / 6, 0.5, 1);
      spotLight.position.set(bodyLength / 2, wheelRadius + bodyHeight * 0.3, z);
      spotLight.target.position.set(bodyLength / 2 + 10, wheelRadius, z);
      group.add(spotLight);
      group.add(spotLight.target);
      headLights.push(spotLight);
    }

    const tailLightMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.3
    });

    for (const z of [-bodyWidth / 3, bodyWidth / 3]) {
      const tailLight = new THREE.Mesh(lightGeo, tailLightMat);
      tailLight.position.set(-bodyLength / 2 + 0.1, wheelRadius + bodyHeight * 0.3, z);
      group.add(tailLight);
    }

    return { id: '', group, body, wheels, headLights };
  }

  function spawnVehicle(pathId: string): Vehicle | null {
    const curve = curves.get(pathId);
    if (!curve) return null;

    const types: ('car' | 'suv' | 'truck')[] = ['car', 'car', 'car', 'suv', 'suv', 'truck'];
    const type = types[Math.floor(Math.random() * types.length)];
    const color = getRandomVehicleColor();

    const vehicle: Vehicle = {
      id: `vehicle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      pathId,
      progress: Math.random() * 0.1,
      speed: 0.0003 + Math.random() * 0.0005,
      color,
      lane: Math.floor(Math.random() * 3) - 1
    };

    const mesh = createVehicleMesh(type, color);
    mesh.id = vehicle.id;
    mesh.group.userData = { type: 'vehicle', vehicleId: vehicle.id };

    vehicleMeshes.set(vehicle.id, mesh);
    vehiclesGroup.add(mesh.group);
    store.addVehicle(vehicle);

    return vehicle;
  }

  function removeVehicle(vehicleId: string) {
    const mesh = vehicleMeshes.get(vehicleId);
    if (mesh) {
      mesh.group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      vehiclesGroup.remove(mesh.group);
      vehicleMeshes.delete(vehicleId);
    }
    store.removeVehicle(vehicleId);
  }

  function updateVehicles(deltaTime: number, isNight: boolean, roadStatus: string) {
    const speedMultiplier = roadStatus === 'congested' ? 0.3 : roadStatus === 'construction' ? 0.5 : 1;

    const toRemove: string[] = [];

    for (const vehicle of store.vehicles) {
      const mesh = vehicleMeshes.get(vehicle.id);
      const curve = curves.get(vehicle.pathId);

      if (!mesh || !curve) continue;

      vehicle.progress += vehicle.speed * deltaTime * 60 * speedMultiplier;

      if (vehicle.progress >= 1) {
        toRemove.push(vehicle.id);
        continue;
      }

      const roadSegment = vehiclePaths.find(p => p === vehicle.pathId);
      const roadWidth = roadSegment?.includes('main') ? 20 : 10;

      const { position, tangent } = getPointAtProgress(curve, vehicle.progress, vehicle.lane, roadWidth);

      mesh.group.position.copy(position);
      mesh.group.position.y += 0.1;

      const angle = Math.atan2(tangent.x, tangent.z);
      mesh.group.rotation.y = angle;

      for (const wheel of mesh.wheels) {
        wheel.rotation.x -= vehicle.speed * deltaTime * 300;
      }

      for (const light of mesh.headLights) {
        light.intensity = isNight ? 2 : 0;
      }

      store.updateVehicleProgress(vehicle.id, vehicle.progress);
    }

    for (const id of toRemove) {
      removeVehicle(id);
    }
  }

  function updateTrafficDensity(density: number) {
    const targetCount = Math.floor(density * 60);
    const currentCount = store.vehicles.length;

    if (currentCount < targetCount) {
      const toSpawn = Math.min(targetCount - currentCount, 5);
      for (let i = 0; i < toSpawn; i++) {
        const pathId = vehiclePaths[Math.floor(Math.random() * vehiclePaths.length)];
        setTimeout(() => spawnVehicle(pathId), i * 200);
      }
    } else if (currentCount > targetCount) {
      const toRemove = currentCount - targetCount;
      const vehicles = [...store.vehicles].sort((a, b) => b.progress - a.progress);
      for (let i = 0; i < toRemove && i < vehicles.length; i++) {
        if (vehicles[i].progress > 0.5) {
          removeVehicle(vehicles[i].id);
        }
      }
    }

    const avgSpeed = store.vehicles.length > 0
      ? store.vehicles.reduce((sum, v) => sum + v.speed, 0) / store.vehicles.length * 10000
      : 0;

    store.updateStats({
      totalVehicles: store.vehicles.length,
      averageSpeed: Math.round(avgSpeed * 3.6),
      congestionLevel: density > 0.7 ? 3 : density > 0.4 ? 2 : 1
    });
  }

  function getSelectedVehiclePosition(): THREE.Vector3 | null {
    const selectedId = store.state.selectedVehicleId;
    if (!selectedId) return null;

    const vehicle = store.vehicles.find(v => v.id === selectedId);
    const mesh = vehicleMeshes.get(selectedId);

    if (!vehicle || !mesh) {
      const available = store.vehicles[0];
      if (available) {
        store.selectVehicle(available.id);
        const availableMesh = vehicleMeshes.get(available.id);
        return availableMesh ? availableMesh.group.position.clone() : null;
      }
      return null;
    }

    return mesh.group.position.clone();
  }

  function selectRandomVehicle() {
    if (store.vehicles.length > 0) {
      const randomIndex = Math.floor(Math.random() * store.vehicles.length);
      store.selectVehicle(store.vehicles[randomIndex].id);
    }
  }

  function dispose() {
    for (const vehicle of store.vehicles) {
      const mesh = vehicleMeshes.get(vehicle.id);
      if (mesh) {
        mesh.group.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            if (obj.material instanceof THREE.Material) {
              obj.material.dispose();
            }
          }
        });
      }
    }
    vehicleMeshes.clear();
    store.vehicles.length = 0;
  }

  return {
    spawnVehicle,
    removeVehicle,
    updateVehicles,
    updateTrafficDensity,
    getSelectedVehiclePosition,
    selectRandomVehicle,
    dispose
  };
}
