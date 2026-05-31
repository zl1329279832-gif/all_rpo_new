import type { RoadSegment, RoadPoint, Building } from '@/types';

const L0 = 0;
const L1 = 6;
const L2 = 12;

function straight(
  x1: number, z1: number,
  x2: number, z2: number,
  y: number, n = 50
): RoadPoint[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return { x: x1 + (x2 - x1) * t, y, z: z1 + (z2 - z1) * t };
  });
}

function ramp(
  sx: number, sz: number, sy: number, sdx: number, sdz: number,
  ex: number, ez: number, ey: number, edx: number, edz: number,
  curv = 1, n = 60
): RoadPoint[] {
  const sL = 20, eL = 20;
  const p0x = sx, p0z = sz;
  const p1x = sx + sdx * sL, p1z = sz + sdz * sL;
  const p2x = ex + edx * eL, p2z = ez + edz * eL;
  const p3x = ex, p3z = ez;
  const cx = (p1x + p2x) / 2 + (p2z - p1z) * curv * 0.4;
  const cz = (p1z + p2z) / 2 + (p1x - p2x) * curv * 0.4;

  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const m = 1 - t;
    const x = m * m * m * p0x + 3 * m * m * t * p1x + 3 * m * t * t * cx + t * t * t * p3x;
    const z = m * m * m * p0z + 3 * m * m * t * p1z + 3 * m * t * t * cz + t * t * t * p3z;
    const ht = t < 0.15 ? 0 : t > 0.85 ? 1 : (t - 0.15) / 0.7;
    const eht = ht < 0.5 ? 2 * ht * ht : 1 - Math.pow(-2 * ht + 2, 2) / 2;
    const y = sy + (ey - sy) * eht;
    return { x, y, z };
  });
}

const EW0_EDGE_S = 12;
const EW0_EDGE_N = -12;
const NS1_EDGE_E = 12;
const NS1_EDGE_W = -12;
const EW2_EDGE_S = 70;
const EW2_EDGE_N = 50;

export const roadSegments: RoadSegment[] = [
  {
    id: 'main-ew-l0', name: '东西主干道 (地面层)', type: 'main', level: 0,
    points: straight(-160, 0, 160, 0, L0, 60),
    width: 24, lanes: 6, direction: 'bidirectional',
    startDir: { x: 1, z: 0 }, endDir: { x: 1, z: 0 }
  },
  {
    id: 'main-ns-l1', name: '南北主干道 (一层)', type: 'main', level: 1,
    points: straight(0, -160, 0, 160, L1, 60),
    width: 24, lanes: 6, direction: 'bidirectional',
    startDir: { x: 0, z: 1 }, endDir: { x: 0, z: 1 }
  },
  {
    id: 'main-ew-l2', name: '东西快速路 (二层)', type: 'main', level: 2,
    points: straight(-140, 60, 140, 60, L2, 55),
    width: 20, lanes: 4, direction: 'forward',
    startDir: { x: 1, z: 0 }, endDir: { x: 1, z: 0 }
  },
  {
    id: 'ramp-e-up',
    name: '东向上匝道 (地面→一层)',
    type: 'ramp', level: 0,
    points: ramp(
      70, EW0_EDGE_S, L0,  1, 0,
      NS1_EDGE_E, -70, L1,  0, -1,
      1.5, 55
    ),
    width: 10, lanes: 2, direction: 'forward',
    startDir: { x: 1, z: 0 }, endDir: { x: 0, z: -1 }
  },
  {
    id: 'ramp-w-down',
    name: '西向下匝道 (一层→地面)',
    type: 'ramp', level: 1,
    points: ramp(
      NS1_EDGE_W, 70, L1,  0, 1,
      -70, EW0_EDGE_N, L0,  -1, 0,
      -1.5, 55
    ),
    width: 10, lanes: 2, direction: 'forward',
    startDir: { x: 0, z: 1 }, endDir: { x: -1, z: 0 }
  },
  {
    id: 'ramp-se-up',
    name: '东南上匝道 (一层→二层)',
    type: 'ramp', level: 1,
    points: ramp(
      NS1_EDGE_E, -70, L1,  0, -1,
      70, EW2_EDGE_S, L2,  1, 0,
      2.0, 55
    ),
    width: 10, lanes: 2, direction: 'forward',
    startDir: { x: 0, z: -1 }, endDir: { x: 1, z: 0 }
  },
  {
    id: 'ramp-nw-down',
    name: '西北下匝道 (二层→一层)',
    type: 'ramp', level: 2,
    points: ramp(
      -70, EW2_EDGE_N, L2,  -1, 0,
      NS1_EDGE_W, 70, L1,     0, 1,
      -2.0, 55
    ),
    width: 10, lanes: 2, direction: 'forward',
    startDir: { x: -1, z: 0 }, endDir: { x: 0, z: 1 }
  },
  {
    id: 'ramp-ne-loop',
    name: '东北环形匝道 (二层→地面)',
    type: 'ramp', level: 2,
    points: ramp(
      90, EW2_EDGE_S, L2,  1, 0,
      EW0_EDGE_S, -20, L0,  1, 0,
      3.0, 65
    ),
    width: 10, lanes: 2, direction: 'forward',
    startDir: { x: 1, z: 0 }, endDir: { x: 1, z: 0 }
  },
  {
    id: 'ramp-sw-loop',
    name: '西南环形匝道 (地面→二层)',
    type: 'ramp', level: 0,
    points: ramp(
      -90, EW0_EDGE_N, L0,  -1, 0,
      EW2_EDGE_N, 20, L2,   -1, 0,
      -3.0, 65
    ),
    width: 10, lanes: 2, direction: 'forward',
    startDir: { x: -1, z: 0 }, endDir: { x: -1, z: 0 }
  }
];

export const buildings: Building[] = [
  { id: 'b1', position: { x: 120, y: 0, z: 120 }, width: 25, depth: 25, height: 45, style: 'office' },
  { id: 'b2', position: { x: -120, y: 0, z: 120 }, width: 30, depth: 20, height: 60, style: 'commercial' },
  { id: 'b3', position: { x: 120, y: 0, z: -120 }, width: 20, depth: 20, height: 28, style: 'residential' },
  { id: 'b4', position: { x: -120, y: 0, z: -120 }, width: 35, depth: 25, height: 50, style: 'office' },
  { id: 'b5', position: { x: 160, y: 0, z: 0 }, width: 20, depth: 15, height: 35, style: 'residential' },
  { id: 'b6', position: { x: -160, y: 0, z: 0 }, width: 25, depth: 20, height: 40, style: 'commercial' },
  { id: 'b7', position: { x: 0, y: 0, z: 160 }, width: 25, depth: 25, height: 55, style: 'office' },
  { id: 'b8', position: { x: 0, y: 0, z: -160 }, width: 18, depth: 18, height: 30, style: 'residential' }
];

export const vehiclePaths = roadSegments.map(s => s.id);

export const roadSignData = [
  { id: 'sign1', position: { x: 90, y: L0, z: 18 }, text: '向东行驶', direction: { x: 1, y: 0, z: 0 } },
  { id: 'sign2', position: { x: -90, y: L0, z: -18 }, text: '向西行驶', direction: { x: -1, y: 0, z: 0 } },
  { id: 'sign3', position: { x: 18, y: L1, z: 90 }, text: '向北行驶', direction: { x: 0, y: 0, z: 1 } },
  { id: 'sign4', position: { x: -18, y: L1, z: -90 }, text: '向南行驶', direction: { x: 0, y: 0, z: -1 } }
];
