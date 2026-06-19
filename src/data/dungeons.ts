import type { Dungeon } from '@/types';

export const DUNGEONS: Record<string, Dungeon> = {
  // ===== Beowulf：ヘオロットの広間 → 沼 → 竜の塚 =====
  dungeon_beowulf: {
    id: 'dungeon_beowulf',
    worldId: 'beowulf',
    name: 'ヘオロットの広間',
    floors: [
      {
        name: '第一層：宴の広間',
        nodes: [
          { type: 'battle', enemyIds: ['grendel'] },
          { type: 'battle', enemyIds: ['grendel'] },
          { type: 'event', eventText: '広間の奥から、怪物の咆哮が響いてくる……。' },
          { type: 'battle', enemyIds: ['grendel', 'grendel'] },
        ],
      },
      {
        name: '第二層：底なし沼',
        nodes: [
          { type: 'battle', enemyIds: ['grendels_mother'] },
          { type: 'battle', enemyIds: ['grendel', 'grendels_mother'] },
          { type: 'event', eventText: '沼の奥に、黄金の輝きが見える。竜の塚だ。' },
        ],
      },
      {
        name: '最深部：竜の塚',
        nodes: [{ type: 'boss', enemyIds: ['dragon'] }],
      },
    ],
  },

  // ===== Hamlet：エルシノア城 =====
  dungeon_hamlet: {
    id: 'dungeon_hamlet',
    worldId: 'hamlet',
    name: 'エルシノア城',
    floors: [
      {
        name: '第一層：城壁',
        nodes: [
          { type: 'battle', enemyIds: ['ghost'] },
          { type: 'battle', enemyIds: ['royal_guard'] },
          { type: 'event', eventText: '亡き王の亡霊が、復讐を囁く……。' },
          { type: 'battle', enemyIds: ['ghost', 'royal_guard'] },
        ],
      },
      {
        name: '第二層：謁見の間',
        nodes: [
          { type: 'battle', enemyIds: ['royal_guard', 'royal_guard'] },
          { type: 'battle', enemyIds: ['ghost', 'ghost'] },
        ],
      },
      {
        name: '玉座の間',
        nodes: [{ type: 'boss', enemyIds: ['claudius'] }],
      },
    ],
  },

  // ===== Macbeth：インヴァネス城 =====
  dungeon_macbeth: {
    id: 'dungeon_macbeth',
    worldId: 'macbeth',
    name: 'インヴァネス城',
    floors: [
      {
        name: '第一層：荒野',
        nodes: [
          { type: 'battle', enemyIds: ['witch'] },
          { type: 'event', eventText: '「めでたしめでたし、いずれ王となるお方！」魔女の声がこだまする。' },
          { type: 'battle', enemyIds: ['soldier'] },
          { type: 'battle', enemyIds: ['witch', 'soldier'] },
        ],
      },
      {
        name: '第二層：城内',
        nodes: [
          { type: 'battle', enemyIds: ['banquos_ghost'] },
          { type: 'battle', enemyIds: ['soldier', 'soldier'] },
          { type: 'event', eventText: '消えぬ血の染み。手を洗っても、洗っても……。' },
        ],
      },
      {
        name: '運命の間',
        nodes: [{ type: 'boss', enemyIds: ['macbeths_fate'] }],
      },
    ],
  },
};
