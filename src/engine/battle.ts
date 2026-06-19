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
  /** 防御コマンドによる被ダメ半減（このラウンドのみ） */
  defending: boolean;
  rageTriggered: boolean;
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
export function combatantFromOwned(owned: OwnedCharacter): Combatant {
  const char = getCharacter(owned.characterId);
  const stats = statsWithEquipment(char, owned);
  return {
    uid: `ally_${owned.characterId}`,
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
    defending: false,
    rageTriggered: false,
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

function applyDamage(target: Combatant, raw: number): number {
  const dmg = target.defending ? Math.max(1, Math.floor(raw / 2)) : raw;
  target.hp = Math.max(0, target.hp - dmg);
  if (target.hp === 0) target.alive = false;
  return dmg;
}

export function resolveAction(working: Combatant[], action: BattleAction): LogEntry[] {
  const actor = working.find((c) => c.uid === action.actorUid);
  if (!actor || !actor.alive) return [];
  const logs: LogEntry[] = [];
  const enemySide: Side = actor.side === 'ally' ? 'enemy' : 'ally';

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
    case 'attack': {
      const targets =
        skill.target === 'all' ? livingOf(working, enemySide) : [pickAliveTarget(working, action.targetUid, enemySide)].filter(Boolean) as Combatant[];
      for (const t of targets) {
        const dmg = calcDamage({ attackerAtk: actor.stats.atk, defenderDef: t.stats.def, skill, atkBuff: actor.atkBuff });
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
      actor.hp = Math.min(actor.maxHp, actor.hp + heal);
      logs.push({ text: `${actor.name} のHPが ${heal} 回復した。` });
      break;
    }
    case 'buff': {
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
