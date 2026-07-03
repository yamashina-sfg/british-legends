import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '@/store/useGameStore';
import { ACTIVE_PARTY_LIMIT, getActivePartyIds } from './party';
import { createNewSave, loadSlot, saveSlot, unlockCharacter } from './save';
import type { SaveData } from '@/types';

function installLocalStorageMock() {
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
    },
  });
}

function saveWithParty(characterIds: string[]): SaveData {
  return characterIds.reduce((save, characterId) => unlockCharacter(save, characterId).data, createNewSave(1));
}

describe('ally unlock flow', () => {
  beforeEach(() => {
    installLocalStorageMock();
  });

  afterEach(() => {
    useGameStore.setState({ save: null, scene: 'title', newlyJoinedCharacterId: null, map: null, encounter: null });
    localStorage.clear();
  });

  it('unlocks Beowulf, Hamlet, and Macbeth from world completion rewards', () => {
    let save = createNewSave(1);
    for (const [worldId, characterId] of [
      ['beowulf', 'beowulf_young'],
      ['hamlet', 'hamlet_prince'],
      ['macbeth', 'macbeth_thane'],
    ] as const) {
      useGameStore.setState({ save: { ...save, progress: { ...save.progress, currentWorldId: worldId } }, newlyJoinedCharacterId: null });
      useGameStore.getState().completeWorld(worldId);
      save = useGameStore.getState().save!;

      expect(save.party.some((member) => member.characterId === characterId)).toBe(true);
      expect(useGameStore.getState().newlyJoinedCharacterId).toBe(characterId);
    }
  });

  it('shows unlocked allies in the owned roster and active party up to four members', () => {
    const save = saveWithParty(['beowulf_young', 'hamlet_prince', 'macbeth_thane', 'gulliver_traveler', 'holmes_detective']);

    expect(save.party.map((member) => member.characterId)).toEqual([
      'beowulf_young',
      'hamlet_prince',
      'macbeth_thane',
      'gulliver_traveler',
      'holmes_detective',
    ]);
    expect(getActivePartyIds(save)).toHaveLength(ACTIVE_PARTY_LIMIT);
    expect(getActivePartyIds(save)).not.toContain('holmes_detective');
  });

  it('does not duplicate an ally when the same world is cleared again', () => {
    const first = unlockCharacter(createNewSave(1), 'hamlet_prince');
    const second = unlockCharacter(first.data, 'hamlet_prince');

    expect(first.joined).toBe(true);
    expect(second.joined).toBe(false);
    expect(second.data.party.filter((member) => member.characterId === 'hamlet_prince')).toHaveLength(1);
  });

  it('preserves unlocked allies after saving and loading', () => {
    const save = saveWithParty(['beowulf_young', 'hamlet_prince', 'macbeth_thane', 'gulliver_traveler', 'holmes_detective']);

    saveSlot(save);
    const loaded = loadSlot(1)!;

    expect(loaded.party.map((member) => member.characterId)).toContain('holmes_detective');
    expect(loaded.party).toHaveLength(5);
    expect(getActivePartyIds(loaded)).toHaveLength(4);
  });
});
