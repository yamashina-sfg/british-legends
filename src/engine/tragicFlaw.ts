import type { Character, Stats, TragicFlaw, TragicFlawEffect } from '@/types';

export interface FlawRuntime {
  flaw: TragicFlaw;
  isBossBattle: boolean;
  state: {
    meter: number;
    hpSpent: number;
    awakened: boolean;
  };
}

export function createFlawRuntime(character: Character, isBossBattle: boolean): FlawRuntime | undefined {
  if (!character.tragicFlaw) return undefined;
  return {
    flaw: character.tragicFlaw,
    isBossBattle,
    state: {
      meter: character.tragicFlaw.meter?.startsAt ?? 0,
      hpSpent: 0,
      awakened: false,
    },
  };
}

export function cloneFlawRuntime(runtime: FlawRuntime | undefined): FlawRuntime | undefined {
  if (!runtime) return undefined;
  return {
    flaw: runtime.flaw,
    isBossBattle: runtime.isBossBattle,
    state: { ...runtime.state },
  };
}

export function skillIdsWithTragicFlaw(character: Character, learnedSkillIds: string[]): string[] {
  const activeSkillId = character.tragicFlaw?.activeSkill.skillId;
  if (!activeSkillId || learnedSkillIds.includes(activeSkillId)) return learnedSkillIds;
  return [...learnedSkillIds, activeSkillId];
}

function effectApplies(effect: TragicFlawEffect, runtime: FlawRuntime, hp: number, maxHp: number): boolean {
  if (effect.type !== 'statMultiplier') return false;
  if (effect.when === 'bossBattle') return runtime.isBossBattle;
  if (effect.when === 'hpBelowRatio') return hp > 0 && hp <= maxHp * (effect.thresholdRatio ?? 0);
  return false;
}

export function effectiveStats(base: Stats, runtime: FlawRuntime | undefined, hp: number, maxHp: number): Stats {
  if (!runtime) return base;
  const next = { ...base };
  const effects = [
    ...runtime.flaw.tragicFlaw.effects,
    ...runtime.flaw.passiveAbility.effects,
    ...runtime.flaw.battleTrait.effects,
  ];
  for (const effect of effects) {
    if (effect.type === 'statMultiplier' && effectApplies(effect, runtime, hp, maxHp)) {
      next[effect.stat] = Math.max(1, Math.floor(next[effect.stat] * effect.multiplier));
    }
    if (effect.type === 'atkMultiplierByHpSpent') {
      const steps = Math.floor(runtime.state.hpSpent / Math.max(1, Math.floor(maxHp * effect.stepRatio)));
      const multiplier = Math.min(effect.maxMultiplier, 1 + steps * effect.multiplierPerStep);
      next.atk = Math.max(1, Math.floor(next.atk * multiplier));
    }
  }
  return next;
}

export function onDefend(runtime: FlawRuntime | undefined): string | null {
  if (!runtime) return null;
  const effect = [...runtime.flaw.tragicFlaw.effects, ...runtime.flaw.passiveAbility.effects]
    .find((entry) => entry.type === 'meterOnCommand' && entry.command === 'defend');
  if (!effect || effect.type !== 'meterOnCommand') return null;
  const max = runtime.flaw.meter?.max ?? 100;
  runtime.state.meter = Math.min(max, runtime.state.meter + effect.amount);
  return `${runtime.flaw.theme}: ${runtime.flaw.meter?.label ?? 'Meter'} ${runtime.state.meter}/${max}`;
}

export function applyHpCost(runtime: FlawRuntime | undefined, skillId: string, hp: number, maxHp: number): { hp: number; text?: string } {
  if (!runtime || runtime.flaw.activeSkill.skillId !== skillId) return { hp };
  const effect = runtime.flaw.activeSkill.effects.find((entry) => entry.type === 'hpCost');
  if (!effect || effect.type !== 'hpCost') return { hp };
  const cost = Math.max(1, Math.floor(maxHp * effect.ratio));
  runtime.state.hpSpent += cost;
  return {
    hp: Math.max(1, hp - cost),
    text: `${runtime.flaw.theme}: HP${cost}を代償にした。`,
  };
}

export function damageMultiplier(
  runtime: FlawRuntime | undefined,
  action: { command: 'attack' | 'skill'; skillId: string },
  hp: number,
  maxHp: number,
): { multiplier: number; text?: string } {
  if (!runtime) return { multiplier: 1 };
  let multiplier = 1;
  const messages: string[] = [];

  for (const effect of runtime.flaw.activeSkill.effects) {
    if (runtime.flaw.activeSkill.skillId === action.skillId && effect.type === 'damageByMissingHp') {
      const missingRatio = Math.max(0, 1 - hp / maxHp);
      const bonus = missingRatio * effect.maxBonusMultiplier;
      multiplier *= 1 + bonus;
      messages.push(`${runtime.flaw.theme}: 瀕死の英雄譚が威力 ${Math.round((1 + bonus) * 100)}% へ跳ね上がる。`);
    }
  }

  const meterEffects = [...runtime.flaw.passiveAbility.effects, ...runtime.flaw.activeSkill.effects]
    .filter((entry) => entry.type === 'consumeMeterForDamage');
  for (const effect of meterEffects) {
    if (effect.type !== 'consumeMeterForDamage') continue;
    const isActiveSkill = runtime.flaw.activeSkill.skillId === action.skillId;
    const isPassiveAttack = action.command === 'attack' && effect.requireFullMeter;
    if (!isActiveSkill && !isPassiveAttack) continue;
    const max = runtime.flaw.meter?.max ?? 100;
    if (effect.requireFullMeter && runtime.state.meter < max) continue;
    const ratio = max > 0 ? runtime.state.meter / max : 0;
    const meterMultiplier = effect.minMultiplier + (effect.maxMultiplier - effect.minMultiplier) * ratio;
    if (meterMultiplier <= 1) continue;
    multiplier *= meterMultiplier;
    runtime.state.meter = 0;
    messages.push(`${runtime.flaw.theme}: 逡巡が決意へ変わった。威力 ${Math.round(meterMultiplier * 100)}%。`);
  }

  return { multiplier, text: messages.join(' ') || undefined };
}

export function flawIsAwakened(runtime: FlawRuntime | undefined, hp: number, maxHp: number): boolean {
  if (!runtime) return false;
  const hpAwaken = runtime.flaw.tragicFlaw.effects.some(
    (effect) => effect.type === 'statMultiplier' && effect.when === 'hpBelowRatio' && hp <= maxHp * (effect.thresholdRatio ?? 0),
  );
  const meterAwaken = Boolean(runtime.flaw.meter && runtime.state.meter >= runtime.flaw.meter.max);
  const costAwaken = runtime.state.hpSpent > 0;
  return hpAwaken || meterAwaken || costAwaken;
}
