import type { CodexEntry } from '@/types';

// 文学要素の主な表現場所。倒した敵・加入したキャラ・入手素材が解放されると lore が読める。
export const CODEX: Record<string, CodexEntry> = {
  // --- 世界 ---
  codex_world_beowulf: {
    id: 'codex_world_beowulf',
    type: 'world',
    refId: 'beowulf',
    loreText:
      '『ベオウルフ』は現存する最古の英語による長編叙事詩。デーン人の王フロースガールの広間ヘオロットを襲う怪物グレンデルを、ゲアト族の英雄ベオウルフが討つ。物語は彼が老いて竜と相討ちになるまでを描く。',
  },
  codex_world_hamlet: {
    id: 'codex_world_hamlet',
    type: 'world',
    refId: 'hamlet',
    loreText:
      '『ハムレット』はシェイクスピア四大悲劇の一つ。デンマーク王子ハムレットは、父を毒殺し王位と母を奪った叔父クローディアスへの復讐に苦悩する。「生きるべきか、死ぬべきか」の独白で知られる。',
  },
  codex_world_macbeth: {
    id: 'codex_world_macbeth',
    type: 'world',
    refId: 'macbeth',
    loreText:
      '『マクベス』は四大悲劇で最も短い作品。将軍マクベスは三人の魔女の予言に唆され、王ダンカンを暗殺して王位に就くが、罪の意識と新たな予言に追い詰められ破滅する。',
  },

  // --- 物語の縦軸 ---
  codex_story_beowulf: {
    id: 'codex_story_beowulf',
    type: 'story',
    refId: 'beowulf',
    loreText: '竜の塚に残った黒い余白。Oblivionは怪物ではなく、物語が読まれなくなる瞬間そのものに巣食っている。',
  },
  codex_story_hamlet: {
    id: 'codex_story_hamlet',
    type: 'story',
    refId: 'hamlet',
    loreText: 'エルシノア城の封蝋に刻まれたThe Censorの印。彼らは問いを嫌い、悲劇から迷いと矛盾を削り取ろうとする。',
  },
  codex_story_macbeth: {
    id: 'codex_story_macbeth',
    type: 'story',
    refId: 'macbeth',
    loreText: '燃え残った最終ページ。Oblivionは結末だけでなく、そこへ至る選択と罪の重さを消そうとしている。',
  },

  // --- Lost Pages ---
  codex_page_beowulf_hero: {
    id: 'codex_page_beowulf_hero',
    type: 'story',
    refId: 'beowulf_lost_page_hero',
    loreText: 'Lost Page: 『ベオウルフ』の英雄は、強さだけでなく名誉と責任で語られる。怪物退治は共同体を守る誓いでもあった。',
  },
  codex_page_beowulf_heorot: {
    id: 'codex_page_beowulf_heorot',
    type: 'story',
    refId: 'beowulf_lost_page_heorot',
    loreText: 'Lost Page: ヘオロットは祝宴の広間であり、王と戦士が言葉と贈り物で絆を結ぶ場所。グレンデルはその共同体を襲った。',
  },
  codex_page_beowulf_dragon: {
    id: 'codex_page_beowulf_dragon',
    type: 'story',
    refId: 'beowulf_lost_page_dragon',
    loreText: 'Lost Page: 晩年の竜退治は勝利だけでは終わらない。英雄の死は、物語を次世代へ渡すための代償として描かれる。',
  },
  codex_page_hamlet_revenge: {
    id: 'codex_page_hamlet_revenge',
    type: 'story',
    refId: 'hamlet_lost_page_revenge',
    loreText: 'Lost Page: 『ハムレット』は復讐劇でありながら、すぐに行動できない人間の思考そのものを舞台に上げた悲劇。',
  },
  codex_page_hamlet_elsinore: {
    id: 'codex_page_hamlet_elsinore',
    type: 'story',
    refId: 'hamlet_lost_page_elsinore',
    loreText: 'Lost Page: エルシノア城では、家族・国家・舞台が重なり合う。城の霧は、誰が真実を語るのかを曖昧にする。',
  },
  codex_page_hamlet_question: {
    id: 'codex_page_hamlet_question',
    type: 'story',
    refId: 'hamlet_lost_page_question',
    loreText: 'Lost Page: 「生きるべきか」という問いは弱さではない。答えを急がないことが、人間の複雑さを守っている。',
  },
  codex_page_macbeth_prophecy: {
    id: 'codex_page_macbeth_prophecy',
    type: 'story',
    refId: 'macbeth_lost_page_prophecy',
    loreText: 'Lost Page: 『マクベス』の予言は運命そのものではない。聞いた者の野心が、言葉を破滅への道に変える。',
  },
  codex_page_macbeth_blood: {
    id: 'codex_page_macbeth_blood',
    type: 'story',
    refId: 'macbeth_lost_page_blood',
    loreText: 'Lost Page: 血は罪の記号として繰り返される。洗っても落ちない汚れは、良心がまだ消えていない証でもある。',
  },
  codex_page_macbeth_birnam: {
    id: 'codex_page_macbeth_birnam',
    type: 'story',
    refId: 'macbeth_lost_page_birnam',
    loreText: 'Lost Page: バーナムの森が動くという不可能な予言は、言葉の解釈が権力者の油断を崩す瞬間を示している。',
  },

  // --- 敵 ---
  codex_enemy_grendel: {
    id: 'codex_enemy_grendel',
    type: 'enemy',
    refId: 'grendel',
    loreText: 'カインの末裔とされる沼の怪物。夜ごとヘオロットを襲い、戦士たちを喰らった。ベオウルフに腕をもぎ取られて死ぬ。',
  },
  codex_enemy_dragon: {
    id: 'codex_enemy_dragon',
    type: 'enemy',
    refId: 'dragon',
    loreText: '黄金の財宝を守る古竜。盗まれた杯への怒りで国を焼く。ベオウルフは竜を討つも、自らも毒の傷で命を落とす。',
  },
  codex_enemy_ghost: {
    id: 'codex_enemy_ghost',
    type: 'enemy',
    refId: 'ghost',
    loreText: '深夜の城壁に現れる先王ハムレットの亡霊。我が弟クローディアスによる毒殺の真相を息子に告げ、復讐を促す。',
  },
  codex_enemy_claudius: {
    id: 'codex_enemy_claudius',
    type: 'enemy',
    refId: 'claudius',
    loreText: '兄王を毒殺し、王妃と王位を奪った簒奪者。巧みな弁舌で宮廷を支配するが、その罪は祈りでも拭えない。',
  },
  codex_enemy_witch: {
    id: 'codex_enemy_witch',
    type: 'enemy',
    refId: 'witch',
    loreText: '荒野に現れる三人の魔女。「いずれ王となるお方」という予言でマクベスの野心に火を点ける。',
  },
  codex_enemy_macbeths_fate: {
    id: 'codex_enemy_macbeths_fate',
    type: 'enemy',
    refId: 'macbeths_fate',
    loreText: '「女から生まれた者には殺せぬ」という予言を盾にしたマクベス自身の運命。だがその予言には抜け道があった。',
  },

  // --- 仲間 ---
  codex_char_beowulf: {
    id: 'codex_char_beowulf',
    type: 'character',
    refId: 'beowulf_young',
    loreText: 'ゲアト族の英雄。素手で怪物を引き裂く豪腕を持ち、名誉のために竜にも挑む。英語文学が生んだ最初の英雄。',
  },
  codex_char_hamlet: {
    id: 'codex_char_hamlet',
    type: 'character',
    refId: 'hamlet_prince',
    loreText: 'デンマークの王子。思索的で繊細だが、復讐への決意と逡巡の間で揺れ動く。近代的自我の原型とも言われる。',
  },
  codex_char_macbeth: {
    id: 'codex_char_macbeth',
    type: 'character',
    refId: 'macbeth_thane',
    loreText: '勇敢な将軍だったが、予言と妻の唆しにより王を弑逆する。野心と良心の相克に引き裂かれる悲劇の主人公。',
  },
};
