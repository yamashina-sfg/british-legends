import type { Stats } from '@/types';

export interface ManuscriptFragment {
  id: string;
  worldId: string;
  name: string;
  hint: string;
}

export const MANUSCRIPT_FRAGMENTS: ManuscriptFragment[] = [
  { id: 'heorot-song', worldId: 'beowulf', name: 'ヘオロットの歌', hint: 'Beowulfの宝箱を調べる' },
  { id: 'mere-descent', worldId: 'beowulf', name: '沼底への降下', hint: 'Beowulfの深層を探索する' },
  { id: 'dragon-cup', worldId: 'beowulf', name: '竜塚の杯', hint: 'Beowulfの最終層を探索する' },
  { id: 'dragon-funeral', worldId: 'beowulf', name: '英雄の葬送', hint: 'Dragonを討伐する' },
  { id: 'ghost-record', worldId: 'hamlet', name: '亡霊の証言', hint: 'Hamletの宝箱を調べる' },
  { id: 'players-note', worldId: 'hamlet', name: '旅役者の覚書', hint: 'Hamletの深層を探索する' },
  { id: 'poisoned-cup', worldId: 'hamlet', name: '毒杯の記録', hint: 'Hamletの最終層を探索する' },
  { id: 'elsinore-confession', worldId: 'hamlet', name: 'エルシノアの告白', hint: 'Claudiusを討伐する' },
  { id: 'witch-prophecy', worldId: 'macbeth', name: '魔女の予言', hint: 'Macbethの宝箱を調べる' },
  { id: 'duncan-blood', worldId: 'macbeth', name: '消えない血痕', hint: 'Macbethの深層を探索する' },
  { id: 'birnam-branch', worldId: 'macbeth', name: 'バーナムの枝', hint: 'Macbethの最終層を探索する' },
  { id: 'birnam-comes', worldId: 'macbeth', name: '森が動く夜', hint: "Macbeth's Fateを討伐する" },
];

export const MANUSCRIPT_BLESSING_THRESHOLDS = [3, 6, 9, 12] as const;

export function fragmentsForWorld(worldId: string): ManuscriptFragment[] {
  return MANUSCRIPT_FRAGMENTS.filter((fragment) => fragment.worldId === worldId);
}

export function manuscriptStats(fragmentIds: string[]): Stats {
  const uniqueCount = new Set(fragmentIds).size;
  return {
    hp: (uniqueCount >= 3 ? 10 : 0) + (uniqueCount >= 12 ? 20 : 0),
    mp: uniqueCount >= 12 ? 5 : 0,
    atk: uniqueCount >= 6 ? 2 : 0,
    def: uniqueCount >= 9 ? 2 : 0,
    spd: 0,
  };
}

export function manuscriptBlessingLevel(fragmentIds: string[]): number {
  const count = new Set(fragmentIds).size;
  return MANUSCRIPT_BLESSING_THRESHOLDS.filter((threshold) => count >= threshold).length;
}
