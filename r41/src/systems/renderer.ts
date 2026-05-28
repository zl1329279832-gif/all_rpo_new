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
    this.drawRoads()
    this.drawBerths(berths)
    this.drawYard(yardSlots)
    this.drawShips(ships)
    this.drawCranes(cranes)
    this.drawTrucks(trucks)
    this.drawGate()
    this.drawLegend()
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
    this.ctx.fillRect(200, 0, MAP_WIDTH - 200, MAP_HEIGHT)
  }

  private drawWater() {
    const waterGradient = this.ctx.createLinearGradient(0, 0, 200, 0)
    waterGradient.addColorStop(0, '#0a2463')
    waterGradient.addColorStop(1, '#1e3a8a')
    this.ctx.fillStyle = waterGradient
    this.ctx.fillRect(0, 0, 200, MAP_HEIGHT)

    this.ctx.strokeStyle = 'rgba(100, 150, 255, 0.1)'
    this.ctx.lineWidth = 1
    for (let i = 0; i < 10; i++) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, i * 70 + 20)
      this.ctx.bezierCurveTo(60, i * 70 + 10, 130, i * 70 + 30, 200, i * 70 + 15)
      this.ctx.stroke()
    }
  }

  private drawRoads() {
    this.ctx.fillStyle = '#1f2937'
    this.ctx.fillRect(200, MAP_HEIGHT - 30, MAP_WIDTH - 200, 30)
    this.ctx.fillRect(MAP_WIDTH - 120, 0, 120, MAP_HEIGHT)

    this.ctx.strokeStyle = '#fbbf24'
    this.ctx.lineWidth = 2
    this.ctx.setLineDash([15, 10])
    this.ctx.beginPath()
    this.ctx.moveTo(200, MAP_HEIGHT - 15)
    this.ctx.lineTo(MAP_WIDTH, MAP_HEIGHT - 15)
    this.ctx.stroke()
    this.ctx.setLineDash([])
  }

  private drawBerths(berths: Berth[]) {
    berths.forEach((berth, index) => {
      this.ctx.fillStyle = '#4a5568'
      this.ctx.fillRect(berth.position.x - 20, berth.position.y - 50, 70, 100)
      
      const berthColor = berth.ship ? '#10b981' : '#6b7280'
      this.ctx.fillStyle = berthColor
      this.ctx.fillRect(berth.position.x - 15, berth.position.y - 45, 60, 90)

      this.ctx.fillStyle = '#fff'
      this.ctx.font = 'bold 12px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText(`${index + 1}号泊位`, berth.position.x + 15, berth.position.y + 5)

      if (berth.ship && berth.ship.containers.length > 0) {
        this.ctx.fillStyle = 'rgba(251, 191, 36, 0.8)'
        this.ctx.font = '10px Arial'
        this.ctx.fillText(`待卸: ${berth.ship.containers.length}`, berth.position.x + 15, berth.position.y + 20)
      }
    })
  }

  private drawYard(yardSlots: YardSlot[]) {
    this.ctx.fillStyle = '#374151'
    this.ctx.fillRect(350, 30, 720, 640)

    yardSlots.forEach(slot => {
      let zoneColor = '#4b5563'
      if (slot.zone === 'cold') zoneColor = '#0891b2'
      if (slot.zone === 'dangerous') zoneColor = '#dc2626'

      this.ctx.strokeStyle = zoneColor
      this.ctx.lineWidth = slot.container ? 3 : 1
      this.ctx.strokeRect(slot.position.x - 35, slot.position.y - 45, 70, 90)

      if (slot.container) {
        const cargoColor = getCargoTypeColor(slot.container.cargo.type)
        this.ctx.fillStyle = cargoColor
        this.ctx.fillRect(slot.position.x - 30, slot.position.y - 40, 60, 80)
        
        this.ctx.fillStyle = '#fff'
        this.ctx.font = 'bold 10px Arial'
        this.ctx.textAlign = 'center'
        this.ctx.fillText(`${slot.container.cargo.size}尺`, slot.position.x, slot.position.y)
      }
    })

    this.ctx.font = 'bold 11px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.fillStyle = '#9ca3af'
    this.ctx.fillText('普通区', 360, 60)
    this.ctx.fillStyle = '#0891b2'
    this.ctx.fillText('冷链区', 360, 410)
    this.ctx.fillStyle = '#dc2626'
    this.ctx.fillText('危险品区', 360, 530)
  }

  private drawShips(ships: Ship[]) {
    ships.forEach(ship => {
      if (ship.status === 'departing') {
        this.ctx.globalAlpha = 0.5
      }

      const shipY = ship.position.y
      let shipX = ship.position.x

      if (ship.status === 'waiting') {
        shipX = 50
      }

      this.ctx.fillStyle = ship.status === 'waiting' ? '#78716c' : '#065f46'
      this.ctx.beginPath()
      this.ctx.ellipse(shipX, shipY, 55, 30, 0, 0, Math.PI * 2)
      this.ctx.fill()

      this.ctx.fillStyle = '#0369a1'
      this.ctx.fillRect(shipX - 35, shipY - 12, 25, 24)

      this.ctx.fillStyle = '#fff'
      this.ctx.font = 'bold 10px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText(ship.name, shipX, shipY - 40)

      this.ctx.font = '9px Arial'
      this.ctx.fillStyle = '#fbbf24'
      this.ctx.fillText(`${ship.containers.length}/${ship.maxCapacity}`, shipX, shipY + 5)

      if (ship.status === 'docked') {
        this.ctx.fillStyle = '#10b981'
        this.ctx.font = '9px Arial'
        this.ctx.fillText('停靠中', shipX, shipY + 18)
      } else if (ship.status === 'unloading') {
        this.ctx.fillStyle = '#f59e0b'
        this.ctx.font = '9px Arial'
        this.ctx.fillText('卸货中', shipX, shipY + 18)
      }

      this.ctx.globalAlpha = 1
    })
  }

  private drawCranes(cranes: Crane[]) {
    cranes.forEach((crane, index) => {
      const baseX = crane.position.x
      const baseY = crane.position.y

      this.ctx.fillStyle = crane.status === 'idle' ? '#4b5563' : '#f59e0b'
      
      this.ctx.fillRect(baseX, baseY - 55, 6, 110)
      
      this.ctx.fillRect(baseX - 10, baseY - 60, 45, 6)
      
      this.ctx.fillStyle = crane.status === 'idle' ? '#6b7280' : '#fbbf24'
      this.ctx.beginPath()
      this.ctx.arc(baseX + 12, baseY - 65, 9, 0, Math.PI * 2)
      this.ctx.fill()

      if (crane.container) {
        const cargoColor = getCargoTypeColor(crane.container.cargo.type)
        this.ctx.fillStyle = cargoColor
        this.ctx.fillRect(baseX + 25, baseY - 25, 22, 30)
        
        this.ctx.fillStyle = '#fff'
        this.ctx.font = 'bold 8px Arial'
        this.ctx.textAlign = 'center'
        this.ctx.fillText(`${crane.container.cargo.size}`, baseX + 36, baseY - 8)
      }

      if (crane.status !== 'idle') {
        this.ctx.fillStyle = '#fbbf24'
        this.ctx.font = '10px Arial'
        this.ctx.textAlign = 'center'
        this.ctx.fillText(`${Math.round(crane.progress * 100)}%`, baseX + 12, baseY + 65)
      }

      this.ctx.fillStyle = '#94a3b8'
      this.ctx.font = '9px Arial'
      this.ctx.fillText(`吊机${index + 1}`, baseX + 12, baseY + 55)
    })
  }

  private drawTrucks(trucks: Truck[]) {
    trucks.forEach((truck, index) => {
      this.ctx.save()
      
      if (truck.container) {
        const cargoColor = getCargoTypeColor(truck.container.cargo.type)
        this.ctx.fillStyle = cargoColor
        this.ctx.fillRect(truck.position.x - 14, truck.position.y - 18, 28, 22)
        
        this.ctx.fillStyle = '#fff'
        this.ctx.font = 'bold 8px Arial'
        this.ctx.textAlign = 'center'
        this.ctx.fillText(`${truck.container.cargo.size}`, truck.position.x, truck.position.y - 6)
      }

      const truckColor = truck.status === 'idle' ? '#6b7280' : 
                        truck.status === 'moving_to_yard' ? '#22c55e' : 
                        truck.status === 'moving_to_gate' ? '#3b82f6' : '#f59e0b'
      
      this.ctx.fillStyle = truckColor
      this.ctx.fillRect(truck.position.x - 9, truck.position.y + 4, 18, 13)
      
      this.ctx.fillStyle = '#1e40af'
      this.ctx.beginPath()
      this.ctx.arc(truck.position.x - 7, truck.position.y + 17, 3.5, 0, Math.PI * 2)
      this.ctx.arc(truck.position.x + 7, truck.position.y + 17, 3.5, 0, Math.PI * 2)
      this.ctx.fill()

      this.ctx.fillStyle = '#fff'
      this.ctx.font = 'bold 7px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText(`T${index + 1}`, truck.position.x, truck.position.y + 13)

      const statusLabels: Record<string, string> = {
        idle: '空闲',
        moving_to_berth: '去泊位',
        loading: '装货',
        moving_to_yard: '去堆场',
        unloading: '卸货',
        moving_to_gate: '返回'
      }
      
      this.ctx.fillStyle = '#94a3b8'
      this.ctx.font = '8px Arial'
      this.ctx.fillText(statusLabels[truck.status] || truck.status, truck.position.x, truck.position.y - 25)

      this.ctx.restore()
    })
  }

  private drawGate() {
    this.ctx.fillStyle = '#1e40af'
    this.ctx.fillRect(MAP_WIDTH - 100, 310, 90, 80)
    
    this.ctx.fillStyle = '#3b82f6'
    this.ctx.fillRect(MAP_WIDTH - 90, 320, 70, 60)
    
    this.ctx.fillStyle = '#fff'
    this.ctx.font = 'bold 13px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('大门', MAP_WIDTH - 55, 355)
    
    this.ctx.font = '10px Arial'
    this.ctx.fillStyle = '#94a3b8'
    this.ctx.fillText('出入口', MAP_WIDTH - 55, 372)
  }

  private drawLegend() {
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'
    this.ctx.fillRect(210, MAP_HEIGHT - 25, 300, 20)
    
    this.ctx.font = '9px Arial'
    this.ctx.textAlign = 'left'
    
    const items = [
      { color: '#6b7280', label: '空闲' },
      { color: '#22c55e', label: '去堆场' },
      { color: '#3b82f6', label: '返回' },
      { color: '#f59e0b', label: '装卸' }
    ]
    
    let x = 220
    items.forEach(item => {
      this.ctx.fillStyle = item.color
      this.ctx.fillRect(x, MAP_HEIGHT - 20, 12, 10)
      this.ctx.fillStyle = '#94a3b8'
      this.ctx.fillText(item.label, x + 16, MAP_HEIGHT - 12)
      x += 70
    })
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
