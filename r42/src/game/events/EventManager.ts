import { EventType, ShipState } from '../../types';
import type { GameState, GameEvent, EventChoice } from '../../types';
import { LEVEL_CONFIGS } from '../levels/levelData';

export class EventManager {
  checkForEvents(state: GameState, dt: number): GameEvent | null {
    if (state.activeEvent) return null;

    const config = LEVEL_CONFIGS.find(c => c.id === state.levelId);
    if (!config) return null;

    const probability = config.eventFrequency * dt;
    if (Math.random() >= probability) return null;

    const eventTypes = [EventType.Asteroid, EventType.EnergyCrisis, EventType.HostileRaid];
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    const miningSectors = state.sectors.filter(s => s.resourceType !== undefined && s.resourceType !== null);
    const randomSector = miningSectors.length > 0
      ? miningSectors[Math.floor(Math.random() * miningSectors.length)]
      : null;

    const timestamp = state.gameTime;

    switch (type) {
      case EventType.Asteroid: {
        const sectorName = randomSector ? randomSector.name : 'unknown sector';
        const choices: EventChoice[] = [
          { label: 'Evacuate ships', effect: 'evacuate' },
          { label: 'Hold position', effect: 'hold' },
        ];
        return {
          id: `evt_${Date.now()}`,
          type: EventType.Asteroid,
          sectorId: randomSector?.id ?? '',
          description: `Asteroid swarm approaching ${sectorName}!`,
          timestamp,
          resolved: false,
          choices,
        };
      }
      case EventType.EnergyCrisis: {
        const choices: EventChoice[] = [
          { label: 'Reroute power', effect: 'reroute' },
          { label: 'Emergency shutdown', effect: 'shutdown' },
        ];
        return {
          id: `evt_${Date.now()}`,
          type: EventType.EnergyCrisis,
          sectorId: '',
          description: 'Energy grid malfunction detected!',
          timestamp,
          resolved: false,
          choices,
        };
      }
      case EventType.HostileRaid: {
        const sectorName = randomSector ? randomSector.name : 'unknown sector';
        const choices: EventChoice[] = [
          { label: 'Send defense ships', effect: 'defend' },
          { label: 'Abandon sector', effect: 'abandon' },
        ];
        return {
          id: `evt_${Date.now()}`,
          type: EventType.HostileRaid,
          sectorId: randomSector?.id ?? '',
          description: `Hostile forces detected near ${sectorName}!`,
          timestamp,
          resolved: false,
          choices,
        };
      }
      default:
        return null;
    }
  }

  resolveEvent(state: GameState, choice: string): GameState {
    const event = state.activeEvent;
    if (!event) return state;

    const updatedShips = state.ships.map(s => ({ ...s, cargo: [...s.cargo] }));
    const updatedSectors = state.sectors.map(s => ({ ...s, connections: [...s.connections] }));
    const updatedWarehouse = state.warehouse.map(s => ({ ...s }));

    switch (choice) {
      case 'evacuate': {
        const sectorId = event.sectorId;
        for (const ship of updatedShips) {
          if (ship.sectorId === sectorId) {
            ship.sectorId = state.mothershipId;
            ship.state = ShipState.Idle;
            ship.targetSectorId = null;
            ship.moveProgress = 0;
            ship.miningProgress = 0;
          }
        }
        break;
      }
      case 'hold': {
        const sectorId = event.sectorId;
        for (const ship of updatedShips) {
          if (ship.sectorId === sectorId) {
            ship.health = Math.max(0, ship.health - 30);
          }
        }
        break;
      }
      case 'reroute': {
        break;
      }
      case 'shutdown': {
        for (const ship of updatedShips) {
          ship.state = ShipState.Idle;
          ship.targetSectorId = null;
          ship.moveProgress = 0;
          ship.miningProgress = 0;
        }
        break;
      }
      case 'defend': {
        break;
      }
      case 'abandon': {
        const sectorId = event.sectorId;
        for (const ship of updatedShips) {
          if (ship.sectorId === sectorId) {
            ship.sectorId = state.mothershipId;
            ship.state = ShipState.Idle;
            ship.targetSectorId = null;
            ship.moveProgress = 0;
            ship.miningProgress = 0;
            ship.cargo = [];
          }
        }
        const sector = updatedSectors.find(s => s.id === sectorId);
        if (sector) {
          sector.resourceAmount = 0;
        }
        break;
      }
    }

    return {
      ...state,
      ships: updatedShips,
      sectors: updatedSectors,
      warehouse: updatedWarehouse,
      energy: choice === 'reroute' ? Math.max(0, state.energy - 50) : state.energy,
      activeEvent: null,
    };
  }
}
