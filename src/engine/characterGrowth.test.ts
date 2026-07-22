import { describe, expect, it } from 'vitest';
import { allocateStatusPoint, criticalChance, emptyAllocatedStats, evasionChance, luckDropMultiplier, normalizeOwnedGrowth } from './characterGrowth';
import type { OwnedCharacter } from '@/types';

const hero: OwnedCharacter = {
  characterId: 'beowulf_1', level: 3, exp: 100, currentHp: 10, currentMp: 5,
  learnedSkillIds: [], allocatedStats: emptyAllocatedStats(), unspentStatusPoints: 6,
};

describe('仕様書準拠のキャラクター成長', () => {
  it('旧セーブにはレベル差×3のポイントを復元する', () => {
    const legacy = { ...hero, allocatedStats: undefined, unspentStatusPoints: undefined };
    expect(normalizeOwnedGrowth(legacy).unspentStatusPoints).toBe(6);
  });

  it('ポイントを1消費して能力を1上げる', () => {
    const next = allocateStatusPoint(hero, 'luk');
    expect(next?.allocatedStats?.luk).toBe(1);
    expect(next?.unspentStatusPoints).toBe(5);
  });

  it('LUKの確率とドロップ倍率を上限付きで計算する', () => {
    expect(criticalChance(150, 0)).toBe(0.1);
    expect(evasionChance(0, 3000)).toBe(0.95);
    expect(luckDropMultiplier(3600)).toBe(11);
    expect(luckDropMultiplier(9999)).toBe(11);
  });
});
