import type { OwnedCharacter, SaveData } from '@/types';
import { CHARACTERS, EQUIPMENT, getCharacter, getWorld, SKILLS, WORLD_ORDER } from '@/data';
import { statsAtLevel } from './leveling';

const STORAGE_PREFIX = 'british-legends:slot:';
export const SAVE_SLOTS = [1, 2, 3];

export function slotKey(slotId: number): string {
  return `${STORAGE_PREFIX}${slotId}`;
}

/** 新規セーブデータ。最初の世界だけ解放しておく。 */
export function createNewSave(slotId: number): SaveData {
  const firstWorldId = WORLD_ORDER[0];
  return {
    slotId,
    lastSavedAt: Date.now(),
    playTimeSec: 0,
    progress: {
      unlockedWorldIds: [firstWorldId],
      clearedWorldIds: [],
      currentWorldId: null,
    },
    party: [],
    inventory: {},
    items: {},
    equipmentInventory: [],
    storyFragments: [],
    learnedSkillBooks: [],
    exploration: {},
    gold: 36,
    codex: { discoveredIds: [] },
  };
}

const LEGACY_CHARACTER_IDS: Record<string, string> = {
  beowulf: 'beowulf_young',
  hamlet: 'hamlet_prince',
  macbeth: 'macbeth_thane',
};

function normalizeWorldIds(ids: unknown, fallback: string[]): string[] {
  const values = Array.isArray(ids) ? ids : fallback;
  const valid = values.filter((id): id is string => typeof id === 'string' && WORLD_ORDER.includes(id));
  return valid.length > 0 ? [...new Set(valid)] : fallback;
}

function normalizeCharacter(raw: Partial<OwnedCharacter> | null | undefined): OwnedCharacter | null {
  if (!raw || typeof raw.characterId !== 'string') return null;
  const characterId = LEGACY_CHARACTER_IDS[raw.characterId] ?? raw.characterId;
  const char = CHARACTERS[characterId];
  if (!char) return null;

  const level = Math.max(1, Math.floor(Number(raw.level) || 1));
  const stats = statsAtLevel(char, level);
  const learned = Array.isArray(raw.learnedSkillIds) ? raw.learnedSkillIds : char.skillIds;
  const learnedSkillIds = [...new Set([...char.skillIds, ...learned.filter((id) => typeof id === 'string' && SKILLS[id])])];
  const weapon = raw.equippedWeaponId && EQUIPMENT[raw.equippedWeaponId] ? raw.equippedWeaponId : undefined;
  const armor = raw.equippedArmorId && EQUIPMENT[raw.equippedArmorId] ? raw.equippedArmorId : undefined;
  const accessory = raw.equippedAccessoryId && EQUIPMENT[raw.equippedAccessoryId] ? raw.equippedAccessoryId : undefined;

  return {
    characterId,
    level,
    exp: Math.max(0, Math.floor(Number(raw.exp) || 0)),
    currentHp: Math.min(stats.hp, Math.max(0, Math.floor(Number(raw.currentHp) || stats.hp))),
    currentMp: Math.min(stats.mp, Math.max(0, Math.floor(Number(raw.currentMp) || stats.mp))),
    learnedSkillIds,
    ...(weapon ? { equippedWeaponId: weapon } : {}),
    ...(armor ? { equippedArmorId: armor } : {}),
    ...(accessory ? { equippedAccessoryId: accessory } : {}),
  };
}

function normalizeRecord(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object') return {};
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>)
      .filter(([key, value]) => key && Number.isFinite(Number(value)))
      .map(([key, value]) => [key, Math.max(0, Math.floor(Number(value)))]),
  );
}

function normalizeStringArray(raw: unknown, allowed?: Record<string, unknown>): string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((id): id is string => typeof id === 'string' && (!allowed || !!allowed[id])))];
}

function normalizeSave(raw: Partial<SaveData> & Record<string, unknown>, slotId: number): SaveData {
  const firstWorldId = WORLD_ORDER[0];
  const unlockedWorldIds = normalizeWorldIds(raw.progress?.unlockedWorldIds, [firstWorldId]);
  const clearedWorldIds = normalizeWorldIds(raw.progress?.clearedWorldIds, []);
  const currentWorldId =
    typeof raw.progress?.currentWorldId === 'string' && WORLD_ORDER.includes(raw.progress.currentWorldId)
      ? raw.progress.currentWorldId
      : null;
  const party = (Array.isArray(raw.party) ? raw.party : [])
    .map((member) => normalizeCharacter(member as Partial<OwnedCharacter>))
    .filter((member): member is OwnedCharacter => !!member);
  const exploration = raw.exploration && typeof raw.exploration === 'object' ? raw.exploration : {};

  return {
    slotId: Number(raw.slotId) || slotId,
    lastSavedAt: Number(raw.lastSavedAt) || Date.now(),
    playTimeSec: Math.max(0, Math.floor(Number(raw.playTimeSec) || 0)),
    progress: {
      unlockedWorldIds,
      clearedWorldIds,
      currentWorldId,
    },
    party,
    inventory: normalizeRecord(raw.inventory),
    items: normalizeRecord(raw.items),
    equipmentInventory: normalizeStringArray(raw.equipmentInventory, EQUIPMENT),
    storyFragments: normalizeStringArray(raw.storyFragments),
    learnedSkillBooks: normalizeStringArray(raw.learnedSkillBooks, SKILLS),
    exploration: exploration as SaveData['exploration'],
    gold: Math.max(0, Math.floor(Number(raw.gold) || 36)),
    codex: {
      discoveredIds: normalizeStringArray(raw.codex?.discoveredIds),
    },
  };
}

export function loadSlot(slotId: number): SaveData | null {
  try {
    const raw = localStorage.getItem(slotKey(slotId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SaveData> & Record<string, unknown>;
    const normalized = normalizeSave(parsed, slotId);
    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      saveSlot(normalized);
    }
    return normalized;
  } catch {
    return null;
  }
}

export function saveSlot(data: SaveData): void {
  const toStore: SaveData = { ...data, lastSavedAt: Date.now() };
  localStorage.setItem(slotKey(data.slotId), JSON.stringify(toStore));
}

export function deleteSlot(slotId: number): void {
  localStorage.removeItem(slotKey(slotId));
}

export function listSlots(): (SaveData | null)[] {
  return SAVE_SLOTS.map(loadSlot);
}

/** 加入済み仲間を初期段階Lv1・全回復で生成 */
export function createOwnedCharacter(characterId: string): OwnedCharacter {
  const char = getCharacter(characterId);
  const stats = statsAtLevel(char, 1);
  return {
    characterId,
    level: 1,
    exp: 0,
    currentHp: stats.hp,
    currentMp: stats.mp,
    learnedSkillIds: char.skillIds,
  };
}

/** クリア後、次の order の世界を解放する */
export function unlockNextWorld(data: SaveData, clearedWorldId: string): SaveData {
  const cleared = getWorld(clearedWorldId);
  const nextId = WORLD_ORDER.find((id) => getWorld(id).order === cleared.order + 1);
  const unlocked = new Set(data.progress.unlockedWorldIds);
  if (nextId) unlocked.add(nextId);
  const clearedSet = new Set(data.progress.clearedWorldIds);
  clearedSet.add(clearedWorldId);
  return {
    ...data,
    progress: {
      ...data.progress,
      unlockedWorldIds: [...unlocked],
      clearedWorldIds: [...clearedSet],
    },
  };
}
