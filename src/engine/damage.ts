import type { Element, Skill, Stats } from '@/types';
import { attributeMultiplier } from './attributes';

export interface DamageContext {
  attackerAtk: number;
  attackerInt?: number;
  defenderDef: number;
  defenderMdef?: number;
  skill: Skill;
  /** 一時的な攻撃力バフ（hero_roar など） */
  atkBuff?: number;
  attackerElement?: Element;
  defenderElement?: Element;
  randomMultiplier?: number;
}

export function criticalChance(attackerLuk=0,defenderLuk=0):number{return Math.max(0,Math.min(1,Math.floor(((attackerLuk-defenderLuk)/1500)*1000)/1000))}
export function evasionChance(attackerLuk=0,defenderLuk=0):number{return Math.max(0,Math.min(.95,Math.floor(((defenderLuk-attackerLuk)/1500)*1000)/1000))}
export function resolveLuckHit(attackerLuk=0,defenderLuk=0,unavoidable=false,evadeRoll=Math.random(),criticalRoll=Math.random()):{evaded:boolean;critical:boolean}{const evaded=!unavoidable&&evadeRoll<evasionChance(attackerLuk,defenderLuk);return{evaded,critical:!evaded&&criticalRoll<criticalChance(attackerLuk,defenderLuk)}}
export function luckDropMultiplier(luk=0):number{return 1+Math.min(3600,Math.max(0,luk))/360}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** 240815仕様: 11倍基礎値、0.85〜1.15乱数、有利属性1.2倍、防御7倍。 */
export function calcDamage(ctx: DamageContext): number {
  const atk = ctx.attackerAtk + (ctx.atkBuff ?? 0);
  const int = ctx.attackerInt ?? 0;
  const magic = ctx.skill.damageKind === 'magic' || ctx.skill.explosion;
  const offense = magic ? int + atk / 10 : atk - int / 10;
  const defense = magic ? (ctx.defenderMdef ?? ctx.defenderDef) : ctx.defenderDef;
  const variance = ctx.randomMultiplier ?? randomInt(85, 115) / 100;
  const element = ctx.skill.element ?? ctx.attackerElement;
  const affinity = attributeMultiplier(element, ctx.defenderElement);
  const explosion = ctx.skill.explosion ? 12 : 1;
  const damage = offense * 11 * variance * affinity * explosion * ctx.skill.power - defense * 7;
  return Math.max(1, Math.floor(damage));
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
