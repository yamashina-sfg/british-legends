export const CORE_WORLD_IDS = ['beowulf', 'hamlet', 'macbeth'] as const;

export type CoreWorldId = (typeof CORE_WORLD_IDS)[number];

export const CORE_WORLD_META: Record<CoreWorldId, {
  theme: string;
  period: string;
  year: string;
  shortIntro: string;
  trophy: string;
  bookColor: string;
  companion: {
    name: string;
    activity: string;
    line: string;
  };
}> = {
  beowulf: {
    theme: 'Heroism / 名誉と死',
    period: '古英語叙事詩',
    year: '8〜11世紀',
    shortIntro: '怪物と竜に挑む英雄叙事詩。力の奥にある責任を描く。',
    trophy: '竜の杯',
    bookColor: '#d4b45d',
    companion: {
      name: 'Beowulf',
      activity: '剣を磨いている',
      line: '英雄とは力だけではない。',
    },
  },
  hamlet: {
    theme: 'Indecision / 逡巡と決断',
    period: 'エリザベス朝悲劇',
    year: '1600年頃',
    shortIntro: '復讐を命じられた王子が、問い続けることで人間の深さを照らす。',
    trophy: '黒い羽根ペン',
    bookColor: '#7e78b8',
    companion: {
      name: 'Hamlet',
      activity: '本を読み、余白に問いを書いている',
      line: '決断とは、時に苦しみを伴う。',
    },
  },
  macbeth: {
    theme: 'Ambition / 野心と罪',
    period: 'ジャコビアン悲劇',
    year: '1606年頃',
    shortIntro: '予言に囚われた将軍が、王冠と罪に飲み込まれていく。',
    trophy: '血染めの王冠',
    bookColor: '#c6564f',
    companion: {
      name: 'Macbeth',
      activity: '暖炉を見つめ、火の奥の王冠を避けている',
      line: '野心は、人を変えてしまう。',
    },
  },
};

export const LONG_TERM_FOUNDATIONS = [
  { id: 'achievements', label: '実績', description: '物語修復、図鑑、戦闘条件の達成を記録する基盤。' },
  { id: 'completion', label: '完成率', description: '図鑑達成率と全作品コンプリート率を統合表示する基盤。' },
  { id: 'titles', label: '称号', description: 'プレイスタイルに応じた称号を付与できる基盤。' },
  { id: 'new-game-plus', label: 'New Game+', description: '修復済み記録を引き継ぐ周回設計の基盤。' },
  { id: 'challenge', label: 'Challenge', description: '制限付き再挑戦モードを追加するための基盤。' },
];
