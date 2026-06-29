import type { SaveData } from '@/types';
import { getCharacter, getWorld, WORLD_ORDER } from '@/data';
import { checkEvolution } from './evolution';

// ============================================================
// 「現在の目的」を セーブ状態から一意に導出する純粋ロジック。
// 全画面（Lodge / WorldMap / Dungeon）で同じ指針を出し、
// プレイヤーが「次に何をすべきか」で迷わないようにする。
// ============================================================

export type ObjectiveWhere = 'start' | 'lodge' | 'world' | 'done';

export interface Objective {
  /** 短い見出し */
  label: string;
  /** 一行の具体的な指示 */
  detail: string;
  /** どこへ向かうべきか */
  where: ObjectiveWhere;
  /** 関連ワールド */
  worldId?: string;
  /** 推奨レベルに対して育成不足か */
  underleveled?: boolean;
}

function topLevel(save: SaveData): number {
  return save.party.reduce((max, p) => Math.max(max, p.level), 1);
}

export function getObjective(save: SaveData): Objective {
  // 0. まだ仲間がいない（新規開始直後）
  if (save.party.length === 0) {
    return {
      label: '旅立ちの準備をしよう',
      detail: 'Bibliotheca Lodgeのポータルから、最初の物語世界へ出発しよう。',
      where: 'start',
    };
  }

  // 1. いま進化できる仲間がいる → Lodgeの机へ
  const evolvable = save.party.find((p) =>
    checkEvolution(p, getCharacter(p.characterId), save.inventory).canEvolve,
  );
  if (evolvable) {
    const ch = getCharacter(evolvable.characterId);
    return {
      label: `${ch.name}を進化させよう`,
      detail: `Lodgeの「進化の机」で ${ch.stageName} を次の姿へ導ける。`,
      where: 'lodge',
    };
  }

  // 2. 未クリアの解放済み世界を攻略する
  const unlocked = new Set(save.progress.unlockedWorldIds);
  const cleared = new Set(save.progress.clearedWorldIds);
  const activeId = WORLD_ORDER.find((id) => unlocked.has(id) && !cleared.has(id));
  if (activeId) {
    const w = getWorld(activeId);
    const lv = topLevel(save);
    const under = lv < w.recommendedLevel;
    return {
      label: `${w.title}の世界を修復せよ`,
      detail: under
        ? `推奨Lv${w.recommendedLevel}に対していまLv${lv}。道中の敵を倒して鍛えてから最深部へ。`
        : `${w.title}の最深部のボスを討ち、主人公を仲間に迎えよう。`,
      where: 'world',
      worldId: activeId,
      underleveled: under,
    };
  }

  // 3. すべて修復した
  return {
    label: 'すべての物語を修復した',
    detail: 'Bibliothecaに光が戻った。図鑑を埋め、仲間をさらに鍛えよう。',
    where: 'done',
  };
}
