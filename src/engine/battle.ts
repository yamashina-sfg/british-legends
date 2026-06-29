import type { Enemy, OwnedCharacter, Skill, Stats } from '@/types';
import { getCharacter, getEnemy, getSkill } from '@/data';
import { statsWithEquipment } from './equipment';
import { calcDamage, calcHeal } from './damage';
import {
  applyHpCost,
  createFlawRuntime,
  damageMultiplier,
  effectiveStats,
  flawIsAwakened,
  onDefend,
  skillIdsWithTragicFlaw,
  type FlawRuntime,
} from './tragicFlaw';

// ============================================================
// 戦闘エンジン（純粋ロジック・React非依存）
// ============================================================

export type Side = 'ally' | 'enemy';

export interface Combatant {
  /** 戦闘内インスタンスID（敵が複数いても一意） */
  uid: string;
  side: Side;
  name: string;
  spriteId: string;
  /** 参照元（ally=characterId, enemy=enemyId） */
  sourceId: string;
  level: number;
  stats: Stats;
  maxHp: number;
  maxMp: number;
  hp: number;
  mp: number;
  skillIds: string[];
  /** hero_roar 等による攻撃力バフ（累積） */
  atkBuff: number;
  /** 防御コマンドによる被ダメ半減（このラウンドのみ） */
  defending: boolean;
  rageTriggered: boolean;
  phaseTwoTriggered: boolean;
  finalTriggered: boolean;
  summonedGuard: boolean;
  poison: number;
  cursed: number;
  tragicFlaw?: FlawRuntime;
  alive: boolean;
}

export type CommandType = 'attack' | 'skill' | 'defend';

export interface BattleAction {
  actorUid: string;
  type: CommandType;
  skillId?: string;
  targetUid?: string;
}

export interface LogEntry {
  text: string;
}

// --- コンバタント生成 ----------------------------------------
export function combatantFromOwned(owned: OwnedCharacter, partyIndex = 0, isBossBattle = false): Combatant {
  const char = getCharacter(owned.characterId);
  const stats = statsWithEquipment(char, owned);
  return {
    // characterId は仲間の種類なので、同じ仲間が編成されても戦闘内IDは必ず分ける。
    uid: `ally_${owned.characterId}_${partyIndex}`,
    side: 'ally',
    name: char.name,
    spriteId: char.spriteId,
    sourceId: owned.characterId,
    level: owned.level,
    stats,
    maxHp: stats.hp,
    maxMp: stats.mp,
    hp: Math.min(owned.currentHp, stats.hp),
    mp: Math.min(owned.currentMp, stats.mp),
    skillIds: skillIdsWithTragicFlaw(char, owned.learnedSkillIds),
    atkBuff: 0,
    defending: false,
    rageTriggered: false,
    phaseTwoTriggered: false,
    finalTriggered: false,
    summonedGuard: false,
    poison: 0,
    cursed: 0,
    tragicFlaw: createFlawRuntime(char, isBossBattle),
    alive: owned.currentHp > 0,
  };
}

export function combatantFromEnemy(enemyId: string, index: number): Combatant {
  const enemy: Enemy = getEnemy(enemyId);
  return {
    uid: `enemy_${enemyId}_${index}`,
    side: 'enemy',
    name: enemy.name,
    spriteId: enemy.spriteId,
    sourceId: enemyId,
    level: 1,
    stats: { ...enemy.stats },
    maxHp: enemy.stats.hp,
    maxMp: enemy.stats.mp,
    hp: enemy.stats.hp,
    mp: enemy.stats.mp,
    skillIds: enemy.skillIds,
    atkBuff: 0,
    defending: false,
    rageTriggered: false,
    phaseTwoTriggered: false,
    finalTriggered: false,
    summonedGuard: false,
    poison: 0,
    cursed: 0,
    alive: true,
  };
}

/** 敵IDリスト（同一IDが並ぶと A/B で区別）からコンバタント生成 */
export function buildEnemyCombatants(enemyIds: string[]): Combatant[] {
  const counts: Record<string, number> = {};
  return enemyIds.map((id) => {
    const i = counts[id] ?? 0;
    counts[id] = i + 1;
    const c = combatantFromEnemy(id, i);
    // 同名が複数いる場合だけ A/B サフィックスを付ける
    if (enemyIds.filter((e) => e === id).length > 1) {
      c.name = `${c.name} ${String.fromCharCode(65 + i)}`;
    }
    return c;
  });
}

// --- 判定ヘルパ ---------------------------------------------
export const livingOf = (cs: Combatant[], side: Side) => cs.filter((c) => c.side === side && c.alive);
export const isBattleOver = (cs: Combatant[]) =>
  livingOf(cs, 'ally').length === 0 || livingOf(cs, 'enemy').length === 0;
export const allyWon = (cs: Combatant[]) => livingOf(cs, 'enemy').length === 0;

// --- 敵AI：単純ロジック ---------------------------------------
export function decideEnemyAction(actor: Combatant, all: Combatant[]): BattleAction {
  const targets = livingOf(all, 'ally');
  const weakest = [...targets].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  const target = actor.sourceId === 'claudius' ? weakest : targets[Math.floor(Math.random() * targets.length)];
  // MPが足りる特技を3割の確率で使用
  const usable = actor.skillIds
    .map(getSkill)
    .filter((s) => s.mpCost <= actor.mp && s.id !== 'attack_basic');
  if (actor.sourceId === 'dragon' && actor.rageTriggered && actor.skillIds.includes('dragon_breath') && Math.random() < 0.8) {
    return { actorUid: actor.uid, type: 'skill', skillId: 'dragon_breath', targetUid: target?.uid };
  }
  if (actor.sourceId === 'dragon' && actor.hp <= actor.maxHp * 0.72 && actor.skillIds.includes('wing_attack') && Math.random() < 0.52) {
    return { actorUid: actor.uid, type: 'skill', skillId: 'wing_attack', targetUid: target?.uid };
  }
  if (actor.sourceId === 'claudius' && actor.hp <= actor.maxHp * 0.28 && !actor.finalTriggered) {
    return { actorUid: actor.uid, type: 'skill', skillId: 'royal_execution', targetUid: target?.uid };
  }
  if (actor.sourceId === 'claudius' && actor.skillIds.includes('royal_poison') && Math.random() < 0.58) {
    return { actorUid: actor.uid, type: 'skill', skillId: 'royal_poison', targetUid: target?.uid };
  }
  if (actor.sourceId === 'macbeths_fate' && actor.hp <= actor.maxHp * 0.72 && !actor.phaseTwoTriggered) {
    return { actorUid: actor.uid, type: 'skill', skillId: 'bloody_ambition', targetUid: actor.uid };
  }
  if (actor.sourceId === 'macbeths_fate' && actor.skillIds.includes('witchs_curse') && Math.random() < 0.55) {
    return { actorUid: actor.uid, type: 'skill', skillId: 'witchs_curse', targetUid: target?.uid };
  }
  if (usable.length > 0 && Math.random() < 0.4) {
    const skill = usable[Math.floor(Math.random() * usable.length)];
    return { actorUid: actor.uid, type: 'skill', skillId: skill.id, targetUid: target?.uid };
  }
  return { actorUid: actor.uid, type: 'attack', targetUid: target?.uid };
}

// --- 行動順：素早さ降順（同値はランダム） ----------------------
export function orderActions(actions: BattleAction[], combatants: Combatant[]): BattleAction[] {
  const spd = (uid: string) => combatants.find((c) => c.uid === uid)?.stats.spd ?? 0;
  return [...actions].sort((a, b) => {
    const d = spd(b.actorUid) - spd(a.actorUid);
    return d !== 0 ? d : Math.random() - 0.5;
  });
}

// --- 1アクションの解決（working copy をミューテート） -----------
function pickAliveTarget(cs: Combatant[], preferUid: string | undefined, side: Side): Combatant | undefined {
  const pref = cs.find((c) => c.uid === preferUid && c.alive);
  if (pref) return pref;
  return livingOf(cs, side)[0];
}

function applyDamage(target: Combatant, raw: number): number {
  const cursedBonus = target.cursed > 0 ? Math.ceil(raw * 0.12) : 0;
  const dmg = target.defending ? Math.max(1, Math.floor((raw + cursedBonus) / 2)) : raw + cursedBonus;
  target.hp = Math.max(0, target.hp - dmg);
  if (target.hp === 0) target.alive = false;
  return dmg;
}

function maybeLogAwakening(actor: Combatant, logs: LogEntry[]): void {
  if (!actor.tragicFlaw || actor.tragicFlaw.state.awakened) return;
  if (!flawIsAwakened(actor.tragicFlaw, actor.hp, actor.maxHp)) return;
  actor.tragicFlaw.state.awakened = true;
  logs.push({ text: `${actor.name} の宿命「${actor.tragicFlaw.flaw.theme}」が目を覚ました！` });
}

export function resolveAction(working: Combatant[], action: BattleAction): LogEntry[] {
  const actor = working.find((c) => c.uid === action.actorUid);
  if (!actor || !actor.alive) return [];
  const logs: LogEntry[] = [];
  const enemySide: Side = actor.side === 'ally' ? 'enemy' : 'ally';

  if (action.type === 'defend') {
    actor.defending = true;
    logs.push({ text: `${actor.name} は身を守っている。` });
    if (actor.poison > 0 || actor.cursed > 0) {
      actor.poison = Math.max(0, actor.poison - 2);
      actor.cursed = Math.max(0, actor.cursed - 2);
      logs.push({ text: '呼吸を整え、毒と呪いを抑え込んだ。' });
    }
    const flawLog = onDefend(actor.tragicFlaw);
    if (flawLog) logs.push({ text: flawLog });
    maybeLogAwakening(actor, logs);
    return logs;
  }

  const skill: Skill = action.type === 'skill' && action.skillId ? getSkill(action.skillId) : getSkill('attack_basic');

  if (action.type === 'skill') {
    if (actor.mp < skill.mpCost) {
      logs.push({ text: `${actor.name} はMPが足りない！` });
      return logs;
    }
    actor.mp -= skill.mpCost;
    if (skill.id === 'royal_execution') actor.finalTriggered = true;
    if (skill.id === 'bloody_ambition') actor.phaseTwoTriggered = true;
    const hpCost = applyHpCost(actor.tragicFlaw, skill.id, actor.hp, actor.maxHp);
    actor.hp = hpCost.hp;
    if (hpCost.text) logs.push({ text: hpCost.text });
    logs.push({ text: `${actor.name} は「${skill.name}」を放った！` });
  } else {
    logs.push({ text: `${actor.name} の攻撃！` });
  }

  switch (skill.type) {
    case 'attack': {
      const targets =
        skill.target === 'all' ? livingOf(working, enemySide) : [pickAliveTarget(working, action.targetUid, enemySide)].filter(Boolean) as Combatant[];
      const actorStats = effectiveStats(actor.stats, actor.tragicFlaw, actor.hp, actor.maxHp);
      const flawDamage = damageMultiplier(actor.tragicFlaw, { command: action.type, skillId: skill.id }, actor.hp, actor.maxHp);
      if (flawDamage.text) logs.push({ text: flawDamage.text });
      maybeLogAwakening(actor, logs);
      for (const t of targets) {
        const targetStats = effectiveStats(t.stats, t.tragicFlaw, t.hp, t.maxHp);
        const baseDmg = calcDamage({ attackerAtk: actorStats.atk, defenderDef: targetStats.def, skill, atkBuff: actor.atkBuff });
        const dmg = Math.max(1, Math.floor(baseDmg * flawDamage.multiplier));
        const dealt = applyDamage(t, dmg);
        logs.push({ text: `${t.name} に ${dealt} のダメージ！` });
        if (!t.alive) logs.push({ text: `${t.name} を倒した！` });
        else maybeLogAwakening(t, logs);
      }
      break;
    }
    case 'heal': {
      const heal = calcHeal(skill);
      actor.hp = Math.min(actor.maxHp, actor.hp + heal);
      logs.push({ text: `${actor.name} のHPが ${heal} 回復した。` });
      break;
    }
    case 'buff': {
      actor.atkBuff += skill.power;
      logs.push({ text: `${actor.name} の攻撃力が上がった！` });
      if (skill.id === 'bloody_ambition') logs.push({ text: '魔女の影が三つに割れ、血の王座が燃え上がる！' });
      break;
    }
    case 'debuff': {
      const targets =
        skill.target === 'all' ? livingOf(working, enemySide) : [pickAliveTarget(working, action.targetUid, enemySide)].filter(Boolean) as Combatant[];
      for (const t of targets) {
        t.stats = { ...t.stats, def: Math.max(0, t.stats.def - skill.power), spd: Math.max(1, t.stats.spd - skill.power) };
        if (skill.id === 'royal_poison') {
          t.poison = 3;
          logs.push({ text: `${t.name} は毒杯に侵された……防御で早く抑えられる。` });
        } else if (skill.id === 'witchs_curse') {
          t.cursed = 3;
          logs.push({ text: `${t.name} は魔女の呪いを受けた……被ダメージが増える。` });
        } else if (skill.id === 'wing_attack') {
          logs.push({ text: `${t.name} は翼圧で行動順を乱された。回復と防御が攻略の鍵だ。` });
        } else {
          logs.push({ text: `${t.name} は弱体化した……。` });
        }
      }
      break;
    }
  }
  applyOngoingStatuses(working, logs);
  triggerBossPhases(working, logs);
  return logs;
}

function applyOngoingStatuses(working: Combatant[], logs: LogEntry[]): void {
  for (const t of working.filter((c) => c.side === 'ally' && c.alive && c.poison > 0)) {
    const poisonDmg = Math.max(3, Math.floor(t.maxHp * 0.06));
    t.hp = Math.max(0, t.hp - poisonDmg);
    t.poison -= 1;
    if (t.hp === 0) t.alive = false;
    logs.push({ text: `${t.name} は毒で ${poisonDmg} のダメージ。` });
  }
}

function triggerBossPhases(working: Combatant[], logs: LogEntry[]): void {
  for (const boss of livingOf(working, 'enemy')) {
    if (boss.sourceId === 'claudius' && !boss.summonedGuard && boss.hp <= boss.maxHp * 0.68) {
      boss.summonedGuard = true;
      const guard = combatantFromEnemy('royal_guard', working.filter((c) => c.sourceId === 'royal_guard').length);
      guard.name = 'Royal Guard';
      working.push(guard);
      logs.push({ text: 'Claudius が Royal Guard を召喚！護衛を先に倒すと毒の圧力が下がる。' });
    }
    if (boss.sourceId === 'dragon' && !boss.rageTriggered && boss.hp > 0 && boss.hp <= boss.maxHp / 2) {
      boss.rageTriggered = true;
      boss.atkBuff += 12;
      logs.push({ text: 'Dragonの鱗が砕け、Rageが発動！火炎ブレスが激しくなる。' });
    }
    if (boss.sourceId === 'macbeths_fate' && !boss.phaseTwoTriggered && boss.hp <= boss.maxHp * 0.5) {
      boss.phaseTwoTriggered = true;
      boss.atkBuff += 10;
      logs.push({ text: '魔女演出：雷鳴とともに予言が反転し、Macbethの野心が燃え上がる！' });
    }
  }
}

/** ラウンド冒頭：防御フラグをリセット */
export function resetRoundFlags(combatants: Combatant[]): Combatant[] {
  return combatants.map((c) => ({ ...c, defending: false }));
}
