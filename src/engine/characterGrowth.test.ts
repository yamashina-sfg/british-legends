import { describe, expect, it } from 'vitest';
import { allocationCap, blessCharacter, commitStatusAllocation, criticalChance, emptyAllocatedStats, evasionChance, luckDropMultiplier, maxCharacterLevel, normalizeOwnedGrowth } from './characterGrowth';
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

  it('仮振りを確定するとレベルポイントから消費する', () => {
    const next = commitStatusAllocation(hero, { ...emptyAllocatedStats(), luk: 1 });
    expect(next?.allocatedStats?.luk).toBe(1);
    expect(next?.levelStatusPoints).toBe(5);
    expect(next?.unspentStatusPoints).toBe(5);
  });

  it('最大レベルで星神の祝福を受けると上限と祝福ポイントが増える', () => {
    const blessed = blessCharacter({ ...hero, level: 50, equippedWeaponId: 'iron_sword' }, 'hamlet', 2);
    expect(blessed).toMatchObject({ level: 1, exp: 0, blessingCount: 1, patronWorldId: 'hamlet', bonusStatusPoints: 11 });
    expect(blessed?.equippedWeaponId).toBeUndefined();
    expect(allocationCap(blessed!)).toBe(109);
    expect(maxCharacterLevel(blessed!)).toBe(51);
  });

  it('LUKの確率とドロップ倍率を上限付きで計算する', () => {
    expect(criticalChance(150, 0)).toBe(0.1);
    expect(evasionChance(0, 3000)).toBe(0.95);
    expect(luckDropMultiplier(3600)).toBe(11);
    expect(luckDropMultiplier(9999)).toBe(11);
  });
});
