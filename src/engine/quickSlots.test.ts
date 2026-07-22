import { describe, expect, it } from 'vitest';
import { assignQuickSlot, normalizeQuickSlots } from './quickSlots';

describe('quick slots', () => {
  it('migrates missing and short saves to five slots', () => {
    expect(normalizeQuickSlots()).toHaveLength(5);
    expect(normalizeQuickSlots(['field_ration'])).toEqual(['field_ration', null, null, null, null]);
  });

  it('swaps items when assigning one that is already in another slot', () => {
    expect(assignQuickSlot(['a', 'b', 'c', 'd', null], 2, 'a')).toEqual(['c', 'b', 'a', 'd', null]);
  });
});
