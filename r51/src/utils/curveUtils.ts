import * as THREE from 'three';
import type { RoadPoint } from '@/types';

type ThreeCurve = any;

export function createCatmullRomCurve(points: RoadPoint[], closed = false, tension = 0.5): ThreeCurve {
  const threePoints = points.map(p => new THREE.Vector3(p.x, p.y, p.z));
  const CurveClass = (THREE as any).CatmullRomCurve3;
  const curve = new CurveClass(threePoints, closed, 'catmullrom', tension);
  return curve;
}

export function getCurvePoints(curve: ThreeCurve, divisions: number): THREE.Vector3[] {
  return curve.getPoints(divisions);
}

export function getRoadEdges(
  centerCurve: ThreeCurve,
  width: number,
  divisions: number
): { leftEdge: THREE.Vector3[]; rightEdge: THREE.Vector3[]; centerLine: THREE.Vector3[] } {
  const centerPoints = getCurvePoints(centerCurve, divisions);
  const leftEdge: THREE.Vector3[] = [];
  const rightEdge: THREE.Vector3[] = [];

  for (let i = 0; i < centerPoints.length; i++) {
    const current = centerPoints[i];
    const next = centerPoints[Math.min(i + 1, centerPoints.length - 1)];
    const prev = centerPoints[Math.max(i - 1, 0)];

    const tangent = new THREE.Vector3()
      .subVectors(next, prev)
      .normalize();

    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const halfWidth = width / 2;

    leftEdge.push(new THREE.Vector3(
      current.x + normal.x * halfWidth,
      current.y,
      current.z + normal.z * halfWidth
    ));

    rightEdge.push(new THREE.Vector3(
      current.x - normal.x * halfWidth,
      current.y,
      current.z - normal.z * halfWidth
    ));
  }

  return { leftEdge, rightEdge, centerLine: centerPoints };
}

export function getLaneLinePoints(
  centerCurve: ThreeCurve,
  roadWidth: number,
  laneIndex: number,
  totalLanes: number,
  divisions: number
): THREE.Vector3[] {
  const laneWidth = roadWidth / totalLanes;
  const offset = (laneIndex - totalLanes / 2 + 0.5) * laneWidth;
  const points: THREE.Vector3[] = [];

  for (let i = 0; i <= divisions; i++) {
    const t = i / divisions;
    const centerPoint = centerCurve.getPoint(t);
    const tangent = centerCurve.getTangent(t).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    points.push(new THREE.Vector3(
      centerPoint.x + normal.x * offset,
      centerPoint.y + 0.03,
      centerPoint.z + normal.z * offset
    ));
  }

  return points;
}

export function getPointAtProgress(
  curve: ThreeCurve,
  progress: number,
  laneOffset: number,
  roadWidth: number
): { position: THREE.Vector3; tangent: THREE.Vector3 } {
  const position = curve.getPointAt(progress);
  const tangent = curve.getTangentAt(progress).normalize();
  const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

  const offsetPosition = position.clone().add(
    normal.multiplyScalar(laneOffset * roadWidth * 0.3)
  );

  return { position: offsetPosition, tangent };
}

export function smoothHeightTransition(
  points: RoadPoint[],
  startHeight: number,
  endHeight: number
): RoadPoint[] {
  return points.map((point, index) => {
    const t = index / (points.length - 1);
    const easedT = t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
    return {
      ...point,
      y: startHeight + (endHeight - startHeight) * easedT
    };
  });
}

export function createRampPoints(
  startPoint: RoadPoint,
  endPoint: RoadPoint,
  segments: number,
  curveAmount: number = 1
): RoadPoint[] {
  const points: RoadPoint[] = [];
  const midPoint = {
    x: (startPoint.x + endPoint.x) / 2 + (endPoint.z - startPoint.z) * curveAmount * 0.4,
    y: (startPoint.y + endPoint.y) / 2,
    z: (startPoint.z + endPoint.z) / 2 + (startPoint.x - endPoint.x) * curveAmount * 0.4
  };

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const t2 = t * t;
    const mt = 1 - t;
    const mt2 = mt * mt;

    const x = mt2 * startPoint.x + 2 * mt * t * midPoint.x + t2 * endPoint.x;
    const y = mt2 * startPoint.y + 2 * mt * t * midPoint.y + t2 * endPoint.y;
    const z = mt2 * startPoint.z + 2 * mt * t * midPoint.z + t2 * endPoint.z;

    points.push({ x, y, z });
  }

  return points;
}

export function getPillarPositions(
  curve: ThreeCurve,
  spacing: number,
  divisions: number
): THREE.Vector3[] {
  const positions: THREE.Vector3[] = [];
  const curveLength = curve.getLength();
  const numPillars = Math.floor(curveLength / spacing);

  for (let i = 0; i <= numPillars; i++) {
    const t = i / numPillars;
    positions.push(curve.getPointAt(t));
  }

  return positions;
}
