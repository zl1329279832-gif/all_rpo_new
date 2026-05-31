import type { RoadSegment, RoadPoint, Building } from '@/types';
import { smoothHeightTransition, createRampPoints } from '@/utils/curveUtils';

const LEVEL_0 = 0;
const LEVEL_1 = 6;
const LEVEL_2 = 12;

function createStraightRoad(
  startX: number,
  startZ: number,
  endX: number,
  endZ: number,
  y: number,
  segments: number = 30
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

function createCurveRoad(
  centerX: number,
  centerZ: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  startY: number,
  endY: number,
  segments: number = 40
): RoadPoint[] {
  const points: RoadPoint[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = startAngle + (endAngle - startAngle) * t;
    const easedT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    points.push({
      x: centerX + Math.cos(angle) * radius,
      y: startY + (endY - startY) * easedT,
      z: centerZ + Math.sin(angle) * radius
    });
  }
  return points;
}

function createTransitionRamp(
  startX: number, startZ: number, startY: number,
  endX: number, endZ: number, endY: number,
  curveAmount: number = 1,
  segments: number = 35
): RoadPoint[] {
  const midPoint = {
    x: (startX + endX) / 2 + (endZ - startZ) * curveAmount * 0.35,
    y: (startY + endY) / 2,
    z: (startZ + endZ) / 2 + (startX - endX) * curveAmount * 0.35
  };

  const points: RoadPoint[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const easedT = t < 0.3
      ? 4 * t * t * t / 0.027
      : t > 0.7
        ? 1 - Math.pow(1 - t, 3) / 0.027
        : t;
    const finalT = Math.min(1, Math.max(0, easedT > 1 ? 1 : easedT));

    const mt = 1 - finalT;
    const x = mt * mt * startX + 2 * mt * finalT * midPoint.x + finalT * finalT * endX;
    const y = startY + (endY - startY) * (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const z = mt * mt * startZ + 2 * mt * finalT * midPoint.z + finalT * finalT * endZ;

    points.push({ x, y, z });
  }
  return points;
}

export const roadSegments: RoadSegment[] = [
  {
    id: 'main-east-west-l0',
    name: '东西主干道 (地面层)',
    type: 'main',
    level: 0,
    points: createStraightRoad(-150, 0, 150, 0, LEVEL_0, 40),
    width: 24,
    lanes: 6,
    direction: 'bidirectional'
  },
  {
    id: 'main-north-south-l1',
    name: '南北主干道 (一层)',
    type: 'main',
    level: 1,
    points: createStraightRoad(0, -150, 0, 150, LEVEL_1, 40),
    width: 24,
    lanes: 6,
    direction: 'bidirectional'
  },
  {
    id: 'main-east-west-l2',
    name: '东西快速路 (二层)',
    type: 'main',
    level: 2,
    points: createStraightRoad(-120, 40, 120, 40, LEVEL_2, 35),
    width: 20,
    lanes: 4,
    direction: 'forward'
  },
  {
    id: 'ramp-ne-l0-to-l1',
    name: '东北匝道 (地面→一层)',
    type: 'ramp',
    level: 0,
    points: smoothHeightTransition(
      createTransitionRamp(50, -20, LEVEL_0, 20, -50, LEVEL_1, 1.5, 35),
      LEVEL_0,
      LEVEL_1
    ),
    width: 10,
    lanes: 2,
    direction: 'forward'
  },
  {
    id: 'ramp-nw-l1-to-l2',
    name: '西北匝道 (一层→二层)',
    type: 'ramp',
    level: 1,
    points: smoothHeightTransition(
      createTransitionRamp(-20, 50, LEVEL_1, -50, 40, LEVEL_2, -1.2, 35),
      LEVEL_1,
      LEVEL_2
    ),
    width: 10,
    lanes: 2,
    direction: 'forward'
  },
  {
    id: 'ramp-se-l2-to-l0',
    name: '东南环形匝道 (二层→地面)',
    type: 'ramp',
    level: 2,
    points: createCurveRoad(
      60,
      60,
      40,
      Math.PI,
      -Math.PI * 0.5,
      LEVEL_2,
      LEVEL_0,
      45
    ),
    width: 10,
    lanes: 2,
    direction: 'forward'
  },
  {
    id: 'ramp-sw-l0-to-l1',
    name: '西南匝道 (地面→一层)',
    type: 'ramp',
    level: 0,
    points: smoothHeightTransition(
      createTransitionRamp(-50, 20, LEVEL_0, -20, 50, LEVEL_1, -1.5, 35),
      LEVEL_0,
      LEVEL_1
    ),
    width: 10,
    lanes: 2,
    direction: 'forward'
  },
  {
    id: 'connect-north-l1',
    name: '北向连接路',
    type: 'main',
    level: 1,
    points: createStraightRoad(30, -80, 30, -30, LEVEL_1, 25),
    width: 12,
    lanes: 3,
    direction: 'forward'
  },
  {
    id: 'ramp-curve-uturn',
    name: 'U型转弯匝道',
    type: 'ramp',
    level: 1,
    points: createCurveRoad(
      -80,
      0,
      25,
      0,
      Math.PI,
      LEVEL_1,
      LEVEL_1,
      30
    ),
    width: 10,
    lanes: 2,
    direction: 'forward'
  }
];

export const buildings: Building[] = [
  { id: 'b1', position: { x: 100, y: 0, z: 100 }, width: 25, depth: 25, height: 40, style: 'office' },
  { id: 'b2', position: { x: -100, y: 0, z: 100 }, width: 30, depth: 20, height: 55, style: 'commercial' },
  { id: 'b3', position: { x: 100, y: 0, z: -100 }, width: 20, depth: 20, height: 25, style: 'residential' },
  { id: 'b4', position: { x: -100, y: 0, z: -100 }, width: 35, depth: 25, height: 45, style: 'office' },
  { id: 'b5', position: { x: 130, y: 0, z: 0 }, width: 20, depth: 15, height: 30, style: 'residential' },
  { id: 'b6', position: { x: -130, y: 0, z: 0 }, width: 25, depth: 20, height: 35, style: 'commercial' },
  { id: 'b7', position: { x: 0, y: 0, z: 130 }, width: 25, depth: 25, height: 50, style: 'office' },
  { id: 'b8', position: { x: 0, y: 0, z: -130 }, width: 18, depth: 18, height: 28, style: 'residential' },
  { id: 'b9', position: { x: 80, y: 0, z: 80 }, width: 15, depth: 15, height: 20, style: 'residential' },
  { id: 'b10', position: { x: -80, y: 0, z: -80 }, width: 22, depth: 22, height: 42, style: 'commercial' },
  { id: 'b11', position: { x: 60, y: 0, z: -90 }, width: 28, depth: 18, height: 38, style: 'office' },
  { id: 'b12', position: { x: -60, y: 0, z: 90 }, width: 20, depth: 24, height: 32, style: 'commercial' }
];

export const vehiclePaths = [
  'main-east-west-l0',
  'main-north-south-l1',
  'main-east-west-l2',
  'ramp-ne-l0-to-l1',
  'ramp-nw-l1-to-l2',
  'ramp-se-l2-to-l0',
  'ramp-sw-l0-to-l1',
  'connect-north-l1'
];

export const roadSignData = [
  { id: 'sign1', position: { x: 80, y: LEVEL_0, z: 15 }, text: '向东行驶', direction: { x: 1, y: 0, z: 0 } },
  { id: 'sign2', position: { x: -80, y: LEVEL_0, z: -15 }, text: '向西行驶', direction: { x: -1, y: 0, z: 0 } },
  { id: 'sign3', position: { x: 15, y: LEVEL_1, z: 80 }, text: '向北行驶', direction: { x: 0, y: 0, z: 1 } },
  { id: 'sign4', position: { x: -15, y: LEVEL_1, z: -80 }, text: '向南行驶', direction: { x: 0, y: 0, z: -1 } },
  { id: 'sign5', position: { x: 60, y: LEVEL_1, z: -30 }, text: '立交桥入口', direction: { x: 1, y: 0, z: 0 } },
  { id: 'sign6', position: { x: -60, y: LEVEL_2, z: 50 }, text: '快速路', direction: { x: -1, y: 0, z: 0 } }
];
