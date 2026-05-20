import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { RackData, EngineStats } from '@/core/types'
import { DatacenterEngine } from '@/core/DatacenterEngine'
import { generateRackData } from '@/assets/dataGenerator'

export function useDatacenterEngine() {
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const engine = ref<DatacenterEngine | null>(null)
  const hoveredRack = ref<RackData | null>(null)
  const selectedRack = ref<RackData | null>(null)
  const stats = ref<EngineStats>({
    fps: 0,
    frameCount: 0,
    renderTime: 0,
    instanceCount: 0
  })
  const tooltipPosition = ref({ x: 0, y: 0, visible: false })
  const isInitialized = ref(false)

  const initEngine = () => {
    if (!canvasRef.value || engine.value) return

    engine.value = new DatacenterEngine(canvasRef.value)

    const racks = generateRackData(10000)
    engine.value.loadData(racks)

    engine.value.setOnHover((rack) => {
      hoveredRack.value = rack
      if (rack && engine.value) {
        const pos = engine.value.getRackScreenPosition(rack)
        tooltipPosition.value = {
          x: pos.x,
          y: pos.y,
          visible: pos.visible
        }
      } else {
        tooltipPosition.value.visible = false
      }
    })

    engine.value.setOnClick((rack) => {
      selectedRack.value = rack
    })

    engine.value.setOnStatsUpdate((newStats) => {
      stats.value = newStats
    })

    engine.value.start()
    isInitialized.value = true
  }

  const handleResize = () => {
    if (!canvasRef.value || !engine.value) return
    engine.value.resize(canvasRef.value.clientWidth, canvasRef.value.clientHeight)
  }

  const resetView = () => {
    engine.value?.resetView()
    selectedRack.value = null
  }

  const clearSelection = () => {
    selectedRack.value = null
  }

  onMounted(() => {
    initEngine()
    window.addEventListener('resize', handleResize)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
    engine.value?.dispose()
  })

  return {
    canvasRef,
    engine,
    hoveredRack,
    selectedRack,
    stats,
    tooltipPosition,
    isInitialized,
    resetView,
    clearSelection
  }
}
