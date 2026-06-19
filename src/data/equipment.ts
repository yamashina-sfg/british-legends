import type { Stats } from '@/types';

export type EquipmentSlot = 'weapon' | 'armor';

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
  mead_shield: { id: 'mead_shield', name: '蜜酒の盾', slot: 'armor', price: 24, bonus: { def: 4 }, worldId: 'beowulf', description: 'ヘオロットの宴で使われた頑丈な盾。' },
  runic_blade: { id: 'runic_blade', name: 'ルーンの剣', slot: 'weapon', price: 54, bonus: { atk: 9, mp: 3 }, worldId: 'beowulf', description: '古い文字が刻まれた英雄の剣。' },
};

export const getEquipment = (id: string) => EQUIPMENT[id];
