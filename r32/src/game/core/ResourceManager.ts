export class ResourceManager {
  private images: Map<string, HTMLImageElement> = new Map()
  private sounds: Map<string, HTMLAudioElement> = new Map()
  private loadProgress: number = 0
  private totalResources: number = 0
  private loadedResources: number = 0

  async loadImage(key: string, src: string): Promise<HTMLImageElement> {
    if (this.images.has(key)) {
      return this.images.get(key)!
    }

    this.totalResources++
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        this.images.set(key, img)
        this.loadedResources++
        this.loadProgress = this.loadedResources / this.totalResources
        resolve(img)
      }
      img.onerror = () => {
        this.loadedResources++
        reject(new Error(`Failed to load image: ${src}`))
      }
      img.src = src
    })
  }

  async loadSound(key: string, src: string): Promise<HTMLAudioElement> {
    if (this.sounds.has(key)) {
      return this.sounds.get(key)!
    }

    this.totalResources++
    return new Promise((resolve, reject) => {
      const audio = new Audio()
      audio.oncanplaythrough = () => {
        this.sounds.set(key, audio)
        this.loadedResources++
        this.loadProgress = this.loadedResources / this.totalResources
        resolve(audio)
      }
      audio.onerror = () => {
        this.loadedResources++
        reject(new Error(`Failed to load sound: ${src}`))
      }
      audio.src = src
    })
  }

  getImage(key: string): HTMLImageElement | undefined {
    return this.images.get(key)
  }

  getSound(key: string): HTMLAudioElement | undefined {
    return this.sounds.get(key)
  }

  playSound(key: string, volume: number = 0.5): void {
    const sound = this.sounds.get(key)
    if (sound) {
      sound.volume = volume
      sound.currentTime = 0
      sound.play().catch(() => {})
    }
  }

  getLoadProgress(): number {
    return this.loadProgress
  }

  isLoaded(): boolean {
    return this.totalResources > 0 && this.loadedResources >= this.totalResources
  }

  clear(): void {
    this.images.clear()
    this.sounds.clear()
    this.loadProgress = 0
    this.totalResources = 0
    this.loadedResources = 0
  }
}

export const resourceManager = new ResourceManager()
