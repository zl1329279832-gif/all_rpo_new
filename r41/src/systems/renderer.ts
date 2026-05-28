import { MAP_WIDTH, MAP_HEIGHT } from '@/config/map'
import type { Truck, Ship, Crane, Berth, YardSlot, Position } from '@/types'
import { getCargoTypeColor } from '@/systems/orderSystem'

export class GameRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.canvas.width = MAP_WIDTH
    this.canvas.height = MAP_HEIGHT
  }

  render(
    trucks: Truck[],
    ships: Ship[],
    cranes: Crane[],
    berths: Berth[],
    yardSlots: YardSlot[]
  ) {
    this.clear()
    this.drawBackground()
    this.drawWater()
    this.drawBerths(berths)
    this.drawYard(yardSlots)
    this.drawRoads()
    this.drawShips(ships)
    this.drawCranes(cranes)
    this.drawTrucks(trucks)
    this.drawGate()
  }

  private clear() {
    this.ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT)
  }

  private drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, MAP_WIDTH, MAP_HEIGHT)
    gradient.addColorStop(0, '#1e3a5f')
    gradient.addColorStop(1, '#0d1b2a')
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT)

    this.ctx.fillStyle = '#2d4a3e'
    this.ctx.fillRect(250, 0, MAP_WIDTH - 250, MAP_HEIGHT)
  }

  private drawWater() {
    const waterGradient = this.ctx.createLinearGradient(0, 0, 250, 0)
    waterGradient.addColorStop(0, '#0a2463')
    waterGradient.addColorStop(1, '#1e3a8a')
    this.ctx.fillStyle = waterGradient
    this.ctx.fillRect(0, 0, 250, MAP_HEIGHT)

    this.ctx.strokeStyle = 'rgba(100, 150, 255, 0.1)'
    this.ctx.lineWidth = 1
    for (let i = 0; i < 10; i++) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, i * 70 + 20)
      this.ctx.bezierCurveTo(80, i * 70 + 10, 160, i * 70 + 30, 250, i * 70 + 15)
      this.ctx.stroke()
    }
  }

  private drawBerths(berths: Berth[]) {
    berths.forEach(berth => {
      this.ctx.fillStyle = '#4a5568'
      this.ctx.fillRect(berth.position.x - 30, berth.position.y - 50, 80, 100)
      
      this.ctx.fillStyle = berth.ship ? '#10b981' : '#6b7280'
      this.ctx.fillRect(berth.position.x - 25, berth.position.y - 45, 70, 90)

      this.ctx.fillStyle = '#fff'
      this.ctx.font = 'bold 12px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText(berth.id.split('-')[1].toUpperCase(), berth.position.x + 10, berth.position.y + 5)
    })
  }

  private drawYard(yardSlots: YardSlot[]) {
    this.ctx.fillStyle = '#374151'
    this.ctx.fillRect(350, 50, 750, 600)

    yardSlots.forEach(slot => {
      let zoneColor = '#4b5563'
      if (slot.zone === 'cold') zoneColor = '#0891b2'
      if (slot.zone === 'dangerous') zoneColor = '#dc2626'

      this.ctx.strokeStyle = zoneColor
      this.ctx.lineWidth = 2
      this.ctx.strokeRect(slot.position.x - 35, slot.position.y - 40, 70, 90)

      if (slot.container) {
        const cargoColor = getCargoTypeColor(slot.container.cargo.type)
        this.ctx.fillStyle = cargoColor
        this.ctx.fillRect(slot.position.x - 30, slot.position.y - 35, 60, 80)
        
        this.ctx.fillStyle = '#fff'
        this.ctx.font = 'bold 10px Arial'
        this.ctx.textAlign = 'center'
        this.ctx.fillText(`${slot.container.cargo.size}尺`, slot.position.x, slot.position.y + 5)
      }
    })

    this.ctx.font = 'bold 11px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.fillStyle = '#9ca3af'
    this.ctx.fillText('普通区', 360, 80)
    this.ctx.fillStyle = '#0891b2'
    this.ctx.fillText('冷链区', 360, 410)
    this.ctx.fillStyle = '#dc2626'
    this.ctx.fillText('危险品区', 360, 520)
  }

  private drawRoads() {
    this.ctx.fillStyle = '#1f2937'
    this.ctx.fillRect(0, 680, MAP_WIDTH, 20)
    this.ctx.fillRect(1080, 0, 20, MAP_HEIGHT)

    this.ctx.strokeStyle = '#fbbf24'
    this.ctx.lineWidth = 2
    this.ctx.setLineDash([15, 10])
    this.ctx.beginPath()
    this.ctx.moveTo(0, 690)
    this.ctx.lineTo(MAP_WIDTH, 690)
    this.ctx.stroke()
    this.ctx.setLineDash([])
  }

  private drawShips(ships: Ship[]) {
    ships.forEach(ship => {
      if (ship.status === 'departing') {
        this.ctx.globalAlpha = 0.5
      }

      this.ctx.fillStyle = ship.status === 'waiting' ? '#78716c' : '#065f46'
      this.ctx.beginPath()
      this.ctx.ellipse(ship.position.x, ship.position.y, 60, 35, 0, 0, Math.PI * 2)
      this.ctx.fill()

      this.ctx.fillStyle = '#0369a1'
      this.ctx.fillRect(ship.position.x - 40, ship.position.y - 15, 30, 30)

      this.ctx.fillStyle = '#fff'
      this.ctx.font = 'bold 10px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText(ship.name, ship.position.x, ship.position.y - 45)

      this.ctx.font = '9px Arial'
      this.ctx.fillStyle = '#fbbf24'
      this.ctx.fillText(`${ship.containers.length}/${ship.maxCapacity}`, ship.position.x, ship.position.y + 5)

      this.ctx.globalAlpha = 1
    })
  }

  private drawCranes(cranes: Crane[]) {
    cranes.forEach(crane => {
      this.ctx.fillStyle = crane.status === 'idle' ? '#4b5563' : '#f59e0b'
      
      this.ctx.fillRect(crane.position.x + 20, crane.position.y - 60, 8, 120)
      
      this.ctx.fillRect(crane.position.x + 10, crane.position.y - 65, 50, 8)
      
      this.ctx.fillStyle = crane.status === 'idle' ? '#6b7280' : '#fbbf24'
      this.ctx.beginPath()
      this.ctx.arc(crane.position.x + 35, crane.position.y - 70, 10, 0, Math.PI * 2)
      this.ctx.fill()

      if (crane.container) {
        const cargoColor = getCargoTypeColor(crane.container.cargo.type)
        this.ctx.fillStyle = cargoColor
        this.ctx.fillRect(crane.position.x + 45, crane.position.y - 30, 25, 35)
      }
    })
  }

  private drawTrucks(trucks: Truck[]) {
    trucks.forEach((truck, index) => {
      this.ctx.save()
      
      if (truck.container) {
        const cargoColor = getCargoTypeColor(truck.container.cargo.type)
        this.ctx.fillStyle = cargoColor
        this.ctx.fillRect(truck.position.x - 15, truck.position.y - 20, 30, 25)
      }

      this.ctx.fillStyle = truck.status === 'moving' ? '#22c55e' : '#6b7280'
      this.ctx.fillRect(truck.position.x - 10, truck.position.y + 5, 20, 15)
      
      this.ctx.fillStyle = '#1e40af'
      this.ctx.beginPath()
      this.ctx.arc(truck.position.x - 8, truck.position.y + 20, 4, 0, Math.PI * 2)
      this.ctx.arc(truck.position.x + 8, truck.position.y + 20, 4, 0, Math.PI * 2)
      this.ctx.fill()

      this.ctx.fillStyle = '#fff'
      this.ctx.font = 'bold 8px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText(`T${index + 1}`, truck.position.x, truck.position.y + 15)

      this.ctx.restore()
    })
  }

  private drawGate() {
    this.ctx.fillStyle = '#1e40af'
    this.ctx.fillRect(1100, 300, 80, 100)
    
    this.ctx.fillStyle = '#3b82f6'
    this.ctx.fillRect(1110, 310, 60, 80)
    
    this.ctx.fillStyle = '#fff'
    this.ctx.font = 'bold 14px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('大门', 1140, 360)
  }

  public getCanvasPosition(clientX: number, clientY: number): Position {
    const rect = this.canvas.getBoundingClientRect()
    const scaleX = this.canvas.width / rect.width
    const scaleY = this.canvas.height / rect.height
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }
}
