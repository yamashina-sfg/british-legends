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

  start: (party: OwnedCharacter[], enemyIds: string[], isBoss: boolean) => void;
  livingAllies: () => Combatant[];
  livingEnemies: () => Combatant[];
  currentActor: () => Combatant | undefined;
  /** 表示中の仲間だけが送れる。古いクリックや二重送信は false で拒否する。 */
  chooseCommand: (actorUid: string, a: Omit<BattleAction, 'actorUid'>) => boolean;
  reset: () => void;
}

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

  start: (party, enemyIds, isBoss) => {
    const allies = party.filter((p) => p.currentHp > 0).map(combatantFromOwned);
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
    const working = (inputIndex === 0 ? resetRoundFlags(combatants) : combatants)
      .map((combatant) => ({ ...combatant, stats: { ...combatant.stats } }));
    const action: BattleAction = { ...a, actorUid: actor.uid };
    const roundLog = resolveAction(working, action);

    let phase: BattlePhase = 'input';
    const nextIndex = inputIndex + 1;

    // 敵を倒した場合は、残りの入力を待たずに勝利へ進む。
    if (isBattleOver(working)) {
      phase = allyWon(working) ? 'won' : 'lost';
      roundLog.push({ text: phase === 'won' ? '戦いに勝利した！' : '全滅してしまった……。' });
    } else if (nextIndex < turnActorUids.length) {
      set({
        combatants: working,
        log: [...get().log, ...roundLog],
        planned: [],
        inputIndex: nextIndex,
        phase,
      });
      return true;
    } else {
      // 味方全員が行動した後だけ、敵側のターンを解決する。
      phase = 'resolving';
      const enemyActions = orderActions(livingOf(working, 'enemy').map((enemy) => decideEnemyAction(enemy, working)), working);
      for (const enemyAction of enemyActions) {
        if (isBattleOver(working)) break;
        roundLog.push(...resolveAction(working, enemyAction));
      }
      if (isBattleOver(working)) {
        phase = allyWon(working) ? 'won' : 'lost';
        roundLog.push({ text: phase === 'won' ? '戦いに勝利した！' : '全滅してしまった……。' });
      } else {
        phase = 'input';
      }
    }

    set({
      combatants: working,
      log: [...get().log, ...roundLog],
      planned: [],
      turnActorUids: livingOf(working, 'ally').map((ally) => ally.uid),
      inputIndex: 0,
      phase,
    });
    return true;
  },

  reset: () =>
    set({ active: false, combatants: [], log: [], phase: 'input', turnActorUids: [], inputIndex: 0, planned: [], enemyIds: [], isBoss: false }),
}));
