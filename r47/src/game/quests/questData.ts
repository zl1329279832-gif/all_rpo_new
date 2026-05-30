import type { Quest } from '../types';

export const QUEST_LINE_PEARL: Quest = {
  id: 'pearl_of_silk_road',
  name: '丝路明珠',
  steps: [
    {
      description: '在长安购买 5 单位丝绸',
      targetCity: 'changan',
      targetGood: 'silk',
      targetQuantity: 5,
      reward: 100,
      completed: false,
    },
    {
      description: '将丝绸运至撒马尔罕出售',
      targetCity: 'samarkand',
      targetGood: 'silk',
      targetQuantity: 5,
      reward: 200,
      completed: false,
    },
    {
      description: '从巴格达购买 3 单位黄金',
      targetCity: 'baghdad',
      targetGood: 'gold',
      targetQuantity: 3,
      reward: 300,
      completed: false,
    },
    {
      description: '将黄金送达君士坦丁堡',
      targetCity: 'constantinople',
      targetGood: 'gold',
      targetQuantity: 3,
      reward: 500,
      completed: false,
    },
  ],
};

export const QUEST_LINE_LEGEND: Quest = {
  id: 'legend_of_trade_route',
  name: '商道传奇',
  steps: [
    {
      description: '在敦煌购买 4 单位香料',
      targetCity: 'dunhuang',
      targetGood: 'spice',
      targetQuantity: 4,
      reward: 80,
      completed: false,
    },
    {
      description: '将香料运至巴格达出售',
      targetCity: 'baghdad',
      targetGood: 'spice',
      targetQuantity: 4,
      reward: 150,
      completed: false,
    },
    {
      description: '从喀什购买 3 单位宝石',
      targetCity: 'kashgar',
      targetGood: 'gem',
      targetQuantity: 3,
      reward: 250,
      completed: false,
    },
    {
      description: '将宝石运至长安',
      targetCity: 'changan',
      targetGood: 'gem',
      targetQuantity: 3,
      reward: 400,
      completed: false,
    },
  ],
};
