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
