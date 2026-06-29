import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { combatantFromEnemy, combatantFromOwned, decideEnemyAction, resolveAction } from '@/engine/battle';
import { effectiveStats } from '@/engine/tragicFlaw';
import { expForLevel, gainExp, requiredExpForNextLevel } from '@/engine/leveling';
import { getCharacter } from '@/data';
import { useBattleStore } from './useBattleStore';
import type { OwnedCharacter } from '@/types';

const beowulf: OwnedCharacter = {
  characterId: 'beowulf_young', level: 1, exp: 0, currentHp: 80, currentMp: 12,
  learnedSkillIds: ['attack_basic', 'mighty_grip'],
};

const hamlet: OwnedCharacter = {
  characterId: 'hamlet_prince', level: 1, exp: 0, currentHp: 70, currentMp: 24,
  learnedSkillIds: ['attack_basic', 'poison_blade'],
};

const macbeth: OwnedCharacter = {
  characterId: 'macbeth_thane', level: 1, exp: 0, currentHp: 90, currentMp: 18,
  learnedSkillIds: ['attack_basic', 'bloody_dagger'],
};

describe('battle command input', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    useBattleStore.getState().reset();
  });

  it('requests exactly one attack command from each living ally before resolving the round', () => {
    const battle = useBattleStore.getState();
    battle.start([beowulf, hamlet], ['grendel'], false);

    expect(useBattleStore.getState().currentActor()?.sourceId).toBe('beowulf_young');
    const firstActorUid = useBattleStore.getState().currentActor()!.uid;
    const enemyUid = useBattleStore.getState().livingEnemies()[0].uid;
    const initialEnemyHp = useBattleStore.getState().livingEnemies()[0].hp;
    expect(useBattleStore.getState().chooseCommand(firstActorUid, { type: 'attack', targetUid: enemyUid })).toBe(true);
    vi.runOnlyPendingTimers();

    expect(useBattleStore.getState().phase).toBe('input');
    expect(useBattleStore.getState().currentActor()?.sourceId).toBe('hamlet_prince');
    expect(useBattleStore.getState().planned).toHaveLength(0);
    expect(useBattleStore.getState().log.map((entry) => entry.text).join('\n')).toContain('Beowulf の攻撃！');
    expect(useBattleStore.getState().livingEnemies()[0].hp).toBeLessThan(initialEnemyHp);

    expect(useBattleStore.getState().chooseCommand(firstActorUid, { type: 'attack', targetUid: enemyUid })).toBe(false);
    expect(useBattleStore.getState().currentActor()?.sourceId).toBe('hamlet_prince');

    const secondActorUid = useBattleStore.getState().currentActor()!.uid;
    expect(useBattleStore.getState().chooseCommand(secondActorUid, { type: 'attack', targetUid: enemyUid })).toBe(true);
    vi.runOnlyPendingTimers();
    expect(useBattleStore.getState().planned).toHaveLength(0);
    expect(useBattleStore.getState().inputIndex).toBe(0);
    expect(useBattleStore.getState().combatants.some((combatant) => combatant.side === 'ally' && combatant.hp < combatant.maxHp)).toBe(true);
    expect(useBattleStore.getState().log.map((entry) => entry.text).join('\n')).toContain('Grendel は「噛みつき」を放った！');
  });

  it('assigns unique combatant ids even when two party entries share a character id', () => {
    expect(combatantFromOwned(beowulf, 0).uid).not.toBe(combatantFromOwned(beowulf, 1).uid);
  });

  it('resolves an attack from every party member in one player phase', () => {
    const battle = useBattleStore.getState();
    battle.start([beowulf, hamlet, macbeth], ['dragon'], false);
    const enemyUid = useBattleStore.getState().livingEnemies()[0].uid;

    for (const characterId of ['beowulf_young', 'hamlet_prince', 'macbeth_thane']) {
      const actor = useBattleStore.getState().currentActor();
      expect(actor?.sourceId).toBe(characterId);
      expect(useBattleStore.getState().chooseCommand(actor!.uid, { type: 'attack', targetUid: enemyUid })).toBe(true);
      vi.runOnlyPendingTimers();
    }

    const messages = useBattleStore.getState().log.map((entry) => entry.text).join('\n');
    expect(messages).toContain('Beowulf の攻撃！');
    expect(messages).toContain('Hamlet の攻撃！');
    expect(messages).toContain('Macbeth の攻撃！');
  });

  it('gives Beowulf enemies distinct attack patterns', () => {
    const battle = useBattleStore.getState();
    battle.start([beowulf], ['grendel'], false);
    const actorUid = useBattleStore.getState().currentActor()!.uid;
    const enemyUid = useBattleStore.getState().livingEnemies()[0].uid;

    expect(useBattleStore.getState().chooseCommand(actorUid, { type: 'defend' })).toBe(true);
    vi.runOnlyPendingTimers();
    let log = useBattleStore.getState().log.map((entry) => entry.text).join('\n');
    expect(log).toContain('噛みつき');

    expect(useBattleStore.getState().chooseCommand(useBattleStore.getState().currentActor()!.uid, { type: 'defend' })).toBe(true);
    vi.runOnlyPendingTimers();
    expect(useBattleStore.getState().chooseCommand(useBattleStore.getState().currentActor()!.uid, { type: 'defend' })).toBe(true);
    vi.runOnlyPendingTimers();
    log = useBattleStore.getState().log.map((entry) => entry.text).join('\n');
    expect(log).toContain('怪腕の叩きつけ');
    expect(useBattleStore.getState().livingEnemies()[0].uid).toBe(enemyUid);
  });

  it('can lose when enemy attacks reduce every ally to 0 HP', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const wounded: OwnedCharacter = { ...beowulf, currentHp: 4 };
    useBattleStore.getState().start([wounded], ['dragon'], true);

    const actor = useBattleStore.getState().currentActor()!;
    expect(useBattleStore.getState().chooseCommand(actor.uid, { type: 'defend' })).toBe(true);
    vi.runOnlyPendingTimers();

    expect(useBattleStore.getState().phase).toBe('lost');
    expect(useBattleStore.getState().livingAllies()).toHaveLength(0);
    expect(useBattleStore.getState().log.map((entry) => entry.text).join('\n')).toContain('全滅してしまった');
  });

  it('revives a fallen ally with Phoenix Page during battle', () => {
    useBattleStore.getState().start([beowulf, hamlet], ['grendel'], false);
    useBattleStore.setState((state) => ({
      combatants: state.combatants.map((combatant) =>
        combatant.sourceId === 'hamlet_prince'
          ? { ...combatant, hp: 0, alive: false }
          : combatant,
      ),
      turnActorUids: state.turnActorUids.filter((uid) => !uid.includes('hamlet_prince')),
    }));
    const actor = useBattleStore.getState().currentActor()!;
    const fallen = useBattleStore.getState().combatants.find((c) => c.sourceId === 'hamlet_prince')!;

    expect(useBattleStore.getState().chooseCommand(actor.uid, { type: 'skill', skillId: 'phoenix_page', targetUid: fallen.uid })).toBe(true);

    const revived = useBattleStore.getState().combatants.find((c) => c.sourceId === 'hamlet_prince')!;
    expect(revived.alive).toBe(true);
    expect(revived.hp).toBeGreaterThan(0);
    expect(revived.hp).toBeLessThanOrEqual(Math.ceil(revived.maxHp * 0.5));
  });
});

describe('tragic flaw system', () => {
  it('turns Hamlet waiting into Resolve for the next decision', () => {
    const actor = combatantFromOwned(hamlet);
    resolveAction([actor], { actorUid: actor.uid, type: 'defend' });
    expect(actor.tragicFlaw?.state.meter).toBe(50);
    resolveAction([actor], { actorUid: actor.uid, type: 'defend' });
    expect(actor.tragicFlaw?.state.meter).toBe(100);

    const enemy = combatantFromEnemy('grendel', 0);
    const logs = resolveAction([actor, enemy], { actorUid: actor.uid, type: 'attack', targetUid: enemy.uid });
    expect(actor.tragicFlaw?.state.meter).toBe(0);
    expect(logs.map((entry) => entry.text).join('\n')).toContain('Resolve解放');
  });

  it('makes Macbeth pay HP to grow more dangerous', () => {
    const actor = combatantFromOwned(macbeth);
    const enemy = combatantFromEnemy('grendel', 0);
    resolveAction([actor, enemy], { actorUid: actor.uid, type: 'skill', skillId: 'bloody_crown', targetUid: enemy.uid });

    expect(actor.hp).toBe(72);
    expect(actor.tragicFlaw?.state.hpSpent).toBe(18);
    expect(effectiveStats(actor.stats, actor.tragicFlaw, actor.hp, actor.maxHp).atk).toBeGreaterThan(actor.stats.atk);
  });

  it('makes Beowulf stronger and less guarded near defeat', () => {
    const actor = combatantFromOwned({ ...beowulf, currentHp: 20 });
    const stats = effectiveStats(actor.stats, actor.tragicFlaw, actor.hp, actor.maxHp);

    expect(stats.atk).toBeGreaterThan(actor.stats.atk);
    expect(stats.def).toBeLessThan(actor.stats.def);
  });

  it('applies Beowulf boss battle traits from character data', () => {
    const actor = combatantFromOwned(beowulf, 0, true);
    const stats = effectiveStats(actor.stats, actor.tragicFlaw, actor.hp, actor.maxHp);

    expect(stats.atk).toBeGreaterThan(actor.stats.atk);
    expect(stats.def).toBeGreaterThan(actor.stats.def);
  });
});

describe('boss phase patterns', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('gives Dragon a phase-two wing attack and rage state', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.1).mockReturnValue(0.5);
    const dragon = combatantFromEnemy('dragon', 0);
    const hero = combatantFromOwned(beowulf);
    dragon.hp = Math.floor(dragon.maxHp * 0.7);

    const action = decideEnemyAction(dragon, [dragon, hero]);
    expect(action.skillId).toBe('wing_attack');

    dragon.hp = Math.floor(dragon.maxHp * 0.5);
    dragon.rageTriggered = true;
    const rageAction = decideEnemyAction(dragon, [dragon, hero]);
    expect(['dragon_breath', 'dragon_tail_smash']).toContain(rageAction.skillId);
  });

  it('makes Claudius summon a guard before his final strike', () => {
    const claudius = combatantFromEnemy('claudius', 0);
    const hero = combatantFromOwned(hamlet);
    claudius.hp = Math.floor(claudius.maxHp * 0.65);

    expect(decideEnemyAction(claudius, [claudius, hero]).skillId).toBe('summon_guard');
    claudius.summonedGuard = true;
    claudius.hp = Math.floor(claudius.maxHp * 0.25);
    expect(decideEnemyAction(claudius, [claudius, hero]).skillId).toBe('royal_execution');
  });

  it('makes Macbeth awaken Bloody Ambition and spread the witch curse', () => {
    const boss = combatantFromEnemy('macbeths_fate', 0);
    const hero = combatantFromOwned(macbeth);
    boss.hp = Math.floor(boss.maxHp * 0.7);

    expect(decideEnemyAction(boss, [boss, hero]).skillId).toBe('bloody_ambition');
    resolveAction([boss, hero], { actorUid: boss.uid, type: 'skill', skillId: 'witch_curse', targetUid: hero.uid });
    expect(hero.cursed).toBe(3);
  });
});

describe('leveling balance', () => {
  it('uses slower early level requirements', () => {
    expect(requiredExpForNextLevel(1)).toBe(30);
    expect(requiredExpForNextLevel(2)).toBe(70);
    expect(requiredExpForNextLevel(3)).toBe(130);
    expect(requiredExpForNextLevel(4)).toBe(220);
    expect(requiredExpForNextLevel(5)).toBe(350);
    expect(expForLevel(3)).toBe(100);
  });

  it('does not jump from level 1 to level 3 after one Grendel battle', () => {
    const result = gainExp(beowulf, getCharacter(beowulf.characterId), 16);
    expect(result.owned.level).toBe(1);
  });
});
