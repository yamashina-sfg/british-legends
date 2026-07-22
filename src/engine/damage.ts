import type { Skill, Stats } from '@/types';

export interface DamageContext {
  attackerAtk: number;
  defenderDef: number;
  skill: Skill;
  /** 一時的な攻撃力バフ（hero_roar など） */
  atkBuff?: number;
}

export function criticalChance(attackerLuk=0,defenderLuk=0):number{return Math.max(0,Math.min(1,Math.floor(((attackerLuk-defenderLuk)/1500)*1000)/1000))}
export function evasionChance(attackerLuk=0,defenderLuk=0):number{return Math.max(0,Math.min(.95,Math.floor(((defenderLuk-attackerLuk)/1500)*1000)/1000))}
export function resolveLuckHit(attackerLuk=0,defenderLuk=0,unavoidable=false,evadeRoll=Math.random(),criticalRoll=Math.random()):{evaded:boolean;critical:boolean}{const evaded=!unavoidable&&evadeRoll<evasionChance(attackerLuk,defenderLuk);return{evaded,critical:!evaded&&criticalRoll<criticalChance(attackerLuk,defenderLuk)}}
export function luckDropMultiplier(luk=0):number{return 1+Math.min(3600,Math.max(0,luk))/360}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * DQ風ダメージ計算。
 * 基本 = 攻撃力 - 防御力/2 + 乱数(-2..3)、最低1、スキル倍率を乗算。
 */
export function calcDamage(ctx: DamageContext): number {
  const atk = ctx.attackerAtk + (ctx.atkBuff ?? 0);
  const base = atk - ctx.defenderDef / 2 + randomInt(-2, 3);
  const dmg = Math.floor(Math.max(1, base) * ctx.skill.power);
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
