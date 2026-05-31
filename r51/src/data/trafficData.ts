import type { RoadSegment, RoadPoint, Building } from '@/types';
import { smoothHeightTransition } from '@/utils/curveUtils';

const LEVEL_0 = 0;
const LEVEL_1 = 6;
const LEVEL_2 = 12;

function createStraightRoad(
  startX: number,
  startZ: number,
  endX: number,
  endZ: number,
  y: number,
  segments: number = 40
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

function createCurveRamp(
  startX: number,
  startZ: number,
  startY: number,
  endX: number,
  endZ: number,
  endY: number,
  curveX: number,
  curveZ: number,
  segments: number = 40
): RoadPoint[] {
  const points: RoadPoint[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const mt = 1 - t;
    const t2 = t * t;
    const mt2 = mt * mt;

    const x = mt2 * startX + 2 * mt * t * curveX + t2 * endX;
    const z = mt2 * startZ + 2 * mt * t * curveZ + t2 * endZ;

    const heightT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const y = startY + (endY - startY) * heightT;

    points.push({ x, y, z });
  }
  return points;
}

function createCircleRamp(
  centerX: number,
  centerZ: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  startY: number,
  endY: number,
  segments: number = 50
): RoadPoint[] {
  const points: RoadPoint[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = startAngle + (endAngle - startAngle) * t;
    const heightT = t;
    const y = startY + (endY - startY) * heightT;

    points.push({
      x: centerX + Math.cos(angle) * radius,
      y,
      z: centerZ + Math.sin(angle) * radius
    });
  }
  return points;
}

export const roadSegments: RoadSegment[] = [
  {
    id: 'main-east-west-l0',
    name: '东西主干道 (地面层)',
    type: 'main',
    level: 0,
    points: createStraightRoad(-160, 0, 160, 0, LEVEL_0, 50),
    width: 24,
    lanes: 6,
    direction: 'bidirectional'
  },
  {
    id: 'main-north-south-l1',
    name: '南北主干道 (一层)',
    type: 'main',
    level: 1,
    points: createStraightRoad(0, -160, 0, 160, LEVEL_1, 50),
    width: 24,
    lanes: 6,
    direction: 'bidirectional'
  },
  {
    id: 'main-east-west-l2',
    name: '东西快速路 (二层)',
    type: 'main',
    level: 2,
    points: createStraightRoad(-140, 50, 140, 50, LEVEL_2, 45),
    width: 20,
    lanes: 4,
    direction: 'forward'
  },
  {
    id: 'ramp-ne-l0-to-l1',
    name: '东北匝道 (地面→一层)',
    type: 'ramp',
    level: 0,
    points: createCurveRamp(
      60, 0, LEVEL_0,
      0, -60, LEVEL_1,
      60, -60,
      45
    ),
    width: 10,
    lanes: 2,
    direction: 'forward'
  },
  {
    id: 'ramp-nw-l1-to-l0',
    name: '西北匝道 (一层→地面)',
    type: 'ramp',
    level: 1,
    points: createCurveRamp(
      0, 60, LEVEL_1,
      -60, 0, LEVEL_0,
      -60, 60,
      45
    ),
    width: 10,
    lanes: 2,
    direction: 'forward'
  },
  {
    id: 'ramp-se-l1-to-l2',
    name: '东南匝道 (一层→二层)',
    type: 'ramp',
    level: 1,
    points: createCurveRamp(
      0, -60, LEVEL_1,
      60, 50, LEVEL_2,
      70, -30,
      45
    ),
    width: 10,
    lanes: 2,
    direction: 'forward'
  },
  {
    id: 'ramp-sw-l2-to-l0',
    name: '西南环形匝道 (二层→地面)',
    type: 'ramp',
    level: 2,
    points: createCircleRamp(
      -70,
      30,
      45,
      0,
      Math.PI * 1.3,
      LEVEL_2,
      LEVEL_0,
      55
    ),
    width: 10,
    lanes: 2,
    direction: 'forward'
  },
  {
    id: 'ramp-es-l2-to-l1',
    name: '东向匝道 (二层→一层)',
    type: 'ramp',
    level: 2,
    points: createCurveRamp(
      70, 50, LEVEL_2,
      0, 60, LEVEL_1,
      70, 70,
      45
    ),
    width: 10,
    lanes: 2,
    direction: 'forward'
  },
  {
    id: 'connect-west-l0',
    name: '西向连接路',
    type: 'main',
    level: 0,
    points: createStraightRoad(-80, -30, -80, 30, LEVEL_0, 30),
    width: 12,
    lanes: 3,
    direction: 'forward'
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
  'ramp-es-l2-to-l1'
];

export const roadSignData = [
  { id: 'sign1', position: { x: 80, y: LEVEL_0, z: 18 }, text: '向东行驶', direction: { x: 1, y: 0, z: 0 } },
  { id: 'sign2', position: { x: -80, y: LEVEL_0, z: -18 }, text: '向西行驶', direction: { x: -1, y: 0, z: 0 } },
  { id: 'sign3', position: { x: 18, y: LEVEL_1, z: 80 }, text: '向北行驶', direction: { x: 0, y: 0, z: 1 } },
  { id: 'sign4', position: { x: -18, y: LEVEL_1, z: -80 }, text: '向南行驶', direction: { x: 0, y: 0, z: -1 } },
  { id: 'sign5', position: { x: 65, y: LEVEL_0, z: 5 }, text: '立交桥入口', direction: { x: 1, y: 0, z: 0 } },
  { id: 'sign6', position: { x: -70, y: LEVEL_2, z: 60 }, text: '快速路', direction: { x: -1, y: 0, z: 0 } }
];
