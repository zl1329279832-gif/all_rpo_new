import * as THREE from 'three';
import type { ForkliftData } from '@/types';
import { COLORS } from '@/config';
import { getStatusColor } from '@/utils';

const LOW_POLY_SEGMENTS = 8;

const sharedForkliftMaterials = {
  body: null as THREE.MeshStandardMaterial | null,
  dark: null as THREE.MeshStandardMaterial | null,
  glass: null as THREE.MeshStandardMaterial | null,
  headlight: null as THREE.MeshStandardMaterial | null,
};

function getForkliftMaterial(key: keyof typeof sharedForkliftMaterials, options: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
  if (!sharedForkliftMaterials[key]) {
    sharedForkliftMaterials[key] = new THREE.MeshStandardMaterial({
      roughness: 0.5,
      metalness: 0.5,
      ...options,
    });
  }
  return sharedForkliftMaterials[key]!;
}

const sharedGeometries = {
  body: null as THREE.BoxGeometry | null,
  cabin: null as THREE.BoxGeometry | null,
  wheel: null as THREE.CylinderGeometry | null,
  mast: null as THREE.BoxGeometry | null,
  fork: null as THREE.BoxGeometry | null,
  indicator: null as THREE.SphereGeometry | null,
  headlight: null as THREE.CircleGeometry | null,
};

function getForkliftGeometry(key: keyof typeof sharedGeometries): THREE.BufferGeometry {
  if (!sharedGeometries[key]) {
    switch (key) {
      case 'body':
        sharedGeometries.body = new THREE.BoxGeometry(2.5, 1.2, 3.5, 1, 1, 1);
        break;
      case 'cabin':
        sharedGeometries.cabin = new THREE.BoxGeometry(2.2, 1.5, 1.8, 1, 1, 1);
        break;
      case 'wheel':
        sharedGeometries.wheel = new THREE.CylinderGeometry(0.4, 0.4, 0.25, LOW_POLY_SEGMENTS);
        break;
      case 'mast':
        sharedGeometries.mast = new THREE.BoxGeometry(0.3, 3, 0.3, 1, 1, 1);
        break;
      case 'fork':
        sharedGeometries.fork = new THREE.BoxGeometry(0.15, 0.1, 1.5, 1, 1, 1);
        break;
      case 'indicator':
        sharedGeometries.indicator = new THREE.SphereGeometry(0.2, LOW_POLY_SEGMENTS, LOW_POLY_SEGMENTS);
        break;
      case 'headlight':
        sharedGeometries.headlight = new THREE.CircleGeometry(0.15, LOW_POLY_SEGMENTS);
        break;
    }
  }
  return sharedGeometries[key]!;
}

export class ForkliftBuilder {
  static createForklift(data: ForkliftData): THREE.Group {
    const forkliftGroup = new THREE.Group();
    forkliftGroup.name = `forklift_${data.id}`;
    forkliftGroup.userData = {
      type: 'forklift',
      id: data.id,
      data: data,
    };

    const bodyMaterial = getForkliftMaterial('body', { color: 0xff6b35, roughness: 0.4, metalness: 0.6 });
    const darkMaterial = getForkliftMaterial('dark', { color: 0x333333, roughness: 0.8, metalness: 0.2 });
    const glassMaterial = getForkliftMaterial('glass', { color: 0x87ceeb, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.5 });
    const headlightMaterial = getForkliftMaterial('headlight', { color: 0xffffaa, emissive: 0xffffaa, emissiveIntensity: 1 });

    const body = new THREE.Mesh(getForkliftGeometry('body'), bodyMaterial);
    body.position.y = 0.8;
    body.castShadow = true;
    body.receiveShadow = false;
    body.frustumCulled = true;
    forkliftGroup.add(body);

    const cabin = new THREE.Mesh(getForkliftGeometry('cabin'), glassMaterial);
    cabin.position.set(0, 2.1, -0.5);
    cabin.castShadow = false;
    cabin.frustumCulled = true;
    forkliftGroup.add(cabin);

    const wheelGeometry = getForkliftGeometry('wheel');
    const wheelPositions = [
      { x: -1, z: 1.2 },
      { x: 1, z: 1.2 },
      { x: -1, z: -1.2 },
      { x: 1, z: -1.2 },
    ];

    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, darkMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, 0.4, pos.z);
      wheel.castShadow = false;
      wheel.frustumCulled = true;
      forkliftGroup.add(wheel);
    });

    const mast = new THREE.Mesh(getForkliftGeometry('mast'), darkMaterial);
    mast.position.set(0, 1.5, 2);
    mast.castShadow = false;
    mast.frustumCulled = true;
    forkliftGroup.add(mast);

    const forkGeometry = getForkliftGeometry('fork');
    const fork1 = new THREE.Mesh(forkGeometry, darkMaterial);
    fork1.position.set(-0.6, 0.2, 2.5);
    fork1.castShadow = false;
    fork1.frustumCulled = true;
    forkliftGroup.add(fork1);

    const fork2 = new THREE.Mesh(forkGeometry, darkMaterial);
    fork2.position.set(0.6, 0.2, 2.5);
    fork2.castShadow = false;
    fork2.frustumCulled = true;
    forkliftGroup.add(fork2);

    const statusColor = getStatusColor(data.status);
    const indicatorMaterial = new THREE.MeshStandardMaterial({
      color: statusColor,
      emissive: statusColor,
      emissiveIntensity: data.status !== 'idle' ? 0.8 : 0.3,
    });
    const statusIndicator = new THREE.Mesh(getForkliftGeometry('indicator'), indicatorMaterial);
    statusIndicator.position.set(0, 3.2, 0);
    statusIndicator.name = 'status_indicator';
    statusIndicator.frustumCulled = true;
    forkliftGroup.add(statusIndicator);

    if (data.status === 'working') {
      const headlightGeometry = getForkliftGeometry('headlight');
      const headlight1 = new THREE.Mesh(headlightGeometry, headlightMaterial);
      headlight1.position.set(-0.8, 0.8, 1.76);
      headlight1.rotation.y = Math.PI;
      headlight1.frustumCulled = true;
      forkliftGroup.add(headlight1);

      const headlight2 = new THREE.Mesh(headlightGeometry, headlightMaterial);
      headlight2.position.set(0.8, 0.8, 1.76);
      headlight2.rotation.y = Math.PI;
      headlight2.frustumCulled = true;
      forkliftGroup.add(headlight2);
    }

    if (data.status === 'error') {
      const alarmLight = new THREE.PointLight(COLORS.danger, 2, 8);
      alarmLight.position.set(0, 3.5, 0);
      alarmLight.name = 'alarm_light';
      forkliftGroup.add(alarmLight);
    }

    forkliftGroup.position.set(data.position.x, data.position.y, data.position.z);
    forkliftGroup.rotation.y = data.rotation;
    forkliftGroup.frustumCulled = true;

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
        alarmLight.intensity = 1 + pulse * 2;
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
    line.frustumCulled = true;
    return line;
  }

  static createFlowPath(start: THREE.Vector3, end: THREE.Vector3): THREE.Group {
    const pathGroup = new THREE.Group();
    pathGroup.name = 'flow_path';

    const points: THREE.Vector3[] = [];
    const segments = 10;
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
    line.frustumCulled = true;
    pathGroup.add(line);

    return pathGroup;
  }

  static dispose(): void {
    Object.values(sharedForkliftMaterials).forEach(mat => {
      if (mat) mat.dispose();
    });
    Object.values(sharedGeometries).forEach(geom => {
      if (geom) geom.dispose();
    });
  }
}
