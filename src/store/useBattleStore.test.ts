import { describe, expect, it } from 'vitest';
import { combatantFromOwned } from '@/engine/battle';
import { useBattleStore } from './useBattleStore';
import type { OwnedCharacter } from '@/types';

const beowulf: OwnedCharacter = {
  characterId: 'beowulf_young', level: 1, exp: 0, currentHp: 80, currentMp: 12,
  learnedSkillIds: ['attack_basic', 'mighty_grip'],
};

const hamlet: OwnedCharacter = {
  characterId: 'hamlet_prince', level: 1, exp: 0, currentHp: 70, currentMp: 24,
  learnedSkillIds: ['attack_basic', 'poison_blade'],
};

describe('battle command input', () => {
  it('requests exactly one command from each living ally before resolving the round', () => {
    const battle = useBattleStore.getState();
    battle.start([beowulf, hamlet], ['grendel'], false);

    expect(useBattleStore.getState().currentActor()?.sourceId).toBe('beowulf_young');
    useBattleStore.getState().chooseCommand({ type: 'defend' });

    expect(useBattleStore.getState().phase).toBe('input');
    expect(useBattleStore.getState().currentActor()?.sourceId).toBe('hamlet_prince');
    expect(useBattleStore.getState().planned).toHaveLength(1);

    useBattleStore.getState().chooseCommand({ type: 'defend' });
    expect(useBattleStore.getState().planned).toHaveLength(0);
    expect(useBattleStore.getState().inputIndex).toBe(0);
  });

  it('assigns unique combatant ids even when two party entries share a character id', () => {
    expect(combatantFromOwned(beowulf, 0).uid).not.toBe(combatantFromOwned(beowulf, 1).uid);
  });
});
