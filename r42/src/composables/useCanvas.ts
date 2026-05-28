import { ref, onMounted, onUnmounted } from 'vue';
import type { GameState } from '../types';
import { GameRenderer } from '../renderer/GameRenderer';

export function useCanvas(getState: () => GameState | null, getSelectedSector: () => string | null, getSelectedShip: () => string | null) {
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const renderer = ref<GameRenderer | null>(null);
  const lastTime = ref(performance.now());

  function handleResize(): void {
    if (!canvasRef.value || !renderer.value) return;
    const rect = canvasRef.value.parentElement?.getBoundingClientRect();
    if (rect) {
      renderer.value.resize(rect.width, rect.height);
    }
  }

  function renderFrame(): void {
    if (!renderer.value || !getState()) return;
    const now = performance.now();
    const dt = Math.min(0.1, (now - lastTime.value) / 1000);
    lastTime.value = now;
    renderer.value.render(getState()!, getSelectedSector(), getSelectedShip(), dt);
  }

  function handleClick(event: MouseEvent): { type: 'sector' | 'ship' | 'none'; id: string | null } {
    if (!canvasRef.value || !renderer.value || !getState()) {
      return { type: 'none', id: null };
    }
    const rect = canvasRef.value.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const shipId = renderer.value.getShipAt(x, y, getState()!);
    if (shipId) return { type: 'ship', id: shipId };
    const sectorId = renderer.value.getSectorAt(x, y, getState()!);
    if (sectorId) return { type: 'sector', id: sectorId };
    return { type: 'none', id: null };
  }

  onMounted(() => {
    if (canvasRef.value) {
      renderer.value = new GameRenderer(canvasRef.value);
      handleResize();
      window.addEventListener('resize', handleResize);
    }
  });

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
  });

  return { canvasRef, renderFrame, handleClick, handleResize, getShipPosition: (ship: any) => renderer.value?.getShipPosition(ship, getState()!) };
}
