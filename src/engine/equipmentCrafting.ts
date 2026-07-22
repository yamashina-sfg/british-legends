import type { SaveData } from '@/types';
import { MAX_EQUIPMENT_LEVEL } from './forging';

export interface EquipmentRecipe {
  id: string;
  baseEquipmentId: string;
  resultEquipmentId: string;
  materialId: string;
  materialQty: number;
  gold: number;
}

export const EQUIPMENT_RECIPES: EquipmentRecipe[] = [
  { id: 'iron_to_steel', baseEquipmentId: 'iron_sword', resultEquipmentId: 'steel_sword', materialId: 'monster_fang', materialQty: 5, gold: 80 },
  { id: 'steel_to_runic', baseEquipmentId: 'steel_sword', resultEquipmentId: 'runic_blade', materialId: 'ghost_fragment', materialQty: 7, gold: 140 },
  { id: 'runic_to_hero', baseEquipmentId: 'runic_blade', resultEquipmentId: 'hero_sword', materialId: 'witch_scroll', materialQty: 9, gold: 220 },
];

export function canCraftEquipment(save: SaveData, recipe: EquipmentRecipe): boolean {
  return (save.equipmentInventory ?? []).includes(recipe.baseEquipmentId)
    && (save.equipmentLevels?.[recipe.baseEquipmentId] ?? 0) >= MAX_EQUIPMENT_LEVEL
    && !(save.equipmentInventory ?? []).includes(recipe.resultEquipmentId)
    && save.gold >= recipe.gold
    && (save.inventory[recipe.materialId] ?? 0) >= recipe.materialQty;
}

export function craftEquipment(save: SaveData, recipe: EquipmentRecipe): SaveData | null {
  if (!canCraftEquipment(save, recipe)) return null;
  return {
    ...save,
    gold: save.gold - recipe.gold,
    inventory: { ...save.inventory, [recipe.materialId]: (save.inventory[recipe.materialId] ?? 0) - recipe.materialQty },
    equipmentInventory: [...new Set([...(save.equipmentInventory ?? []), recipe.resultEquipmentId])],
  };
}
