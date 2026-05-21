export class InputManager {
  private keys: Set<string> = new Set()
  private keysPressed: Set<string> = new Set()
  private keysReleased: Set<string> = new Set()
  private mouseX: number = 0
  private mouseY: number
  private mouseDown: boolean = false
  private mouseClicked: boolean = false
  private listeners: Array<() => void> = []

  private onKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase()
    if (!this.keys.has(key)) {
      this.keysPressed.add(key)
    }
    this.keys.add(key)

    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
      e.preventDefault()
    }
  }

  private onKeyUp = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase()
    this.keys.delete(key)
    this.keysReleased.add(key)
  }

  private onMouseMove = (e: MouseEvent) => {
    const canvas = e.target as HTMLCanvasElement
    if (canvas && canvas.getBoundingClientRect) {
      const rect = canvas.getBoundingClientRect()
      this.mouseX = e.clientX - rect.left
      this.mouseY = e.clientY - rect.top
    }
  }

  private onMouseDown = () => {
    this.mouseDown = true
    this.mouseClicked = true
  }

  private onMouseUp = () => {
    this.mouseDown = false
  }

  init(canvas: HTMLCanvasElement): void {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    canvas.addEventListener('mousemove', this.onMouseMove)
    canvas.addEventListener('mousedown', this.onMouseDown)
    canvas.addEventListener('mouseup', this.onMouseUp)
    canvas.addEventListener('contextmenu', (e) => e.preventDefault())
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    this.keys.clear()
    this.keysPressed.clear()
    this.keysReleased.clear()
  }

  isKeyDown(key: string): boolean {
    return this.keys.has(key.toLowerCase())
  }

  isKeyPressed(key: string): boolean {
    return this.keysPressed.has(key.toLowerCase())
  }

  isKeyReleased(key: string): boolean {
    return this.keysReleased.has(key.toLowerCase())
  }

  getMovement(): { x: number; y: number } {
    let x = 0
    let y = 0

    if (this.isKeyDown('w') || this.isKeyDown('arrowup')) y -= 1
    if (this.isKeyDown('s') || this.isKeyDown('arrowdown')) y += 1
    if (this.isKeyDown('a') || this.isKeyDown('arrowleft')) x -= 1
    if (this.isKeyDown('d') || this.isKeyDown('arrowright')) x += 1

    if (x !== 0 && y !== 0) {
      x *= 0.7071
      y *= 0.7071
    }

    return { x, y }
  }

  getMousePosition(): { x: number; y: number } {
    return { x: this.mouseX, y: this.mouseY }
  }

  isMouseDown(): boolean {
    return this.mouseDown
  }

  isMouseClicked(): boolean {
    return this.mouseClicked
  }

  endFrame(): void {
    this.keysPressed.clear()
    this.keysReleased.clear()
    this.mouseClicked = false
  }
}

export const inputManager = new InputManager()
