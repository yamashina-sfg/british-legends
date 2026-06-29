import type { Character, TragicFlaw } from '@/types';

const HEROISM: TragicFlaw = {
  id: 'heroism',
  theme: 'Heroism',
  icon: '⚔',
  description: '英雄とは、勝っている者ではなく、倒れかけても前へ出る者である。',
  tragicFlaw: {
    name: '栄光への渇き',
    description: 'HP30%以下で攻撃力+40%、防御-20%。追い詰められるほど英雄譚は燃え上がる。',
    effects: [
      { type: 'statMultiplier', stat: 'atk', multiplier: 1.4, when: 'hpBelowRatio', thresholdRatio: 0.3 },
      { type: 'statMultiplier', stat: 'def', multiplier: 0.8, when: 'hpBelowRatio', thresholdRatio: 0.3 },
    ],
  },
  passiveAbility: {
    name: 'Heroic Spirit',
    description: '瀕死になると英雄の精神が覚醒し、守りを捨てて攻め抜く。',
    effects: [],
  },
  activeSkill: {
    skillId: 'last_stand',
    name: 'Last Stand',
    description: '大ダメージ。HPが少ないほど威力が上がる。',
    effects: [{ type: 'damageByMissingHp', maxBonusMultiplier: 1.5 }],
  },
  battleTrait: {
    name: 'Monster-Slayer',
    description: 'ボス戦で攻撃力と防御力が上昇する。',
    effects: [
      { type: 'statMultiplier', stat: 'atk', multiplier: 1.15, when: 'bossBattle' },
      { type: 'statMultiplier', stat: 'def', multiplier: 1.1, when: 'bossBattle' },
    ],
  },
  awakeningCondition: {
    name: 'HP30%以下',
    description: '最後まで戦い抜く英雄として覚醒する。',
  },
};

const INDECISION: TragicFlaw = {
  id: 'indecision',
  theme: 'Indecision',
  icon: '?',
  description: '逡巡は弱さではない。長く考えた一撃ほど、運命を深く刺す。',
  meter: { label: 'Resolve', max: 100 },
  tragicFlaw: {
    name: '逡巡',
    description: '攻撃せず待機するとResolveが増える。最大時、次の攻撃が2.5倍になる。',
    effects: [{ type: 'meterOnCommand', command: 'defend', amount: 50 }],
  },
  passiveAbility: {
    name: 'Thinking',
    description: '防御/待機でResolve+50。最大になると次の攻撃で全消費し、大きく威力上昇。',
    effects: [{ type: 'consumeMeterForDamage', minMultiplier: 2, maxMultiplier: 2.5, requireFullMeter: true }],
  },
  activeSkill: {
    skillId: 'to_be_or_not',
    name: 'To Be, Or Not To Be',
    description: 'Resolveを全消費する超高火力攻撃。考え抜くほど威力上昇。',
    effects: [{ type: 'consumeMeterForDamage', minMultiplier: 1.2, maxMultiplier: 3 }],
  },
  battleTrait: {
    name: '考えるほど強くなる',
    description: '行動しないターンが、次の決断の威力になる。',
    effects: [],
  },
  awakeningCondition: {
    name: 'Resolve最大',
    description: '逡巡が決意へ変わり、次の攻撃が強化される。',
  },
};

const AMBITION: TragicFlaw = {
  id: 'ambition',
  theme: 'Ambition',
  icon: '♛',
  description: '王冠は血を求める。代償を払うほど、野心は刃を鋭くする。',
  tragicFlaw: {
    name: '野心',
    description: '自身のHPを消費するたび、戦闘中の攻撃力が上昇する。',
    effects: [],
  },
  passiveAbility: {
    name: 'Ambition',
    description: 'HPを累計10%消費するごとに攻撃力+12%。最大+72%。',
    effects: [{ type: 'atkMultiplierByHpSpent', stepRatio: 0.1, multiplierPerStep: 0.12, maxMultiplier: 1.72 }],
  },
  activeSkill: {
    skillId: 'bloody_crown',
    name: 'Bloody Crown',
    description: '自身のHP20%を消費し、超高火力攻撃を放つ。',
    effects: [{ type: 'hpCost', ratio: 0.2 }],
  },
  battleTrait: {
    name: 'リスクを負うほど強い',
    description: '自ら傷を負う選択が、そのまま攻撃性能へ変わる。',
    effects: [],
  },
  awakeningCondition: {
    name: 'HP消費',
    description: '血を払うほど王冠への執着が増す。',
  },
};

// 進化段階ごとに1レコード。進化＝OwnedCharacter.characterId を nextCharacterId に差し替えるだけ。
export const CHARACTERS: Record<string, Character> = {
  // ===== Beowulf 進化ツリー =====
  beowulf_young: {
    id: 'beowulf_young',
    name: 'Beowulf',
    worldId: 'beowulf',
    spriteId: 'beowulf_young',
    stageName: 'Young Beowulf',
    baseStats: { hp: 80, mp: 12, atk: 20, def: 12, spd: 10 },
    growthRate: { hp: 12, mp: 2, atk: 4, def: 2, spd: 1 },
    skillIds: ['attack_basic', 'mighty_grip'],
    tragicFlaw: HEROISM,
    evolution: {
      requiredLevel: 5,
      requiredMaterials: [{ materialId: 'grendel_claw', qty: 3 }],
      nextCharacterId: 'beowulf_hero',
    },
  },
  beowulf_hero: {
    id: 'beowulf_hero',
    name: 'Beowulf',
    worldId: 'beowulf',
    spriteId: 'beowulf_hero',
    stageName: 'Hero Beowulf',
    baseStats: { hp: 140, mp: 24, atk: 32, def: 20, spd: 13 },
    growthRate: { hp: 16, mp: 3, atk: 5, def: 3, spd: 1 },
    skillIds: ['attack_basic', 'mighty_grip', 'hero_roar'],
    tragicFlaw: HEROISM,
    evolution: {
      requiredLevel: 12,
      requiredMaterials: [
        { materialId: 'monster_fang', qty: 5 },
        { materialId: 'dragon_scale', qty: 1 },
      ],
      nextCharacterId: 'beowulf_slayer',
    },
  },
  beowulf_slayer: {
    id: 'beowulf_slayer',
    name: 'Beowulf',
    worldId: 'beowulf',
    spriteId: 'beowulf_slayer',
    stageName: 'Dragon Slayer',
    baseStats: { hp: 220, mp: 40, atk: 48, def: 30, spd: 16 },
    growthRate: { hp: 20, mp: 4, atk: 6, def: 4, spd: 2 },
    skillIds: ['attack_basic', 'mighty_grip', 'hero_roar', 'dragon_slash'],
    tragicFlaw: HEROISM,
    evolution: {
      requiredLevel: 20,
      requiredMaterials: [{ materialId: 'dragon_scale', qty: 5 }],
      nextCharacterId: 'beowulf_king',
    },
  },
  beowulf_king: {
    id: 'beowulf_king',
    name: 'Beowulf',
    worldId: 'beowulf',
    spriteId: 'beowulf_king',
    stageName: 'Legendary King',
    baseStats: { hp: 340, mp: 60, atk: 66, def: 42, spd: 20 },
    growthRate: { hp: 26, mp: 5, atk: 8, def: 5, spd: 2 },
    skillIds: ['attack_basic', 'mighty_grip', 'hero_roar', 'dragon_slash'],
    tragicFlaw: HEROISM,
    evolution: null,
  },

  // ===== Hamlet 進化ツリー =====
  hamlet_prince: {
    id: 'hamlet_prince',
    name: 'Hamlet',
    worldId: 'hamlet',
    spriteId: 'hamlet_prince',
    stageName: 'Prince Hamlet',
    baseStats: { hp: 70, mp: 24, atk: 18, def: 10, spd: 14 },
    growthRate: { hp: 10, mp: 4, atk: 4, def: 2, spd: 2 },
    skillIds: ['attack_basic', 'poison_blade'],
    tragicFlaw: INDECISION,
    evolution: {
      requiredLevel: 8,
      requiredMaterials: [{ materialId: 'ghost_fragment', qty: 4 }],
      nextCharacterId: 'hamlet_avenger',
    },
  },
  hamlet_avenger: {
    id: 'hamlet_avenger',
    name: 'Hamlet',
    worldId: 'hamlet',
    spriteId: 'hamlet_avenger',
    stageName: 'Avenger Hamlet',
    baseStats: { hp: 130, mp: 44, atk: 30, def: 18, spd: 19 },
    growthRate: { hp: 14, mp: 5, atk: 5, def: 3, spd: 2 },
    skillIds: ['attack_basic', 'poison_blade', 'to_be_or_not'],
    tragicFlaw: INDECISION,
    evolution: {
      requiredLevel: 16,
      requiredMaterials: [
        { materialId: 'broken_crown', qty: 3 },
        { materialId: 'memory_of_revenge', qty: 2 },
      ],
      nextCharacterId: 'hamlet_tragic',
    },
  },
  hamlet_tragic: {
    id: 'hamlet_tragic',
    name: 'Hamlet',
    worldId: 'hamlet',
    spriteId: 'hamlet_tragic',
    stageName: 'Tragic Prince',
    baseStats: { hp: 210, mp: 70, atk: 46, def: 28, spd: 24 },
    growthRate: { hp: 18, mp: 6, atk: 7, def: 4, spd: 3 },
    skillIds: ['attack_basic', 'poison_blade', 'to_be_or_not'],
    tragicFlaw: INDECISION,
    evolution: null,
  },

  // ===== Macbeth 進化ツリー =====
  macbeth_thane: {
    id: 'macbeth_thane',
    name: 'Macbeth',
    worldId: 'macbeth',
    spriteId: 'macbeth_thane',
    stageName: 'Thane Macbeth',
    baseStats: { hp: 90, mp: 18, atk: 22, def: 14, spd: 11 },
    growthRate: { hp: 13, mp: 3, atk: 5, def: 3, spd: 1 },
    skillIds: ['attack_basic', 'bloody_dagger'],
    tragicFlaw: AMBITION,
    evolution: {
      requiredLevel: 8,
      requiredMaterials: [{ materialId: 'witch_scroll', qty: 4 }],
      nextCharacterId: 'macbeth_king',
    },
  },
  macbeth_king: {
    id: 'macbeth_king',
    name: 'Macbeth',
    worldId: 'macbeth',
    spriteId: 'macbeth_king',
    stageName: 'King Macbeth',
    baseStats: { hp: 160, mp: 36, atk: 36, def: 22, spd: 14 },
    growthRate: { hp: 17, mp: 4, atk: 6, def: 4, spd: 2 },
    skillIds: ['attack_basic', 'bloody_dagger', 'prophecy'],
    tragicFlaw: AMBITION,
    evolution: {
      requiredLevel: 16,
      requiredMaterials: [
        { materialId: 'blood_relic', qty: 4 },
        { materialId: 'cursed_crown', qty: 1 },
      ],
      nextCharacterId: 'macbeth_tyrant',
    },
  },
  macbeth_tyrant: {
    id: 'macbeth_tyrant',
    name: 'Macbeth',
    worldId: 'macbeth',
    spriteId: 'macbeth_tyrant',
    stageName: 'Cursed Tyrant',
    baseStats: { hp: 250, mp: 56, atk: 54, def: 34, spd: 18 },
    growthRate: { hp: 22, mp: 5, atk: 8, def: 5, spd: 2 },
    skillIds: ['attack_basic', 'bloody_dagger', 'prophecy'],
    tragicFlaw: AMBITION,
    evolution: null,
  },
};
