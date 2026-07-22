import type { Stats } from '@/types';
import type { Equipment } from '@/data/equipment';

export const MAX_EQUIPMENT_LEVEL = 5;

const FORGE_MATERIAL_BY_WORLD: Record<string, string> = {
  beowulf: 'monster_fang', hamlet: 'ghost_fragment', macbeth: 'witch_scroll',
  gulliver: 'tiny_sword', crusoe: 'wood_log', mariner: 'ancient_feather',
  frankenstein: 'research_notes', alice: 'magic_card', holmes: 'evidence_file',
  dracula: 'vampire_fang', dalloway: 'memory_fragment', nineteen84: 'secret_document',
};

export interface ForgeCost { gold: number; materialId: string; materialQty: number }

export function forgeCost(equipment: Equipment, currentLevel: number): ForgeCost | null {
  if (currentLevel >= MAX_EQUIPMENT_LEVEL) return null;
  return {
    gold: Math.max(12, Math.ceil(Math.max(equipment.price, 40) * 0.18) + currentLevel * 8),
    materialId: FORGE_MATERIAL_BY_WORLD[equipment.worldId] ?? 'monster_fang',
    materialQty: currentLevel + 1,
  };
}

export function enhancedEquipmentBonus(bonus: Partial<Stats>, level: number): Partial<Stats> {
  const multiplier = 1 + Math.min(MAX_EQUIPMENT_LEVEL, Math.max(0, level)) * 0.1;
  return Object.fromEntries(
    Object.entries(bonus).map(([stat, value]) => [stat, Math.ceil((value ?? 0) * multiplier)]),
  ) as Partial<Stats>;
}
