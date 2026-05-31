export interface RoadPoint {
  x: number;
  y: number;
  z: number;
}

export interface RoadSegment {
  id: string;
  name: string;
  type: 'main' | 'ramp';
  level: number;
  points: RoadPoint[];
  width: number;
  lanes: number;
  direction: 'forward' | 'backward' | 'bidirectional';
}

export interface Vehicle {
  id: string;
  type: 'car' | 'suv' | 'truck';
  pathId: string;
  progress: number;
  speed: number;
  color: number;
  lane: number;
  lanes: number;
  roadWidth: number;
}

export interface SceneState {
  cameraMode: 'top' | 'driving' | 'free';
  trafficDensity: number;
  timeOfDay: 'day' | 'night';
  roadStatus: 'normal' | 'construction' | 'congested';
  showLabels: boolean;
  selectedVehicleId: string | null;
}

export interface Building {
  id: string;
  position: RoadPoint;
  width: number;
  depth: number;
  height: number;
  style: 'office' | 'residential' | 'commercial';
}

export interface StreetLight {
  id: string;
  position: RoadPoint;
  height: number;
}

export interface RoadSign {
  id: string;
  position: RoadPoint;
  text: string;
  direction: RoadPoint;
}

export interface TrafficStats {
  totalVehicles: number;
  averageSpeed: number;
  congestionLevel: number;
  activeRoutes: number;
}
