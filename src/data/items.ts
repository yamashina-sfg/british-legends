export interface StoreItem {
  id: string;
  name: string;
  price: number;
  skillId?: 'recovery_potion' | 'high_recovery_potion';
  description: string;
}

export const STORE_ITEMS: Record<string, StoreItem> = {
  recovery_potion: { id: 'recovery_potion', name: '回復薬', price: 12, skillId: 'recovery_potion', description: '戦闘中にHPを34回復する。' },
  high_recovery_potion: { id: 'high_recovery_potion', name: '上級回復薬', price: 36, skillId: 'high_recovery_potion', description: '戦闘中にHPを82回復する。' },
  revival_draught: { id: 'revival_draught', name: '蘇生薬', price: 70, description: '戦闘不能の仲間を蘇生する。MVPでは所持のみ可能。' },
};
