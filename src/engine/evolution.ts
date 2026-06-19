import type { Character, OwnedCharacter } from '@/types';
import { getCharacter } from '@/data';
import { statsAtLevel } from './leveling';

export interface EvolutionCheck {
  canEvolve: boolean;
  hasEvolution: boolean;
  levelOk: boolean;
  materialsOk: boolean;
  /** 不足している素材（materialId -> 不足数） */
  missing: { materialId: string; need: number; have: number }[];
}

/** 進化条件を満たしているか判定 */
export function checkEvolution(
  owned: OwnedCharacter,
  char: Character,
  inventory: Record<string, number>,
): EvolutionCheck {
  const evo = char.evolution;
  if (!evo) {
    return { canEvolve: false, hasEvolution: false, levelOk: false, materialsOk: false, missing: [] };
  }
  const levelOk = owned.level >= evo.requiredLevel;
  const missing = evo.requiredMaterials
    .map((req) => ({
      materialId: req.materialId,
      need: req.qty,
      have: inventory[req.materialId] ?? 0,
    }))
    .filter((m) => m.have < m.need);
  const materialsOk = missing.length === 0;
  return {
    canEvolve: levelOk && materialsOk,
    hasEvolution: true,
    levelOk,
    materialsOk,
    missing,
  };
}

export interface EvolutionResult {
  owned: OwnedCharacter;
  inventory: Record<string, number>;
  fromStageName: string;
  toStageName: string;
}

/**
 * 進化を実行する。素材を消費し、characterId を次段階に差し替える。
 * 進化時は最大HP/MPまで全回復させる（DQの転職風）。
 * 条件を満たさない場合は null を返す。
 */
export function evolve(
  owned: OwnedCharacter,
  inventory: Record<string, number>,
): EvolutionResult | null {
  const char = getCharacter(owned.characterId);
  const check = checkEvolution(owned, char, inventory);
  if (!check.canEvolve || !char.evolution) return null;

  const nextInventory = { ...inventory };
  for (const req of char.evolution.requiredMaterials) {
    nextInventory[req.materialId] = (nextInventory[req.materialId] ?? 0) - req.qty;
  }

  const nextChar = getCharacter(char.evolution.nextCharacterId);
  const nextStats = statsAtLevel(nextChar, owned.level);

  const nextOwned: OwnedCharacter = {
    ...owned,
    characterId: nextChar.id,
    currentHp: nextStats.hp,
    currentMp: nextStats.mp,
    learnedSkillIds: nextChar.skillIds,
  };

  return {
    owned: nextOwned,
    inventory: nextInventory,
    fromStageName: char.stageName,
    toStageName: nextChar.stageName,
  };
}
