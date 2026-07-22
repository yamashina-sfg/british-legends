import { describe, expect, it } from 'vitest';
import { createNewSave } from './save';
import { canCraftEquipment, craftEquipment, EQUIPMENT_RECIPES } from './equipmentCrafting';

describe('上位装備制作', () => {
  it('+5の基礎装備・素材・Goldから上位装備を作り、基礎装備は残す', () => {
    const save = createNewSave(1);
    save.gold = 100;
    save.equipmentInventory = ['iron_sword'];
    save.equipmentLevels = { iron_sword: 5 };
    save.inventory = { monster_fang: 5 };
    const recipe = EQUIPMENT_RECIPES[0];
    expect(canCraftEquipment(save, recipe)).toBe(true);
    const next = craftEquipment(save, recipe)!;
    expect(next.equipmentInventory).toEqual(['iron_sword', 'steel_sword']);
    expect(next.inventory.monster_fang).toBe(0);
    expect(next.gold).toBe(20);
  });
});
