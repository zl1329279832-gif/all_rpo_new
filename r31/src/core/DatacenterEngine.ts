import * as TWEEN from '@tweenjs/tween.js'
import { SceneManager } from './SceneManager'
import { PickerManager } from './PickerManager'
import { CameraController } from './CameraController'
import type { RackData, PickResult, EngineStats } from './types'

export class DatacenterEngine {
  private sceneManager: SceneManager
  private pickerManager: PickerManager
  private cameraController: CameraController
  private hoveredRackId: number | null = null
  private selectedRackId: number | null = null
  private isRunning: boolean = false
  private stats: EngineStats
  private frameCount: number = 0
  private lastFpsUpdate: number = 0
  private onHover: ((rack: RackData | null) => void) | null = null
  private onClick: ((rack: RackData | null) => void) | null = null
  private onStatsUpdate: ((stats: EngineStats) => void) | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.sceneManager = new SceneManager(canvas)
    this.cameraController = new CameraController(
      this.sceneManager.getCamera(),
      canvas
    )
    this.pickerManager = new PickerManager(
      canvas,
      this.sceneManager.getCamera(),
      this.sceneManager.getRackManager()
    )

    this.stats = {
      fps: 0,
      frameCount: 0,
      renderTime: 0,
      instanceCount: 0
    }

    this.cameraController.setOnChangeCallback(() => {
      this.sceneManager.requestRender()
      this.updateTooltipPosition()
    })

    this.bindInteractionEvents(canvas)
  }

  private bindInteractionEvents(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('mousemove', this.onMouseMove)
    canvas.addEventListener('click', this.onClickEvent)
    canvas.addEventListener('mouseleave', this.onMouseLeave)
  }

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.isRunning) return

    this.pickerManager.pickDebounced(e.clientX, e.clientY, (result) => {
      this.handleHover(result)
    })
  }

  private onClickEvent = (e: MouseEvent): void => {
    if (!this.isRunning) return

    const result = this.pickerManager.pick(e.clientX, e.clientY)
    this.handleClick(result)
  }

  private onMouseLeave = (): void => {
    if (this.hoveredRackId !== null) {
      this.setHoveredRack(null)
    }
  }

  private handleHover(result: PickResult | null): void {
    const rackId = result ? result.rackId : null
    
    if (rackId !== this.hoveredRackId) {
      this.setHoveredRack(rackId)
    }
  }

  private handleClick(result: PickResult | null): void {
    const rackId = result ? result.rackId : null
    
    if (rackId !== this.selectedRackId) {
      this.setSelectedRack(rackId)
    }
  }

  private setHoveredRack(rackId: number | null): void {
    this.hoveredRackId = rackId
    
    const rackManager = this.sceneManager.getRackManager()
    
    if (this.selectedRackId !== null) {
      rackManager.highlightRack(this.selectedRackId)
    } else {
      rackManager.highlightRack(rackId)
    }
    
    this.sceneManager.requestRender()
    
    if (this.onHover) {
      const rack = rackId !== null ? rackManager.getRackDataById(rackId) : null
      this.onHover(rack ?? null)
    }
  }

  private setSelectedRack(rackId: number | null): void {
    this.selectedRackId = rackId
    
    const rackManager = this.sceneManager.getRackManager()
    rackManager.highlightRack(rackId)
    this.sceneManager.requestRender()
    
    if (this.onClick) {
      const rack = rackId !== null ? rackManager.getRackDataById(rackId) : null
      this.onClick(rack ?? null)
    }

    if (rackId !== null) {
      const rack = rackManager.getRackDataById(rackId)
      if (rack) {
        this.cameraController.flyTo(new THREE.Vector3(rack.x, 0, rack.z), 1200)
      }
    }
  }

  private updateTooltipPosition(): void {
    if (this.hoveredRackId !== null) {
      const rackManager = this.sceneManager.getRackManager()
      const rack = rackManager.getRackDataById(this.hoveredRackId)
      if (rack && this.onHover) {
        this.onHover(rack)
      }
    }
  }

  loadData(racks: RackData[]): void {
    this.sceneManager.buildRacks(racks)
    this.stats.instanceCount = racks.length
  }

  start(): void {
    if (this.isRunning) return
    this.isRunning = true

    this.sceneManager.startRenderLoop(() => {
      const now = performance.now()
      TWEEN.update()
      
      this.frameCount++
      if (now - this.lastFpsUpdate >= 1000) {
        this.stats.fps = this.frameCount
        this.stats.frameCount += this.frameCount
        this.frameCount = 0
        this.lastFpsUpdate = now
        this.stats.renderTime = performance.now() - now
        
        if (this.onStatsUpdate) {
          this.onStatsUpdate({ ...this.stats })
        }
      }
    })
  }

  stop(): void {
    this.isRunning = false
    this.sceneManager.stopRenderLoop()
  }

  resetView(): void {
    this.cameraController.resetView()
    this.setSelectedRack(null)
    this.setHoveredRack(null)
  }

  getRackScreenPosition(rack: RackData) {
    return this.pickerManager.getRackScreenPosition(rack)
  }

  getStats(): EngineStats {
    return { ...this.stats }
  }

  getCameraController(): CameraController {
    return this.cameraController
  }

  setOnHover(callback: (rack: RackData | null) => void): void {
    this.onHover = callback
  }

  setOnClick(callback: (rack: RackData | null) => void): void {
    this.onClick = callback
  }

  setOnStatsUpdate(callback: (stats: EngineStats) => void): void {
    this.onStatsUpdate = callback
  }

  resize(width: number, height: number): void {
    this.sceneManager.resize(width, height)
  }

  dispose(): void {
    this.stop()
    this.pickerManager.dispose()
    this.cameraController.dispose()
    this.sceneManager.dispose()
  }
}
