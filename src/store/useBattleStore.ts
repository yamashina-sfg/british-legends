import { create } from 'zustand';
import type { Combatant, BattleAction, LogEntry } from '@/engine/battle';
import {
  buildEnemyCombatants,
  combatantFromOwned,
  decideEnemyAction,
  isBattleOver,
  allyWon,
  livingOf,
  orderActions,
  resetRoundFlags,
  resolveAction,
} from '@/engine/battle';
import type { OwnedCharacter } from '@/types';

export type BattlePhase = 'input' | 'resolving' | 'won' | 'lost';

interface BattleState {
  active: boolean;
  isBoss: boolean;
  enemyIds: string[];
  combatants: Combatant[];
  log: LogEntry[];
  phase: BattlePhase;
  /** このラウンドでコマンドを選ぶ仲間。戦闘中に並びが変わっても入力順は固定する。 */
  turnActorUids: string[];
  /** turnActorUids 内の入力待ち index */
  inputIndex: number;
  planned: BattleAction[];
  lastAction: BattleAction | null;

  start: (party: OwnedCharacter[], enemyIds: string[], isBoss: boolean) => void;
  livingAllies: () => Combatant[];
  livingEnemies: () => Combatant[];
  currentActor: () => Combatant | undefined;
  /** 表示中の仲間だけが送れる。古いクリックや二重送信は false で拒否する。 */
  chooseCommand: (actorUid: string, a: Omit<BattleAction, 'actorUid'>) => boolean;
  reset: () => void;
}

const nextLivingTurnIndex = (turnActorUids: string[], combatants: Combatant[], startIndex: number) =>
  turnActorUids.findIndex((uid, index) =>
    index >= startIndex && combatants.some((combatant) => combatant.uid === uid && combatant.alive),
  );

const ENEMY_TURN_DELAY_MS = 760;

const cloneCombatants = (combatants: Combatant[]) =>
  combatants.map((combatant) => ({
    ...combatant,
    stats: { ...combatant.stats },
    tragicFlaw: combatant.tragicFlaw
      ? { flaw: combatant.tragicFlaw.flaw, state: { ...combatant.tragicFlaw.state } }
      : undefined,
  }));

const resolveEnemyCounter = (combatants: Combatant[]) => {
  const enemyAction = orderActions(
    livingOf(combatants, 'enemy').map((enemy) => decideEnemyAction(enemy, combatants)),
    combatants,
  )[0];
  if (!enemyAction) return null;
  return { action: enemyAction, log: resolveAction(combatants, enemyAction) };
};

const scheduleEnemyTurn = (callback: () => void) => {
  const scheduler = typeof window === 'undefined' ? setTimeout : window.setTimeout;
  scheduler(callback, ENEMY_TURN_DELAY_MS);
};

export const useBattleStore = create<BattleState>((set, get) => ({
  active: false,
  isBoss: false,
  enemyIds: [],
  combatants: [],
  log: [],
  phase: 'input',
  turnActorUids: [],
  inputIndex: 0,
  planned: [],
  lastAction: null,

  start: (party, enemyIds, isBoss) => {
    const allies = party.filter((p) => p.currentHp > 0).map((member, index) => combatantFromOwned(member, index, isBoss));
    const enemies = buildEnemyCombatants(enemyIds);
    set({
      active: true,
      isBoss,
      enemyIds,
      combatants: [...allies, ...enemies],
      log: [{ text: allies.length > 0 ? (isBoss ? 'ボスが立ちはだかる！' : '魔物が現れた！') : '戦える仲間がいない……。' }],
      phase: allies.length > 0 ? 'input' : 'lost',
      turnActorUids: allies.map((ally) => ally.uid),
      inputIndex: 0,
      planned: [],
      lastAction: null,
    });
  },

  livingAllies: () => livingOf(get().combatants, 'ally'),
  livingEnemies: () => livingOf(get().combatants, 'enemy'),

  currentActor: () => {
    const { combatants, turnActorUids, inputIndex } = get();
    const uid = turnActorUids[inputIndex];
    return combatants.find((combatant) => combatant.uid === uid && combatant.alive);
  },

  chooseCommand: (requestedActorUid, a) => {
    const { combatants, planned, inputIndex, turnActorUids } = get();
    const actorUid = turnActorUids[inputIndex];
    const actor = combatants.find((combatant) => combatant.uid === actorUid && combatant.alive);
    // 直前の仲間のクリックが遅れて届いても、次の仲間のターンを消費させない。
    if (!actor || actor.uid !== requestedActorUid || planned.some((action) => action.actorUid === actor.uid)) return false;

    // 行動は入力した瞬間に解決する。これにより、各仲間のダメージが画面とログへ即時反映される。
    const working = inputIndex === 0 ? cloneCombatants(resetRoundFlags(combatants)) : cloneCombatants(combatants);
    const action: BattleAction = { ...a, actorUid: actor.uid };
    const roundLog = resolveAction(working, action);

    let phase: BattlePhase = 'input';

    // 敵を倒した場合は、残りの入力を待たずに勝利へ進む。
    if (isBattleOver(working)) {
      phase = allyWon(working) ? 'won' : 'lost';
      roundLog.push({ text: phase === 'won' ? '戦いに勝利した！' : '全滅してしまった……。' });
    } else if (livingOf(working, 'enemy').length > 0) {
      const logAfterPlayer = [...get().log, ...roundLog, { text: '敵のターン！' }];

      set({
        combatants: working,
        log: logAfterPlayer,
        planned: [],
        lastAction: action,
        phase: 'resolving',
      });

      scheduleEnemyTurn(() => {
        const state = get();
        if (state.phase !== 'resolving') return;
        const afterEnemy = cloneCombatants(state.combatants);
        const enemyResult = resolveEnemyCounter(afterEnemy);
        const enemyLog = enemyResult?.log ?? [{ text: '敵は様子をうかがっている。' }];
        let nextPhase: BattlePhase = 'input';

        if (isBattleOver(afterEnemy)) {
          nextPhase = allyWon(afterEnemy) ? 'won' : 'lost';
          enemyLog.push({ text: nextPhase === 'won' ? '戦いに勝利した！' : '全滅してしまった……。' });
          set({
            combatants: afterEnemy,
            log: [...state.log, ...enemyLog],
            planned: [],
            lastAction: enemyResult?.action ?? null,
            turnActorUids: livingOf(afterEnemy, 'ally').map((ally) => ally.uid),
            inputIndex: 0,
            phase: nextPhase,
          });
          return;
        }

        const nextIndexAfterEnemy = nextLivingTurnIndex(turnActorUids, afterEnemy, inputIndex + 1);
        const refreshedTurnActorUids = livingOf(afterEnemy, 'ally').map((ally) => ally.uid);
        const nextIndex = nextIndexAfterEnemy >= 0
          ? nextIndexAfterEnemy
          : nextLivingTurnIndex(refreshedTurnActorUids, afterEnemy, 0);

        set({
          combatants: afterEnemy,
          log: [...state.log, ...enemyLog],
          planned: [],
          lastAction: enemyResult?.action ?? null,
          turnActorUids: nextIndexAfterEnemy >= 0 ? state.turnActorUids : refreshedTurnActorUids,
          inputIndex: Math.max(0, nextIndex),
          phase: nextPhase,
        });
      });

      return true;
    }

    set({
      combatants: working,
      log: [...get().log, ...roundLog],
      planned: [],
      lastAction: action,
      turnActorUids: livingOf(working, 'ally').map((ally) => ally.uid),
      inputIndex: 0,
      phase,
    });
    return true;
  },

  reset: () =>
    set({ active: false, combatants: [], log: [], phase: 'input', turnActorUids: [], inputIndex: 0, planned: [], lastAction: null, enemyIds: [], isBoss: false }),
}));
