export interface StoreItem {
  id: string;
  name: string;
  price: number;
  skillId?: 'recovery_potion' | 'high_recovery_potion' | 'elixir';
  description: string;
}

export const STORE_ITEMS: Record<string, StoreItem> = {
  field_ration: { id: 'field_ration', name: '旅の糧', price: 7, skillId: 'recovery_potion', description: '戦闘中にHPを34回復する。安価な携帯食。' },
  recovery_potion: { id: 'recovery_potion', name: '回復薬', price: 12, skillId: 'recovery_potion', description: '戦闘中にHPを34回復する。' },
  high_recovery_potion: { id: 'high_recovery_potion', name: '上級回復薬', price: 36, skillId: 'high_recovery_potion', description: '戦闘中にHPを82回復する。' },
  elixir: { id: 'elixir', name: '生命の霊薬', price: 68, skillId: 'elixir', description: '戦闘中にHPを160回復する。' },
};
