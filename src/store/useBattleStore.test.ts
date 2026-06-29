import { describe, expect, it } from 'vitest';
import { combatantFromEnemy, combatantFromOwned, resolveAction } from '@/engine/battle';
import { effectiveStats } from '@/engine/tragicFlaw';
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
  it('requests exactly one attack command from each living ally before resolving the round', () => {
    const battle = useBattleStore.getState();
    battle.start([beowulf, hamlet], ['grendel'], false);

    expect(useBattleStore.getState().currentActor()?.sourceId).toBe('beowulf_young');
    const firstActorUid = useBattleStore.getState().currentActor()!.uid;
    const enemyUid = useBattleStore.getState().livingEnemies()[0].uid;
    const initialEnemyHp = useBattleStore.getState().livingEnemies()[0].hp;
    expect(useBattleStore.getState().chooseCommand(firstActorUid, { type: 'attack', targetUid: enemyUid })).toBe(true);

    expect(useBattleStore.getState().phase).toBe('input');
    expect(useBattleStore.getState().currentActor()?.sourceId).toBe('hamlet_prince');
    expect(useBattleStore.getState().planned).toHaveLength(0);
    expect(useBattleStore.getState().log.map((entry) => entry.text).join('\n')).toContain('Beowulf の攻撃！');
    expect(useBattleStore.getState().livingEnemies()[0].hp).toBeLessThan(initialEnemyHp);

    expect(useBattleStore.getState().chooseCommand(firstActorUid, { type: 'attack', targetUid: enemyUid })).toBe(false);
    expect(useBattleStore.getState().currentActor()?.sourceId).toBe('hamlet_prince');

    const secondActorUid = useBattleStore.getState().currentActor()!.uid;
    expect(useBattleStore.getState().chooseCommand(secondActorUid, { type: 'attack', targetUid: enemyUid })).toBe(true);
    expect(useBattleStore.getState().planned).toHaveLength(0);
    expect(useBattleStore.getState().inputIndex).toBe(0);
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
    }

    const messages = useBattleStore.getState().log.map((entry) => entry.text).join('\n');
    expect(messages).toContain('Beowulf の攻撃！');
    expect(messages).toContain('Hamlet の攻撃！');
    expect(messages).toContain('Macbeth の攻撃！');
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
});
