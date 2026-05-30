import * as PIXI from 'pixi.js'
import type { City, Route, CaravanState } from '../types'
import { CITIES } from '../map'
import { getAllRoutes } from '../map'

export class GameMapRenderer {
  app: PIXI.Application
  container: PIXI.Container
  citySprites: Map<string, PIXI.Container> = new Map()
  routeGraphics: PIXI.Graphics = new PIXI.Graphics()
  caravanSprite: PIXI.Container = new PIXI.Container()
  onCityClick?: (cityId: string) => void
  highlightedCity: string | null = null

  constructor(canvasElement: HTMLCanvasElement) {
    this.app = new PIXI.Application({
      view: canvasElement,
      background: 0xF5E6C8,
      width: canvasElement.parentElement?.clientWidth || window.innerWidth,
      height: canvasElement.parentElement?.clientHeight || window.innerHeight,
      antialias: true,
    })

    this.container = new PIXI.Container()
    this.app.stage.addChild(this.container)

    this.init()
  }

  private init() {
    this.drawRoutes()
    this.container.addChild(this.routeGraphics)
    this.createCities()
    this.createCaravan()
    this.container.addChild(this.caravanSprite)
  }

  private drawRoutes() {
    this.routeGraphics.clear()
    const routes = getAllRoutes()
    routes.forEach((route: Route) => {
      const fromCity = CITIES.find((c: City) => c.id === route.from)
      const toCity = CITIES.find((c: City) => c.id === route.to)
      if (fromCity && toCity) {
        const screenPos = this.getScreenPositions(fromCity, toCity)
        this.routeGraphics.lineStyle(2, 0xD4A017, 0.4)
        this.routeGraphics.moveTo(screenPos.from.x, screenPos.from.y)
        this.routeGraphics.lineTo(screenPos.to.x, screenPos.to.y)
      }
    })
  }

  private getScreenPositions(fromCity: City, toCity: City) {
    const w = this.app.screen.width
    const h = this.app.screen.height
    return {
      from: { x: fromCity.x * w, y: fromCity.y * h },
      to: { x: toCity.x * w, y: toCity.y * h },
    }
  }

  private createCities() {
    CITIES.forEach((city: City) => {
      const cityContainer = new PIXI.Container()
      cityContainer.eventMode = 'static'
      cityContainer.cursor = 'pointer'

      const circle = new PIXI.Graphics()
      circle.beginFill(0xD4A017)
      circle.drawCircle(0, 0, 18)
      circle.endFill()
      circle.beginFill(0x3E2723)
      circle.drawCircle(0, 0, 14)
      circle.endFill()
      circle.beginFill(0xD4A017)
      circle.drawCircle(0, 0, 10)
      circle.endFill()

      const text = new PIXI.Text(city.name, {
        fontFamily: 'Cinzel',
        fontSize: 14,
        fill: 0x3E2723,
        fontWeight: 'bold',
      })
      text.anchor.set(0.5, 2)

      cityContainer.addChild(circle)
      cityContainer.addChild(text)

      cityContainer.on('pointerdown', () => {
        if (this.onCityClick) {
          this.onCityClick(city.id)
        }
      })

      this.citySprites.set(city.id, cityContainer)
      this.container.addChild(cityContainer)
    })

    this.updateCityPositions()
  }

  private createCaravan() {
    const camel = new PIXI.Graphics()
    camel.beginFill(0x8B4513)
    camel.drawRoundedRect(-12, -8, 24, 16, 4)
    camel.endFill()
    camel.beginFill(0xA0522D)
    camel.drawCircle(0, -10, 8)
    camel.endFill()
    camel.beginFill(0x654321)
    camel.drawCircle(-6, 6, 3)
    camel.drawCircle(6, 6, 3)
    camel.endFill()

    this.caravanSprite.addChild(camel)
    this.caravanSprite.visible = false
  }

  updateCityPositions() {
    const w = this.app.screen.width
    const h = this.app.screen.height

    CITIES.forEach((city: City) => {
      const sprite = this.citySprites.get(city.id)
      if (sprite) {
        sprite.x = city.x * w
        sprite.y = city.y * h
      }
    })
  }

  updateCaravan(caravan: CaravanState) {
    if (caravan.isMoving && caravan.movingTo && caravan.moveRoute) {
      const fromCity = CITIES.find((c: City) => c.id === caravan.currentCityId)
      const toCity = CITIES.find((c: City) => c.id === caravan.movingTo)
      if (fromCity && toCity) {
        const w = this.app.screen.width
        const h = this.app.screen.height
        const t = caravan.moveProgress
        const x = (fromCity.x + (toCity.x - fromCity.x) * t) * w
        const y = (fromCity.y + (toCity.y - fromCity.y) * t) * h
        this.caravanSprite.x = x
        this.caravanSprite.y = y
        this.caravanSprite.visible = true
      }
    } else {
      const currentCity = CITIES.find((c: City) => c.id === caravan.currentCityId)
      if (currentCity) {
        const w = this.app.screen.width
        const h = this.app.screen.height
        this.caravanSprite.x = currentCity.x * w
        this.caravanSprite.y = currentCity.y * h - 30
        this.caravanSprite.visible = true
      }
    }
  }

  highlightConnectedCities(connectedCityIds: string[]) {
    this.citySprites.forEach((sprite, cityId) => {
      const circle = sprite.children[0] as PIXI.Graphics
      if (connectedCityIds.includes(cityId)) {
        circle.alpha = 1
        sprite.scale.set(1.1)
      } else {
        circle.alpha = 0.5
        sprite.scale.set(1)
      }
    })
  }

  resetHighlights() {
    this.citySprites.forEach((sprite) => {
      sprite.alpha = 1
      sprite.scale.set(1)
    })
  }

  setHighlightedCity(cityId: string | null) {
    this.highlightedCity = cityId
    if (cityId) {
      const sprite = this.citySprites.get(cityId)
      if (sprite) {
        sprite.scale.set(1.2)
      }
    }
  }

  update() {
    this.updateCityPositions()
  }

  resize() {
    this.app.renderer.resize(
      (this.app.view as unknown as HTMLCanvasElement).parentElement?.clientWidth || window.innerWidth,
      (this.app.view as unknown as HTMLCanvasElement).parentElement?.clientHeight || window.innerHeight
    )
    this.routeGraphics.clear()
    this.drawRoutes()
    this.updateCityPositions()
  }

  destroy() {
    this.app.destroy(true, { children: true, texture: true, baseTexture: true })
  }
}
