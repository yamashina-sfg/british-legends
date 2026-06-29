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
  dungeon_gulliver: {
    id: 'dungeon_gulliver', worldId: 'gulliver', name: 'リリパット王国',
    floors: [
      { name: '第一層：小人たちの浜辺', nodes: [{ type: 'battle', enemyIds: ['lilliput_soldier'] }, { type: 'battle', enemyIds: ['giant_bird'] }, { type: 'event', eventText: '無数の細い縄が、巨人の手足を縛りつけている。' }] },
      { name: '第二層：宮廷の庭', nodes: [{ type: 'battle', enemyIds: ['gulliver_royal_guard'] }, { type: 'battle', enemyIds: ['lilliput_soldier', 'gulliver_royal_guard'] }] },
      { name: '玉座の間', nodes: [{ type: 'boss', enemyIds: ['emperor_lilliput'] }] },
    ],
  },
  dungeon_crusoe: {
    id: 'dungeon_crusoe', worldId: 'crusoe', name: '無人島',
    floors: [
      { name: '第一層：漂着海岸', nodes: [{ type: 'battle', enemyIds: ['wild_beast'] }, { type: 'battle', enemyIds: ['pirate'] }, { type: 'event', eventText: '潮に濡れた木片が、まだ船の匂いを残している。' }] },
      { name: '第二層：島の奥地', nodes: [{ type: 'battle', enemyIds: ['cannibal'] }, { type: 'battle', enemyIds: ['wild_beast', 'cannibal'] }] },
      { name: '海賊の入り江', nodes: [{ type: 'boss', enemyIds: ['pirate_captain'] }] },
    ],
  },
  dungeon_mariner: {
    id: 'dungeon_mariner', worldId: 'mariner', name: '呪われた海',
    floors: [
      { name: '第一層：凪いだ海', nodes: [{ type: 'battle', enemyIds: ['cursed_bird'] }, { type: 'battle', enemyIds: ['ghost_sailor'] }, { type: 'event', eventText: '風は止み、船だけが罪の重さで軋む。' }] },
      { name: '第二層：幽霊船の影', nodes: [{ type: 'battle', enemyIds: ['sea_spirit'] }, { type: 'battle', enemyIds: ['ghost_sailor', 'sea_spirit'] }] },
      { name: '死の船', nodes: [{ type: 'boss', enemyIds: ['death_ship'] }] },
    ],
  },
  dungeon_frankenstein: {
    id: 'dungeon_frankenstein', worldId: 'frankenstein', name: '研究所',
    floors: [
      { name: '第一層：解剖室', nodes: [{ type: 'battle', enemyIds: ['failed_experiment'] }, { type: 'battle', enemyIds: ['laboratory_guard'] }, { type: 'event', eventText: '机上の手記には、生命の秘密を暴こうとする執念が滲む。' }] },
      { name: '第二層：稲妻の塔', nodes: [{ type: 'battle', enemyIds: ['electric_spirit'] }, { type: 'battle', enemyIds: ['failed_experiment', 'electric_spirit'] }] },
      { name: '創造の間', nodes: [{ type: 'boss', enemyIds: ['creature'] }] },
    ],
  },
  dungeon_alice: {
    id: 'dungeon_alice', worldId: 'alice', name: 'Wonderland',
    floors: [
      { name: '第一層：涙の池', nodes: [{ type: 'battle', enemyIds: ['white_rabbit'] }, { type: 'battle', enemyIds: ['card_soldier'] }, { type: 'event', eventText: '小さくなったり大きくなったり、常識だけが置き去りになる。' }] },
      { name: '第二層：狂ったお茶会', nodes: [{ type: 'battle', enemyIds: ['mad_hatter'] }, { type: 'battle', enemyIds: ['card_soldier', 'mad_hatter'] }] },
      { name: '女王の法廷', nodes: [{ type: 'boss', enemyIds: ['queen_hearts'] }] },
    ],
  },
  dungeon_holmes: {
    id: 'dungeon_holmes', worldId: 'holmes', name: '霧のロンドン',
    floors: [
      { name: '第一層：ベイカー街', nodes: [{ type: 'battle', enemyIds: ['thug'] }, { type: 'battle', enemyIds: ['criminal'] }, { type: 'event', eventText: '霧の中、足跡だけが事件の輪郭を語っている。' }] },
      { name: '第二層：裏通り', nodes: [{ type: 'battle', enemyIds: ['assassin'] }, { type: 'battle', enemyIds: ['thug', 'assassin'] }] },
      { name: '滝へ至る道', nodes: [{ type: 'boss', enemyIds: ['moriarty'] }] },
    ],
  },
  dungeon_dracula: {
    id: 'dungeon_dracula', worldId: 'dracula', name: 'ドラキュラ城',
    floors: [
      { name: '第一層：墓地', nodes: [{ type: 'battle', enemyIds: ['bat'] }, { type: 'battle', enemyIds: ['zombie'] }, { type: 'event', eventText: '赤い月の下、城門は血のように濡れている。' }] },
      { name: '第二層：吸血鬼の回廊', nodes: [{ type: 'battle', enemyIds: ['vampire'] }, { type: 'battle', enemyIds: ['zombie', 'vampire'] }] },
      { name: '伯爵の玉座', nodes: [{ type: 'boss', enemyIds: ['dracula'] }] },
    ],
  },
  dungeon_dalloway: {
    id: 'dungeon_dalloway', worldId: 'dalloway', name: 'ロンドン',
    floors: [
      { name: '第一層：朝の街路', nodes: [{ type: 'battle', enemyIds: ['shadow'] }, { type: 'battle', enemyIds: ['anxiety'] }, { type: 'event', eventText: '時計の音が、現在と過去を同時に鳴らしている。' }] },
      { name: '第二層：記憶の公園', nodes: [{ type: 'battle', enemyIds: ['nightmare'] }, { type: 'battle', enemyIds: ['shadow', 'nightmare'] }] },
      { name: '内面の部屋', nodes: [{ type: 'boss', enemyIds: ['memories'] }] },
    ],
  },
  dungeon_nineteen84: {
    id: 'dungeon_nineteen84', worldId: 'nineteen84', name: 'Oceania',
    floors: [
      { name: '第一層：監視街区', nodes: [{ type: 'battle', enemyIds: ['thought_police'] }, { type: 'battle', enemyIds: ['spy_drone'] }, { type: 'event', eventText: '壁の向こうから、見られているという感覚だけが残る。' }] },
      { name: '第二層：真理省', nodes: [{ type: 'battle', enemyIds: ['officer'] }, { type: 'battle', enemyIds: ['thought_police', 'officer'] }] },
      { name: '101号室', nodes: [{ type: 'boss', enemyIds: ['big_brother'] }] },
    ],
  },
};
