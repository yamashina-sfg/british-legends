import type { Character, OwnedCharacter, Stats } from '@/types';

/** レベルnに到達するための累積必要経験値（n=1なら0） */
export function requiredExpForNextLevel(level: number): number {
  const early: Record<number, number> = {
    1: 30,
    2: 70,
    3: 130,
    4: 220,
    5: 350,
  };
  return early[level] ?? Math.floor(25 * Math.pow(level, 1.8) + 20);
}

export function expForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let lv = 1; lv < level; lv += 1) {
    total += requiredExpForNextLevel(lv);
  }
  return total;
}

/** 累積経験値から現在レベルを算出 */
export function levelFromExp(exp: number): number {
  let level = 1;
  while (expForLevel(level + 1) <= exp) level++;
  return level;
}

/** 指定レベルでのステータスを基礎値＋成長率で算出 */
export function statsAtLevel(char: Character, level: number): Stats {
  const lv = Math.max(1, level) - 1;
  return {
    hp: char.baseStats.hp + char.growthRate.hp * lv,
    mp: char.baseStats.mp + char.growthRate.mp * lv,
    atk: char.baseStats.atk + char.growthRate.atk * lv,
    def: char.baseStats.def + char.growthRate.def * lv,
    spd: char.baseStats.spd + char.growthRate.spd * lv,
  };
}

export interface ExpGainResult {
  owned: OwnedCharacter;
  leveledUp: boolean;
  fromLevel: number;
  toLevel: number;
}

/**
 * 経験値を加算し、レベルアップを反映する。
 * レベルアップ時は最大HP/MPの増加分だけ現在値も回復させる（DQ風）。
 */
export function gainExp(owned: OwnedCharacter, char: Character, amount: number): ExpGainResult {
  const fromLevel = owned.level;
  const newExp = owned.exp + amount;
  const toLevel = levelFromExp(newExp);

  const next: OwnedCharacter = { ...owned, exp: newExp, level: toLevel };

  if (toLevel > fromLevel) {
    const before = statsAtLevel(char, fromLevel);
    const after = statsAtLevel(char, toLevel);
    next.currentHp = Math.min(after.hp, owned.currentHp + (after.hp - before.hp));
    next.currentMp = Math.min(after.mp, owned.currentMp + (after.mp - before.mp));
  }

  return { owned: next, leveledUp: toLevel > fromLevel, fromLevel, toLevel };
}
