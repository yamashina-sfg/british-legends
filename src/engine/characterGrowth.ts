import type { AllocatableStat, AllocatedStats, OwnedCharacter } from '@/types';

export const STATUS_POINTS_PER_LEVEL = 3;
export const BASE_STAT_ALLOCATION_CAP = 99;
export const BASE_MAX_LEVEL = 50;

export const ALLOCATABLE_STATS: AllocatableStat[] = ['atk', 'int', 'def', 'mdef', 'spd', 'luk'];

export function emptyAllocatedStats(): AllocatedStats {
  return { atk: 0, int: 0, def: 0, mdef: 0, spd: 0, luk: 0 };
}

export function normalizeOwnedGrowth(owned: OwnedCharacter): OwnedCharacter {
  const allocated = { ...emptyAllocatedStats(), ...(owned.allocatedStats ?? {}) };
  const used = ALLOCATABLE_STATS.reduce((sum, key) => sum + Math.max(0, allocated[key] ?? 0), 0);
  const earned = Math.max(0, owned.level - 1) * STATUS_POINTS_PER_LEVEL;
  const legacyUnspent = owned.unspentStatusPoints ?? Math.max(0, earned - used);
  const levelStatusPoints = owned.levelStatusPoints ?? legacyUnspent;
  const bonusStatusPoints = owned.bonusStatusPoints ?? 0;
  const paidStatusPoints = owned.paidStatusPoints ?? 0;
  return {
    ...owned,
    allocatedStats: allocated,
    levelStatusPoints,
    bonusStatusPoints,
    paidStatusPoints,
    blessingCount: owned.blessingCount ?? 0,
    unspentStatusPoints: levelStatusPoints + bonusStatusPoints + paidStatusPoints,
  };
}

export function allocationCap(owned: OwnedCharacter): number {
  return BASE_STAT_ALLOCATION_CAP + (owned.blessingCount ?? 0) * 10;
}

export function maxCharacterLevel(owned: OwnedCharacter): number {
  return BASE_MAX_LEVEL + (owned.blessingCount ?? 0);
}

export function commitStatusAllocation(owned: OwnedCharacter, draft: AllocatedStats): OwnedCharacter | null {
  const normalized = normalizeOwnedGrowth(owned);
  const current = normalized.allocatedStats!;
  const cap = allocationCap(normalized);
  if (ALLOCATABLE_STATS.some((key) => draft[key] < current[key] || draft[key] > cap)) return null;
  const cost = ALLOCATABLE_STATS.reduce((sum, key) => sum + draft[key] - current[key], 0);
  if (cost < 0 || cost > (normalized.unspentStatusPoints ?? 0)) return null;
  let remaining = cost;
  const spend = (amount: number | undefined) => {
    const used = Math.min(amount ?? 0, remaining);
    remaining -= used;
    return (amount ?? 0) - used;
  };
  const levelStatusPoints = spend(normalized.levelStatusPoints);
  const bonusStatusPoints = spend(normalized.bonusStatusPoints);
  const paidStatusPoints = spend(normalized.paidStatusPoints);
  return normalizeOwnedGrowth({ ...normalized, allocatedStats: { ...draft }, levelStatusPoints, bonusStatusPoints, paidStatusPoints });
}

export function blessCharacter(owned: OwnedCharacter, patronWorldId: string, unlockedPatronCount: number): OwnedCharacter | null {
  const normalized = normalizeOwnedGrowth(owned);
  if (normalized.level < maxCharacterLevel(normalized) || unlockedPatronCount < 1) return null;
  const blessingCount = (normalized.blessingCount ?? 0) + 1;
  return normalizeOwnedGrowth({
    ...normalized,
    level: 1,
    exp: 0,
    blessingCount,
    patronWorldId,
    bodySkinWorldId: normalized.skinLocked ? normalized.bodySkinWorldId : patronWorldId,
    levelStatusPoints: 0,
    bonusStatusPoints: (normalized.bonusStatusPoints ?? 0) + 9 + unlockedPatronCount,
    equippedWeaponId: undefined,
    equippedHeadId: undefined,
    equippedArmorId: undefined,
    equippedArmsId: undefined,
    equippedShieldId: undefined,
    equippedLegsId: undefined,
    equippedAccessoryId: undefined,
  });
}

export function movementSpeed(spd: number): number {
  return 8 + Math.max(0, spd) / 300;
}

export function actionGaugePerSecond(spd: number): number {
  return 199 + Math.max(0, spd);
}

export function luckDropMultiplier(luk: number): number {
  return 1 + Math.min(3600, Math.max(0, luk)) / 360;
}

export function criticalChance(attackerLuk: number, defenderLuk: number): number {
  const raw = Math.max(0, Math.min(1, (attackerLuk - defenderLuk) / 1500));
  return Math.floor(raw * 1000) / 1000;
}

export function evasionChance(attackerLuk: number, defenderLuk: number): number {
  const raw = Math.max(0, Math.min(0.95, (defenderLuk - attackerLuk) / 1500));
  return Math.floor(raw * 1000) / 1000;
}
