import * as THREE from 'three';
import type { LoadingDockData, SensorData, ChannelData } from '@/types';
import { COLORS } from '@/config';
import { getStatusColor } from '@/utils';

export class LoadingDockBuilder {
  static createDock(data: LoadingDockData): THREE.Group {
    const dockGroup = new THREE.Group();
    dockGroup.name = `dock_${data.id}`;
    dockGroup.userData = {
      type: 'dock',
      id: data.id,
      data: data,
    };

    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.8,
      metalness: 0.2,
    });

    const statusColor = getStatusColor(data.status);
    const indicatorMaterial = new THREE.MeshStandardMaterial({
      color: statusColor,
      emissive: statusColor,
      emissiveIntensity: 0.5,
    });

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(10, 0.3, 8),
      baseMaterial
    );
    base.position.y = 0.15;
    base.receiveShadow = true;
    dockGroup.add(base);

    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(10, 5, 0.3),
      baseMaterial
    );
    backWall.position.set(0, 2.5, -4);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    dockGroup.add(backWall);

    const doorOpening = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 4, 0.1),
      new THREE.MeshStandardMaterial({
        color: 0x111111,
        transparent: true,
        opacity: 0.9,
      })
    );
    doorOpening.position.set(0, 2, -3.8);
    dockGroup.add(doorOpening);

    const doorFrameMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.5,
      metalness: 0.5,
    });

    const doorFrameLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 4.2, 0.3),
      doorFrameMaterial
    );
    doorFrameLeft.position.set(-2.4, 2.1, -3.8);
    dockGroup.add(doorFrameLeft);

    const doorFrameRight = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 4.2, 0.3),
      doorFrameMaterial
    );
    doorFrameRight.position.set(2.4, 2.1, -3.8);
    dockGroup.add(doorFrameRight);

    const doorFrameTop = new THREE.Mesh(
      new THREE.BoxGeometry(5.1, 0.3, 0.3),
      doorFrameMaterial
    );
    doorFrameTop.position.set(0, 4.15, -3.8);
    dockGroup.add(doorFrameTop);

    const lightStrip = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.2, 0.1),
      indicatorMaterial
    );
    lightStrip.position.set(0, 4.5, -3.7);
    lightStrip.name = 'status_strip';
    dockGroup.add(lightStrip);

    const bumper = new THREE.Mesh(
      new THREE.BoxGeometry(5, 0.5, 0.5),
      new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.9,
      })
    );
    bumper.position.set(0, 0.5, 3.5);
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
    dockGroup.add(edgeLines);

    dockGroup.position.set(data.position.x, data.position.y, data.position.z);

    return dockGroup;
  }

  private static createTruck(): THREE.Group {
    const truckGroup = new THREE.Group();

    const trailerMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.7,
      metalness: 0.3,
    });

    const trailer = new THREE.Mesh(
      new THREE.BoxGeometry(8, 4, 12),
      trailerMaterial
    );
    trailer.position.y = 2.2;
    trailer.castShadow = true;
    truckGroup.add(trailer);

    const wheelRadius = 0.5;
    const wheelThickness = 0.3;
    const wheelPositions = [
      { x: -3, z: -4 }, { x: 3, z: -4 },
      { x: -3, z: 4 }, { x: 3, z: 4 },
    ];

    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelThickness, 16),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, wheelRadius, pos.z);
      truckGroup.add(wheel);
    });

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

    const baseGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.15, 16);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.5,
      metalness: 0.5,
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.castShadow = true;
    sensorGroup.add(base);

    const sensorGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const sensorMaterial = new THREE.MeshStandardMaterial({
      color: baseColor,
      emissive: baseColor,
      emissiveIntensity: data.status === 'normal' ? 0.3 : 0.8,
      transparent: true,
      opacity: 0.9,
    });
    const sensor = new THREE.Mesh(sensorGeometry, sensorMaterial);
    sensor.position.y = 0.2;
    sensor.name = 'sensor_body';
    sensorGroup.add(sensor);

    if (data.status !== 'normal' && data.status !== 'offline') {
      const ringGeometry = new THREE.RingGeometry(0.25, 0.35, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: statusColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.08;
      ring.name = 'status_ring';
      sensorGroup.add(ring);
    }

    if (data.status === 'offline') {
      const crossGeometry1 = new THREE.BoxGeometry(0.4, 0.05, 0.05);
      const crossMaterial = new THREE.MeshBasicMaterial({ color: 0x666666 });
      const cross1 = new THREE.Mesh(crossGeometry1, crossMaterial);
      cross1.rotation.z = Math.PI / 4;
      cross1.position.y = 0.2;
      sensorGroup.add(cross1);

      const cross2 = new THREE.Mesh(crossGeometry1, crossMaterial);
      cross2.rotation.z = -Math.PI / 4;
      cross2.position.y = 0.2;
      sensorGroup.add(cross2);
    }

    if (data.type === 'smoke') {
      const domeGeometry = new THREE.SphereGeometry(0.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const domeMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
      });
      const dome = new THREE.Mesh(domeGeometry, domeMaterial);
      dome.position.y = 0.2;
      sensorGroup.add(dome);
    }

    sensorGroup.position.set(data.position.x, data.position.y, data.position.z);

    return sensorGroup;
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
        (statusRing as THREE.Mesh).material = new THREE.MeshBasicMaterial({
          color: new THREE.Color(getStatusColor(data.status)),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
        });
      }
    } else if (statusRing) {
      sensorGroup.remove(statusRing);
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

    const pathGeometry = new THREE.PlaneGeometry(3, distance);
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
    channelGroup.add(line);

    const arrowHelper = new THREE.ArrowHelper(
      new THREE.Vector3().subVectors(end, start).normalize(),
      start.clone().setY(0.1),
      distance * 0.95,
      congestionColor,
      1,
      0.5
    );
    arrowHelper.name = 'channel_arrow';
    channelGroup.add(arrowHelper);

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

    const arrow = channelGroup.getObjectByName('channel_arrow') as THREE.ArrowHelper;
    if (arrow) {
      arrow.setColor(congestionColor);
    }
  }
}
