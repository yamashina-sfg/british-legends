import type { Stats } from '@/types';

export type EquipmentSlot = 'weapon' | 'armor' | 'accessory';

export interface Equipment {
  id: string;
  name: string;
  slot: EquipmentSlot;
  price: number;
  bonus: Partial<Stats>;
  worldId: string;
  description: string;
}

export const EQUIPMENT: Record<string, Equipment> = {
  hunting_spear: { id: 'hunting_spear', name: '狩人の槍', slot: 'weapon', price: 14, bonus: { atk: 3, spd: 1 }, worldId: 'beowulf', description: '森で鍛えた軽い槍。先手を取りやすい。' },
  iron_sword: { id: 'iron_sword', name: '鉄の剣', slot: 'weapon', price: 28, bonus: { atk: 5 }, worldId: 'beowulf', description: '鍛えられた鉄の剣。怪物の皮膚を断つ。' },
  steel_sword: { id: 'steel_sword', name: '鋼の剣', slot: 'weapon', price: 72, bonus: { atk: 10 }, worldId: 'beowulf', description: '怪物の牙にも負けない、重い鋼の剣。' },
  runic_blade: { id: 'runic_blade', name: 'ルーンの刃', slot: 'weapon', price: 108, bonus: { atk: 14, mp: 4 }, worldId: 'beowulf', description: '古英語の刻印が、技の力を引き出す。' },
  hero_sword: { id: 'hero_sword', name: '英雄の剣', slot: 'weapon', price: 148, bonus: { atk: 18, spd: 2 }, worldId: 'beowulf', description: '失われた物語を修復する者に応える剣。' },
  geat_greatsword: { id: 'geat_greatsword', name: 'ゲアト族の大剣', slot: 'weapon', price: 220, bonus: { atk: 25, def: 2 }, worldId: 'beowulf', description: '竜の巣へ挑むための、両手持ちの大剣。' },
  traveler_cloak: { id: 'traveler_cloak', name: '旅人の外套', slot: 'armor', price: 12, bonus: { def: 2, spd: 1 }, worldId: 'beowulf', description: '雨と冷気をしのぐ、薄手の外套。' },
  leather_armor: { id: 'leather_armor', name: '革鎧', slot: 'armor', price: 22, bonus: { def: 3 }, worldId: 'beowulf', description: '旅立ちの者のための、柔らかな鎧。' },
  iron_armor: { id: 'iron_armor', name: '鉄鎧', slot: 'armor', price: 62, bonus: { def: 8 }, worldId: 'beowulf', description: '鈍い鉄の光を放つ、堅い胸当て。' },
  scale_mail: { id: 'scale_mail', name: '鱗の胸当て', slot: 'armor', price: 94, bonus: { hp: 12, def: 10 }, worldId: 'beowulf', description: '水棲の怪物の鱗を重ねた胸当て。' },
  hero_armor: { id: 'hero_armor', name: '英雄鎧', slot: 'armor', price: 132, bonus: { hp: 24, def: 13 }, worldId: 'beowulf', description: '英雄の誓いを宿す、古い鎧。' },
  rune_plate: { id: 'rune_plate', name: 'ルーンの鎧', slot: 'armor', price: 190, bonus: { hp: 30, mp: 5, def: 16 }, worldId: 'beowulf', description: '言葉そのものを刻んだ、重厚な胸甲。' },
  scholar_seal: { id: 'scholar_seal', name: '書記の印章', slot: 'accessory', price: 24, bonus: { mp: 8 }, worldId: 'beowulf', description: '失われた文節を読むための、古い印章。' },
  wanderer_charm: { id: 'wanderer_charm', name: '旅人の護符', slot: 'accessory', price: 48, bonus: { hp: 12, mp: 4 }, worldId: 'beowulf', description: '遠い道を歩く者を守る、小さな護符。' },
  wolf_token: { id: 'wolf_token', name: '狼の牙飾り', slot: 'accessory', price: 78, bonus: { hp: 18, atk: 3 }, worldId: 'beowulf', description: '夜の森を越えた者に渡される牙飾り。' },
  king_ring: { id: 'king_ring', name: '王の指輪', slot: 'accessory', price: 160, bonus: { hp: 28, mp: 10, def: 4 }, worldId: 'beowulf', description: '物語を取り戻した王の、静かな加護。' },
  grendel_fang_blade: { id: 'grendel_fang_blade', name: 'グレンデル牙剣', slot: 'weapon', price: 0, bonus: { atk: 22, spd: 4 }, worldId: 'beowulf', description: '隠し部屋で見つかる怪物牙の刃。通常攻撃が重く速い。' },
  dragon_heart_mail: { id: 'dragon_heart_mail', name: '竜心の鎧', slot: 'armor', price: 0, bonus: { hp: 42, def: 18, mp: 8 }, worldId: 'beowulf', description: 'Dragon Heartで熱を循環させる伝説の鎧。' },
  royal_ring: { id: 'royal_ring', name: 'Royal Ring', slot: 'accessory', price: 0, bonus: { mp: 18, def: 5, spd: 3 }, worldId: 'hamlet', description: '毒と謀略を見抜く王家の指輪。Claudiusの希少戦利品。' },
  glass_rapier: { id: 'glass_rapier', name: '割れた硝子のレイピア', slot: 'weapon', price: 0, bonus: { atk: 16, spd: 8 }, worldId: 'hamlet', description: '割れたステンドグラスの光を宿した細剣。' },
  cursed_crown: { id: 'cursed_crown', name: 'Cursed Crown', slot: 'accessory', price: 0, bonus: { atk: 8, mp: 16, spd: 4 }, worldId: 'macbeth', description: '野心を力に変える王冠。HPが削れた戦いで真価を発揮する。' },
  witchfire_dagger: { id: 'witchfire_dagger', name: '魔女火の短剣', slot: 'weapon', price: 0, bonus: { atk: 18, mp: 8, spd: 5 }, worldId: 'macbeth', description: '雷雨の祭壇で燃える青い火を鍛え込んだ短剣。' },
};

export const getEquipment = (id: string) => EQUIPMENT[id];
