import type { Skill } from '@/types';

export const SKILLS: Record<string, Skill> = {
  // --- 共通 ---
  attack_basic: {
    id: 'attack_basic',
    name: 'たたかう',
    type: 'attack',
    target: 'single',
    mpCost: 0,
    power: 1.0,
    description: '通常攻撃。',
  },
  recovery_potion: { id: 'recovery_potion', name: '回復薬', type: 'heal', target: 'self', mpCost: 0, power: 34, description: 'HPを34回復する。' },
  high_recovery_potion: { id: 'high_recovery_potion', name: '上級回復薬', type: 'heal', target: 'self', mpCost: 0, power: 82, description: 'HPを82回復する。' },

  // --- Beowulf 系 ---
  mighty_grip: {
    id: 'mighty_grip',
    name: 'グレンデルの組み手',
    type: 'attack',
    target: 'single',
    mpCost: 4,
    power: 1.6,
    description: '怪物の腕をもぎ取る豪腕の一撃。',
  },
  hero_roar: {
    id: 'hero_roar',
    name: '英雄の咆哮',
    type: 'buff',
    target: 'self',
    mpCost: 6,
    power: 8,
    description: '己を鼓舞し、攻撃力を高める。',
  },
  dragon_slash: {
    id: 'dragon_slash',
    name: 'ドラゴンスレイヤー',
    type: 'attack',
    target: 'all',
    mpCost: 12,
    power: 1.4,
    description: '竜をも討つ全体斬撃。',
  },

  // --- Hamlet 系 ---
  to_be_or_not: {
    id: 'to_be_or_not',
    name: '生か死か',
    type: 'attack',
    target: 'single',
    mpCost: 8,
    power: 2.0,
    description: '迷いを断ち切る痛烈な刺突。',
  },
  poison_blade: {
    id: 'poison_blade',
    name: '毒の刃',
    type: 'debuff',
    target: 'single',
    mpCost: 5,
    power: 6,
    description: '敵の防御を蝕む毒。',
  },

  // --- Macbeth 系 ---
  bloody_dagger: {
    id: 'bloody_dagger',
    name: '幻の短剣',
    type: 'attack',
    target: 'single',
    mpCost: 6,
    power: 1.8,
    description: '空に浮かぶ短剣を掴み、突き立てる。',
  },
  prophecy: {
    id: 'prophecy',
    name: '魔女の予言',
    type: 'debuff',
    target: 'all',
    mpCost: 10,
    power: 5,
    description: '敵全体の素早さを呪縛で奪う。',
  },

  // --- 敵スキル ---
  enemy_bite: {
    id: 'enemy_bite',
    name: '噛みつき',
    type: 'attack',
    target: 'single',
    mpCost: 0,
    power: 1.2,
    description: '鋭い牙で噛みつく。',
  },
  dragon_breath: {
    id: 'dragon_breath',
    name: '火炎のブレス',
    type: 'attack',
    target: 'all',
    mpCost: 0,
    power: 1.3,
    description: '灼熱の炎を吐く。',
  },
  curse_word: {
    id: 'curse_word',
    name: '呪詛',
    type: 'debuff',
    target: 'single',
    mpCost: 0,
    power: 4,
    description: '呪いの言葉で弱体化させる。',
  },
};
