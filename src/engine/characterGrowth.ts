import type { AllocatableStat, AllocatedStats, OwnedCharacter } from '@/types';

export const STATUS_POINTS_PER_LEVEL = 3;
export const BASE_STAT_ALLOCATION_CAP = 99;

export const ALLOCATABLE_STATS: AllocatableStat[] = ['atk', 'int', 'def', 'mdef', 'spd', 'luk'];

export function emptyAllocatedStats(): AllocatedStats {
  return { atk: 0, int: 0, def: 0, mdef: 0, spd: 0, luk: 0 };
}

export function normalizeOwnedGrowth(owned: OwnedCharacter): OwnedCharacter {
  const allocated = { ...emptyAllocatedStats(), ...(owned.allocatedStats ?? {}) };
  const used = ALLOCATABLE_STATS.reduce((sum, key) => sum + Math.max(0, allocated[key] ?? 0), 0);
  const earned = Math.max(0, owned.level - 1) * STATUS_POINTS_PER_LEVEL;
  return {
    ...owned,
    allocatedStats: allocated,
    unspentStatusPoints: owned.unspentStatusPoints ?? Math.max(0, earned - used),
  };
}

export function allocateStatusPoint(
  owned: OwnedCharacter,
  stat: AllocatableStat,
  marriageCount = 0,
): OwnedCharacter | null {
  const normalized = normalizeOwnedGrowth(owned);
  const cap = BASE_STAT_ALLOCATION_CAP + Math.max(0, marriageCount) * 10;
  if ((normalized.unspentStatusPoints ?? 0) <= 0 || normalized.allocatedStats![stat] >= cap) return null;
  return {
    ...normalized,
    allocatedStats: { ...normalized.allocatedStats!, [stat]: normalized.allocatedStats![stat] + 1 },
    unspentStatusPoints: (normalized.unspentStatusPoints ?? 0) - 1,
  };
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
