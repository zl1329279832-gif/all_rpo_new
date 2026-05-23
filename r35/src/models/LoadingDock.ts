import * as THREE from 'three';
import type { LoadingDockData, SensorData, ChannelData } from '@/types';
import { COLORS } from '@/config';
import { getStatusColor } from '@/utils';

const LOW_POLY_SEGMENTS = 8;

const sharedMaterials = {
  base: null as THREE.MeshStandardMaterial | null,
  doorFrame: null as THREE.MeshStandardMaterial | null,
  wheel: null as THREE.MeshStandardMaterial | null,
  trailer: null as THREE.MeshStandardMaterial | null,
  sensorBase: null as THREE.MeshStandardMaterial | null,
  bumper: null as THREE.MeshStandardMaterial | null,
};

function getSharedMaterial(key: keyof typeof sharedMaterials, options: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
  if (!sharedMaterials[key]) {
    sharedMaterials[key] = new THREE.MeshStandardMaterial({
      roughness: 0.7,
      metalness: 0.3,
      ...options,
    });
  }
  return sharedMaterials[key]!;
}

export class LoadingDockBuilder {
  static createDock(data: LoadingDockData): THREE.Group {
    const dockGroup = new THREE.Group();
    dockGroup.name = `dock_${data.id}`;
    dockGroup.userData = {
      type: 'dock',
      id: data.id,
      data: data,
    };

    const baseMaterial = getSharedMaterial('base', { color: 0x444444, roughness: 0.8, metalness: 0.2 });
    const doorFrameMaterial = getSharedMaterial('doorFrame', { color: 0x666666, roughness: 0.5, metalness: 0.5 });

    const statusColor = getStatusColor(data.status);
    const indicatorMaterial = new THREE.MeshStandardMaterial({
      color: statusColor,
      emissive: statusColor,
      emissiveIntensity: 0.5,
    });

    const baseGeometry = new THREE.BoxGeometry(10, 0.3, 8, 1, 1, 1);
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.15;
    base.receiveShadow = true;
    base.castShadow = false;
    base.frustumCulled = true;
    dockGroup.add(base);

    const backWallGeometry = new THREE.BoxGeometry(10, 5, 0.3, 1, 1, 1);
    const backWall = new THREE.Mesh(backWallGeometry, baseMaterial);
    backWall.position.set(0, 2.5, -4);
    backWall.castShadow = false;
    backWall.receiveShadow = true;
    backWall.frustumCulled = true;
    dockGroup.add(backWall);

    const doorOpening = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 4, 0.1, 1, 1, 1),
      new THREE.MeshStandardMaterial({
        color: 0x111111,
        transparent: true,
        opacity: 0.9,
      })
    );
    doorOpening.position.set(0, 2, -3.8);
    doorOpening.frustumCulled = true;
    dockGroup.add(doorOpening);

    const doorFrameGeometry = new THREE.BoxGeometry(0.3, 4.2, 0.3, 1, 1, 1);
    const doorFrameLeft = new THREE.Mesh(doorFrameGeometry, doorFrameMaterial);
    doorFrameLeft.position.set(-2.4, 2.1, -3.8);
    doorFrameLeft.frustumCulled = true;
    dockGroup.add(doorFrameLeft);

    const doorFrameRight = new THREE.Mesh(doorFrameGeometry, doorFrameMaterial);
    doorFrameRight.position.set(2.4, 2.1, -3.8);
    doorFrameRight.frustumCulled = true;
    dockGroup.add(doorFrameRight);

    const doorFrameTop = new THREE.Mesh(
      new THREE.BoxGeometry(5.1, 0.3, 0.3, 1, 1, 1),
      doorFrameMaterial
    );
    doorFrameTop.position.set(0, 4.15, -3.8);
    doorFrameTop.frustumCulled = true;
    dockGroup.add(doorFrameTop);

    const lightStripGeometry = new THREE.BoxGeometry(8, 0.2, 0.1, 1, 1, 1);
    const lightStrip = new THREE.Mesh(lightStripGeometry, indicatorMaterial);
    lightStrip.position.set(0, 4.5, -3.7);
    lightStrip.name = 'status_strip';
    lightStrip.frustumCulled = true;
    dockGroup.add(lightStrip);

    const bumperMaterial = getSharedMaterial('bumper', { color: 0x222222, roughness: 0.9 });
    const bumper = new THREE.Mesh(
      new THREE.BoxGeometry(5, 0.5, 0.5, 1, 1, 1),
      bumperMaterial
    );
    bumper.position.set(0, 0.5, 3.5);
    bumper.frustumCulled = true;
    dockGroup.add(bumper);

    if (data.status === 'occupied' && data.currentVehicle) {
      const truck = this.createTruck();
      truck.position.z = 6;
      dockGroup.add(truck);
    }

    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(10, 5, 8));
    const edgeLines = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: statusColor, transparent: true, opacity: 0.7 })
    );
    edgeLines.position.y = 2.5;
    edgeLines.name = 'dock_edges';
    edgeLines.frustumCulled = true;
    dockGroup.add(edgeLines);

    dockGroup.position.set(data.position.x, data.position.y, data.position.z);
    dockGroup.frustumCulled = true;

    return dockGroup;
  }

  private static createTruck(): THREE.Group {
    const truckGroup = new THREE.Group();

    const trailerMaterial = getSharedMaterial('trailer', { color: 0xcccccc, roughness: 0.7, metalness: 0.3 });
    const wheelMaterial = getSharedMaterial('wheel', { color: 0x222222 });

    const trailerGeometry = new THREE.BoxGeometry(8, 4, 12, 1, 1, 1);
    const trailer = new THREE.Mesh(trailerGeometry, trailerMaterial);
    trailer.position.y = 2.2;
    trailer.castShadow = true;
    trailer.receiveShadow = false;
    trailer.frustumCulled = true;
    truckGroup.add(trailer);

    const wheelRadius = 0.5;
    const wheelThickness = 0.3;
    const wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelThickness, LOW_POLY_SEGMENTS);
    const wheelPositions = [
      { x: -3, z: -4 }, { x: 3, z: -4 },
      { x: -3, z: 4 }, { x: 3, z: 4 },
    ];

    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, wheelRadius, pos.z);
      wheel.castShadow = false;
      wheel.frustumCulled = true;
      truckGroup.add(wheel);
    });

    truckGroup.frustumCulled = true;
    return truckGroup;
  }

  static updateDock(dockGroup: THREE.Group, data: LoadingDockData): void {
    dockGroup.userData.data = data;

    const statusColor = new THREE.Color(getStatusColor(data.status));
    const statusStrip = dockGroup.getObjectByName('status_strip') as THREE.Mesh;
    if (statusStrip) {
      const material = statusStrip.material as THREE.MeshStandardMaterial;
      material.color.copy(statusColor);
      material.emissive.copy(statusColor);
    }

    const edges = dockGroup.getObjectByName('dock_edges') as THREE.LineSegments;
    if (edges) {
      (edges.material as THREE.LineBasicMaterial).color.copy(statusColor);
    }
  }
}

export class SensorBuilder {
  private static baseGeometry: THREE.CylinderGeometry | null = null;
  private static sensorGeometry: THREE.SphereGeometry | null = null;
  private static ringGeometry: THREE.RingGeometry | null = null;
  private static crossGeometry: THREE.BoxGeometry | null = null;
  private static domeGeometry: THREE.SphereGeometry | null = null;

  static getBaseGeometry(): THREE.CylinderGeometry {
    if (!SensorBuilder.baseGeometry) {
      SensorBuilder.baseGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.15, LOW_POLY_SEGMENTS);
    }
    return SensorBuilder.baseGeometry;
  }

  static getSensorGeometry(): THREE.SphereGeometry {
    if (!SensorBuilder.sensorGeometry) {
      SensorBuilder.sensorGeometry = new THREE.SphereGeometry(0.15, LOW_POLY_SEGMENTS, LOW_POLY_SEGMENTS);
    }
    return SensorBuilder.sensorGeometry;
  }

  static getRingGeometry(): THREE.RingGeometry {
    if (!SensorBuilder.ringGeometry) {
      SensorBuilder.ringGeometry = new THREE.RingGeometry(0.25, 0.35, LOW_POLY_SEGMENTS * 2);
    }
    return SensorBuilder.ringGeometry;
  }

  static getCrossGeometry(): THREE.BoxGeometry {
    if (!SensorBuilder.crossGeometry) {
      SensorBuilder.crossGeometry = new THREE.BoxGeometry(0.4, 0.05, 0.05, 1, 1, 1);
    }
    return SensorBuilder.crossGeometry;
  }

  static getDomeGeometry(): THREE.SphereGeometry {
    if (!SensorBuilder.domeGeometry) {
      SensorBuilder.domeGeometry = new THREE.SphereGeometry(0.2, LOW_POLY_SEGMENTS, LOW_POLY_SEGMENTS, 0, Math.PI * 2, 0, Math.PI / 2);
    }
    return SensorBuilder.domeGeometry;
  }

  static createSensor(data: SensorData): THREE.Group {
    const sensorGroup = new THREE.Group();
    sensorGroup.name = `sensor_${data.id}`;
    sensorGroup.userData = {
      type: 'sensor',
      id: data.id,
      data: data,
    };

    const statusColor = getStatusColor(data.status);
    const baseColor = data.type === 'temperature' ? COLORS.danger :
                      data.type === 'humidity' ? COLORS.primary :
                      data.type === 'smoke' ? COLORS.warning :
                      data.type === 'door' ? COLORS.purple : COLORS.info;

    const baseMaterial = getSharedMaterial('sensorBase', { color: 0x444444, roughness: 0.5, metalness: 0.5 });
    const base = new THREE.Mesh(SensorBuilder.getBaseGeometry(), baseMaterial);
    base.castShadow = false;
    base.receiveShadow = false;
    base.frustumCulled = true;
    sensorGroup.add(base);

    const sensorMaterial = new THREE.MeshStandardMaterial({
      color: baseColor,
      emissive: baseColor,
      emissiveIntensity: data.status === 'normal' ? 0.3 : 0.8,
      transparent: true,
      opacity: 0.9,
    });
    const sensor = new THREE.Mesh(SensorBuilder.getSensorGeometry(), sensorMaterial);
    sensor.position.y = 0.2;
    sensor.name = 'sensor_body';
    sensor.frustumCulled = true;
    sensorGroup.add(sensor);

    if (data.status !== 'normal' && data.status !== 'offline') {
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: statusColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const ring = new THREE.Mesh(SensorBuilder.getRingGeometry(), ringMaterial);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.08;
      ring.name = 'status_ring';
      ring.frustumCulled = true;
      sensorGroup.add(ring);
    }

    if (data.status === 'offline') {
      const crossMaterial = new THREE.MeshBasicMaterial({ color: 0x666666 });
      const cross1 = new THREE.Mesh(SensorBuilder.getCrossGeometry(), crossMaterial);
      cross1.rotation.z = Math.PI / 4;
      cross1.position.y = 0.2;
      cross1.frustumCulled = true;
      sensorGroup.add(cross1);

      const cross2 = new THREE.Mesh(SensorBuilder.getCrossGeometry(), crossMaterial);
      cross2.rotation.z = -Math.PI / 4;
      cross2.position.y = 0.2;
      cross2.frustumCulled = true;
      sensorGroup.add(cross2);
    }

    if (data.type === 'smoke') {
      const domeMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
      });
      const dome = new THREE.Mesh(SensorBuilder.getDomeGeometry(), domeMaterial);
      dome.position.y = 0.2;
      dome.frustumCulled = true;
      sensorGroup.add(dome);
    }

    sensorGroup.position.set(data.position.x, data.position.y, data.position.z);
    sensorGroup.frustumCulled = true;

    return sensorGroup;
  }

  static createSensorsInstanced(sensorsData: SensorData[]): THREE.InstancedMesh {
    const geometry = SensorBuilder.getSensorGeometry();
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
    });

    const instancedMesh = new THREE.InstancedMesh(geometry, material, sensorsData.length);
    instancedMesh.name = 'sensors_instanced';
    instancedMesh.castShadow = false;
    instancedMesh.receiveShadow = false;
    instancedMesh.frustumCulled = true;

    const dummy = new THREE.Object3D();
    const colors = new Float32Array(sensorsData.length * 3);

    sensorsData.forEach((data, index) => {
      const baseColor = data.type === 'temperature' ? COLORS.danger :
                        data.type === 'humidity' ? COLORS.primary :
                        data.type === 'smoke' ? COLORS.warning :
                        data.type === 'door' ? COLORS.purple : COLORS.info;

      dummy.position.set(data.position.x, data.position.y + 0.2, data.position.z);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(index, dummy.matrix);

      const color = new THREE.Color(baseColor);
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    });

    instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);

    return instancedMesh;
  }

  static updateSensor(sensorGroup: THREE.Group, data: SensorData): void {
    sensorGroup.userData.data = data;

    const sensorBody = sensorGroup.getObjectByName('sensor_body') as THREE.Mesh;
    if (sensorBody) {
      const material = sensorBody.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = data.status === 'normal' ? 0.3 : 0.8;
    }

    const statusRing = sensorGroup.getObjectByName('status_ring');
    if (data.status !== 'normal' && data.status !== 'offline') {
      if (statusRing) {
        const pulse = Math.sin(Date.now() * 0.005) * 0.2 + 0.8;
        statusRing.scale.setScalar(pulse);
      }
    }
  }

  static dispose(): void {
    if (SensorBuilder.baseGeometry) {
      SensorBuilder.baseGeometry.dispose();
      SensorBuilder.baseGeometry = null;
    }
    if (SensorBuilder.sensorGeometry) {
      SensorBuilder.sensorGeometry.dispose();
      SensorBuilder.sensorGeometry = null;
    }
    if (SensorBuilder.ringGeometry) {
      SensorBuilder.ringGeometry.dispose();
      SensorBuilder.ringGeometry = null;
    }
    if (SensorBuilder.crossGeometry) {
      SensorBuilder.crossGeometry.dispose();
      SensorBuilder.crossGeometry = null;
    }
    if (SensorBuilder.domeGeometry) {
      SensorBuilder.domeGeometry.dispose();
      SensorBuilder.domeGeometry = null;
    }
  }
}

export class ChannelBuilder {
  static createChannel(data: ChannelData): THREE.Group {
    const channelGroup = new THREE.Group();
    channelGroup.name = `channel_${data.id}`;
    channelGroup.userData = {
      type: 'channel',
      id: data.id,
      data: data,
    };

    const start = new THREE.Vector3(data.start.x, data.start.y, data.start.z);
    const end = new THREE.Vector3(data.end.x, data.end.y, data.end.z);
    const distance = start.distanceTo(end);
    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

    const congestionColor = data.congestionLevel >= 90 ? COLORS.danger :
                            data.congestionLevel >= 70 ? COLORS.warning : COLORS.success;

    const pathGeometry = new THREE.PlaneGeometry(3, distance, 1, 1);
    const pathMaterial = new THREE.MeshStandardMaterial({
      color: congestionColor,
      transparent: true,
      opacity: 0.3 + data.congestionLevel / 200,
      side: THREE.DoubleSide,
    });
    const path = new THREE.Mesh(pathGeometry, pathMaterial);
    path.rotation.x = -Math.PI / 2;
    path.position.copy(midPoint);
    path.position.y = 0.02;
    path.lookAt(end);
    path.rotateY(Math.PI / 2);
    path.name = 'channel_path';
    path.frustumCulled = true;
    channelGroup.add(path);

    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(start.x, 0.05, start.z),
      new THREE.Vector3(end.x, 0.05, end.z),
    ]);
    const lineMaterial = new THREE.LineDashedMaterial({
      color: congestionColor,
      dashSize: 1,
      gapSize: 0.5,
      transparent: true,
      opacity: 0.8,
    });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    line.computeLineDistances();
    line.name = 'channel_line';
    line.frustumCulled = true;
    channelGroup.add(line);

    channelGroup.frustumCulled = true;

    return channelGroup;
  }

  static updateChannel(channelGroup: THREE.Group, data: ChannelData): void {
    channelGroup.userData.data = data;

    const congestionColor = new THREE.Color(
      data.congestionLevel >= 90 ? COLORS.danger :
      data.congestionLevel >= 70 ? COLORS.warning : COLORS.success
    );

    const path = channelGroup.getObjectByName('channel_path') as THREE.Mesh;
    if (path) {
      const material = path.material as THREE.MeshStandardMaterial;
      material.color.copy(congestionColor);
      material.opacity = 0.3 + data.congestionLevel / 200;
    }

    const line = channelGroup.getObjectByName('channel_line') as THREE.Line;
    if (line) {
      (line.material as THREE.LineDashedMaterial).color.copy(congestionColor);
    }
  }
}
