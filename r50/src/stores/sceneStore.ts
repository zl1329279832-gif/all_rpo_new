import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LightMode, CameraMode, StructureLayer } from '@/types'
import type { ComponentInfo } from '@/interactions/ComponentLabelSystem'

export const useSceneStore = defineStore('scene', () => {
  const lightMode = ref<LightMode>('day')
  const cameraMode = ref<CameraMode>('topdown')
  const structureLayer = ref<StructureLayer>('all')
  const selectedComponent = ref<ComponentInfo | null>(null)
  const hoveredComponent = ref<ComponentInfo | null>(null)
  const isLoading = ref(true)
  const showHelp = ref(false)

  const lightModeLabel = computed(() => {
    const labels: Record<LightMode, string> = {
      day: '白天',
      dusk: '黄昏',
      night: '夜晚'
    }
    return labels[lightMode.value]
  })

  const cameraModeLabel = computed(() => {
    const labels: Record<CameraMode, string> = {
      roam: '漫游模式',
      topdown: '俯视模式'
    }
    return labels[cameraMode.value]
  })

  const structureLayerLabel = computed(() => {
    const labels: Record<StructureLayer, string> = {
      foundation: '地基台基',
      columns: '梁柱结构',
      walls: '墙体门窗',
      roof: '屋顶系统',
      all: '完整建筑'
    }
    return labels[structureLayer.value]
  })

  function setLightMode(mode: LightMode) {
    lightMode.value = mode
  }

  function setCameraMode(mode: CameraMode) {
    cameraMode.value = mode
  }

  function setStructureLayer(layer: StructureLayer) {
    structureLayer.value = layer
  }

  function setSelectedComponent(info: ComponentInfo | null) {
    selectedComponent.value = info
  }

  function setHoveredComponent(info: ComponentInfo | null) {
    hoveredComponent.value = info
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function toggleHelp() {
    showHelp.value = !showHelp.value
  }

  return {
    lightMode,
    cameraMode,
    structureLayer,
    selectedComponent,
    hoveredComponent,
    isLoading,
    showHelp,
    lightModeLabel,
    cameraModeLabel,
    structureLayerLabel,
    setLightMode,
    setCameraMode,
    setStructureLayer,
    setSelectedComponent,
    setHoveredComponent,
    setLoading,
    toggleHelp
  }
})
