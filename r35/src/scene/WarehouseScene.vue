<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useWarehouseStore } from '@/data/warehouseStore';
import { SceneManager } from '@/scene/SceneManager';
import { RenderLoop } from '@/scene/RenderLoop';
import { PostProcessingManager } from '@/scene/EffectComposer';
import { WarehouseBuilder } from '@/models/Warehouse';
import { ShelfBuilder } from '@/models/Shelf';
import { ForkliftBuilder } from '@/models/Forklift';
import { LoadingDockBuilder, SensorBuilder, ChannelBuilder } from '@/models/LoadingDock';
import { RaycasterManager } from '@/interactions/Raycaster';
import { LabelManager } from '@/interactions/LabelManager';
import { CameraController } from '@/interactions/CameraController';
import { SearchLocator } from '@/interactions/SearchLocator';
import { PlaybackController } from '@/interactions/PlaybackController';
import type { PickedObject, AlarmData, ShelfData, ForkliftData, SensorData, LoadingDockData } from '@/types';
import { COLORS, SCENE_CONFIG } from '@/config';

const store = useWarehouseStore();
const sceneContainer = ref<HTMLElement | null>(null);

const sceneManager = SceneManager.getInstance();
const renderLoop = RenderLoop.getInstance();
const postProcessing = PostProcessingManager.getInstance();
const raycaster = RaycasterManager.getInstance();
const labelManager = LabelManager.getInstance();
const cameraController = CameraController.getInstance();
const searchLocator = SearchLocator.getInstance();
const playbackController = PlaybackController.getInstance();

let isInitialized = false;
let animationUpdateCallback: ((delta: number, elapsed: number) => void) | null = null;

const emit = defineEmits<{
  (e: 'objectPicked', obj: PickedObject | null): void;
  (e: 'objectHovered', obj: PickedObject | null): void;
}>();

function initScene() {
  if (!sceneContainer.value || isInitialized) return;

  sceneManager.init(sceneContainer.value);
  postProcessing.init(sceneContainer.value);

  const warehouseBuilder = new WarehouseBuilder(sceneManager);
  const warehouse = warehouseBuilder.build();
  sceneManager.scene.add(warehouse);

  buildShelves();
  buildForklifts();
  buildSensors();
  buildLoadingDocks();
  buildChannels();

  raycaster.init();
  labelManager.init(sceneContainer.value);
  setupInteractions();

  animationUpdateCallback = (delta: number, elapsed: number) => {
    updateAnimations(elapsed);
    postProcessing.render();
  };

  renderLoop.addCallback(animationUpdateCallback);
  renderLoop.start();

  store.startDataRefresh();

  isInitialized = true;
}

function buildShelves() {
  store.shelves.forEach(shelf => {
    const shelfGroup = ShelfBuilder.createShelf(shelf);
    sceneManager.shelvesGroup.add(shelfGroup);

    const labelData = labelManager.createLabelFromPickedObject(
      { type: 'shelf', id: shelf.id, data: shelf },
      shelfGroup
    );
    if (labelData) {
      labelManager.addLabel(labelData);
    }
  });
}

function buildForklifts() {
  store.forklifts.forEach(forklift => {
    const forkliftGroup = ForkliftBuilder.createForklift(forklift);
    sceneManager.forkliftsGroup.add(forkliftGroup);

    const labelData = labelManager.createLabelFromPickedObject(
      { type: 'forklift', id: forklift.id, data: forklift },
      forkliftGroup
    );
    if (labelData) {
      labelManager.addLabel(labelData);
    }
  });
}

function buildSensors() {
  store.sensors.forEach(sensor => {
    const sensorGroup = SensorBuilder.createSensor(sensor);
    sceneManager.sensorsGroup.add(sensorGroup);
  });
}

function buildLoadingDocks() {
  store.loadingDocks.forEach(dock => {
    const dockGroup = LoadingDockBuilder.createDock(dock);
    sceneManager.docksGroup.add(dockGroup);

    const labelData = labelManager.createLabelFromPickedObject(
      { type: 'dock', id: dock.id, data: dock },
      dockGroup
    );
    if (labelData) {
      labelManager.addLabel(labelData);
    }
  });
}

function buildChannels() {
  store.channels.forEach(channel => {
    const channelGroup = ChannelBuilder.createChannel(channel);
    sceneManager.channelsGroup.add(channelGroup);
  });
}

function setupInteractions() {
  raycaster.onClick((obj) => {
    store.setPickedObject(obj);
    emit('objectPicked', obj);
  });

  raycaster.onHover((obj) => {
    if (obj) {
      labelManager.setHoveredLabel(obj.id);
    } else {
      labelManager.setHoveredLabel(null);
    }
    emit('objectHovered', obj);
  });
}

function updateAnimations(elapsedTime: number) {
  sceneManager.forkliftsGroup.children.forEach((group, index) => {
    const forkliftData = store.forklifts[index];
    if (forkliftData) {
      ForkliftBuilder.updateForklift(group as THREE.Group, forkliftData);

      const labelData = labelManager.createLabelFromPickedObject(
        { type: 'forklift', id: forkliftData.id, data: forkliftData },
        group as THREE.Group
      );
      if (labelData) {
        labelManager.updateLabel(labelData);
      }
    }
  });

  sceneManager.sensorsGroup.children.forEach((group, index) => {
    const sensorData = store.sensors[index];
    if (sensorData) {
      SensorBuilder.updateSensor(group as THREE.Group, sensorData);
    }
  });

  sceneManager.channelsGroup.children.forEach((group, index) => {
    const channelData = store.channels[index];
    if (channelData) {
      ChannelBuilder.updateChannel(group as THREE.Group, channelData);
    }
  });

  sceneManager.docksGroup.children.forEach((group, index) => {
    const dockData = store.loadingDocks[index];
    if (dockData) {
      LoadingDockBuilder.updateDock(group as THREE.Group, dockData);
    }
  });

  const time = Date.now() * 0.001;
  sceneManager.shelvesGroup.children.forEach((group, index) => {
    const shelfData = store.shelves.find(s => `shelf_${s.id}` === group.name);
    if (shelfData) {
      ShelfBuilder.updateShelf(group as THREE.Group, shelfData);

      const labelData = labelManager.createLabelFromPickedObject(
        { type: 'shelf', id: shelfData.id, data: shelfData },
        group as THREE.Group
      );
      if (labelData) {
        labelManager.updateLabel(labelData);
      }

      if (shelfData.status === 'alarm') {
        const edges = group.getObjectByName('shelf_edges') as THREE.LineSegments;
        if (edges) {
          const pulse = Math.sin(time * 4) * 0.3 + 0.7;
          (edges.material as THREE.LineBasicMaterial).opacity = pulse;
        }
      }
    }
  });
}

function handleSearch(query: string) {
  const results = searchLocator.search(query, store.shelves);
  if (results.length > 0) {
    const shelf = searchLocator.locateById(results[0].id, store.shelves);
    if (shelf) {
      labelManager.highlightSearchedLabel(shelf.id);
    }
  }
}

function handleLocateAlarm(alarm: AlarmData) {
  const target = store.shelves.find(s => s.id === alarm.targetId) ||
                 store.forklifts.find(f => f.id === alarm.targetId) ||
                 store.sensors.find(s => s.id === alarm.targetId);

  if (target) {
    cameraController.focusOnPosition(target.position);
    labelManager.highlightSearchedLabel(alarm.targetId);
  }
}

function handleCameraViewChange(view: any) {
  cameraController.setView(view);
}

function handleFloorChange(floor: number) {
  sceneManager.setFloorVisible(floor);
}

function handlePlaybackTrack(forkliftId: string) {
  const track = store.forkliftTracks.get(forkliftId);
  if (track) {
    playbackController.loadTrack(forkliftId, track);
    store.setSelectedForklift(forkliftId);
  }
}

watch(
  () => store.searchQuery,
  (query) => {
    if (query) {
      handleSearch(query);
    }
  }
);

watch(
  () => store.currentCameraView,
  (view) => {
    handleCameraViewChange(view);
  }
);

watch(
  () => store.currentFloor,
  (floor) => {
    handleFloorChange(floor);
  }
);

watch(
  () => store.selectedForkliftId,
  (id) => {
    if (id) {
      handlePlaybackTrack(id);
    }
  }
);

onMounted(() => {
  initScene();
});

onUnmounted(() => {
  if (animationUpdateCallback) {
    renderLoop.removeCallback(animationUpdateCallback);
  }

  store.stopDataRefresh();
  renderLoop.dispose();
  postProcessing.dispose();
  raycaster.dispose();
  labelManager.dispose();
  searchLocator.dispose();
  playbackController.dispose();
  ShelfBuilder.dispose();
  sceneManager.dispose();
});

defineExpose({
  handleLocateAlarm,
});
</script>

<template>
  <div ref="sceneContainer" class="scene-container">
    <div class="scene-overlay">
      <div class="corner-decoration top-left"></div>
      <div class="corner-decoration top-right"></div>
      <div class="corner-decoration bottom-left"></div>
      <div class="corner-decoration bottom-right"></div>
    </div>

    <div class="scene-stats">
      <div class="stat-item">
        <span class="stat-label">FPS</span>
        <span class="stat-value font-mono">{{ renderLoop.getFps() }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">对象数</span>
        <span class="stat-value font-mono">{{ sceneManager.scene.children.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">绘制调用</span>
        <span class="stat-value font-mono">-</span>
      </div>
    </div>

    <div class="scene-hint">
      <div class="hint-item">
        <kbd>鼠标左键</kbd> 旋转视角
      </div>
      <div class="hint-item">
        <kbd>鼠标滚轮</kbd> 缩放
      </div>
      <div class="hint-item">
        <kbd>鼠标右键</kbd> 平移
      </div>
      <div class="hint-item">
        <kbd>点击</kbd> 查看详情
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.scene-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  background: var(--bg-primary);
}

.scene-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;

  .corner-decoration {
    position: absolute;
    width: 40px;
    height: 40px;
    border: 2px solid var(--color-primary);
    opacity: 0.5;

    &.top-left {
      top: 16px;
      left: 16px;
      border-right: none;
      border-bottom: none;
    }

    &.top-right {
      top: 16px;
      right: 16px;
      border-left: none;
      border-bottom: none;
    }

    &.bottom-left {
      bottom: 16px;
      left: 16px;
      border-right: none;
      border-top: none;
    }

    &.bottom-right {
      bottom: 16px;
      right: 16px;
      border-left: none;
      border-top: none;
    }
  }
}

.scene-stats {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  gap: 16px;
  padding: 10px 16px;
  background: var(--bg-glass);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  z-index: 20;
  font-size: 11px;

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;

    .stat-label {
      color: var(--text-tertiary);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-value {
      color: var(--color-primary-light);
      font-weight: 700;
      font-size: 13px;
    }
  }
}

.scene-hint {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 16px;
  padding: 8px 16px;
  background: var(--bg-glass);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-primary);
  border-radius: 20px;
  z-index: 20;

  .hint-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--text-tertiary);

    kbd {
      padding: 2px 8px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-secondary);
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: var(--text-secondary);
    }
  }
}
</style>
