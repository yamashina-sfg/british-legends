import type { Enemy, OwnedCharacter, Skill, Stats } from '@/types';
import { getCharacter, getEnemy, getSkill } from '@/data';
import { statsWithEquipment } from './equipment';
import { calcDamage, calcHeal } from './damage';

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
  /** Hamlet の逡巡など、次の一撃へ持ち越す文学テーマ由来の蓄積 */
  tragicCharge: number;
  /** 戦闘内で何回行動したか。敵の固定パターンに使う。 */
  actionCount: number;
  /** 防御コマンドによる被ダメ半減（このラウンドのみ） */
  defending: boolean;
  rageTriggered: boolean;
  passiveTriggered: boolean;
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
export function combatantFromOwned(owned: OwnedCharacter, partyIndex = 0): Combatant {
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
    skillIds: owned.learnedSkillIds,
    atkBuff: 0,
    tragicCharge: 0,
    actionCount: 0,
    defending: false,
    rageTriggered: false,
    passiveTriggered: false,
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
    tragicCharge: 0,
    actionCount: 0,
    defending: false,
    rageTriggered: false,
    passiveTriggered: false,
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
  const target = targets[Math.floor(Math.random() * targets.length)];
  const nextActionNumber = actor.actionCount + 1;

  if (actor.sourceId === 'grendel') {
    return {
      actorUid: actor.uid,
      type: 'skill',
      skillId: nextActionNumber % 3 === 0 ? 'grendel_crush' : 'enemy_bite',
      targetUid: target?.uid,
    };
  }

  if (actor.sourceId === 'grendels_mother') {
    const woundedTarget = [...targets].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    return {
      actorUid: actor.uid,
      type: 'skill',
      skillId: nextActionNumber % 4 === 0 ? 'mere_drag' : nextActionNumber % 2 === 0 ? 'curse_word' : 'enemy_bite',
      targetUid: woundedTarget?.uid ?? target?.uid,
    };
  }

  if (actor.sourceId === 'dragon') {
    const specialRoll = Math.random();
    if (actor.rageTriggered || specialRoll < 0.4) {
      return {
        actorUid: actor.uid,
        type: 'skill',
        skillId: specialRoll < 0.2 ? 'dragon_tail_smash' : 'dragon_breath',
        targetUid: target?.uid,
      };
    }
    return {
      actorUid: actor.uid,
      type: 'attack',
      targetUid: target?.uid,
    };
  }

  if (actor.sourceId === 'claudius') {
    const guardCount = all.filter((c) => c.side === 'enemy' && c.alive && c.sourceId === 'royal_guard').length;
    if (nextActionNumber % 3 === 0 && guardCount < 2) {
      return { actorUid: actor.uid, type: 'skill', skillId: 'summon_guard', targetUid: target?.uid };
    }
    return {
      actorUid: actor.uid,
      type: 'skill',
      skillId: nextActionNumber % 2 === 0 ? 'poisoned_cup' : 'curse_word',
      targetUid: target?.uid,
    };
  }

  if (actor.sourceId === 'macbeths_fate') {
    if (!actor.rageTriggered && actor.hp <= actor.maxHp / 2) {
      return { actorUid: actor.uid, type: 'skill', skillId: 'bloody_ambition', targetUid: actor.uid };
    }
    return {
      actorUid: actor.uid,
      type: 'skill',
      skillId: nextActionNumber % 3 === 0 ? 'witch_curse' : 'bloody_dagger',
      targetUid: target?.uid,
    };
  }

  // MPが足りる特技を3割の確率で使用
  const usable = actor.skillIds
    .map(getSkill)
    .filter((s) => s.mpCost <= actor.mp && s.id !== 'attack_basic');
  if (actor.sourceId === 'dragon' && actor.rageTriggered && actor.skillIds.includes('dragon_breath') && Math.random() < 0.8) {
    return { actorUid: actor.uid, type: 'skill', skillId: 'dragon_breath', targetUid: target?.uid };
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

function pickTarget(cs: Combatant[], preferUid: string | undefined, side: Side): Combatant | undefined {
  const pref = cs.find((c) => c.uid === preferUid && c.side === side);
  if (pref) return pref;
  return cs.find((c) => c.side === side);
}

function applyDamage(target: Combatant, raw: number): number {
  const dmg = target.defending ? Math.max(1, Math.floor(raw / 2)) : raw;
  target.hp = Math.max(0, target.hp - dmg);
  if (target.hp === 0) target.alive = false;
  return dmg;
}

export function resolveAction(working: Combatant[], action: BattleAction): LogEntry[] {
  const actor = working.find((c) => c.uid === action.actorUid);
  if (!actor || !actor.alive) return [];
  actor.actionCount += 1;
  const logs: LogEntry[] = [];
  const enemySide: Side = actor.side === 'ally' ? 'enemy' : 'ally';

  if (
    actor.side === 'ally' &&
    actor.sourceId.startsWith('beowulf') &&
    !actor.passiveTriggered &&
    actor.hp > 0 &&
    actor.hp <= actor.maxHp * 0.3
  ) {
    actor.passiveTriggered = true;
    actor.atkBuff += 14;
    actor.stats = { ...actor.stats, def: Math.max(1, actor.stats.def - 6) };
    logs.push({ text: '宿命「英雄」: Beowulfの Heroic Spirit が燃え上がる！' });
    logs.push({ text: '攻撃力が大きく上がったが、防御が下がった。' });
  }

  if (action.type === 'defend') {
    actor.defending = true;
    logs.push({ text: `${actor.name} は身を守っている。` });
    return logs;
  }

  const skill: Skill = action.type === 'skill' && action.skillId ? getSkill(action.skillId) : getSkill('attack_basic');

  if (action.type === 'skill') {
    if (actor.mp < skill.mpCost) {
      logs.push({ text: `${actor.name} はMPが足りない！` });
      return logs;
    }
    actor.mp -= skill.mpCost;
    logs.push({ text: `${actor.name} は「${skill.name}」を放った！` });
  } else {
    logs.push({ text: `${actor.name} の攻撃！` });
  }

  switch (skill.type) {
    case 'charge': {
      actor.tragicCharge = Math.min(3, actor.tragicCharge + 1);
      logs.push({ text: `宿命「逡巡」: ${actor.name} は決断を遅らせ、次の一撃を研ぎ澄ませた。` });
      logs.push({ text: `逡巡 ${actor.tragicCharge}/3。次の攻撃威力が上がる。` });
      break;
    }
    case 'sacrifice': {
      const cost = Math.max(1, Math.floor(actor.maxHp * 0.16));
      actor.hp = Math.max(1, actor.hp - cost);
      actor.atkBuff += skill.power;
      if (actor.sourceId === 'macbeths_fate') actor.rageTriggered = true;
      logs.push({ text: `宿命「野心」: ${actor.name} はHP${cost}を代償に力を得た！` });
      logs.push({ text: `${actor.name} の攻撃力が大きく上がった。` });
      break;
    }
    case 'attack': {
      const targets =
        skill.target === 'all' ? livingOf(working, enemySide) : [pickAliveTarget(working, action.targetUid, enemySide)].filter(Boolean) as Combatant[];
      for (const t of targets) {
        let dmg = calcDamage({ attackerAtk: actor.stats.atk, defenderDef: t.stats.def, skill, atkBuff: actor.atkBuff });
        if (actor.tragicCharge > 0) {
          const multiplier = 1 + actor.tragicCharge * 0.55;
          dmg = Math.max(1, Math.floor(dmg * multiplier));
          logs.push({ text: `溜めた逡巡が決断に変わった！ 威力 ${Math.round(multiplier * 100)}%` });
          actor.tragicCharge = 0;
        }
        const dealt = applyDamage(t, dmg);
        logs.push({ text: `${t.name} に ${dealt} のダメージ！` });
        if (t.sourceId === 'dragon' && !t.rageTriggered && t.hp > 0 && t.hp <= t.maxHp / 2) {
          t.rageTriggered = true;
          t.atkBuff += 10;
          logs.push({ text: 'Dragonの鱗が砕け、灼熱の怒りが解き放たれた！' });
        }
        if (!t.alive) logs.push({ text: `${t.name} を倒した！` });
      }
      break;
    }
    case 'heal': {
      const heal = calcHeal(skill);
      const target = skill.target === 'self' ? actor : pickAliveTarget(working, action.targetUid, actor.side);
      if (!target || !target.alive) {
        logs.push({ text: 'しかし、効果はなかった。' });
        break;
      }
      const before = target.hp;
      target.hp = Math.min(target.maxHp, target.hp + heal);
      logs.push({ text: `${target.name} のHPが ${target.hp - before} 回復した。` });
      break;
    }
    case 'revive': {
      const target = pickTarget(working, action.targetUid, actor.side);
      if (!target || target.alive) {
        logs.push({ text: 'しかし、蘇生できる仲間はいなかった。' });
        break;
      }
      target.alive = true;
      target.hp = Math.max(1, Math.ceil(target.maxHp * (skill.power / 100)));
      logs.push({ text: `${target.name} はHP${target.hp}で立ち上がった！` });
      break;
    }
    case 'buff': {
      if (skill.id === 'summon_guard') {
        const guard = combatantFromEnemy('royal_guard', working.filter((c) => c.sourceId === 'royal_guard').length);
        guard.uid = `enemy_royal_guard_summoned_${actor.actionCount}_${Math.floor(Math.random() * 10000)}`;
        guard.name = 'Royal Guard';
        working.push(guard);
        logs.push({ text: 'Claudius は王の護衛を呼び寄せた！' });
        break;
      }
      if (skill.id === 'shield_oath') {
        actor.defending = true;
        actor.stats = { ...actor.stats, def: actor.stats.def + skill.power };
        logs.push({ text: `宿命「英雄」: ${actor.name} は仲間を守る誓いを立てた。` });
        logs.push({ text: `${actor.name} の防御力が上がり、このターン受けるダメージを抑える。` });
        break;
      }
      actor.atkBuff += skill.power;
      logs.push({ text: `${actor.name} の攻撃力が上がった！` });
      break;
    }
    case 'debuff': {
      const targets =
        skill.target === 'all' ? livingOf(working, enemySide) : [pickAliveTarget(working, action.targetUid, enemySide)].filter(Boolean) as Combatant[];
      for (const t of targets) {
        t.stats = { ...t.stats, def: Math.max(0, t.stats.def - skill.power), spd: Math.max(1, t.stats.spd - skill.power) };
        logs.push({ text: `${t.name} は弱体化した……。` });
      }
      break;
    }
  }
  return logs;
}

/** ラウンド冒頭：防御フラグをリセット */
export function resetRoundFlags(combatants: Combatant[]): Combatant[] {
  return combatants.map((c) => ({ ...c, defending: false }));
}
