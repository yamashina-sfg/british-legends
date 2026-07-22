import { describe, expect, it } from 'vitest';
import { assignQuickSlot, normalizeQuickSlots } from './quickSlots';

describe('quick slots', () => {
  it('migrates missing and short saves to four slots', () => {
    expect(normalizeQuickSlots()).toHaveLength(4);
    expect(normalizeQuickSlots(['field_ration'])).toEqual(['field_ration', 'high_recovery_potion', 'phoenix_page', 'elixir']);
  });

  it('moves duplicate items instead of registering them twice', () => {
    expect(assignQuickSlot(['a', 'b', 'c', 'd'], 2, 'a')).toEqual([null, 'b', 'a', 'd']);
  });
});
