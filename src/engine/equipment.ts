import type { Character, OwnedCharacter, Stats } from '@/types';
import { getEquipment } from '@/data';
import { statsAtLevel } from './leveling';

export function statsWithEquipment(character: Character, owned: OwnedCharacter): Stats {
  const base = statsAtLevel(character, owned.level);
  return [owned.equippedWeaponId, owned.equippedArmorId, owned.equippedAccessoryId]
    .filter(Boolean)
    .reduce<Stats>((stats, id) => {
      const bonus = getEquipment(id!).bonus;
      return {
        hp: stats.hp + (bonus.hp ?? 0), mp: stats.mp + (bonus.mp ?? 0),
        atk: stats.atk + (bonus.atk ?? 0), def: stats.def + (bonus.def ?? 0), spd: stats.spd + (bonus.spd ?? 0),
      };
    }, base);
}
