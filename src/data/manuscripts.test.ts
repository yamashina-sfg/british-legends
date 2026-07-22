import { describe, expect, it } from 'vitest';
import { manuscriptBlessingLevel, manuscriptStats } from './manuscripts';

describe('manuscript album', () => {
  it('applies cumulative blessings for unique fragments', () => {
    expect(manuscriptStats(['a', 'b', 'c'])).toMatchObject({ hp: 10, atk: 0 });
    expect(manuscriptStats(['a', 'b', 'c', 'd', 'e', 'f'])).toMatchObject({ hp: 10, atk: 2 });
    expect(manuscriptStats(Array.from({ length: 12 }, (_, i) => `f${i}`))).toEqual({ hp: 30, mp: 5, atk: 2, def: 2, spd: 0 });
  });

  it('does not count duplicate fragment ids twice', () => {
    expect(manuscriptBlessingLevel(['a', 'a', 'b'])).toBe(0);
  });
});
