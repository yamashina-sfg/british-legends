import type { Material } from '@/types';

export const MATERIALS: Record<string, Material> = {
  // --- Beowulf ---
  grendel_claw: {
    id: 'grendel_claw',
    name: 'Grendel Claw',
    worldId: 'beowulf',
    description: '怪物グレンデルの鉤爪。英雄が引きちぎった証。',
    iconId: 'grendel_claw',
  },
  monster_fang: {
    id: 'monster_fang',
    name: 'Monster Fang',
    worldId: 'beowulf',
    description: '沼に潜む怪物の牙。まだ熱を帯びている。',
    iconId: 'monster_fang',
  },
  dragon_scale: {
    id: 'dragon_scale',
    name: 'Dragon Scale',
    worldId: 'beowulf',
    description: '黄金を守る古竜の鱗。鋼鉄より硬い。',
    iconId: 'dragon_scale',
  },
  grendels_fang: {
    id: 'grendels_fang',
    name: "Grendel's Fang",
    worldId: 'beowulf',
    description: 'グレンデルの奥牙。怪物の力を宿す希少な進化素材。',
    iconId: 'grendels_fang',
  },
  dragon_heart: {
    id: 'dragon_heart',
    name: 'Dragon Heart',
    worldId: 'beowulf',
    description: '古竜の胸で燃え続けた核。最上位装備の鍛造に使う伝説素材。',
    iconId: 'dragon_heart',
  },

  // --- Hamlet ---
  ghost_fragment: {
    id: 'ghost_fragment',
    name: 'Ghost Fragment',
    worldId: 'hamlet',
    description: '亡き王の亡霊が残した冷たい欠片。',
    iconId: 'ghost_fragment',
  },
  broken_crown: {
    id: 'broken_crown',
    name: 'Broken Crown',
    worldId: 'hamlet',
    description: '簒奪された王冠の破片。罪の重みを宿す。',
    iconId: 'broken_crown',
  },
  memory_of_revenge: {
    id: 'memory_of_revenge',
    name: 'Memory of Revenge',
    worldId: 'hamlet',
    description: '果たされぬ復讐の記憶。手にすると胸が痛む。',
    iconId: 'memory_of_revenge',
  },
  royal_ring: {
    id: 'royal_ring',
    name: 'Royal Ring',
    worldId: 'hamlet',
    description: 'クローディアスが隠し持った王家の指輪。罪深い権威を封じた希少素材。',
    iconId: 'royal_ring',
  },

  // --- Macbeth ---
  witch_scroll: {
    id: 'witch_scroll',
    name: 'Witch Scroll',
    worldId: 'macbeth',
    description: '三人の魔女が記した予言の巻物。',
    iconId: 'witch_scroll',
  },
  blood_relic: {
    id: 'blood_relic',
    name: 'Blood Relic',
    worldId: 'macbeth',
    description: '決して洗い落とせぬ血の遺物。',
    iconId: 'blood_relic',
  },
  cursed_crown: {
    id: 'cursed_crown',
    name: 'Cursed Crown',
    worldId: 'macbeth',
    description: '野心の果てに掴んだ呪われた王冠。',
    iconId: 'cursed_crown',
  },
};
