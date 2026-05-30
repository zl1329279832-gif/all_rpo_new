import type { Quest, QuestStep, CaravanState } from '../types';
import { QUEST_LINE_PEARL, QUEST_LINE_LEGEND } from './questData';

export function createInitialQuests(): Quest[] {
  return [
    JSON.parse(JSON.stringify(QUEST_LINE_PEARL)),
    JSON.parse(JSON.stringify(QUEST_LINE_LEGEND)),
  ];
}

export function checkQuestProgress(
  quests: Quest[],
  caravan: CaravanState,
  cityId: string,
): Quest[] {
  return quests.map((quest) => {
    const updatedSteps = quest.steps.map((step) => {
      if (step.completed) return step;
      if (step.targetCity !== cityId) return step;

      const cargoItem = caravan.cargo.find(
        (item) => item.goodId === step.targetGood,
      );
      if (!cargoItem) return step;
      if (cargoItem.quantity < step.targetQuantity) return step;

      caravan.gold += step.reward;

      return { ...step, completed: true };
    });

    return { ...quest, steps: updatedSteps };
  });
}

export function getActiveQuestStep(quest: Quest): QuestStep | null {
  const step = quest.steps.find((s) => !s.completed);
  return step ?? null;
}

export function isQuestComplete(quest: Quest): boolean {
  return quest.steps.every((s) => s.completed);
}
