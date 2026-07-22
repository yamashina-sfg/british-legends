import { describe, expect, it } from 'vitest';
import { addDefeats, crossedResearchLevels, enemyResearchBenefit } from './research';

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
});
