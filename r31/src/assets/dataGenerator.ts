import { RACK_CONFIG, type RackData } from '../core/types'

export function generateRackData(count: number = 10000): RackData[] {
  const racks: RackData[] = []
  const rows = Math.min(RACK_CONFIG.ROWS, Math.ceil(Math.sqrt(count)))
  const cols = Math.min(RACK_CONFIG.COLS, Math.ceil(count / rows))
  
  const offsetX = ((cols - 1) * RACK_CONFIG.GAP_X) / 2
  const offsetZ = ((rows - 1) * RACK_CONFIG.GAP_Z) / 2
  
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols)
    const col = i % cols
    
    const x = col * RACK_CONFIG.GAP_X - offsetX
    const z = row * RACK_CONFIG.GAP_Z - offsetZ
    
    const temperature = 20 + Math.random() * 30
    const rand = Math.random()
    
    let status: RackData['status'] = 'normal'
    if (temperature > 45) {
      status = 'critical'
    } else if (temperature > 35) {
      status = 'warning'
    } else if (rand < 0.02) {
      status = 'offline'
    }
    
    const typeRand = Math.random()
    let rackType: RackData['rackType'] = 'server'
    if (typeRand > 0.85) {
      rackType = 'network'
    } else if (typeRand > 0.7) {
      rackType = 'storage'
    }

    let alarmProgress = 0
    if (status === 'critical') {
      alarmProgress = 0.7 + Math.random() * 0.3
    } else if (status === 'warning') {
      alarmProgress = 0.3 + Math.random() * 0.4
    } else if (status === 'offline') {
      alarmProgress = 0.1 + Math.random() * 0.2
    }
    
    racks.push({
      id: i,
      x,
      z,
      row,
      col,
      temperature: Math.round(temperature * 10) / 10,
      power: Math.round((2 + Math.random() * 8) * 10) / 10,
      status,
      rackType,
      alarmProgress: Math.round(alarmProgress * 100) / 100
    })
  }
  
  return racks
}

export function generateRackDataJson(count: number = 10000): string {
  const racks = generateRackData(count)
  return JSON.stringify(racks, null, 2)
}

export function saveRackDataToFile(count: number = 10000, filename: string = 'racks.json'): void {
  const json = generateRackDataJson(count)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
