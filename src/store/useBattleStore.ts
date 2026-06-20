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
  chooseCommand: (a: Omit<BattleAction, 'actorUid'>) => void;
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

  chooseCommand: (a) => {
    const { combatants, planned, inputIndex, turnActorUids } = get();
    const actorUid = turnActorUids[inputIndex];
    const actor = combatants.find((combatant) => combatant.uid === actorUid && combatant.alive);
    if (!actor || planned.some((action) => action.actorUid === actor.uid)) return;

    const action: BattleAction = { ...a, actorUid: actor.uid };
    const nextPlanned = [...planned, action];
    const nextIndex = inputIndex + 1;

    // まだ入力すべき味方が残っている
    if (nextIndex < turnActorUids.length) {
      set({ planned: nextPlanned, inputIndex: nextIndex });
      return;
    }

    // 全味方の入力完了 → ラウンド解決
    set({ phase: 'resolving' });
    let working = resetRoundFlags(combatants).map((c) => ({ ...c, stats: { ...c.stats } }));

    // 敵の行動を決定
    const enemyActions = livingOf(working, 'enemy').map((e) => decideEnemyAction(e, working));
    const allActions = orderActions([...nextPlanned, ...enemyActions], working);

    const roundLog: LogEntry[] = [];
    for (const act of allActions) {
      if (isBattleOver(working)) break;
      roundLog.push(...resolveAction(working, act));
    }

    let phase: BattlePhase = 'input';
    if (isBattleOver(working)) {
      phase = allyWon(working) ? 'won' : 'lost';
      roundLog.push({ text: phase === 'won' ? '戦いに勝利した！' : '全滅してしまった……。' });
    }

    set({
      combatants: working,
      log: [...get().log, ...roundLog],
      planned: [],
      turnActorUids: livingOf(working, 'ally').map((ally) => ally.uid),
      inputIndex: 0,
      phase,
    });
  },

  reset: () =>
    set({ active: false, combatants: [], log: [], phase: 'input', turnActorUids: [], inputIndex: 0, planned: [], enemyIds: [], isBoss: false }),
}));
