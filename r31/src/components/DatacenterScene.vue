<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import type { RackData, EngineStats } from '@/core/types'
import { DatacenterEngine } from '@/core/DatacenterEngine'
import { generateRackData } from '@/assets/dataGenerator'
import RackTooltip from './RackTooltip.vue'
import StatsPanel from './StatsPanel.vue'
import ControlPanel from './ControlPanel.vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let engine: DatacenterEngine | null = null

const hoveredRack = ref<RackData | null>(null)
const selectedRack = ref<RackData | null>(null)
const stats = ref<EngineStats>({
  fps: 0,
  frameCount: 0,
  renderTime: 0,
  instanceCount: 0
})
const tooltipPosition = ref({ x: 0, y: 0, visible: false })

const initEngine = () => {
  if (!canvasRef.value) return

  engine = new DatacenterEngine(canvasRef.value)

  const racks = generateRackData(10000)
  engine.loadData(racks)

  engine.setOnHover((rack) => {
    hoveredRack.value = rack
    if (rack && engine) {
      const pos = engine.getRackScreenPosition(rack)
      tooltipPosition.value = {
        x: pos.x,
        y: pos.y,
        visible: pos.visible
      }
    } else {
      tooltipPosition.value.visible = false
    }
  })

  engine.setOnClick((rack) => {
    selectedRack.value = rack
  })

  engine.setOnStatsUpdate((newStats) => {
    stats.value = newStats
  })

  engine.start()
}

const handleResize = () => {
  if (!canvasRef.value || !engine) return
  engine.resize(canvasRef.value.clientWidth, canvasRef.value.clientHeight)
}

const handleResetView = () => {
  engine?.resetView()
  selectedRack.value = null
}

watch(selectedRack, (rack) => {
  if (rack && engine) {
    const pos = engine.getRackScreenPosition(rack)
    tooltipPosition.value = {
      x: pos.x,
      y: pos.y,
      visible: pos.visible
    }
  }
})

onMounted(() => {
  initEngine()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  engine?.dispose()
})
</script>

<template>
  <div class="datacenter-scene">
    <canvas ref="canvasRef" class="scene-canvas"></canvas>
    
    <RackTooltip
      v-if="hoveredRack || selectedRack"
      :rack="selectedRack || hoveredRack!"
      :position="tooltipPosition"
      :is-selected="!!selectedRack"
    />
    
    <StatsPanel :stats="stats" />
    
    <ControlPanel
      :selected-rack="selectedRack"
      @reset-view="handleResetView"
      @clear-selection="selectedRack = null"
    />
  </div>
</template>

<style scoped>
.datacenter-scene {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.scene-canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
}

.scene-canvas:active {
  cursor: grabbing;
}
</style>
