import type { World } from '@/types';

export const WORLDS: Record<string, World> = {
  beowulf: {
    id: 'beowulf',
    title: 'Beowulf',
    author: '作者不詳（古英語叙事詩）',
    era: '8〜11世紀',
    order: 1,
    description: '英雄ベオウルフが怪物グレンデルと竜に挑む、英語最古の英雄叙事詩。',
    dungeonId: 'dungeon_beowulf',
    rewardCharacterId: 'beowulf_young',
    recommendedLevel: 5,
  },
  hamlet: {
    id: 'hamlet',
    title: 'Hamlet',
    author: 'William Shakespeare',
    era: '1600年頃',
    order: 2,
    description: '父王を殺された王子ハムレットの、復讐と苦悩の悲劇。',
    dungeonId: 'dungeon_hamlet',
    rewardCharacterId: 'hamlet_prince',
    recommendedLevel: 10,
  },
  macbeth: {
    id: 'macbeth',
    title: 'Macbeth',
    author: 'William Shakespeare',
    era: '1606年頃',
    order: 3,
    description: '魔女の予言に導かれ、王位を簒奪した将軍の破滅を描く悲劇。',
    dungeonId: 'dungeon_macbeth',
    rewardCharacterId: 'macbeth_thane',
    recommendedLevel: 14,
  },
};

/** 解放順にソートした世界リスト */
export const WORLD_ORDER: string[] = Object.values(WORLDS)
  .sort((a, b) => a.order - b.order)
  .map((w) => w.id);
