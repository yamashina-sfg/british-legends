import type { Skill, Stats } from '@/types';

export interface DamageContext {
  attackerAtk: number;
  defenderDef: number;
  skill: Skill;
  /** 一時的な攻撃力バフ（hero_roar など） */
  atkBuff?: number;
}

/**
 * DQ風ダメージ計算。
 * 基本 = atk/2 - def/4、最低1、乱数0.875〜1.0、スキル倍率を乗算。
 */
export function calcDamage(ctx: DamageContext): number {
  const atk = ctx.attackerAtk + (ctx.atkBuff ?? 0);
  const base = atk / 2 - ctx.defenderDef / 4;
  const variance = 0.875 + Math.random() * 0.125;
  const dmg = Math.floor(Math.max(1, base) * variance * ctx.skill.power);
  return Math.max(1, dmg);
}

/** 回復量（heal スキル）。power をそのまま回復量とする。 */
export function calcHeal(skill: Skill): number {
  return skill.power;
}

/** スキルが対象に与える素早さ/防御の弱体量（debuff） */
export function calcDebuff(skill: Skill): number {
  return skill.power;
}

export function clampStat(value: number): number {
  return Math.max(0, Math.floor(value));
}

export type { Stats };
