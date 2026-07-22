import { describe, expect, it } from 'vitest';
import { createNewSave } from './save';
import { fishingLuck, resolveFishing } from './fishing';

describe('釣り', () => {
  it('成功時だけ呼ばれる解決処理が回数と通常報酬を加算する', () => {
    const result = resolveFishing(createNewSave(1), 0);
    expect(result.save.fishing?.count).toBe(1);
    expect(result.save.inventory.wood_log).toBe(1);
  });
  it('特定回数は固定報酬になり、1000回ごとにLUKが1増える', () => {
    const save = createNewSave(1);
    save.fishing = { count: 9, autoUnlocked: false, claimedMilestones: [] };
    expect(resolveFishing(save).reward.id).toBe('monster_fang');
    expect(fishingLuck(999)).toBe(0);
    expect(fishingLuck(1000)).toBe(1);
    expect(fishingLuck(999999)).toBe(100);
  });
});
