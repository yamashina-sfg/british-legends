import type { Character, OwnedCharacter, Stats } from '@/types';
import { getEquipment } from '@/data';
import { statsAtLevel } from './leveling';
import { enhancedEquipmentBonus } from './forging';

export function statsWithEquipment(character: Character, owned: OwnedCharacter, permanentBonus?: Partial<Stats>, equipmentLevels: Record<string, number> = {}): Stats {
  const base = statsAtLevel(character, owned.level);
  const allocated = owned.allocatedStats ?? { atk: 0, int: 0, def: 0, mdef: 0, spd: 0, luk: 0 };
  return [owned.equippedWeaponId, owned.equippedArmorId, owned.equippedAccessoryId]
    .filter(Boolean)
    .reduce<Stats>((stats, id) => {
      const bonus = enhancedEquipmentBonus(getEquipment(id!).bonus, equipmentLevels[id!] ?? 0);
      return {
        hp: stats.hp + (bonus.hp ?? 0), mp: stats.mp + (bonus.mp ?? 0),
        atk: stats.atk + (bonus.atk ?? 0), def: stats.def + (bonus.def ?? 0), spd: stats.spd + (bonus.spd ?? 0),
        int: (stats.int ?? 0) + (bonus.int ?? 0), mdef: (stats.mdef ?? 0) + (bonus.mdef ?? 0), luk: (stats.luk ?? 0) + (bonus.luk ?? 0),
      };
    }, {
      hp: base.hp + (permanentBonus?.hp ?? 0),
      mp: base.mp + (permanentBonus?.mp ?? 0),
      atk: base.atk + allocated.atk + (permanentBonus?.atk ?? 0),
      int: (base.int ?? 0) + allocated.int + (permanentBonus?.int ?? 0),
      def: base.def + allocated.def + (permanentBonus?.def ?? 0),
      mdef: (base.mdef ?? 0) + allocated.mdef + (permanentBonus?.mdef ?? 0),
      spd: base.spd + allocated.spd + (permanentBonus?.spd ?? 0),
      luk: (base.luk ?? 0) + allocated.luk + (permanentBonus?.luk ?? 0),
    });
}
