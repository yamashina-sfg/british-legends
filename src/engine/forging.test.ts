import { describe, expect, it } from 'vitest';
import { EQUIPMENT } from '@/data';
import { enhancedEquipmentBonus, forgeCost } from './forging';

describe('equipment forging', () => {
  it('increases material costs through +5', () => {
    expect(forgeCost(EQUIPMENT.iron_sword, 0)).toMatchObject({ materialId: 'monster_fang', materialQty: 1 });
    expect(forgeCost(EQUIPMENT.iron_sword, 4)?.materialQty).toBe(5);
    expect(forgeCost(EQUIPMENT.iron_sword, 5)).toBeNull();
  });

  it('raises equipment bonuses by ten percent per level', () => {
    expect(enhancedEquipmentBonus({ atk: 5, spd: 1 }, 3)).toEqual({ atk: 7, spd: 2 });
    expect(enhancedEquipmentBonus({ hp: 12 }, 5)).toEqual({ hp: 18 });
  });
});
