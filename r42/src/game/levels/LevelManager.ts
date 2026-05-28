import type { GameState, ScoreResult } from '../../types';
import { LEVEL_CONFIGS } from './levelData';

export function checkObjectives(state: GameState): boolean {
  const config = LEVEL_CONFIGS.find(c => c.id === state.levelId);
  if (!config) return false;

  return config.objectives.every(obj => {
    const stack = state.warehouse.find(s => s.type === obj.type);
    return stack !== undefined && stack.amount >= obj.amount;
  });
}

export function calculateScore(state: GameState): ScoreResult {
  const config = LEVEL_CONFIGS.find(c => c.id === state.levelId);
  if (!config) {
    return {
      resourceScore: 0,
      timeScore: 0,
      lossScore: 0,
      totalScore: 0,
      grade: 'C',
      stats: {
        totalResources: 0,
        timeSeconds: state.gameTime,
        shipsLost: state.losses,
      },
    };
  }

  const totalObjectiveAmount = config.objectives.reduce((sum, obj) => sum + obj.amount, 0);
  const totalWarehouseAmount = config.objectives.reduce((sum, obj) => {
    const stack = state.warehouse.find(s => s.type === obj.type);
    return sum + (stack ? stack.amount : 0);
  }, 0);
  const resourceRatio = totalWarehouseAmount / totalObjectiveAmount;
  const resourceScore = Math.min(resourceRatio * 40, 40);

  const timeScore = Math.max(0, 30 - state.gameTime / 60);

  const lossScore = Math.max(0, 30 - state.losses * 10);

  const totalScore = Math.floor(resourceScore + timeScore + lossScore);

  let grade: 'S' | 'A' | 'B' | 'C';
  if (totalScore >= 80) grade = 'S';
  else if (totalScore >= 60) grade = 'A';
  else if (totalScore >= 40) grade = 'B';
  else grade = 'C';

  return {
    resourceScore: Math.floor(resourceScore),
    timeScore: Math.floor(timeScore),
    lossScore: Math.floor(lossScore),
    totalScore,
    grade,
    stats: {
      totalResources: totalWarehouseAmount,
      timeSeconds: state.gameTime,
      shipsLost: state.losses,
    },
  };
}
