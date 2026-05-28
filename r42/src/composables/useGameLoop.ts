import { onMounted, onUnmounted, ref } from 'vue';
import { GameLoop } from '../game/core/GameLoop';

export function useGameLoop(onUpdate: (dt: number) => void, onRender: () => void) {
  const loop = ref<GameLoop | null>(null);

  onMounted(() => {
    loop.value = new GameLoop(onUpdate, onRender);
  });

  onUnmounted(() => {
    if (loop.value) {
      loop.value.stop();
    }
  });

  function start(): void {
    loop.value?.start();
  }

  function stop(): void {
    loop.value?.stop();
  }

  function isRunning(): boolean {
    return loop.value?.isRunning() ?? false;
  }

  return { start, stop, isRunning };
}
