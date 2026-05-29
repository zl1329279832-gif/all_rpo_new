import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { GameState, ScoreResult, Ship, ShipState, ResourceStack, Tech } from '../types';
import { ResourceType, ShipType, ShipState as SS, GamePhase, TechType } from '../types';
import { createInitialGameState } from '../game/core/GameState';
import { generateStarMap } from '../game/map/StarMapGenerator';
import { moveShip, getCargoTotal, createShip } from '../game/entities/Ship';
import { getSectorById, getConnectedSectors } from '../game/entities/Sector';
import { processMining } from '../game/economy/ResourceProduction';
import { addToWarehouse, getEffectiveCapacity } from '../game/economy/WarehouseCapacity';
import { consumeEnergy, getEnergyRate } from '../game/economy/EnergyConsumption';
import { canUpgradeTech, upgradeTech, getTechBonus } from '../game/tech/TechTree';
import { EventManager } from '../game/events/EventManager';
import { resolveCombat } from '../game/combat/CombatResolver';
import { checkObjectives, calculateScore } from '../game/levels/LevelManager';
import { LEVEL_CONFIGS } from '../game/levels/levelData';
import { StorageService } from '../services/StorageService';

export const useGameStore = defineStore('game', () => {
  const state = ref<GameState | null>(null);
  const selectedSectorId = ref<string | null>(null);
  const selectedShipId = ref<string | null>(null);
  const eventManager = new EventManager();
  const autoSaveTimer = ref<number | null>(null);

  const currentLevelConfig = computed(() => {
    if (!state.value) return null;
    return LEVEL_CONFIGS.find(l => l.id === state.value!.levelId);
  });

  const isPlaying = computed(() => state.value?.phase === GamePhase.Playing);
  const isPaused = computed(() => state.value?.phase === GamePhase.Paused);
  const isCompleted = computed(() => state.value?.phase === GamePhase.Completed);
  const hasActiveEvent = computed(() => state.value?.activeEvent !== null);

  function initLevel(levelId: string, loadSave = false): void {
    const config = LEVEL_CONFIGS.find(l => l.id === levelId);
    if (!config) return;

    if (loadSave) {
      const saved = StorageService.load(levelId);
      if (saved) {
        if (saved.activeEvent && !saved.activeEvent.resolved) {
          saved.phase = GamePhase.Event;
        } else if (saved.phase !== GamePhase.Completed) {
          saved.phase = GamePhase.Playing;
        }
        saved.activeEvent = saved.events.find(e => !e.resolved) || null;
        state.value = saved;
        startAutoSave();
        return;
      }
    }

    const sectors = generateStarMap(config.sectorCount);
    const mothershipSector = sectors[0];
    const newState = createInitialGameState(config);

    const ships: Ship[] = [];
    let shipIndex = 0;

    const ms = createShip(ShipType.Mothership, `ship_${shipIndex}`, 'MV Genesis', mothershipSector.id);
    ships.push(ms);
    newState.mothershipId = ms.id;
    shipIndex++;

    for (const configShip of config.initialShips) {
      const nameMap: Record<string, string[]> = {
        [ShipType.MiningShip]: ['Mining Alpha', 'Mining Beta', 'Mining Gamma'],
        [ShipType.TransportShip]: ['Hauler One', 'Hauler Two', 'Hauler Three'],
        [ShipType.DefenseShip]: ['Defender I', 'Defender II', 'Defender III']
      };
      const names = nameMap[configShip.type] || [];
      for (let i = 0; i < configShip.count; i++) {
        const name = names.length > 0 ? names[i % names.length] : `Ship ${shipIndex}`;
        ships.push(createShip(configShip.type, `ship_${shipIndex}`, name, mothershipSector.id));
        shipIndex++;
      }
    }

    newState.sectors = sectors;
    newState.ships = ships;
    state.value = newState;
    StorageService.deleteSave(levelId);
    startAutoSave();
  }

  function update(dt: number): void {
    if (!state.value || state.value.phase !== GamePhase.Playing) return;

    state.value.gameTime += dt;
    const currentState = state.value;

    for (const ship of currentState.ships) {
      if (ship.state === SS.Moving || ship.state === SS.Transporting) {
        const arrived = moveShip(ship, dt, currentState.sectors);
        if (arrived) {
          const motherShip = currentState.ships.find(s => s.id === currentState.mothershipId);
          if (ship.cargo.length > 0 && motherShip && ship.sectorId === motherShip.sectorId) {
            for (const stack of ship.cargo) {
              const result = addToWarehouse(currentState.warehouse, stack.type, stack.amount, currentState.warehouseCapacity, currentState.techs);
              currentState.warehouse = result.warehouse;
            }
            ship.cargo = [];
          }
          ship.state = SS.Idle;
        }
      }
    }

    const miningEvents = processMining(currentState.ships, currentState.sectors, currentState.techs, dt);

    consumeEnergy(currentState, dt);
    currentState.energyRate = getEnergyRate(currentState);

    const event = eventManager.checkForEvents(currentState, dt);
    if (event && !currentState.activeEvent) {
      currentState.activeEvent = event;
      currentState.events.push(event);
      currentState.phase = GamePhase.Event;
    }

    if (checkObjectives(currentState)) {
      currentState.phase = GamePhase.Completed;
      stopAutoSave();
    }
  }

  function orderShipTo(shipId: string, targetSectorId: string): boolean {
    if (!state.value) return false;
    const ship = state.value.ships.find(s => s.id === shipId);
    const sector = getSectorById(state.value.sectors, ship.sectorId);
    if (!ship || !sector || ship.type === ShipType.Mothership) return false;
    const connected = getConnectedSectors(sector, state.value.sectors);
    if (!connected.some(s => s.id === targetSectorId)) return false;
    if (ship.state === SS.Mining) {
      ship.miningProgress = 0;
      if (getCargoTotal(ship) > 0 && ship.type === ShipType.MiningShip) {
        ship.state = SS.Transporting;
      } else {
        ship.state = SS.Moving;
      }
    } else if (getCargoTotal(ship) > 0) {
      ship.state = SS.Transporting;
    } else {
      ship.state = SS.Moving;
    }
    ship.targetSectorId = targetSectorId;
    ship.moveProgress = 0;
    return true;
  }

  function startMining(shipId: string): boolean {
    if (!state.value) return false;
    const ship = state.value.ships.find(s => s.id === shipId);
    if (!ship || ship.type !== ShipType.MiningShip) return false;
    const sector = getSectorById(state.value.sectors, ship.sectorId);
    if (!sector || sector.type !== 'mining' || !sector.resourceType || sector.resourceAmount <= 0) return false;
    ship.state = SS.Mining;
    ship.miningProgress = 0;
    return true;
  }

  function transferCargoToMothership(shipId: string): void {
    if (!state.value) return;
    const ship = state.value.ships.find(s => s.id === shipId);
    if (!ship || ship.sectorId !== state.value.sectors[0].id) return;
    for (const stack of ship.cargo) {
      const result = addToWarehouse(state.value.warehouse, stack.type, stack.amount, state.value.warehouseCapacity, state.value.techs);
      state.value.warehouse = result.warehouse;
    }
    ship.cargo = [];
  }

  function upgradeTechAction(techType: TechType): boolean {
    if (!state.value) return false;
    const tech = state.value.techs.find(t => t.type === techType);
    if (!tech || !canUpgradeTech(tech, state.value.warehouse)) return false;
    state.value.warehouse = upgradeTech(tech, state.value.warehouse);
    return true;
  }

  function resolveEventChoice(choice: string): void {
    if (!state.value || !state.value.activeEvent) return;
    const evt = state.value.activeEvent;
    const currentState = state.value;

    if (choice === 'evacuate') {
      const affectedShips = currentState.ships.filter(s => s.sectorId === evt.sectorId && s.type !== ShipType.Mothership);
      for (const ship of affectedShips) {
        ship.sectorId = currentState.sectors[0].id;
        ship.targetSectorId = null;
        ship.state = SS.Idle;
        ship.moveProgress = 0;
      }
    } else if (choice === 'hold') {
      const affectedShips = currentState.ships.filter(s => s.sectorId === evt.sectorId);
      for (const ship of affectedShips) {
        ship.health = Math.max(0, ship.health - 30);
      }
      const destroyed = affectedShips.filter(s => s.health <= 0);
      currentState.losses += destroyed.length;
      currentState.ships = currentState.ships.filter(s => s.health > 0);
    } else if (choice === 'reroute') {
      currentState.energy = Math.max(0, currentState.energy - 50);
    } else if (choice === 'defend') {
      const defenseShips = currentState.ships.filter(s => s.type === ShipType.DefenseShip && s.sectorId === evt.sectorId);
      if (defenseShips.length === 0) {
        const miners = currentState.ships.filter(s => s.sectorId === evt.sectorId && s.type !== ShipType.Mothership);
        for (const ship of miners) {
          ship.health = Math.max(0, ship.health - 50);
        }
      } else {
        const combat = resolveCombat(defenseShips, currentState.techs);
        if (combat.winner === 'player') {
          for (const ship of defenseShips) {
            ship.health = Math.max(0, ship.health - combat.playerDamage / defenseShips.length);
          }
        } else {
          for (const ship of defenseShips) {
            ship.health = Math.max(0, ship.health - combat.playerDamage / defenseShips.length);
          }
        }
        const destroyed = currentState.ships.filter(s => s.health <= 0);
        currentState.losses += destroyed.length;
        currentState.ships = currentState.ships.filter(s => s.health > 0);
      }
    } else if (choice === 'abandon') {
      const sector = getSectorById(currentState.sectors, evt.sectorId);
      if (sector) sector.resourceAmount = 0;
      const affectedShips = currentState.ships.filter(s => s.sectorId === evt.sectorId && s.type !== ShipType.Mothership);
      for (const ship of affectedShips) {
        ship.sectorId = currentState.sectors[0].id;
        ship.targetSectorId = null;
        ship.state = SS.Idle;
        ship.moveProgress = 0;
      }
    }

    evt.resolved = true;
    currentState.activeEvent = null;
    currentState.phase = GamePhase.Playing;
  }

  function togglePause(): void {
    if (!state.value) return;
    if (state.value.phase === GamePhase.Playing) {
      state.value.phase = GamePhase.Paused;
    } else if (state.value.phase === GamePhase.Paused) {
      state.value.phase = GamePhase.Playing;
    }
  }

  function manualSave(): void {
    if (!state.value) return;
    StorageService.save(state.value.levelId, state.value);
    state.value.lastSaveTime = Date.now();
  }

  function startAutoSave(): void {
    stopAutoSave();
    autoSaveTimer.value = window.setInterval(() => {
      manualSave();
    }, 30000);
  }

  function stopAutoSave(): void {
    if (autoSaveTimer.value !== null) {
      clearInterval(autoSaveTimer.value);
      autoSaveTimer.value = null;
    }
  }

  function getScore(): ScoreResult | null {
    if (!state.value) return null;
    return calculateScore(state.value);
  }

  function cleanup(): void {
    stopAutoSave();
    state.value = null;
    selectedSectorId.value = null;
    selectedShipId.value = null;
  }

  return {
    state,
    selectedSectorId,
    selectedShipId,
    currentLevelConfig,
    isPlaying,
    isPaused,
    isCompleted,
    hasActiveEvent,
    initLevel,
    update,
    orderShipTo,
    startMining,
    transferCargoToMothership,
    upgradeTechAction,
    resolveEventChoice,
    togglePause,
    manualSave,
    getScore,
    cleanup
  };
});
