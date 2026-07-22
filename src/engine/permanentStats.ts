import type { SaveData, Stats } from '@/types';
import { manuscriptStats } from '@/data/manuscripts';
import { fishingLuck } from './fishing';
import { totalEnemyDefeatStats } from './research';

export function permanentStats(save: SaveData): Stats {
  const manuscript = manuscriptStats(save.storyFragments ?? []);
  const defeat=totalEnemyDefeatStats(save.defeatCounts??{});
  return { hp:manuscript.hp,mp:manuscript.mp,atk:manuscript.atk+defeat.atk,int:(manuscript.int??0)+defeat.int,def:manuscript.def+defeat.def,mdef:(manuscript.mdef??0)+defeat.mdef,spd:manuscript.spd+defeat.spd,luk:(manuscript.luk??0)+defeat.luk+fishingLuck(save.fishing?.count??0) };
}
