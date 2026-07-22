import type { SaveData } from '@/types';

export const FISHING_LUCK_UNIT = 1000;
export const FISHING_LUCK_MAX = 100;

export interface FishingReward { kind: 'material' | 'item' | 'equipment'; id: string; qty: number; label: string }
export interface FishingResult { save: SaveData; reward: FishingReward; milestone: boolean }

const COMMON_REWARDS: FishingReward[] = [
  { kind: 'material', id: 'wood_log', qty: 1, label: '漂流する写本木片' },
  { kind: 'material', id: 'ancient_feather', qty: 1, label: '海鳥の古羽根' },
  { kind: 'item', id: 'recovery_potion', qty: 1, label: '回復薬' },
];
const MILESTONES: Record<number, FishingReward> = {
  10: { kind: 'material', id: 'monster_fang', qty: 5, label: '怪物の牙束' },
  50: { kind: 'equipment', id: 'wanderer_charm', qty: 1, label: '旅人の腕輪' },
  100: { kind: 'equipment', id: 'king_ring', qty: 1, label: '王誓の盾' },
};

export function fishingLuck(count: number): number {
  return Math.min(FISHING_LUCK_MAX, Math.floor(Math.max(0, count) / FISHING_LUCK_UNIT));
}

export function resolveFishing(save: SaveData, roll = Math.random()): FishingResult {
  const fishing = save.fishing ?? { count: 0, autoUnlocked: false, claimedMilestones: [] };
  const count = fishing.count + 1;
  const fixed = MILESTONES[count];
  const reward = fixed ?? COMMON_REWARDS[Math.min(COMMON_REWARDS.length - 1, Math.floor(Math.max(0, roll) * COMMON_REWARDS.length))];
  const next: SaveData = { ...save, fishing: { ...fishing, count, claimedMilestones: fixed ? [...new Set([...fishing.claimedMilestones, count])] : fishing.claimedMilestones } };
  if (reward.kind === 'material') next.inventory = { ...next.inventory, [reward.id]: (next.inventory[reward.id] ?? 0) + reward.qty };
  if (reward.kind === 'item') next.items = { ...next.items, [reward.id]: (next.items[reward.id] ?? 0) + reward.qty };
  if (reward.kind === 'equipment') next.equipmentInventory = [...new Set([...(next.equipmentInventory ?? []), reward.id])];
  return { save: next, reward, milestone: Boolean(fixed) };
}
