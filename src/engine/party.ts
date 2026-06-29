import type { OwnedCharacter, SaveData } from '@/types';

export const ACTIVE_PARTY_LIMIT = 3;

export function getActivePartyIds(save: SaveData): string[] {
  const availableIds = save.party.map((member) => member.characterId);
  const available = new Set(availableIds);
  const selected = (save.activePartyIds ?? []).filter((id) => available.has(id));
  const base = selected.length > 0 ? selected : availableIds;
  return base.slice(0, ACTIVE_PARTY_LIMIT);
}

export function getActiveParty(save: SaveData): OwnedCharacter[] {
  const ids = getActivePartyIds(save);
  return ids
    .map((id) => save.party.find((member) => member.characterId === id))
    .filter((member): member is OwnedCharacter => Boolean(member));
}

export function normalizeActiveParty(save: SaveData): SaveData {
  return { ...save, activePartyIds: getActivePartyIds(save) };
}

export function toggleActivePartyMember(save: SaveData, characterId: string): SaveData {
  if (!save.party.some((member) => member.characterId === characterId)) return normalizeActiveParty(save);
  const activeIds = getActivePartyIds(save);
  const isActive = activeIds.includes(characterId);

  if (isActive) {
    if (activeIds.length <= 1) return { ...save, activePartyIds: activeIds };
    return { ...save, activePartyIds: activeIds.filter((id) => id !== characterId) };
  }

  if (activeIds.length >= ACTIVE_PARTY_LIMIT) return { ...save, activePartyIds: activeIds };
  return { ...save, activePartyIds: [...activeIds, characterId] };
}
