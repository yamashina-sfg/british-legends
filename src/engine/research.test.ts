import { describe, expect, it } from 'vitest';
import { addDefeats, crossedResearchLevels, enemyDefeatStatBonus, enemyResearchBenefit, totalEnemyDefeatStats } from './research';

describe('enemy research', () => {
  it('unlocks archive benefits at 1, 5 and 15 defeats', () => {
    expect(enemyResearchBenefit(0)).toMatchObject({ level: 0, nextThreshold: 1 });
    expect(enemyResearchBenefit(1)).toMatchObject({ level: 1, expRate: 0.05, nextThreshold: 5 });
    expect(enemyResearchBenefit(5)).toMatchObject({ level: 2, goldRate: 0.1, nextThreshold: 15 });
    expect(enemyResearchBenefit(15)).toMatchObject({ level: 3, dropRateBonus: 0.05, nextThreshold: null });
  });

  it('counts duplicate enemies and detects newly crossed ranks', () => {
    expect(addDefeats({ grendel: 4 }, ['grendel', 'grendel'])).toEqual({ grendel: 6 });
    expect(crossedResearchLevels(4, 6)).toEqual([2]);
  });
  it('100体ごとに固有能力が1上がり、10000体で上限になる',()=>{const at98=enemyDefeatStatBonus('grendel',980);expect(at98.value).toBe(9);expect(enemyDefeatStatBonus('grendel',21354).value).toBe(100);expect(Object.values(totalEnemyDefeatStats({grendel:980,dragon:100})).reduce((a,b)=>a+b,0)).toBe(10);});
});
