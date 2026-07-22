import { describe, expect, it } from 'vitest';
import type { OwnedCharacter } from '@/types';
import { equipItem, equippedItemIds, normalizeEquipmentSlots } from './equipment';

const hero: OwnedCharacter = {
  characterId: 'beowulf_1', level: 1, exp: 0, currentHp: 80, currentMp: 12,
  learnedSkillIds: [], equippedAccessoryId: 'cursed_crown',
};

describe('6部位装備', () => {
  it('旧アクセサリーを現在の部位へ自動移行する', () => {
    const migrated = normalizeEquipmentSlots(hero);
    expect(migrated.equippedHeadId).toBe('cursed_crown');
    expect(migrated.equippedAccessoryId).toBeUndefined();
  });

  it('異なる6部位を同時に装備できる', () => {
    const equipped = equipItem(equipItem({ ...hero, equippedAccessoryId: undefined }, 'weapon', 'iron_sword'), 'shield', 'king_ring');
    expect(equippedItemIds(equipped)).toEqual(['iron_sword', 'king_ring']);
  });
});
