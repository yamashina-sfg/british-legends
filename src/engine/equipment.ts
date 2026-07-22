import type { Character, OwnedCharacter, Stats } from '@/types';
import { getEquipment } from '@/data';
import { statsAtLevel } from './leveling';
import { enhancedEquipmentBonus } from './forging';

export function statsWithEquipment(character: Character, owned: OwnedCharacter, permanentBonus?: Partial<Stats>, equipmentLevels: Record<string, number> = {}): Stats {
  const base = statsAtLevel(character, owned.level);
  return [owned.equippedWeaponId, owned.equippedArmorId, owned.equippedAccessoryId]
    .filter(Boolean)
    .reduce<Stats>((stats, id) => {
      const bonus = enhancedEquipmentBonus(getEquipment(id!).bonus, equipmentLevels[id!] ?? 0);
      return {
        hp: stats.hp + (bonus.hp ?? 0), mp: stats.mp + (bonus.mp ?? 0),
        atk: stats.atk + (bonus.atk ?? 0), def: stats.def + (bonus.def ?? 0), spd: stats.spd + (bonus.spd ?? 0),
      };
    }, {
      hp: base.hp + (permanentBonus?.hp ?? 0),
      mp: base.mp + (permanentBonus?.mp ?? 0),
      atk: base.atk + (permanentBonus?.atk ?? 0),
      def: base.def + (permanentBonus?.def ?? 0),
      spd: base.spd + (permanentBonus?.spd ?? 0),
    });
}
