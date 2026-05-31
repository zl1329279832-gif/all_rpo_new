import * as THREE from 'three';
import type { RoadSegment } from '@/types';
import { createCatmullRomCurve, getRoadEdges, getLaneLinePoints, getPillarPositions } from '@/utils/curveUtils';
import { createRoadGeometry, createGuardRailGeometry, createStreetLightGeometry, createRoadSignGeometry } from '@/utils/geometryUtils';
import { roadMaterials, createLineMaterial } from '@/utils/materialPresets';
import { roadSegments, roadSignData } from '@/data/trafficData';

type ThreeCurve = any;

export interface RoadMeshData {
  id: string;
  name: string;
  group: THREE.Group;
  curve: ThreeCurve;
  width: number;
  lanes: number;
  level: number;
}

export function useRoadGenerator(scene: THREE.Scene) {
  const roadMeshes = new Map<string, RoadMeshData>();
  const curves = new Map<string, ThreeCurve>();
  const streetLights: { pole: THREE.Mesh; light: THREE.PointLight }[] = [];

  function generateAllRoads() {
    const roadsGroup = new THREE.Group();
    roadsGroup.name = 'roads';

    for (const segment of roadSegments) {
      const roadData = createRoadSegment(segment);
      roadMeshes.set(segment.id, roadData);
      curves.set(segment.id, roadData.curve);
      roadsGroup.add(roadData.group);
    }

    scene.add(roadsGroup);

    createPillars();
    createStreetLights();
    createRoadSigns();
    createGround();
  }

  function createRoadSegment(segment: RoadSegment): RoadMeshData {
    const group = new THREE.Group();
    group.name = segment.id;

    const curve = createCatmullRomCurve(segment.points);
    const divisions = segment.points.length * 3;
    const { leftEdge, rightEdge, centerLine } = getRoadEdges(curve, segment.width, divisions);

    const roadGeo = createRoadGeometry(leftEdge, rightEdge, 0.5);
    const roadMat = segment.type === 'main' ? roadMaterials.asphalt : roadMaterials.asphaltDark;
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    roadMesh.castShadow = true;
    group.add(roadMesh);

    const edgesGroup = createGuardRailGeometry(leftEdge, rightEdge, 1, 0.15);
    group.add(edgesGroup);

    createLaneMarkings(group, curve, segment.width, segment.lanes, divisions);

    if (segment.type === 'main' && segment.lanes > 4) {
      createMedian(group, curve, segment.width, divisions);
    }

    const roadUserData = {
      type: 'road',
      roadId: segment.id,
      roadName: segment.name,
      level: segment.level,
      lanes: segment.lanes
    };

    group.traverse((obj) => {
      obj.userData = { ...obj.userData, ...roadUserData };
    });

    return {
      id: segment.id,
      name: segment.name,
      group,
      curve,
      width: segment.width,
      lanes: segment.lanes,
      level: segment.level
    };
  }

  function createLaneMarkings(
    parent: THREE.Group,
    curve: ThreeCurve,
    roadWidth: number,
    lanes: number,
    divisions: number
  ) {
    for (let i = 1; i < lanes; i++) {
      const lanePoints = getLaneLinePoints(curve, roadWidth, i, lanes, divisions);

      const isDashed = i !== Math.floor(lanes / 2) || lanes % 2 === 0;
      const material = createLineMaterial(
        i === Math.floor(lanes / 2) && lanes % 2 !== 0 ? 0xffcc00 : 0xffffff,
        isDashed,
        2
      );

      const lineGeo = new THREE.BufferGeometry().setFromPoints(lanePoints);
      const line = new THREE.Line(lineGeo, material);

      if (isDashed) {
        line.computeLineDistances();
      }

      parent.add(line);
    }

    const edgeMat = createLineMaterial(0xffffff, false, 2);
    const leftPoints = getLaneLinePoints(curve, roadWidth, 0, 2, divisions);
    const rightPoints = getLaneLinePoints(curve, roadWidth, 2, 2, divisions);

    const leftEdgeLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(leftPoints),
      edgeMat
    );
    const rightEdgeLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(rightPoints),
      edgeMat
    );

    parent.add(leftEdgeLine);
    parent.add(rightEdgeLine);
  }

  function createMedian(
    parent: THREE.Group,
    curve: ThreeCurve,
    roadWidth: number,
    divisions: number
  ) {
    const leftPoints = getLaneLinePoints(curve, roadWidth, 0, 20, divisions);
    const rightPoints = getLaneLinePoints(curve, roadWidth, 20, 20, divisions);

    const medianGeo = createRoadGeometry(leftPoints, rightPoints, 0.6);
    const medianMesh = new THREE.Mesh(medianGeo, roadMaterials.median);
    medianMesh.position.y = 0.05;
    parent.add(medianMesh);
  }

  function createPillars() {
    const pillarsGroup = new THREE.Group();
    pillarsGroup.name = 'pillars';

    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.8,
      metalness: 0.1
    });

    for (const segment of roadSegments) {
      if (segment.level > 0 || segment.type === 'ramp') {
        const curve = curves.get(segment.id);
        if (!curve) continue;

        const positions = getPillarPositions(curve, 20, 100);

        for (const pos of positions) {
          const height = pos.y;
          if (height < 1) continue;

          const pillarGeo = new THREE.CylinderGeometry(0.8, 1, height, 12);
          const pillar = new THREE.Mesh(pillarGeo, pillarMat);
          pillar.position.set(pos.x, height / 2, pos.z);
          pillar.castShadow = true;
          pillar.receiveShadow = true;

          const capGeo = new THREE.CylinderGeometry(1.5, 0.8, 0.5, 12);
          const cap = new THREE.Mesh(capGeo, pillarMat);
          cap.position.set(pos.x, height + 0.25, pos.z);
          cap.castShadow = true;

          pillarsGroup.add(pillar);
          pillarsGroup.add(cap);
        }
      }
    }

    scene.add(pillarsGroup);
  }

  function createStreetLights() {
    const lightsGroup = new THREE.Group();
    lightsGroup.name = 'streetLights';

    for (const segment of roadSegments) {
      if (segment.type !== 'main') continue;

      const curve = curves.get(segment.id);
      if (!curve) continue;

      const divisions = 50;
      const spacing = segment.type === 'main' ? 25 : 40;
      const numLights = Math.floor(curve.getLength() / spacing);

      for (let i = 0; i <= numLights; i++) {
        const t = i / numLights;
        const pos = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t).normalize();
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

        const offset = segment.width / 2 + 3;

        const { pole, lamp, light } = createStreetLightGeometry();
        pole.position.set(
          pos.x + normal.x * offset,
          pos.y,
          pos.z + normal.z * offset
        );
        pole.lookAt(pos.x, pos.y, pos.z);
        pole.rotateY(Math.PI / 2);

        lightsGroup.add(pole);
        streetLights.push({ pole, light });
      }
    }

    scene.add(lightsGroup);
  }

  function createRoadSigns() {
    const signsGroup = new THREE.Group();
    signsGroup.name = 'roadSigns';

    for (const signData of roadSignData) {
      const sign = createRoadSignGeometry(signData.text);
      sign.position.set(signData.position.x, signData.position.y, signData.position.z);
      signsGroup.add(sign);
    }

    scene.add(signsGroup);
  }

  function createGround() {
    const groundSize = 400;

    const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize, 50, 50);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x3d6b2f,
      roughness: 1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const curbMat = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.9
    });

    for (let i = -1; i <= 1; i += 2) {
      for (let j = -1; j <= 1; j += 2) {
        const stripGeo = new THREE.BoxGeometry(60, 0.3, 60);
        const strip = new THREE.Mesh(stripGeo, curbMat);
        strip.position.set(i * 100, 0.15, j * 100);
        strip.receiveShadow = true;
        scene.add(strip);
      }
    }
  }

  function getCurves() {
    return curves;
  }

  function getStreetLights() {
    return streetLights;
  }

  function dispose() {
    for (const roadData of roadMeshes.values()) {
      roadData.group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    }
    roadMeshes.clear();
    curves.clear();
    streetLights.length = 0;
  }

  return {
    generateAllRoads,
    getCurves,
    getStreetLights,
    dispose
  };
}
