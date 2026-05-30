import type { GameEvent } from '../types'

export const EVENT_POOL: GameEvent[] = [
  {
    id: 'sandstorm',
    name: '沙暴',
    description:
      '漫天黄沙席卷而来，能见度骤降，商队前进受阻。狂风卷起沙砾打在脸上，骆驼不安地嘶鸣。',
    type: 'weather',
    probability: 0.15,
    choices: [
      {
        text: '绕道前行',
        effects: { gold: -10, addDays: 1 },
      },
      {
        text: '原地等待',
        effects: { addDays: 2 },
      },
    ],
  },
  {
    id: 'bandit_ambush',
    name: '盗匪伏击',
    description:
      '前方山谷中突然涌出一伙蒙面盗匪，他们手持弯刀挡住去路，要求留下买路财。',
    type: 'bandit',
    probability: 0.2,
    choices: [
      {
        text: '雇佣护卫迎战',
        effects: { gold: -20 },
        successChance: 0.6,
        successEffects: { reputation: 10 },
        failEffects: { loseCargoPercent: 30, gold: -20 },
      },
      {
        text: '弃货保命',
        effects: { loseCargoPercent: 30 },
      },
    ],
  },
  {
    id: 'merchant_encounter',
    name: '行商偶遇',
    description:
      '路遇一位经验丰富的行商，他向你招手示意，似乎有情报或合作意向。',
    type: 'merchant',
    probability: 0.15,
    choices: [
      {
        text: '交换情报',
        effects: { reputation: 5 },
      },
      {
        text: '合作交易',
        effects: { reputation: 3 },
      },
    ],
  },
  {
    id: 'oasis_discovery',
    name: '绿洲发现',
    description:
      '在荒漠中意外发现了一处隐秘绿洲，清澈泉水与荫凉树荫令人精神一振。',
    type: 'discovery',
    probability: 0.1,
    choices: [
      {
        text: '休整补给',
        effects: { restoreShelfLife: 5, reputation: 5 },
      },
    ],
  },
  {
    id: 'plague_outbreak',
    name: '瘟疫蔓延',
    description:
      '前方城镇传出瘟疫消息，商路被封锁。你可以绕行他路，或冒险穿越疫区。',
    type: 'plague',
    probability: 0.08,
    choices: [
      {
        text: '绕道避疫',
        effects: { gold: -30, addDays: 1 },
      },
      {
        text: '冒险通过',
        effects: {},
        successChance: 0.5,
        successEffects: { reputation: 15 },
        failEffects: { gold: -20 },
      },
    ],
  },
  {
    id: 'sandstorm_minor',
    name: '小沙暴',
    description:
      '一阵小型沙暴掠过，虽无大碍但行进速度明显放缓，需要减速谨慎前行。',
    type: 'weather',
    probability: 0.12,
    choices: [
      {
        text: '减速前进',
        effects: { addDays: 1 },
      },
    ],
  },
  {
    id: 'noble_request',
    name: '贵族请求',
    description:
      '一位当地贵族的管家找到你，说主人急需一批特定货物，愿意以声望作为回报。',
    type: 'merchant',
    probability: 0.1,
    choices: [
      {
        text: '接受委托',
        effects: { reputation: 15, loseCargoPercent: 10 },
      },
      {
        text: '婉言谢绝',
        effects: { reputation: -5 },
      },
    ],
  },
  {
    id: 'lost_caravan',
    name: '迷途商队',
    description:
      '遇到一支迷路的商队，他们看起来疲惫不堪，向你求助指引方向。',
    type: 'discovery',
    probability: 0.08,
    choices: [
      {
        text: '指引方向',
        effects: { reputation: 10 },
      },
      {
        text: '趁火打劫',
        effects: { reputation: -20 },
      },
    ],
  },
  {
    id: 'river_flood',
    name: '河水泛滥',
    description:
      '连日暴雨导致前方河流暴涨，渡口水流湍急，想要过河必须谨慎抉择。',
    type: 'weather',
    probability: 0.1,
    choices: [
      {
        text: '等待退水',
        effects: { addDays: 2 },
      },
      {
        text: '渡河冒险',
        effects: {},
        successChance: 0.5,
        successEffects: { reputation: 5 },
        failEffects: { loseCargoPercent: 25 },
      },
    ],
  },
  {
    id: 'toll_extortion',
    name: '关卡勒索',
    description:
      '前方的关卡守卫百般刁难，声称必须缴纳高额"保护费"才能通行。',
    type: 'bandit',
    probability: 0.12,
    choices: [
      {
        text: '缴纳过路费',
        effects: { gold: -50 },
      },
      {
        text: '据理力争',
        effects: {},
        successChance: 0.4,
        successEffects: { reputation: 8 },
        failEffects: { gold: -80 },
      },
    ],
  },
]
