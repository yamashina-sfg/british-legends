import type { Enemy } from '@/types';

/** 1体の敵のドロップテーブルを抽選し、獲得した素材IDの配列を返す */
export function rollDrops(enemy: Enemy): string[] {
  const got: string[] = [];
  for (const entry of enemy.dropTable) {
    if (Math.random() < entry.rate) got.push(entry.materialId);
  }
  return got;
}

/** 複数の敵から獲得した素材を materialId -> 個数 に集計 */
export function rollDropsForGroup(enemies: Enemy[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const e of enemies) {
    for (const id of rollDrops(e)) {
      result[id] = (result[id] ?? 0) + 1;
    }
  }
  return result;
}
