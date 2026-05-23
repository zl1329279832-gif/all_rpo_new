import * as THREE from 'three';
import { SceneManager } from '@/scene/SceneManager';
import { RenderLoop } from '@/scene/RenderLoop';
import type { PickedObject } from '@/types';
import { LABEL_VISIBLE_DISTANCE } from '@/config';
import { getStatusColor, debounce, throttle } from '@/utils';

export interface LabelData {
  id: string;
  type: string;
  title: string;
  content: string;
  status?: string;
  object3D: THREE.Object3D;
}

interface LabelState {
  element: HTMLElement;
  data: LabelData;
  lastContentUpdate: number;
  lastPositionUpdate: number;
  visible: boolean;
}

export class LabelManager {
  private static instance: LabelManager;
  private sceneManager: SceneManager;
  private renderLoop: RenderLoop;
  private labelsContainer: HTMLElement | null = null;
  private labels: Map<string, LabelState> = new Map();
  private hoveredLabel: string | null = null;
  private updateCallback: (() => void) | null = null;
  private containerRect: DOMRect | null = null;
  private lastRectUpdate: number = 0;
  private readonly RECT_UPDATE_INTERVAL = 500;
  private readonly POSITION_UPDATE_INTERVAL = 16;
  private readonly CONTENT_UPDATE_INTERVAL = 500;

  private tempVector = new THREE.Vector3();
  private tempPosition = new THREE.Vector3();

  private constructor() {
    this.sceneManager = SceneManager.getInstance();
    this.renderLoop = RenderLoop.getInstance();
  }

  static getInstance(): LabelManager {
    if (!LabelManager.instance) {
      LabelManager.instance = new LabelManager();
    }
    return LabelManager.instance;
  }

  init(container: HTMLElement): void {
    this.labelsContainer = document.createElement('div');
    this.labelsContainer.style.position = 'absolute';
    this.labelsContainer.style.top = '0';
    this.labelsContainer.style.left = '0';
    this.labelsContainer.style.width = '100%';
    this.labelsContainer.style.height = '100%';
    this.labelsContainer.style.pointerEvents = 'none';
    this.labelsContainer.style.overflow = 'hidden';
    this.labelsContainer.style.zIndex = '10';
    this.labelsContainer.style.contain = 'strict';

    container.appendChild(this.labelsContainer);

    this.updateRect();
    this.updateCallback = () => this.updateLabels();
    this.renderLoop.addCallback(this.updateCallback);

    window.addEventListener('resize', this.debouncedRectUpdate, { passive: true });
  }

  private debouncedRectUpdate = debounce(() => {
    this.updateRect();
  }, 100);

  private updateRect(): void {
    if (this.sceneManager.renderer?.domElement) {
      this.containerRect = this.sceneManager.renderer.domElement.getBoundingClientRect();
      this.lastRectUpdate = performance.now();
    }
  }

  private ensureRectUpdated(): void {
    const now = performance.now();
    if (!this.containerRect || now - this.lastRectUpdate > this.RECT_UPDATE_INTERVAL) {
      this.updateRect();
    }
  }

  addLabel(data: LabelData): void {
    if (!this.labelsContainer) return;
    if (this.labels.has(data.id)) {
      this.updateLabel(data);
      return;
    }

    const labelElement = this.createLabelElement(data);
    this.labelsContainer.appendChild(labelElement);
    this.labels.set(data.id, {
      element: labelElement,
      data,
      lastContentUpdate: 0,
      lastPositionUpdate: 0,
      visible: true,
    });
  }

  updateLabel(data: LabelData): void {
    const labelState = this.labels.get(data.id);
    if (!labelState) {
      this.addLabel(data);
      return;
    }

    const now = performance.now();
    if (now - labelState.lastContentUpdate < this.CONTENT_UPDATE_INTERVAL &&
        labelState.data.title === data.title &&
        labelState.data.content === data.content &&
        labelState.data.status === data.status) {
      return;
    }

    const labelElement = labelState.element;
    const titleEl = labelElement.querySelector('.label-title') as HTMLElement;
    const contentEl = labelElement.querySelector('.label-content') as HTMLElement;
    const statusDot = labelElement.querySelector('.status-dot') as HTMLElement;

    if (titleEl && labelState.data.title !== data.title) {
      titleEl.textContent = data.title;
    }
    if (contentEl && labelState.data.content !== data.content) {
      contentEl.textContent = data.content;
    }
    if (statusDot && data.status && labelState.data.status !== data.status) {
      statusDot.style.backgroundColor = getStatusColor(data.status);
      statusDot.style.boxShadow = `0 0 8px ${getStatusColor(data.status)}`;
    }

    labelState.data = data;
    labelState.lastContentUpdate = now;
  }

  removeLabel(id: string): void {
    const labelState = this.labels.get(id);
    if (labelState && this.labelsContainer) {
      this.labelsContainer.removeChild(labelState.element);
    }
    this.labels.delete(id);
  }

  showLabel(id: string): void {
    const labelState = this.labels.get(id);
    if (labelState) {
      labelState.element.style.display = 'block';
      labelState.visible = true;
    }
  }

  hideLabel(id: string): void {
    const labelState = this.labels.get(id);
    if (labelState) {
      labelState.element.style.display = 'none';
      labelState.visible = false;
    }
  }

  showAllLabels(): void {
    this.labels.forEach(state => {
      state.element.style.display = 'block';
      state.visible = true;
    });
  }

  hideAllLabels(): void {
    this.labels.forEach(state => {
      state.element.style.display = 'none';
      state.visible = false;
    });
  }

  setHoveredLabel(id: string | null): void {
    if (this.hoveredLabel === id) return;

    if (this.hoveredLabel) {
      const prevLabel = this.labels.get(this.hoveredLabel);
      if (prevLabel) {
        prevLabel.element.classList.remove('label-hovered');
      }
    }

    this.hoveredLabel = id;

    if (id) {
      const currentLabel = this.labels.get(id);
      if (currentLabel) {
        currentLabel.element.classList.add('label-hovered');
      }
    }
  }

  highlightSearchedLabel(id: string): void {
    const labelState = this.labels.get(id);
    if (labelState) {
      labelState.element.classList.add('label-highlighted');
      setTimeout(() => {
        labelState?.element.classList.remove('label-highlighted');
      }, 3000);
    }
  }

  private createLabelElement(data: LabelData): HTMLElement {
    const label = document.createElement('div');
    label.className = 'object-label';
    label.dataset.id = data.id;
    label.style.position = 'absolute';
    label.style.transform = 'translate(-50%, -100%)';
    label.style.minWidth = '120px';
    label.style.padding = '8px 12px';
    label.style.borderRadius = '6px';
    label.style.fontFamily = 'PingFang SC, sans-serif';
    label.style.fontSize = '12px';
    label.style.color = '#fff';
    label.style.pointerEvents = 'auto';
    label.style.transition = 'transform 0.15s ease, opacity 0.15s ease';
    label.style.willChange = 'transform, opacity';
    label.style.contain = 'layout style paint';

    const bgColor = data.status === 'alarm' ? 'rgba(255, 77, 79, 0.9)' :
                    data.status === 'warning' ? 'rgba(250, 173, 20, 0.9)' :
                    'rgba(10, 22, 40, 0.9)';

    label.style.background = bgColor;
    label.style.border = `1px solid ${data.status ? getStatusColor(data.status) : 'rgba(24, 144, 255, 0.5)'}`;
    label.style.boxShadow = `0 4px 12px rgba(0, 0, 0, 0.4), 0 0 8px ${data.status ? getStatusColor(data.status) : 'rgba(24, 144, 255, 0.3)'}`;

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.gap = '6px';
    header.style.marginBottom = '4px';

    if (data.status) {
      const statusDot = document.createElement('span');
      statusDot.className = 'status-dot';
      statusDot.style.width = '8px';
      statusDot.style.height = '8px';
      statusDot.style.borderRadius = '50%';
      statusDot.style.backgroundColor = getStatusColor(data.status);
      statusDot.style.boxShadow = `0 0 6px ${getStatusColor(data.status)}`;
      statusDot.style.animation = 'pulse 2s infinite';
      header.appendChild(statusDot);
    }

    const title = document.createElement('span');
    title.className = 'label-title';
    title.style.fontWeight = '600';
    title.style.fontSize = '13px';
    title.textContent = data.title;
    header.appendChild(title);

    label.appendChild(header);

    if (data.content) {
      const content = document.createElement('div');
      content.className = 'label-content';
      content.style.fontSize = '11px';
      content.style.opacity = '0.9';
      content.style.lineHeight = '1.4';
      content.style.whiteSpace = 'pre-line';
      content.textContent = data.content;
      label.appendChild(content);
    }

    const arrow = document.createElement('div');
    arrow.style.position = 'absolute';
    arrow.style.bottom = '-6px';
    arrow.style.left = '50%';
    arrow.style.transform = 'translateX(-50%)';
    arrow.style.width = '0';
    arrow.style.height = '0';
    arrow.style.borderLeft = '6px solid transparent';
    arrow.style.borderRight = '6px solid transparent';
    arrow.style.borderTop = `6px solid ${bgColor}`;
    label.appendChild(arrow);

    this.ensureStylesAdded();

    return label;
  }

  private stylesAdded = false;
  private ensureStylesAdded(): void {
    if (this.stylesAdded) return;

    const style = document.createElement('style');
    style.textContent = `
      .object-label.label-hovered {
        transform: translate(-50%, -100%) scale(1.05);
        z-index: 20;
      }
      .object-label.label-highlighted {
        animation: highlight-pulse 0.5s ease-in-out 3;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.2); }
      }
      @keyframes highlight-pulse {
        0%, 100% { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 0 8px rgba(24, 144, 255, 0.3); }
        50% { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6), 0 0 20px rgba(24, 144, 255, 0.8); }
      }
    `;
    style.dataset.labels = 'true';
    document.head.appendChild(style);
    this.stylesAdded = true;
  }

  private updateLabels(): void {
    if (!this.labelsContainer || this.labels.size === 0) return;

    const now = performance.now();
    this.ensureRectUpdated();
    if (!this.containerRect) return;

    const camera = this.sceneManager.camera;
    const rect = this.containerRect;
    const width = rect.width;
    const height = rect.height;

    this.labels.forEach((state, id) => {
      if (now - state.lastPositionUpdate < this.POSITION_UPDATE_INTERVAL) {
        return;
      }
      state.lastPositionUpdate = now;

      const labelElement = state.element;
      const data = state.data;

      data.object3D.getWorldPosition(this.tempPosition);

      const distance = this.tempPosition.distanceTo(camera.position);

      if (distance > LABEL_VISIBLE_DISTANCE) {
        if (state.visible) {
          labelElement.style.display = 'none';
          state.visible = false;
        }
        return;
      }

      if (!state.visible) {
        labelElement.style.display = 'block';
        state.visible = true;
      }

      const opacity = Math.max(0.3, 1 - distance / LABEL_VISIBLE_DISTANCE);
      labelElement.style.opacity = String(opacity);

      this.tempVector.copy(this.tempPosition);
      this.tempVector.y += 3;
      this.tempVector.project(camera);

      const x = (this.tempVector.x * 0.5 + 0.5) * width;
      const y = (-this.tempVector.y * 0.5 + 0.5) * height;

      const scale = Math.max(0.7, 1 - distance / LABEL_VISIBLE_DISTANCE * 0.5);
      labelElement.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%) scale(${scale})`;
    });
  }

  createLabelFromPickedObject(picked: PickedObject, object3D: THREE.Object3D): LabelData | null {
    const data = picked.data as any;
    let title = '';
    let content = '';
    let status = '';

    switch (picked.type) {
      case 'shelf':
        title = data.code;
        content = `容量: ${(data.utilization * 100).toFixed(1)}%\n温度: ${data.temperature.toFixed(1)}°C`;
        status = data.status;
        break;
      case 'forklift':
        title = data.code;
        content = `状态: ${this.getStatusText(data.status)}\n电量: ${data.battery.toFixed(1)}%`;
        status = data.status;
        break;
      case 'sensor':
        title = data.code;
        content = `${this.getSensorTypeName(data.type)}: ${data.value}`;
        status = data.status;
        break;
      case 'dock':
        title = data.code;
        content = `状态: ${this.getDockStatusText(data.status)}`;
        status = data.status;
        break;
      default:
        return null;
    }

    return {
      id: picked.id,
      type: picked.type,
      title,
      content,
      status,
      object3D,
    };
  }

  private getStatusText(status: string): string {
    const map: Record<string, string> = {
      idle: '空闲',
      working: '作业中',
      offline: '离线',
      error: '故障',
    };
    return map[status] || status;
  }

  private getSensorTypeName(type: string): string {
    const map: Record<string, string> = {
      temperature: '温度',
      humidity: '湿度',
      smoke: '烟雾',
      door: '门禁',
      infrared: '红外',
    };
    return map[type] || type;
  }

  private getDockStatusText(status: string): string {
    const map: Record<string, string> = {
      available: '可用',
      occupied: '占用中',
      reserved: '已预约',
      maintenance: '维护中',
    };
    return map[status] || status;
  }

  clearAll(): void {
    this.labels.forEach(labelState => {
      if (this.labelsContainer) {
        this.labelsContainer.removeChild(labelState.element);
      }
    });
    this.labels.clear();
    this.hoveredLabel = null;
  }

  dispose(): void {
    if (this.updateCallback) {
      this.renderLoop.removeCallback(this.updateCallback);
      this.updateCallback = null;
    }

    window.removeEventListener('resize', this.debouncedRectUpdate);

    this.clearAll();

    if (this.labelsContainer && this.labelsContainer.parentNode) {
      this.labelsContainer.parentNode.removeChild(this.labelsContainer);
    }
    this.labelsContainer = null;
    this.containerRect = null;
  }
}
