import type { PartMetadata } from '../types'

export const partMetadata: Record<string, PartMetadata> = {
  main_body: {
    id: 'main_body',
    name: '卫星主体舱',
    category: 'structure',
    description: '卫星的核心结构模块，承载所有子系统和有效载荷',
    specifications: {
      '尺寸': '2.0m × 1.5m × 2.0m',
      '材质': '碳纤维复合材料',
      '质量': '450 kg',
      '设计寿命': '15 年',
    },
    function: '提供结构支撑、热防护和电磁屏蔽，集成各子系统接口',
  },
  solar_panels: {
    id: 'solar_panels',
    name: '太阳能帆板',
    category: 'power',
    description: '高效三结砷化镓太阳能电池阵列，为卫星提供电力',
    specifications: {
      '展开尺寸': '12m × 2.5m',
      '电池类型': 'GaAs 三结太阳电池',
      '转换效率': '30%',
      '额定功率': '28 kW',
      '展开时间': '3 分钟',
    },
    function: '将太阳能转化为电能，为卫星各系统供电并为蓄电池充电',
  },
  antenna: {
    id: 'antenna',
    name: '高增益天线',
    category: 'communication',
    description: '双轴指向可控的高增益抛物面天线',
    specifications: {
      '天线口径': '1.2m',
      '工作频段': 'Ka/X 双频段',
      '增益': '45 dBi',
      '指向精度': '0.1°',
      '数据速率': '1.2 Gbps',
    },
    function: '实现高速数据传输，下行传输遥感数据，上行接收遥控指令',
  },
  sband_antenna: {
    id: 'sband_antenna',
    name: 'S 波段天线',
    category: 'communication',
    description: '全向 S 波段测控天线',
    specifications: {
      '工作频段': '2.0-2.3 GHz',
      '增益': '5 dBi',
      '极化方式': '右旋圆极化',
      '数据速率': '256 kbps',
    },
    function: '提供遥测、遥控和测距功能，保障卫星测控链路',
  },
  thrusters: {
    id: 'thrusters',
    name: '主推进系统',
    category: 'propulsion',
    description: '双组元化学推进系统',
    specifications: {
      '推进剂': '甲基肼/四氧化二氮',
      '推力': '500 N',
      '比冲': '320 s',
      '总冲': '500 kN·s',
    },
    function: '轨道转移、轨道保持和姿态控制提供推力',
  },
  rcs_thrusters: {
    id: 'rcs_thrusters',
    name: '姿态控制喷口',
    category: 'propulsion',
    description: '反作用控制系统，用于精确姿态调整',
    specifications: {
      '推力': '10 N',
      '数量': '12 台',
      '比冲': '280 s',
      '响应时间': '<10 ms',
    },
    function: '提供精确的姿态控制，维持卫星姿态稳定',
  },
  sensors: {
    id: 'sensors',
    name: '传感器系统',
    category: 'sensor',
    description: '姿态确定和环境感知传感器组',
    specifications: {
      '包含': '星敏感器、太阳敏感器、GPS、IMU',
      '姿态精度': '0.001°',
      '更新频率': '10 Hz',
    },
    function: '实时测量卫星姿态、位置和速度，为控制系统提供反馈',
  },
  heat_sinks: {
    id: 'heat_sinks',
    name: '散热系统',
    category: 'thermal',
    description: '主动热控制系统的散热模块',
    specifications: {
      '散热能力': '2 kW',
      '工作温度': '-40°C ~ +60°C',
      '控温精度': '±2°C',
    },
    function: '将卫星内部产生的废热辐射到太空中，维持设备工作温度',
  },
  radiators: {
    id: 'radiators',
    name: '可展开散热器',
    category: 'thermal',
    description: '大型可展开散热面',
    specifications: {
      '展开面积': '8 m²',
      '散热能力': '5 kW',
      '热辐射率': '0.85',
    },
    function: '在高功率工作模式下提供额外散热能力',
  },
  internal_modules: {
    id: 'internal_modules',
    name: '内部模块',
    category: 'internal',
    description: '卫星内部电子设备和蓄电池',
    specifications: {
      '包含': '星载计算机、电源控制器、存储器',
      '处理器': '双核 LEON4',
      '主频': '800 MHz',
      '存储容量': '2 TB',
    },
    function: '数据处理、存储管理、电源分配和系统控制',
  },
  star_tracker: {
    id: 'star_tracker',
    name: '星敏感器',
    category: 'sensor',
    description: '高精度光学姿态测量设备',
    specifications: {
      '精度': '1 角秒',
      '视场': '20° × 20°',
      '更新率': '10 Hz',
      '星等': '6.5 Mv',
    },
    function: '通过识别恒星图案确定卫星在惯性空间的姿态',
  },
  imu: {
    id: 'imu',
    name: '惯性测量单元',
    category: 'sensor',
    description: '六轴惯性测量组件',
    specifications: {
      '陀螺精度': '0.001°/h',
      '加速度计精度': '10 μg',
      '带宽': '100 Hz',
      '量程': '±10 g',
    },
    function: '测量角速率和线加速度，提供短期姿态和运动信息',
  },
  battery_module: {
    id: 'battery_module',
    name: '蓄电池组',
    category: 'power',
    description: '锂离子蓄电池组',
    specifications: {
      '容量': '150 Ah',
      '电压': '28 V',
      '循环寿命': '50000 次',
      '放电深度': '40%',
    },
    function: '在地影期为卫星供电，平滑太阳能功率输出',
  },
}

export function getPartMetadata(partId: string): PartMetadata | undefined {
  return partMetadata[partId]
}

export function getAllPartMetadata(): PartMetadata[] {
  return Object.values(partMetadata)
}
