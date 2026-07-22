export const QUICK_SLOT_COUNT = 4;

export const DEFAULT_QUICK_SLOTS: (string | null)[] = [
  'recovery_potion',
  'high_recovery_potion',
  'phoenix_page',
  'elixir',
];

export function normalizeQuickSlots(slots?: (string | null)[]): (string | null)[] {
  return Array.from({ length: QUICK_SLOT_COUNT }, (_, index) => slots?.[index] ?? DEFAULT_QUICK_SLOTS[index] ?? null);
}

export function assignQuickSlot(slots: (string | null)[], index: number, itemId: string | null): (string | null)[] {
  const next = normalizeQuickSlots(slots);
  if (index < 0 || index >= QUICK_SLOT_COUNT) return next;
  // 同じアイテムを登録した場合は古い枠を空け、1アイテム1枠に保つ。
  for (let i = 0; i < next.length; i += 1) if (next[i] === itemId) next[i] = null;
  next[index] = itemId;
  return next;
}
