import { TechType } from '../../types';
import type { Ship, Tech } from '../../types';
import { getTechBonus } from '../tech/TechTree';

export function resolveCombat(
  defenseShips: Ship[],
  techs: Tech[]
): { winner: 'player' | 'enemy'; playerDamage: number; enemyDestroyed: boolean } {
  if (defenseShips.length === 0) {
    return { winner: 'enemy', playerDamage: 0, enemyDestroyed: false };
  }

  const defenseBonus = getTechBonus(TechType.DefensePower, techs);
  const playerAttack = defenseShips.reduce((sum, ship) => sum + ship.attack, 0)
    * (1 + defenseBonus * 0.2);

  const enemyAttack = 20 + Math.random() * 30;

  const mutableShips = defenseShips.map(s => ({ ...s, cargo: [...s.cargo] }));

  if (playerAttack > enemyAttack) {
    const totalDamage = Math.floor(enemyAttack * 0.5);
    distributeDamage(mutableShips, totalDamage);
    return { winner: 'player', playerDamage: totalDamage, enemyDestroyed: true };
  } else {
    const totalDamage = Math.floor(enemyAttack);
    distributeDamage(mutableShips, totalDamage);
    return { winner: 'enemy', playerDamage: totalDamage, enemyDestroyed: false };
  }
}

function distributeDamage(ships: Ship[], totalDamage: number): void {
  const totalHealth = ships.reduce((sum, ship) => sum + ship.health, 0);
  if (totalHealth <= 0) return;

  let remaining = totalDamage;
  for (const ship of ships) {
    const share = (ship.health / totalHealth) * totalDamage;
    const damage = Math.min(Math.floor(share), ship.health);
    ship.health -= damage;
    remaining -= damage;
  }

  let idx = 0;
  while (remaining > 0 && idx < ships.length) {
    const canTake = ships[idx].health;
    const apply = Math.min(remaining, canTake);
    ships[idx].health -= apply;
    remaining -= apply;
    idx++;
  }
}
