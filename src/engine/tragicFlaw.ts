import type { Character, Stats, TragicFlaw, TragicFlawEffect } from '@/types';

export interface FlawState {
  meter: number;
  hpSpent: number;
  isBossBattle: boolean;
  awakened: boolean;
}

export interface FlawRuntime {
  flaw: TragicFlaw;
  state: FlawState;
}

export interface FlawActionContext {
  command: 'attack' | 'skill' | 'defend';
  skillId?: string;
}

const allEffects = (flaw: TragicFlaw): TragicFlawEffect[] => [
  ...flaw.tragicFlaw.effects,
  ...flaw.passiveAbility.effects,
  ...flaw.activeSkill.effects,
  ...flaw.battleTrait.effects,
];

export function createFlawRuntime(char: Character, isBossBattle: boolean): FlawRuntime {
  return {
    flaw: char.tragicFlaw,
    state: {
      meter: char.tragicFlaw.meter?.startsAt ?? 0,
      hpSpent: 0,
      isBossBattle,
      awakened: false,
    },
  };
}

export function skillIdsWithTragicFlaw(char: Character, learnedSkillIds: string[]): string[] {
  return [...new Set([...learnedSkillIds, char.tragicFlaw.activeSkill.skillId])];
}

export function meterPercent(runtime?: FlawRuntime): number | null {
  if (!runtime?.flaw.meter) return null;
  return Math.round((runtime.state.meter / runtime.flaw.meter.max) * 100);
}

function hpBelow(effect: TragicFlawEffect, hp: number, maxHp: number): boolean {
  return effect.type === 'statMultiplier' && effect.when === 'hpBelowRatio' && hp <= maxHp * (effect.thresholdRatio ?? 0);
}

export function flawIsAwakened(runtime: FlawRuntime | undefined, hp: number, maxHp: number): boolean {
  if (!runtime) return false;
  return allEffects(runtime.flaw).some((effect) => {
    if (hpBelow(effect, hp, maxHp)) return true;
    if (effect.type === 'statMultiplier' && effect.when === 'bossBattle') return runtime.state.isBossBattle;
    if (effect.type === 'atkMultiplierByHpSpent') return runtime.state.hpSpent > 0;
    if (effect.type === 'consumeMeterForDamage' && effect.requireFullMeter && runtime.flaw.meter) {
      return runtime.state.meter >= runtime.flaw.meter.max;
    }
    return false;
  });
}

export function effectiveStats(stats: Stats, runtime: FlawRuntime | undefined, hp: number, maxHp: number): Stats {
  if (!runtime) return stats;
  const next = { ...stats };
  for (const effect of allEffects(runtime.flaw)) {
    if (effect.type === 'statMultiplier') {
      const applies = effect.when === 'bossBattle' ? runtime.state.isBossBattle : hpBelow(effect, hp, maxHp);
      if (applies) next[effect.stat] = Math.max(1, Math.floor(next[effect.stat] * effect.multiplier));
    }
    if (effect.type === 'atkMultiplierByHpSpent' && runtime.state.hpSpent > 0) {
      const steps = Math.floor(runtime.state.hpSpent / Math.max(1, maxHp * effect.stepRatio));
      const multiplier = Math.min(effect.maxMultiplier, 1 + steps * effect.multiplierPerStep);
      next.atk = Math.max(1, Math.floor(next.atk * multiplier));
    }
  }
  return next;
}

export function onDefend(runtime: FlawRuntime | undefined): string | null {
  if (!runtime?.flaw.meter) return null;
  const effect = allEffects(runtime.flaw).find((item) => item.type === 'meterOnCommand' && item.command === 'defend');
  if (!effect || effect.type !== 'meterOnCommand') return null;
  const before = runtime.state.meter;
  runtime.state.meter = Math.min(runtime.flaw.meter.max, runtime.state.meter + effect.amount);
  if (runtime.state.meter === before) return null;
  return `${runtime.flaw.theme}: ${runtime.flaw.meter.label} ${runtime.state.meter}/${runtime.flaw.meter.max}`;
}

export function applyHpCost(runtime: FlawRuntime | undefined, skillId: string | undefined, hp: number, maxHp: number): { hp: number; spent: number; text: string | null } {
  if (!runtime || skillId !== runtime.flaw.activeSkill.skillId) return { hp, spent: 0, text: null };
  const hpCost = runtime.flaw.activeSkill.effects.find((effect) => effect.type === 'hpCost');
  if (!hpCost || hpCost.type !== 'hpCost') return { hp, spent: 0, text: null };
  const spent = Math.min(hp - 1, Math.max(1, Math.floor(maxHp * hpCost.ratio)));
  runtime.state.hpSpent += spent;
  return {
    hp: Math.max(1, hp - spent),
    spent,
    text: `${runtime.flaw.theme}: HPを ${spent} 捧げた。`,
  };
}

export function damageMultiplier(runtime: FlawRuntime | undefined, context: FlawActionContext, hp: number, maxHp: number): { multiplier: number; text: string | null } {
  if (!runtime) return { multiplier: 1, text: null };
  let multiplier = 1;
  const notes: string[] = [];

  if (context.skillId === runtime.flaw.activeSkill.skillId) {
    for (const effect of runtime.flaw.activeSkill.effects) {
      if (effect.type === 'damageByMissingHp') {
        const missingRatio = maxHp <= 0 ? 0 : 1 - hp / maxHp;
        const bonus = 1 + missingRatio * effect.maxBonusMultiplier;
        multiplier *= bonus;
        notes.push(`${runtime.flaw.theme}: 瀕死の力 x${bonus.toFixed(2)}`);
      }
    }
  }

  const meterEffects = allEffects(runtime.flaw).filter((effect) => effect.type === 'consumeMeterForDamage');
  for (const effect of meterEffects) {
    if (effect.type !== 'consumeMeterForDamage' || !runtime.flaw.meter) continue;
    const isActiveSkill = context.skillId === runtime.flaw.activeSkill.skillId;
    const full = runtime.state.meter >= runtime.flaw.meter.max;
    if (effect.requireFullMeter && (!full || isActiveSkill)) continue;
    if (!effect.requireFullMeter && !isActiveSkill) continue;
    if (runtime.state.meter <= 0) continue;
    const ratio = runtime.state.meter / runtime.flaw.meter.max;
    const bonus = effect.requireFullMeter
      ? effect.maxMultiplier
      : effect.minMultiplier + (effect.maxMultiplier - effect.minMultiplier) * ratio;
    multiplier *= bonus;
    notes.push(`${runtime.flaw.theme}: ${runtime.flaw.meter.label}解放 x${bonus.toFixed(2)}`);
    runtime.state.meter = 0;
  }

  return { multiplier, text: notes.length > 0 ? notes.join(' / ') : null };
}
