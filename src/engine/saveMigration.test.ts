import { describe, expect, it } from 'vitest';
import { createOwnedCharacter, expandLegacyCharacterHp } from './save';

describe('data 29 HP migration', () => {
  it('preserves legacy HP proportion by expanding the old 1/10 battle scale', () => {
    const owned={...createOwnedCharacter('beowulf_young'),currentHp:37};
    expect(expandLegacyCharacterHp(owned).currentHp).toBe(370);
  });
  it('never expands above the new level maximum', () => {
    const owned={...createOwnedCharacter('beowulf_young'),currentHp:999};
    expect(expandLegacyCharacterHp(owned).currentHp).toBe(800);
  });
});
