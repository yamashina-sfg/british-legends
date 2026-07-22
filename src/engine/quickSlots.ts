export const QUICK_SLOT_COUNT = 5;

export const DEFAULT_QUICK_SLOTS: (string | null)[] = [
  'recovery_potion',
  'high_recovery_potion',
  'phoenix_page',
  'elixir',
  null,
];

export function normalizeQuickSlots(slots?: (string | null)[]): (string | null)[] {
  return Array.from({ length: QUICK_SLOT_COUNT }, (_, index) => slots?.[index] ?? DEFAULT_QUICK_SLOTS[index] ?? null);
}

export function assignQuickSlot(slots: (string | null)[], index: number, itemId: string | null): (string | null)[] {
  const next = normalizeQuickSlots(slots);
  if (index < 0 || index >= QUICK_SLOT_COUNT) return next;
  // 別枠に登録済みなら、選択枠の内容と入れ替える（最終仕様 240704）。
  const previousIndex = itemId === null ? -1 : next.indexOf(itemId);
  const displaced = next[index];
  if (previousIndex >= 0 && previousIndex !== index) next[previousIndex] = displaced;
  next[index] = itemId;
  return next;
}
