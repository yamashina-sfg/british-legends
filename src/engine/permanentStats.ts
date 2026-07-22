import type { SaveData, Stats } from '@/types';
import { manuscriptStats } from '@/data/manuscripts';
import { fishingLuck } from './fishing';

export function permanentStats(save: SaveData): Stats {
  const manuscript = manuscriptStats(save.storyFragments ?? []);
  return { ...manuscript, luk: (manuscript.luk ?? 0) + fishingLuck(save.fishing?.count ?? 0) };
}
