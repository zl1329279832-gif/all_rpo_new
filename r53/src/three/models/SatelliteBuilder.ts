import * as THREE from 'three'
import { buildMainBody } from './MainBody'
import { buildSolarPanels } from './SolarPanel'
import type { SolarPanelData } from './SolarPanel'
import { buildAntenna, buildSBandAntenna } from './Antenna'
import { buildThrusters, buildRCSThrusters } from './Thruster'
import { buildSensors } from './Sensor'
import { buildHeatSinks, buildRadiators } from './HeatSink'
import { buildSupports } from './Support'
import { buildCables, buildConnectors } from './Cable'
import { buildInternalModules } from './InternalModule'

export interface SatelliteData {
  group: THREE.Group
  parts: Map<string, THREE.Object3D>
  solarPanelData: SolarPanelData
  internalModules: THREE.Group
  explodedOffsets: Map<string, THREE.Vector3>
}

export class SatelliteBuilder {
  private satellite: THREE.Group
  private parts: Map<string, THREE.Object3D>
  private solarPanelData!: SolarPanelData
  private internalModules!: THREE.Group
  private explodedOffsets: Map<string, THREE.Vector3>

  constructor() {
    this.satellite = new THREE.Group()
    this.satellite.name = 'satellite'
    this.parts = new Map()
    this.explodedOffsets = new Map()
  }

  build(): SatelliteData {
    const mainBody = buildMainBody()
    this.satellite.add(mainBody)
    this.registerPart('main_body', mainBody)

    this.solarPanelData = buildSolarPanels()
    this.satellite.add(this.solarPanelData.group)
    this.registerPart('solar_panels', this.solarPanelData.group)

    const antenna = buildAntenna()
    this.satellite.add(antenna)
    this.registerPart('antenna', antenna)

    const sbandAntenna = buildSBandAntenna()
    this.satellite.add(sbandAntenna)
    this.registerPart('sband_antenna', sbandAntenna)

    const thrusters = buildThrusters()
    this.satellite.add(thrusters)
    this.registerPart('thrusters', thrusters)

    const rcsThrusters = buildRCSThrusters()
    this.satellite.add(rcsThrusters)
    this.registerPart('rcs_thrusters', rcsThrusters)

    const sensors = buildSensors()
    this.satellite.add(sensors)
    this.registerPart('sensors', sensors)

    const heatSinks = buildHeatSinks()
    this.satellite.add(heatSinks)
    this.registerPart('heat_sinks', heatSinks)

    const radiators = buildRadiators()
    this.satellite.add(radiators)
    this.registerPart('radiators', radiators)

    const supports = buildSupports()
    this.satellite.add(supports)
    this.registerPart('supports', supports)

    const cables = buildCables()
    this.satellite.add(cables)
    this.registerPart('cables', cables)

    const connectors = buildConnectors()
    this.satellite.add(connectors)
    this.registerPart('connectors', connectors)

    this.internalModules = buildInternalModules()
    this.internalModules.visible = false
    this.satellite.add(this.internalModules)
    this.registerPart('internal_modules', this.internalModules)

    this.calculateExplodedOffsets()

    return {
      group: this.satellite,
      parts: this.parts,
      solarPanelData: this.solarPanelData,
      internalModules: this.internalModules,
      explodedOffsets: this.explodedOffsets,
    }
  }

  private registerPart(id: string, object: THREE.Object3D): void {
    this.parts.set(id, object)
    object.userData.partId = id
    object.traverse((child) => {
      if (child !== object) {
        child.userData.parentPartId = id
      }
    })
  }

  private calculateExplodedOffsets(): void {
    const offsets: { [key: string]: THREE.Vector3 } = {
      main_body: new THREE.Vector3(0, 0, 0),
      solar_panels: new THREE.Vector3(0, 2, 0),
      antenna: new THREE.Vector3(2, 1, 0),
      sband_antenna: new THREE.Vector3(-2, 1, 0),
      thrusters: new THREE.Vector3(0, -2, 0),
      rcs_thrusters: new THREE.Vector3(0, -1.5, 2),
      sensors: new THREE.Vector3(1.5, 2, 1.5),
      heat_sinks: new THREE.Vector3(0, 1, -2),
      radiators: new THREE.Vector3(3, 0, 0),
      supports: new THREE.Vector3(-3, 0, 0),
      cables: new THREE.Vector3(0, 0, 2),
      connectors: new THREE.Vector3(1.5, 0, 1.5),
      internal_modules: new THREE.Vector3(0, 0.5, 0),
    }

    Object.entries(offsets).forEach(([key, value]) => {
      this.explodedOffsets.set(key, value)
    })
  }

  getPartById(id: string): THREE.Object3D | undefined {
    return this.parts.get(id)
  }

  getAllParts(): Map<string, THREE.Object3D> {
    return this.parts
  }

  getSolarPanelData(): SolarPanelData {
    return this.solarPanelData
  }

  getInternalModules(): THREE.Group {
    return this.internalModules
  }

  getExplodedOffset(partId: string): THREE.Vector3 | undefined {
    return this.explodedOffsets.get(partId)
  }

  getSatelliteGroup(): THREE.Group {
    return this.satellite
  }
}

export function buildSatellite(): SatelliteData {
  const builder = new SatelliteBuilder()
  return builder.build()
}
