import type { Character, OwnedCharacter, Stats } from '@/types';
import { getEquipment } from '@/data';
import type { EquipmentSlot } from '@/data/equipment';
import { statsAtLevel } from './leveling';
import { enhancedEquipmentBonus } from './forging';

/** 選択した文学星座から、次の祝福まで続く固有バフ。 */
export function patronBlessingBonus(worldId?: string): Partial<Stats> {
  const bonuses: Record<string, Partial<Stats>> = {
    beowulf:{atk:5}, hamlet:{int:5}, macbeth:{atk:3,spd:2}, gulliver:{spd:5}, crusoe:{def:5}, mariner:{mdef:5},
    frankenstein:{int:3,hp:12}, alice:{luk:5}, holmes:{int:3,luk:2}, dracula:{atk:3,mp:6}, dalloway:{mdef:3,luk:2}, nineteen84:{def:3,spd:2},
  };
  return worldId ? bonuses[worldId] ?? {} : {};
}

export function statsWithEquipment(character: Character, owned: OwnedCharacter, permanentBonus?: Partial<Stats>, equipmentLevels: Record<string, number> = {}): Stats {
  const base = statsAtLevel(character, owned.level);
  const allocated = owned.allocatedStats ?? { atk: 0, int: 0, def: 0, mdef: 0, spd: 0, luk: 0 };
  const patron = patronBlessingBonus(owned.patronWorldId);
  return equippedItemIds(owned)
    .filter(Boolean)
    .reduce<Stats>((stats, id) => {
      const bonus = enhancedEquipmentBonus(getEquipment(id!).bonus, equipmentLevels[id!] ?? 0);
      return {
        hp: stats.hp + (bonus.hp ?? 0), mp: stats.mp + (bonus.mp ?? 0),
        atk: stats.atk + (bonus.atk ?? 0), def: stats.def + (bonus.def ?? 0), spd: stats.spd + (bonus.spd ?? 0),
        int: (stats.int ?? 0) + (bonus.int ?? 0), mdef: (stats.mdef ?? 0) + (bonus.mdef ?? 0), luk: (stats.luk ?? 0) + (bonus.luk ?? 0),
      };
    }, {
      hp: base.hp + (permanentBonus?.hp ?? 0) + (patron.hp ?? 0),
      mp: base.mp + (permanentBonus?.mp ?? 0) + (patron.mp ?? 0),
      atk: base.atk + allocated.atk + (permanentBonus?.atk ?? 0) + (patron.atk ?? 0),
      int: (base.int ?? 0) + allocated.int + (permanentBonus?.int ?? 0) + (patron.int ?? 0),
      def: base.def + allocated.def + (permanentBonus?.def ?? 0) + (patron.def ?? 0),
      mdef: (base.mdef ?? 0) + allocated.mdef + (permanentBonus?.mdef ?? 0) + (patron.mdef ?? 0),
      spd: base.spd + allocated.spd + (permanentBonus?.spd ?? 0) + (patron.spd ?? 0),
      luk: (base.luk ?? 0) + allocated.luk + (permanentBonus?.luk ?? 0) + (patron.luk ?? 0),
    });
}

export function equippedItemIds(owned: OwnedCharacter): string[] {
  return [owned.equippedWeaponId, owned.equippedHeadId, owned.equippedArmorId, owned.equippedArmsId, owned.equippedShieldId, owned.equippedLegsId]
    .filter(Boolean) as string[];
}

export function equipItem(owned: OwnedCharacter, slot: EquipmentSlot, itemId: string): OwnedCharacter {
  const field: Record<EquipmentSlot, keyof OwnedCharacter> = {
    weapon: 'equippedWeaponId', head: 'equippedHeadId', armor: 'equippedArmorId',
    arms: 'equippedArmsId', shield: 'equippedShieldId', legs: 'equippedLegsId',
  };
  return { ...owned, [field[slot]]: itemId, equippedAccessoryId: undefined };
}

export function normalizeEquipmentSlots(owned: OwnedCharacter): OwnedCharacter {
  if (!owned.equippedAccessoryId) return owned;
  const legacy = getEquipment(owned.equippedAccessoryId);
  return legacy ? equipItem(owned, legacy.slot, legacy.id) : { ...owned, equippedAccessoryId: undefined };
}
