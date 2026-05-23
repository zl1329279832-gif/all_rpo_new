import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { SceneManager } from './SceneManager';

export class PostProcessingManager {
  private static instance: PostProcessingManager;
  private sceneManager: SceneManager;
  public composer: EffectComposer | null = null;
  public bloomPass: UnrealBloomPass | null = null;
  private isEnabled: boolean = false;
  private bloomParams = {
    threshold: 0.5,
    strength: 0.3,
    radius: 0.3,
  };

  private constructor() {
    this.sceneManager = SceneManager.getInstance();
  }

  private getOptimalPixelRatio(): number {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth * dpr;
    const height = window.innerHeight * dpr;
    const totalPixels = width * height;

    if (totalPixels > 4000000) return 0.75;
    if (totalPixels > 2000000) return 1;
    return Math.min(dpr, 1.5);
  }

  static getInstance(): PostProcessingManager {
    if (!PostProcessingManager.instance) {
      PostProcessingManager.instance = new PostProcessingManager();
    }
    return PostProcessingManager.instance;
  }

  init(container: HTMLElement): void {
    if (!this.sceneManager.isInitialized) {
      this.sceneManager.init(container);
    }

    const { clientWidth, clientHeight } = container;

    const pixelRatio = this.getOptimalPixelRatio();

    this.composer = new EffectComposer(this.sceneManager.renderer);
    this.composer.setSize(clientWidth, clientHeight);
    this.composer.setPixelRatio(pixelRatio);

    const renderPass = new RenderPass(this.sceneManager.scene, this.sceneManager.camera);
    this.composer.addPass(renderPass);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(clientWidth, clientHeight),
      this.bloomParams.strength,
      this.bloomParams.radius,
      this.bloomParams.threshold
    );
    this.composer.addPass(this.bloomPass);

    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  render(): void {
    if (!this.composer) return;
    if (this.isEnabled) {
      this.composer.render();
    } else {
      this.sceneManager.render();
    }
  }

  setBloomStrength(strength: number): void {
    this.bloomParams.strength = strength;
    if (this.bloomPass) {
      this.bloomPass.strength = strength;
    }
  }

  setBloomThreshold(threshold: number): void {
    this.bloomParams.threshold = threshold;
    if (this.bloomPass) {
      this.bloomPass.threshold = threshold;
    }
  }

  setBloomRadius(radius: number): void {
    this.bloomParams.radius = radius;
    if (this.bloomPass) {
      this.bloomPass.radius = radius;
    }
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  toggle(): boolean {
    this.isEnabled = !this.isEnabled;
    return this.isEnabled;
  }

  handleResize(width: number, height: number): void {
    if (this.composer) {
      this.composer.setSize(width, height);
    }
  }

  dispose(): void {
    if (this.composer) {
      this.composer.dispose();
      this.composer = null;
    }
    this.bloomPass = null;
  }
}
