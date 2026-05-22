import type {
  ShelfData,
  ForkliftData,
  SensorData,
  LoadingDockData,
  AlarmData,
  TrackPoint,
  ChannelData,
  Vector3,
} from '@/types';
import { SCENE_CONFIG, ALARM_CONFIG } from '@/config';
import { generateId, randomRange, randomInt } from '@/utils';

export class MockDataGenerator {
  private static instance: MockDataGenerator;
  private shelves: ShelfData[] = [];
  private forklifts: ForkliftData[] = [];
  private sensors: SensorData[] = [];
  private loadingDocks: LoadingDockData[] = [];
  private channels: ChannelData[] = [];

  private constructor() {
    this.initializeData();
  }

  static getInstance(): MockDataGenerator {
    if (!MockDataGenerator.instance) {
      MockDataGenerator.instance = new MockDataGenerator();
    }
    return MockDataGenerator.instance;
  }

  private initializeData(): void {
    this.generateShelves();
    this.generateForklifts();
    this.generateSensors();
    this.generateLoadingDocks();
    this.generateChannels();
  }

  private generateShelves(): void {
    const { warehouseWidth, warehouseDepth, floorCount, shelfWidth, shelfDepth, rowGap, shelfGap } = SCENE_CONFIG;
    const rows = 4;
    const cols = 8;
    const startX = -warehouseWidth / 2 + 10;
    const startZ = -warehouseDepth / 2 + 10;

    for (let floor = 0; floor < floorCount; floor++) {
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = startX + col * (shelfWidth + shelfGap);
          const z = startZ + row * (shelfDepth + rowGap);
          const capacity = 200;
          const usedSlots = randomInt(80, 190);
          const utilization = usedSlots / capacity;

          this.shelves.push({
            id: generateId('shelf'),
            code: `SHELF-${floor + 1}-${String(row + 1).padStart(2, '0')}-${String(col + 1).padStart(2, '0')}`,
            floor,
            position: { x, y: 0, z },
            levels: 5,
            slotsPerLevel: 40,
            usedSlots,
            capacity,
            utilization,
            temperature: randomRange(18, 32),
            humidity: randomRange(40, 80),
            status: this.getShelfStatus(utilization),
          });
        }
      }
    }
  }

  private getShelfStatus(utilization: number): 'normal' | 'warning' | 'alarm' {
    if (utilization >= ALARM_CONFIG.capacity.alarm / 100) return 'alarm';
    if (utilization >= ALARM_CONFIG.capacity.warning / 100) return 'warning';
    return 'normal';
  }

  private generateForklifts(): void {
    const forkliftCount = 8;
    const statuses: Array<'idle' | 'working' | 'offline' | 'error'> = ['working', 'working', 'working', 'idle', 'idle', 'working', 'offline', 'error'];
    const drivers = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];

    for (let i = 0; i < forkliftCount; i++) {
      this.forklifts.push({
        id: generateId('forklift'),
        code: `FL-${String(i + 1).padStart(3, '0')}`,
        status: statuses[i],
        position: {
          x: randomRange(-40, 40),
          y: 0,
          z: randomRange(-30, 30),
        },
        rotation: randomRange(0, Math.PI * 2),
        battery: randomRange(30, 100),
        speed: statuses[i] === 'working' ? randomRange(1, 5) : 0,
        currentTask: statuses[i] === 'working' ? `运输任务-${randomInt(1000, 9999)}` : null,
        driver: drivers[i],
      });
    }
  }

  private generateSensors(): void {
    const { warehouseWidth, warehouseDepth, floorCount } = SCENE_CONFIG;
    const sensorTypes: Array<'temperature' | 'humidity' | 'smoke' | 'door' | 'infrared'> = [
      'temperature', 'humidity', 'smoke', 'temperature', 'humidity', 'infrared', 'door', 'smoke'
    ];

    for (let floor = 0; floor < floorCount; floor++) {
      const y = floor * SCENE_CONFIG.floorHeight + 2;
      for (let i = 0; i < 12; i++) {
        const type = sensorTypes[i % sensorTypes.length];
        const x = randomRange(-warehouseWidth / 2 + 5, warehouseWidth / 2 - 5);
        const z = randomRange(-warehouseDepth / 2 + 5, warehouseDepth / 2 - 5);
        const status = Math.random() > 0.1 ? 'normal' : (Math.random() > 0.5 ? 'warning' : 'alarm');
        const isOffline = Math.random() > 0.92;

        let value = 0;
        if (type === 'temperature') value = randomRange(18, 35);
        else if (type === 'humidity') value = randomRange(40, 90);
        else if (type === 'smoke') value = randomRange(0, 100);
        else if (type === 'door') value = Math.random() > 0.5 ? 1 : 0;
        else if (type === 'infrared') value = Math.random() > 0.7 ? 1 : 0;

        this.sensors.push({
          id: generateId('sensor'),
          code: `SENSOR-${floor + 1}-${String(i + 1).padStart(3, '0')}`,
          type,
          position: { x, y, z },
          value,
          status: isOffline ? 'offline' : status,
          lastUpdate: Date.now(),
          threshold: {
            warning: ALARM_CONFIG[type as keyof typeof ALARM_CONFIG]?.warning || 70,
            alarm: ALARM_CONFIG[type as keyof typeof ALARM_CONFIG]?.alarm || 85,
          },
        });
      }
    }
  }

  private generateLoadingDocks(): void {
    const { warehouseDepth } = SCENE_CONFIG;
    const dockCount = 6;
    const statuses: Array<'available' | 'occupied' | 'reserved' | 'maintenance'> = [
      'available', 'occupied', 'occupied', 'reserved', 'available', 'maintenance'
    ];
    const vehicles = ['粤B-12345', '沪A-67890', '京A-11111', null, null, null];

    for (let i = 0; i < dockCount; i++) {
      const z = -warehouseDepth / 2 + 2;
      const x = -35 + i * 14;

      this.loadingDocks.push({
        id: generateId('dock'),
        code: `DOCK-${String(i + 1).padStart(2, '0')}`,
        position: { x, y: 0, z },
        status: statuses[i],
        currentVehicle: vehicles[i],
        estimatedDeparture: statuses[i] === 'occupied' ? Date.now() + randomInt(1800000, 3600000) : null,
      });
    }
  }

  private generateChannels(): void {
    const channels = [
      { id: 'CH-001', code: '主通道-A', start: { x: -50, y: 0, z: 0 }, end: { x: 50, y: 0, z: 0 } },
      { id: 'CH-002', code: '主通道-B', start: { x: 0, y: 0, z: -35 }, end: { x: 0, y: 0, z: 35 } },
      { id: 'CH-003', code: '通道-01', start: { x: -30, y: 0, z: -20 }, end: { x: 30, y: 0, z: -20 } },
      { id: 'CH-004', code: '通道-02', start: { x: -30, y: 0, z: 20 }, end: { x: 30, y: 0, z: 20 } },
    ];

    for (const ch of channels) {
      this.channels.push({
        ...ch,
        congestionLevel: randomRange(20, 95),
        vehicleCount: randomInt(0, 5),
      });
    }
  }

  getShelves(floor?: number): ShelfData[] {
    if (floor === undefined) return this.shelves;
    return this.shelves.filter(s => s.floor === floor);
  }

  getForklifts(): ForkliftData[] {
    return this.forklifts;
  }

  getSensors(floor?: number): SensorData[] {
    if (floor === undefined) return this.sensors;
    return this.sensors.filter(s => Math.floor(s.position.y / SCENE_CONFIG.floorHeight) === floor);
  }

  getLoadingDocks(): LoadingDockData[] {
    return this.loadingDocks;
  }

  getChannels(): ChannelData[] {
    return this.channels;
  }

  updateShelves(): ShelfData[] {
    return this.shelves.map(shelf => {
      const change = randomInt(-3, 3);
      const newUsedSlots = Math.max(0, Math.min(shelf.capacity, shelf.usedSlots + change));
      const newUtilization = newUsedSlots / shelf.capacity;

      return {
        ...shelf,
        usedSlots: newUsedSlots,
        utilization: newUtilization,
        temperature: Math.max(15, Math.min(38, shelf.temperature + randomRange(-0.5, 0.5))),
        humidity: Math.max(30, Math.min(95, shelf.humidity + randomRange(-1, 1))),
        status: this.getShelfStatus(newUtilization),
      };
    });
  }

  updateForklifts(): { forklifts: ForkliftData[]; tracks: Map<string, TrackPoint> } {
    const tracks = new Map<string, TrackPoint>();
    const now = Date.now();

    const updatedForklifts = this.forklifts.map(fl => {
      if (fl.status !== 'working') {
        return { ...fl, speed: 0 };
      }

      const angle = randomRange(-0.3, 0.3);
      const newRotation = fl.rotation + angle;
      const speed = randomRange(2, 6);
      const dx = Math.sin(newRotation) * speed * 0.1;
      const dz = Math.cos(newRotation) * speed * 0.1;
      let newX = fl.position.x + dx;
      let newZ = fl.position.z + dz;

      newX = Math.max(-55, Math.min(55, newX));
      newZ = Math.max(-38, Math.min(38, newZ));

      const newPosition = { x: newX, y: 0, z: newZ };
      const newBattery = Math.max(5, fl.battery - randomRange(0.01, 0.05));

      tracks.set(fl.id, {
        timestamp: now,
        position: newPosition,
        rotation: newRotation,
        speed,
      });

      return {
        ...fl,
        position: newPosition,
        rotation: newRotation,
        speed,
        battery: newBattery,
      };
    });

    this.forklifts = updatedForklifts;
    return { forklifts: updatedForklifts, tracks };
  }

  updateSensors(): SensorData[] {
    const now = Date.now();

    return this.sensors.map(sensor => {
      if (sensor.status === 'offline') {
        if (Math.random() > 0.98) {
          return { ...sensor, status: 'normal', lastUpdate: now };
        }
        return sensor;
      }

      let newValue = sensor.value;
      if (sensor.type === 'temperature') {
        newValue = Math.max(15, Math.min(40, sensor.value + randomRange(-0.8, 0.8)));
      } else if (sensor.type === 'humidity') {
        newValue = Math.max(30, Math.min(98, sensor.value + randomRange(-1.5, 1.5)));
      } else if (sensor.type === 'smoke') {
        newValue = Math.max(0, Math.min(100, sensor.value + randomRange(-5, 5)));
      }

      let newStatus: 'normal' | 'warning' | 'alarm' | 'offline' = sensor.status;
      if (Math.random() > 0.95) {
        newStatus = 'offline';
      } else if (newValue >= sensor.threshold.alarm) {
        newStatus = 'alarm';
      } else if (newValue >= sensor.threshold.warning) {
        newStatus = 'warning';
      } else {
        newStatus = 'normal';
      }

      return {
        ...sensor,
        value: newValue,
        status: newStatus,
        lastUpdate: now,
      };
    });
  }

  updateChannels(): ChannelData[] {
    return this.channels.map(ch => ({
      ...ch,
      congestionLevel: Math.max(0, Math.min(100, ch.congestionLevel + randomRange(-5, 5))),
      vehicleCount: Math.max(0, ch.vehicleCount + randomInt(-1, 1)),
    }));
  }

  generateAlarms(shelves: ShelfData[], sensors: SensorData[], forklifts: ForkliftData[], channels: ChannelData[]): AlarmData[] {
    const alarms: AlarmData[] = [];
    const now = Date.now();

    for (const shelf of shelves) {
      if (shelf.status === 'alarm') {
        alarms.push({
          id: generateId('alarm'),
          level: 'warning',
          type: 'capacity',
          targetId: shelf.id,
          targetType: 'shelf',
          message: `${shelf.code} 库存容量超过 ${(shelf.utilization * 100).toFixed(1)}%`,
          timestamp: now - randomInt(0, 60000),
          status: 'unhandled',
        });
      }
      if (shelf.temperature >= ALARM_CONFIG.temperature.alarm) {
        alarms.push({
          id: generateId('alarm'),
          level: 'critical',
          type: 'temperature',
          targetId: shelf.id,
          targetType: 'shelf',
          message: `${shelf.code} 温度异常: ${shelf.temperature.toFixed(1)}°C`,
          timestamp: now - randomInt(0, 30000),
          status: 'unhandled',
        });
      }
      if (shelf.humidity >= ALARM_CONFIG.humidity.alarm) {
        alarms.push({
          id: generateId('alarm'),
          level: 'warning',
          type: 'humidity',
          targetId: shelf.id,
          targetType: 'shelf',
          message: `${shelf.code} 湿度过高: ${shelf.humidity.toFixed(1)}%`,
          timestamp: now - randomInt(0, 45000),
          status: 'unhandled',
        });
      }
    }

    for (const sensor of sensors) {
      if (sensor.status === 'offline') {
        alarms.push({
          id: generateId('alarm'),
          level: 'warning',
          type: 'offline',
          targetId: sensor.id,
          targetType: 'sensor',
          message: `${sensor.code} 设备离线`,
          timestamp: now - randomInt(60000, 300000),
          status: 'unhandled',
        });
      } else if (sensor.status === 'alarm') {
        alarms.push({
          id: generateId('alarm'),
          level: sensor.type === 'smoke' ? 'critical' : 'warning',
          type: sensor.type as any,
          targetId: sensor.id,
          targetType: 'sensor',
          message: `${sensor.code} 数值异常: ${sensor.value}`,
          timestamp: now - randomInt(0, 30000),
          status: 'unhandled',
        });
      }
    }

    for (const fl of forklifts) {
      if (fl.status === 'offline') {
        alarms.push({
          id: generateId('alarm'),
          level: 'warning',
          type: 'offline',
          targetId: fl.id,
          targetType: 'forklift',
          message: `${fl.code} 叉车离线`,
          timestamp: now - randomInt(120000, 600000),
          status: 'unhandled',
        });
      }
      if (fl.status === 'error') {
        alarms.push({
          id: generateId('alarm'),
          level: 'critical',
          type: 'offline',
          targetId: fl.id,
          targetType: 'forklift',
          message: `${fl.code} 叉车故障`,
          timestamp: now - randomInt(0, 60000),
          status: 'processing',
        });
      }
      if (fl.battery < 20 && fl.status === 'working') {
        alarms.push({
          id: generateId('alarm'),
          level: 'info',
          type: 'offline',
          targetId: fl.id,
          targetType: 'forklift',
          message: `${fl.code} 电量低: ${fl.battery.toFixed(1)}%`,
          timestamp: now - randomInt(0, 120000),
          status: 'unhandled',
        });
      }
    }

    for (const ch of channels) {
      if (ch.congestionLevel >= ALARM_CONFIG.congestion.alarm) {
        alarms.push({
          id: generateId('alarm'),
          level: 'warning',
          type: 'congestion',
          targetId: ch.id,
          targetType: 'channel',
          message: `${ch.code} 通道拥堵: ${ch.congestionLevel.toFixed(1)}%`,
          timestamp: now - randomInt(0, 30000),
          status: 'unhandled',
        });
      }
    }

    return alarms.sort((a, b) => {
      const levelOrder = { critical: 0, warning: 1, info: 2 };
      if (levelOrder[a.level] !== levelOrder[b.level]) {
        return levelOrder[a.level] - levelOrder[b.level];
      }
      return b.timestamp - a.timestamp;
    });
  }

  generateHistoricalUtilization(days: number = 7): Array<{ date: string; value: number }> {
    const data: Array<{ date: string; value: number }> = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      data.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        value: randomRange(0.65, 0.92),
      });
    }
    return data;
  }

  generateAlarmTrend(hours: number = 24): Array<{ time: string; critical: number; warning: number; info: number }> {
    const data: Array<{ time: string; critical: number; warning: number; info: number }> = [];
    const now = new Date();
    for (let i = hours - 1; i >= 0; i--) {
      const time = new Date(now);
      time.setHours(time.getHours() - i);
      data.push({
        time: `${time.getHours()}:00`,
        critical: randomInt(0, 3),
        warning: randomInt(1, 6),
        info: randomInt(2, 8),
      });
    }
    return data;
  }

  generateForkliftTrack(forkliftId: string, duration: number = 3600000): TrackPoint[] {
    const points: TrackPoint[] = [];
    const now = Date.now();
    const startTime = now - duration;
    let pos: Vector3 = { x: randomRange(-40, 40), y: 0, z: randomRange(-30, 30) };
    let rotation = randomRange(0, Math.PI * 2);

    for (let t = startTime; t <= now; t += 5000) {
      const speed = randomRange(1, 5);
      rotation += randomRange(-0.2, 0.2);
      const dx = Math.sin(rotation) * speed * 0.5;
      const dz = Math.cos(rotation) * speed * 0.5;
      pos = {
        x: Math.max(-55, Math.min(55, pos.x + dx)),
        y: 0,
        z: Math.max(-38, Math.min(38, pos.z + dz)),
      };
      points.push({
        timestamp: t,
        position: { ...pos },
        rotation,
        speed,
      });
    }
    return points;
  }
}
