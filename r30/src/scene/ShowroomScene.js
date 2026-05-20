import { SceneManager } from './SceneManager.js'
import { LightingSystem } from './LightingSystem.js'
import { CarModel } from './CarModel.js'

export class ShowroomScene {
  constructor(canvas) {
    this.canvas = canvas
    this.sceneManager = null
    this.lighting = null
    this.carModel = null
    this.isInitialized = false
    this.onLoadProgress = null
    this.onLoadComplete = null
    this.onDoorClick = null
  }

  async init(options = {}) {
    this.sceneManager = new SceneManager(this.canvas)
    this.sceneManager.init()

    this.lighting = new LightingSystem(this.sceneManager)
    await this.lighting.init({
      hdrPath: options.hdrPath,
      ambientIntensity: 0.4,
      keyIntensity: 1.8,
      fillIntensity: 0.7,
      rimIntensity: 1.0,
      groundIntensity: 0.3
    })

    this.carModel = new CarModel(this.sceneManager)

    if (options.carModelPath) {
      try {
        await this.carModel.load(options.carModelPath, (progress) => {
          if (this.onLoadProgress) {
            this.onLoadProgress(progress)
          }
        })
      } catch (e) {
        console.warn('加载车辆模型失败，使用默认模型:', e)
        this.carModel.createFallbackCar()
      }
    } else {
      this.carModel.createFallbackCar()
    }

    this.carModel.onDoorClick((side, isOpen) => {
      if (this.onDoorClick) {
        this.onDoorClick(side, isOpen)
      }
    })

    this.sceneManager.addAnimationCallback((delta) => {
      this.carModel.update(delta)
    })

    this.isInitialized = true

    if (this.onLoadComplete) {
      this.onLoadComplete()
    }

    return this
  }

  start() {
    if (this.sceneManager) {
      this.sceneManager.start()
    }
  }

  stop() {
    if (this.sceneManager) {
      this.sceneManager.stop()
    }
  }

  setCarColor(color) {
    if (this.carModel) {
      this.carModel.setBodyColor(color)
    }
  }

  getCarColor() {
    return this.carModel ? this.carModel.getBodyColor() : '#ff0000'
  }

  toggleDoor(side) {
    if (this.carModel) {
      this.carModel.toggleDoor(side)
    }
  }

  dispose() {
    if (this.carModel) {
      this.carModel.dispose()
    }
    if (this.lighting) {
      this.lighting.dispose()
    }
    if (this.sceneManager) {
      this.sceneManager.dispose()
    }
    this.isInitialized = false
  }
}
