import type { OwnedCharacter, SaveData } from '@/types';
import { getCharacter, getWorld, WORLD_ORDER } from '@/data';
import { statsAtLevel } from './leveling';
import { normalizeActiveParty } from './party';
import { DEFAULT_QUICK_SLOTS, normalizeQuickSlots } from './quickSlots';
import { emptyAllocatedStats, normalizeOwnedGrowth } from './characterGrowth';
import { normalizeEquipmentSlots } from './equipment';
import { DATA_VERSION } from './versioning';

const STORAGE_PREFIX = 'british-legends:slot:';
export const SAVE_SLOTS = [1, 2, 3];

export function slotKey(slotId: number): string {
  return `${STORAGE_PREFIX}${slotId}`;
}

/** 新規セーブデータ。最初の世界だけ解放しておく。 */
export function createNewSave(slotId: number): SaveData {
  const firstWorldId = WORLD_ORDER[0];
  return {
    dataVersion: DATA_VERSION,
    slotId,
    lastSavedAt: Date.now(),
    playTimeSec: 0,
    openingWatched: false,
    progress: {
      unlockedWorldIds: [firstWorldId],
      clearedWorldIds: [],
      currentWorldId: null,
    },
    activePartyIds: [],
    party: [],
    inventory: {},
    items: {},
    quickSlots: [...DEFAULT_QUICK_SLOTS],
    equipmentInventory: [],
    equipmentLevels: {},
    storyFragments: [],
    learnedSkillBooks: [],
    exploration: {},
    gold: 36,
    codex: { discoveredIds: [] },
    defeatCounts: {},
    fishing: { count: 0, autoUnlocked: false, claimedMilestones: [] },
    pets: [],
    petSlots: [null, null, null],
    arena: { bestWave: 0, selectedStartWave: 1, bestTimes: {}, claimedFirstWaves: [], attempts: 0 },
    constellations: {},
    ownedBodySkins: [],
    ownedHeadStyles: [1, 2, 3, 4],
    settings: { skipBlessingCinematics: false, blessingCinematicsSeen: false },
  };
}

export function loadSlot(slotId: number): SaveData | null {
  try {
    const raw = localStorage.getItem(slotKey(slotId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SaveData;
    return normalizeActiveParty({
      ...parsed,
      dataVersion: DATA_VERSION,
      openingWatched: parsed.openingWatched ?? true,
      gold: parsed.gold ?? 36,
      items: parsed.items ?? {},
      quickSlots: normalizeQuickSlots(parsed.quickSlots),
      equipmentInventory: parsed.equipmentInventory ?? [],
      equipmentLevels: parsed.equipmentLevels ?? {},
      storyFragments: parsed.storyFragments ?? [],
      learnedSkillBooks: parsed.learnedSkillBooks ?? [],
      exploration: parsed.exploration ?? {},
      defeatCounts: parsed.defeatCounts ?? {},
      fishing: parsed.fishing ?? { count: 0, autoUnlocked: false, claimedMilestones: [] },
      pets: parsed.pets ?? [],
      petSlots: Array.from({ length: 3 }, (_, index) => parsed.petSlots?.[index] ?? null),
      arena: parsed.arena ?? { bestWave: 0, selectedStartWave: 1, bestTimes: {}, claimedFirstWaves: [], attempts: 0 },
      constellations: parsed.constellations ?? Object.fromEntries((parsed.progress?.clearedWorldIds ?? []).map((id)=>[id,2])) as Record<string,2>,
      ownedBodySkins: parsed.ownedBodySkins ?? [...(parsed.progress?.clearedWorldIds ?? [])],
      ownedHeadStyles: parsed.ownedHeadStyles ?? [1,2,3,4],
      settings: { skipBlessingCinematics: parsed.settings?.skipBlessingCinematics ?? false, blessingCinematicsSeen: parsed.settings?.blessingCinematicsSeen ?? false },
      party: (parsed.party ?? []).map((owned) => {const learned=[...new Set([...owned.learnedSkillIds,'arcane_burst','story_barrier'])];return normalizeEquipmentSlots(normalizeOwnedGrowth({...owned,learnedSkillIds:learned,equippedSkillIds:owned.equippedSkillIds??learned.filter((id)=>id!=='attack_basic').slice(0,3)}))}),
    });
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
    learnedSkillIds: [...new Set([...char.skillIds,'arcane_burst','story_barrier'])],
    equippedSkillIds: [...char.skillIds.filter((id)=>id!=='attack_basic'),'arcane_burst','story_barrier'].slice(0,3),
    allocatedStats: emptyAllocatedStats(),
    unspentStatusPoints: 0,
    levelStatusPoints: 0,
    bonusStatusPoints: 0,
    paidStatusPoints: 0,
    blessingCount: 0,
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
