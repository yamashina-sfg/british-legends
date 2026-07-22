import { describe, expect, it } from 'vitest';
import { createNewSave, createOwnedCharacter } from './save';
import { recoverPartyAfterDefeat } from './defeat';
import { getCharacter } from '@/data';
import { statsWithEquipment } from './equipment';
import { permanentStats } from './permanentStats';

describe('敗北時の復帰', () => {
  it('装備・恒久強化込みの最大HP/MPまで全回復する', () => {
    const base = createNewSave(1);
    const member = { ...createOwnedCharacter('beowulf_young'), currentHp: 1, currentMp: 0 };
    const save = { ...base, party: [member] };
    const expected = statsWithEquipment(
      getCharacter(member.characterId),
      member,
      permanentStats(save),
      save.equipmentLevels,
    );

    const [recovered] = recoverPartyAfterDefeat(save);
    expect(recovered.currentHp).toBe(expected.hp);
    expect(recovered.currentMp).toBe(expected.mp);
  });
});
