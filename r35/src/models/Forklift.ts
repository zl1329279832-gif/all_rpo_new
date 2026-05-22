import * as THREE from 'three';
import type { ForkliftData } from '@/types';
import { COLORS } from '@/config';
import { getStatusColor } from '@/utils';

export class ForkliftBuilder {
  static createForklift(data: ForkliftData): THREE.Group {
    const forkliftGroup = new THREE.Group();
    forkliftGroup.name = `forklift_${data.id}`;
    forkliftGroup.userData = {
      type: 'forklift',
      id: data.id,
      data: data,
    };

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6b35,
      roughness: 0.4,
      metalness: 0.6,
    });

    const darkMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.2,
    });

    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x87ceeb,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.5,
    });

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 1.2, 3.5),
      bodyMaterial
    );
    body.position.y = 0.8;
    body.castShadow = true;
    body.receiveShadow = true;
    forkliftGroup.add(body);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 1.5, 1.8),
      glassMaterial
    );
    cabin.position.set(0, 2.1, -0.5);
    cabin.castShadow = true;
    forkliftGroup.add(cabin);

    const cabinFrame = new THREE.EdgesGeometry(new THREE.BoxGeometry(2.2, 1.5, 1.8));
    const cabinFrameLines = new THREE.LineSegments(
      cabinFrame,
      new THREE.LineBasicMaterial({ color: 0x333333 })
    );
    cabinFrameLines.position.copy(cabin.position);
    forkliftGroup.add(cabinFrameLines);

    const wheelRadius = 0.4;
    const wheelThickness = 0.25;
    const wheelPositions = [
      { x: -1, z: 1.2 },
      { x: 1, z: 1.2 },
      { x: -1, z: -1.2 },
      { x: 1, z: -1.2 },
    ];

    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelThickness, 16),
        darkMaterial
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, wheelRadius, pos.z);
      wheel.castShadow = true;
      forkliftGroup.add(wheel);
    });

    const mast = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 3, 0.3),
      darkMaterial
    );
    mast.position.set(0, 1.5, 2);
    mast.castShadow = true;
    forkliftGroup.add(mast);

    const fork1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.1, 1.5),
      darkMaterial
    );
    fork1.position.set(-0.6, 0.2, 2.5);
    fork1.castShadow = true;
    forkliftGroup.add(fork1);

    const fork2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.1, 1.5),
      darkMaterial
    );
    fork2.position.set(0.6, 0.2, 2.5);
    fork2.castShadow = true;
    forkliftGroup.add(fork2);

    const statusColor = getStatusColor(data.status);
    const indicatorGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const indicatorMaterial = new THREE.MeshStandardMaterial({
      color: statusColor,
      emissive: statusColor,
      emissiveIntensity: data.status !== 'idle' ? 0.8 : 0.3,
    });
    const statusIndicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    statusIndicator.position.set(0, 3.2, 0);
    statusIndicator.name = 'status_indicator';
    forkliftGroup.add(statusIndicator);

    if (data.status === 'working') {
      const headlightMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffaa,
        emissive: 0xffffaa,
        emissiveIntensity: 1,
      });
      const headlight1 = new THREE.Mesh(
        new THREE.CircleGeometry(0.15, 16),
        headlightMaterial
      );
      headlight1.position.set(-0.8, 0.8, 1.76);
      headlight1.rotation.y = Math.PI;
      forkliftGroup.add(headlight1);

      const headlight2 = new THREE.Mesh(
        new THREE.CircleGeometry(0.15, 16),
        headlightMaterial
      );
      headlight2.position.set(0.8, 0.8, 1.76);
      headlight2.rotation.y = Math.PI;
      forkliftGroup.add(headlight2);

      const spotlight1 = new THREE.SpotLight(0xffffaa, 2, 20, Math.PI / 6, 0.5);
      spotlight1.position.set(-0.8, 0.8, 1.8);
      spotlight1.target.position.set(-0.8, 0, 15);
      forkliftGroup.add(spotlight1);
      forkliftGroup.add(spotlight1.target);

      const spotlight2 = new THREE.SpotLight(0xffffaa, 2, 20, Math.PI / 6, 0.5);
      spotlight2.position.set(0.8, 0.8, 1.8);
      spotlight2.target.position.set(0.8, 0, 15);
      forkliftGroup.add(spotlight2);
      forkliftGroup.add(spotlight2.target);
    }

    if (data.status === 'error') {
      const alarmLight = new THREE.PointLight(COLORS.danger, 3, 10);
      alarmLight.position.set(0, 3.5, 0);
      alarmLight.name = 'alarm_light';
      forkliftGroup.add(alarmLight);
    }

    forkliftGroup.position.set(data.position.x, data.position.y, data.position.z);
    forkliftGroup.rotation.y = data.rotation;

    return forkliftGroup;
  }

  static updateForklift(forkliftGroup: THREE.Group, data: ForkliftData): void {
    forkliftGroup.userData.data = data;

    forkliftGroup.position.set(data.position.x, data.position.y, data.position.z);
    forkliftGroup.rotation.y = data.rotation;

    const statusIndicator = forkliftGroup.getObjectByName('status_indicator') as THREE.Mesh;
    if (statusIndicator) {
      const material = statusIndicator.material as THREE.MeshStandardMaterial;
      const statusColor = new THREE.Color(getStatusColor(data.status));
      material.color.copy(statusColor);
      material.emissive.copy(statusColor);
      material.emissiveIntensity = data.status !== 'idle' ? 0.8 : 0.3;
    }

    if (data.status === 'error') {
      const alarmLight = forkliftGroup.getObjectByName('alarm_light') as THREE.PointLight;
      if (alarmLight) {
        const pulse = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
        alarmLight.intensity = 1 + pulse * 3;
      }
    }
  }

  static createTrackLine(points: Array<{ x: number; y: number; z: number }>): THREE.Line {
    const geometry = new THREE.BufferGeometry().setFromPoints(
      points.map(p => new THREE.Vector3(p.x, p.y + 0.1, p.z))
    );
    const material = new THREE.LineDashedMaterial({
      color: COLORS.primary,
      dashSize: 1,
      gapSize: 0.5,
      transparent: true,
      opacity: 0.8,
    });
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    line.name = 'forklift_track';
    return line;
  }

  static createFlowPath(start: THREE.Vector3, end: THREE.Vector3): THREE.Group {
    const pathGroup = new THREE.Group();
    pathGroup.name = 'flow_path';

    const points: THREE.Vector3[] = [];
    const segments = 20;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      points.push(new THREE.Vector3(
        start.x + (end.x - start.x) * t,
        0.2,
        start.z + (end.z - start.z) * t
      ));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.MeshBasicMaterial({
      color: COLORS.primary,
      transparent: true,
      opacity: 0.6,
    });

    const line = new THREE.Line(geometry, material);
    pathGroup.add(line);

    return pathGroup;
  }
}
