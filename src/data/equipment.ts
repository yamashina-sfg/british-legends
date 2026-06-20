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
  iron_sword: { id: 'iron_sword', name: '鉄の剣', slot: 'weapon', price: 28, bonus: { atk: 5 }, worldId: 'beowulf', description: '鍛えられた鉄の剣。怪物の皮膚を断つ。' },
  steel_sword: { id: 'steel_sword', name: '鋼の剣', slot: 'weapon', price: 72, bonus: { atk: 10 }, worldId: 'beowulf', description: '怪物の牙にも負けない、重い鋼の剣。' },
  hero_sword: { id: 'hero_sword', name: '英雄の剣', slot: 'weapon', price: 148, bonus: { atk: 18, spd: 2 }, worldId: 'beowulf', description: '失われた物語を修復する者に応える剣。' },
  leather_armor: { id: 'leather_armor', name: '革鎧', slot: 'armor', price: 22, bonus: { def: 3 }, worldId: 'beowulf', description: '旅立ちの者のための、柔らかな鎧。' },
  iron_armor: { id: 'iron_armor', name: '鉄鎧', slot: 'armor', price: 62, bonus: { def: 8 }, worldId: 'beowulf', description: '鈍い鉄の光を放つ、堅い胸当て。' },
  hero_armor: { id: 'hero_armor', name: '英雄鎧', slot: 'armor', price: 132, bonus: { hp: 24, def: 13 }, worldId: 'beowulf', description: '英雄の誓いを宿す、古い鎧。' },
  wanderer_charm: { id: 'wanderer_charm', name: '旅人の護符', slot: 'accessory', price: 48, bonus: { hp: 12, mp: 4 }, worldId: 'beowulf', description: '遠い道を歩く者を守る、小さな護符。' },
};

export const getEquipment = (id: string) => EQUIPMENT[id];
