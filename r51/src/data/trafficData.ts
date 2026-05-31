import type { RoadSegment, RoadPoint, Building } from '@/types';

const LEVEL_0 = 0;
const LEVEL_1 = 6;
const LEVEL_2 = 12;

function createStraightRoad(
  startX: number,
  startZ: number,
  endX: number,
  endZ: number,
  y: number,
  segments: number = 50
): RoadPoint[] {
  const points: RoadPoint[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    points.push({
      x: startX + (endX - startX) * t,
      y,
      z: startZ + (endZ - startZ) * t
    });
  }
  return points;
}

function createAlignedRamp(
  startX: number, startZ: number, startY: number,
  startDirX: number, startDirZ: number,
  endX: number, endZ: number, endY: number,
  endDirX: number, endDirZ: number,
  curveOffset: number = 1,
  segments: number = 50
): RoadPoint[] {
  const points: RoadPoint[] = [];

  const startTangentLen = 15;
  const endTangentLen = 15;

  const p0 = { x: startX, y: startY, z: startZ };
  const p1 = {
    x: startX + startDirX * startTangentLen,
    y: startY + (endY - startY) * 0.1,
    z: startZ + startDirZ * startTangentLen
  };
  const p2 = {
    x: endX + endDirX * endTangentLen,
    y: startY + (endY - startY) * 0.9,
    z: endZ + endDirZ * endTangentLen
  };
  const p3 = { x: endX, y: endY, z: endZ };

  const midX = (p1.x + p2.x) / 2 + (p2.z - p1.z) * curveOffset * 0.5;
  const midZ = (p1.z + p2.z) / 2 + (p1.x - p2.x) * curveOffset * 0.5;
  const midY = (p1.y + p2.y) / 2;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const mt = 1 - t;
    const t2 = t * t;
    const mt2 = mt * mt;
    const t3 = t2 * t;
    const mt3 = mt2 * mt;

    const x = mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * midX + t3 * p3.x;
    const z = mt3 * p0.z + 3 * mt2 * t * p1.z + 3 * mt * t2 * midZ + t3 * p3.z;

    const heightT = t < 0.15 ? 0 : t > 0.85 ? 1 : (t - 0.15) / 0.7;
    const easedHT = heightT < 0.5 ? 2 * heightT * heightT : 1 - Math.pow(-2 * heightT + 2, 2) / 2;
    const y = startY + (endY - startY) * easedHT;

    points.push({ x, y, z });
  }

  return points;
}

function createCircleRampAligned(
  startX: number, startZ: number, startY: number,
  startDirX: number, startDirZ: number,
  endX: number, endZ: number, endY: number,
  endDirX: number, endDirZ: number,
  centerX: number, centerZ: number, radius: number,
  startAngle: number, endAngle: number,
  segments: number = 60
): RoadPoint[] {
  const points: RoadPoint[] = [];
  const transitionLen = 8;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;

    if (t < 0.12) {
      const localT = t / 0.12;
      const angle = startAngle + localT * 0.2;
      const arcX = centerX + Math.cos(angle) * radius;
      const arcZ = centerZ + Math.sin(angle) * radius;

      const lineX = startX + startDirX * transitionLen * localT;
      const lineZ = startZ + startDirZ * transitionLen * localT;

      const blend = localT < 0.5 ? 2 * localT * localT : 1 - Math.pow(-2 * localT + 2, 2) / 2;
      points.push({
        x: lineX + (arcX - lineX) * blend,
        y: startY,
        z: lineZ + (arcZ - lineZ) * blend
      });
    } else if (t > 0.88) {
      const localT = (t - 0.88) / 0.12;
      const angle = endAngle - (1 - localT) * 0.2;
      const arcX = centerX + Math.cos(angle) * radius;
      const arcZ = centerZ + Math.sin(angle) * radius;

      const lineX = endX + endDirX * transitionLen * (1 - localT);
      const lineZ = endZ + endDirZ * transitionLen * (1 - localT);

      const blend = localT < 0.5 ? 2 * localT * localT : 1 - Math.pow(-2 * localT + 2, 2) / 2;
      points.push({
        x: arcX + (lineX - arcX) * blend,
        y: endY,
        z: arcZ + (lineZ - arcZ) * blend
      });
    } else {
      const arcT = (t - 0.12) / 0.76;
      const angle = startAngle + 0.2 + (endAngle - startAngle - 0.4) * arcT;
      const heightT = arcT < 0.5 ? 2 * arcT * arcT : 1 - Math.pow(-2 * arcT + 2, 2) / 2;

      points.push({
        x: centerX + Math.cos(angle) * radius,
        y: startY + (endY - startY) * heightT,
        z: centerZ + Math.sin(angle) * radius
      });
    }
  }

  return points;
}

export const roadSegments: RoadSegment[] = [
  {
    id: 'main-east-west-l0',
    name: '东西主干道 (地面层)',
    type: 'main',
    level: 0,
    points: createStraightRoad(-160, 0, 160, 0, LEVEL_0, 60),
    width: 24,
    lanes: 6,
    direction: 'bidirectional'
  },
  {
    id: 'main-north-south-l1',
    name: '南北主干道 (一层)',
    type: 'main',
    level: 1,
    points: createStraightRoad(0, -160, 0, 160, LEVEL_1, 60),
    width: 24,
    lanes: 6,
    direction: 'bidirectional'
  },
  {
    id: 'main-east-west-l2',
    name: '东西快速路 (二层)',
    type: 'main',
    level: 2,
    points: createStraightRoad(-140, 50, 140, 50, LEVEL_2, 55),
    width: 20,
    lanes: 4,
    direction: 'forward'
  },
  {
    id: 'ramp-ne-l0-to-l1',
    name: '东北匝道 (地面→一层)',
    type: 'ramp',
    level: 0,
    points: createAlignedRamp(
      60, 0, LEVEL_0,
      1, 0,
      0, -60, LEVEL_1,
      0, -1,
      1.5,
      55
    ),
    width: 10,
    lanes: 2,
    direction: 'forward',
    startDir: { x: 1, z: 0 },
    endDir: { x: 0, z: -1 }
  },
  {
    id: 'ramp-nw-l1-to-l0',
    name: '西北匝道 (一层→地面)',
    type: 'ramp',
    level: 1,
    points: createAlignedRamp(
      0, 60, LEVEL_1,
      0, 1,
      -60, 0, LEVEL_0,
      -1, 0,
      -1.5,
      55
    ),
    width: 10,
    lanes: 2,
    direction: 'forward',
    startDir: { x: 0, z: 1 },
    endDir: { x: -1, z: 0 }
  },
  {
    id: 'ramp-se-l1-to-l2',
    name: '东南匝道 (一层→二层)',
    type: 'ramp',
    level: 1,
    points: createAlignedRamp(
      0, -60, LEVEL_1,
      0, -1,
      60, 50, LEVEL_2,
      1, 0,
      1.8,
      55
    ),
    width: 10,
    lanes: 2,
    direction: 'forward',
    startDir: { x: 0, z: -1 },
    endDir: { x: 1, z: 0 }
  },
  {
    id: 'ramp-sw-l2-to-l0',
    name: '西南环形匝道 (二层→地面)',
    type: 'ramp',
    level: 2,
    points: createCircleRampAligned(
      -60, 50, LEVEL_2,
      -1, 0,
      -60, 0, LEVEL_0,
      -1, 0,
      -70, 25, 40,
      Math.PI * 0.2, Math.PI * 1.3,
      65
    ),
    width: 10,
    lanes: 2,
    direction: 'forward',
    startDir: { x: -1, z: 0 },
    endDir: { x: -1, z: 0 }
  },
  {
    id: 'ramp-es-l2-to-l1',
    name: '东向匝道 (二层→一层)',
    type: 'ramp',
    level: 2,
    points: createAlignedRamp(
      60, 50, LEVEL_2,
      1, 0,
      0, 60, LEVEL_1,
      0, 1,
      -1.5,
      55
    ),
    width: 10,
    lanes: 2,
    direction: 'forward',
    startDir: { x: 1, z: 0 },
    endDir: { x: 0, z: 1 }
  },
  {
    id: 'ramp-wn-l0-to-l2',
    name: '西向匝道 (地面→二层)',
    type: 'ramp',
    level: 0,
    points: createAlignedRamp(
      -60, 0, LEVEL_0,
      -1, 0,
      -60, 50, LEVEL_2,
      -1, 0,
      1.2,
      55
    ),
    width: 10,
    lanes: 2,
    direction: 'forward',
    startDir: { x: -1, z: 0 },
    endDir: { x: -1, z: 0 }
  }
];

export const buildings: Building[] = [
  { id: 'b1', position: { x: 110, y: 0, z: 110 }, width: 25, depth: 25, height: 45, style: 'office' },
  { id: 'b2', position: { x: -110, y: 0, z: 110 }, width: 30, depth: 20, height: 60, style: 'commercial' },
  { id: 'b3', position: { x: 110, y: 0, z: -110 }, width: 20, depth: 20, height: 28, style: 'residential' },
  { id: 'b4', position: { x: -110, y: 0, z: -110 }, width: 35, depth: 25, height: 50, style: 'office' },
  { id: 'b5', position: { x: 150, y: 0, z: 0 }, width: 20, depth: 15, height: 35, style: 'residential' },
  { id: 'b6', position: { x: -150, y: 0, z: 0 }, width: 25, depth: 20, height: 40, style: 'commercial' },
  { id: 'b7', position: { x: 0, y: 0, z: 150 }, width: 25, depth: 25, height: 55, style: 'office' },
  { id: 'b8', position: { x: 0, y: 0, z: -150 }, width: 18, depth: 18, height: 30, style: 'residential' },
  { id: 'b9', position: { x: 90, y: 0, z: 90 }, width: 15, depth: 15, height: 22, style: 'residential' },
  { id: 'b10', position: { x: -90, y: 0, z: -90 }, width: 22, depth: 22, height: 48, style: 'commercial' },
  { id: 'b11', position: { x: 70, y: 0, z: -100 }, width: 28, depth: 18, height: 42, style: 'office' },
  { id: 'b12', position: { x: -70, y: 0, z: 100 }, width: 20, depth: 24, height: 36, style: 'commercial' }
];

export const vehiclePaths = [
  'main-east-west-l0',
  'main-north-south-l1',
  'main-east-west-l2',
  'ramp-ne-l0-to-l1',
  'ramp-nw-l1-to-l0',
  'ramp-se-l1-to-l2',
  'ramp-sw-l2-to-l0',
  'ramp-es-l2-to-l1',
  'ramp-wn-l0-to-l2'
];

export const roadSignData = [
  { id: 'sign1', position: { x: 80, y: LEVEL_0, z: 18 }, text: '向东行驶', direction: { x: 1, y: 0, z: 0 } },
  { id: 'sign2', position: { x: -80, y: LEVEL_0, z: -18 }, text: '向西行驶', direction: { x: -1, y: 0, z: 0 } },
  { id: 'sign3', position: { x: 18, y: LEVEL_1, z: 80 }, text: '向北行驶', direction: { x: 0, y: 0, z: 1 } },
  { id: 'sign4', position: { x: -18, y: LEVEL_1, z: -80 }, text: '向南行驶', direction: { x: 0, y: 0, z: -1 } },
  { id: 'sign5', position: { x: 65, y: LEVEL_0, z: 5 }, text: '立交桥入口', direction: { x: 1, y: 0, z: 0 } },
  { id: 'sign6', position: { x: -70, y: LEVEL_2, z: 60 }, text: '快速路', direction: { x: -1, y: 0, z: 0 } }
];
