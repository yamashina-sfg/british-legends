import { describe, expect, it } from 'vitest';
import type { Skill } from '@/types';
import { calcDamage, criticalChance, evasionChance, luckDropMultiplier, resolveLuckHit } from './damage';

describe('latest LUK specification', () => {
  it('calculates critical and capped evasion from LUK difference', () => {
    expect(criticalChance(150, 0)).toBe(.1);
    expect(evasionChance(0, 150)).toBe(.1);
    expect(evasionChance(0, 9999)).toBe(.95);
  });
  it('makes explosion attacks unavoidable while retaining critical checks', () => {
    expect(resolveLuckHit(0, 150, true, 0, .5).evaded).toBe(false);
    expect(resolveLuckHit(150, 0, false, .9, .05).critical).toBe(true);
  });
  it('caps drop influence at LUK 3600', () => {
    expect(luckDropMultiplier(360)).toBe(2);
    expect(luckDropMultiplier(9999)).toBe(11);
  });
});

describe('240815 damage specification', () => {
  const physical: Skill = { id:'test', name:'test', type:'attack', target:'single', mpCost:0, power:1, description:'' };
  it('uses ATK/INT, 11x base, fixed variance and DEF*7', () => {
    expect(calcDamage({attackerAtk:20,attackerInt:10,defenderDef:5,skill:physical,randomMultiplier:1})).toBe(174);
  });
  it('applies only advantageous attribute at 1.2x', () => {
    expect(calcDamage({attackerAtk:20,attackerInt:10,defenderDef:5,skill:physical,attackerElement:'fire',defenderElement:'wind',randomMultiplier:1})).toBe(215);
    expect(calcDamage({attackerAtk:20,attackerInt:10,defenderDef:5,skill:physical,attackerElement:'wind',defenderElement:'fire',randomMultiplier:1})).toBe(174);
  });
  it('uses INT/MDEF and 12x for explosion magic', () => {
    const explosion = {...physical, damageKind:'magic' as const, explosion:true};
    expect(calcDamage({attackerAtk:10,attackerInt:20,defenderDef:99,defenderMdef:5,skill:explosion,randomMultiplier:1})).toBe(2737);
  });
});
