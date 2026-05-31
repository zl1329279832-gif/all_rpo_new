export type LightMode = 'day' | 'dusk' | 'night'

export type CameraMode = 'roam' | 'topdown'

export type StructureLayer = 'foundation' | 'columns' | 'walls' | 'roof' | 'all'

export interface BuildingComponent {
  id: string
  name: string
  description: string
  category: string
  position: { x: number; y: number; z: number }
}

export interface LightConfig {
  ambientIntensity: number
  ambientColor: number
  directionalIntensity: number
  directionalColor: number
  directionalPosition: { x: number; y: number; z: number }
  hemisphereIntensity?: number
  hemisphereSkyColor?: number
  hemisphereGroundColor?: number
  pointLights?: Array<{
    position: { x: number; y: number; z: number }
    color: number
    intensity: number
    distance: number
  }>
  fogColor: number
  fogNear: number
  fogFar: number
  background: number
}

export interface TextureConfig {
  color: number
  roughness?: number
  metalness?: number
  repeat?: { x: number; y: number }
  emissive?: number
  emissiveIntensity?: number
}

export interface BuildingConfig {
  position: { x: number; y: number; z: number }
  width: number
  depth: number
  height: number
  rotation?: number
}

export const COMPONENT_INFO: Record<string, { name: string; description: string; category: string }> = {
  'roof-main': {
    name: '正殿屋顶',
    description: '重檐歇山顶，采用灰色筒瓦铺设，屋脊装饰有脊兽，飞檐翘角曲线优美，体现中国古建筑"如鸟斯革，如翚斯飞"的艺术特色。',
    category: '屋顶'
  },
  'roof-side': {
    name: '厢房屋顶',
    description: '硬山顶，为两侧厢房的屋顶形式，等级次于正殿，单坡瓦面，山墙突出，体现传统院落的等级制度。',
    category: '屋顶'
  },
  'roof-gate': {
    name: '牌楼屋顶',
    description: '三间四柱七楼式牌楼，屋顶层次丰富，斗拱支撑出檐深远，是院落的标志性入口建筑。',
    category: '屋顶'
  },
  'dougong': {
    name: '斗拱',
    description: '中国古建筑特有的木结构构件，由方形的斗、升、拱、翘、昂组成，位于立柱和横梁交接处，既承托屋檐重量，又具有装饰作用，是建筑等级的重要标志。',
    category: '木结构'
  },
  'column': {
    name: '立柱',
    description: '红漆木柱，采用抬梁式结构体系，柱顶有卷杀，柱身微有"侧脚"和"生起"，增强建筑整体稳定性。',
    category: '梁柱'
  },
  'beam': {
    name: '梁枋',
    description: '木结构中的水平承重构件，与立柱共同构成"梁柱式"结构体系，梁枋上多有彩画装饰。',
    category: '梁柱'
  },
  'wall': {
    name: '院墙',
    description: '青砖砌筑的围墙，采用"磨砖对缝"工艺，墙顶为小青瓦压顶，围合出私密的庭院空间。',
    category: '墙体'
  },
  'door': {
    name: '隔扇门',
    description: '棂格隔扇门，由抹头、绦环板、裙板组成，棂格图案丰富多样，兼具通风采光和装饰功能。',
    category: '门窗'
  },
  'window': {
    name: '花窗',
    description: '木格栅花窗，采用冰裂纹、回纹等传统图案，既装饰墙面又可借景，是中式园林建筑的特色元素。',
    category: '门窗'
  },
  'step': {
    name: '石阶',
    description: '青石台阶，"阶高而基广"，体现建筑的庄重感，台阶数量为奇数，符合传统礼制规定。',
    category: '台基'
  },
  'railing': {
    name: '栏杆',
    description: '木制栏杆，由望柱、寻杖、栏板组成，栏板雕刻传统纹样，兼具防护和装饰作用。',
    category: '台基'
  },
  'lantern': {
    name: '灯笼',
    description: '传统宫灯，六角形框架，纱绢罩面，夜间点亮时红光摇曳，烘托庭院典雅氛围。',
    category: '装饰'
  },
  'tree': {
    name: '庭院树木',
    description: '庭院种植的松柏和槐树，寓意"松鹤延年"、"门前一棵槐，财源滚滚来"，是传统民居绿化的常见选择。',
    category: '环境'
  },
  'floor': {
    name: '石板地面',
    description: '青石板铺地，采用"十字缝"或"人字纹"铺设方式，古朴自然，雨天不易滑倒。',
    category: '台基'
  },
  'foundation': {
    name: '台基',
    description: '砖石砌筑的台基，抬高建筑主体，起到防水防潮和突出建筑等级的作用，"高台榭，美宫室"是中国古建筑的重要特征。',
    category: '台基'
  },
  'ridge': {
    name: '屋脊',
    description: '正脊和垂脊，上有脊兽装饰，正脊两端为"鸱吻"，垂脊上依次排列仙人走兽，数量越多等级越高。',
    category: '屋顶'
  },
  'eave': {
    name: '飞檐',
    description: '屋角向上翘起的飞檐，形成优美的曲线，既扩大采光面，又利于排水，"飞檐翘角"是中式建筑最具辨识度的特征之一。',
    category: '屋顶'
  },
  'tile': {
    name: '筒瓦',
    description: '灰色陶制筒瓦，断面呈半圆形，与板瓦相互叠压铺设，瓦头有"瓦当"和"滴水"，装饰有云纹、动物纹等图案。',
    category: '屋顶'
  },
  'paifang': {
    name: '牌楼',
    description: '作为院落入口的标志性建筑，三间四柱三楼式，具有表彰、装饰、标识空间等功能，是中国特有的建筑形式。',
    category: '建筑'
  },
  'main-hall': {
    name: '正殿',
    description: '院落主体建筑，体量最大、等级最高，采用抬梁式木构架，是举行重要活动的场所。',
    category: '建筑'
  },
  'wing-room': {
    name: '厢房',
    description: '两侧的附属建筑，体量小于正殿，为居住或辅助用房，体现传统院落"北屋为尊，两厢次之"的布局理念。',
    category: '建筑'
  }
}
