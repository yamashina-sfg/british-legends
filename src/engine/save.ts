import type { OwnedCharacter, SaveData } from '@/types';
import { getCharacter, getWorld, WORLD_ORDER } from '@/data';
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
    gold: 36,
    codex: { discoveredIds: [] },
  };
}

export function loadSlot(slotId: number): SaveData | null {
  try {
    const raw = localStorage.getItem(slotKey(slotId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SaveData;
    return { ...parsed, gold: parsed.gold ?? 36, items: parsed.items ?? {} };
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
