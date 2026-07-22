import type { Element } from '@/types';

const WORLD_ELEMENTS: Record<string, Element> = {
  beowulf: 'fire', hamlet: 'water', macbeth: 'wind', crusoe: 'water',
  gulliver: 'wind', mariner: 'water', frankenstein: 'light', alice: 'light',
  holmes: 'wind', dracula: 'dark', dalloway: 'light', nineteen84: 'dark',
};

export const elementForWorld = (worldId: string): Element => WORLD_ELEMENTS[worldId] ?? 'light';

/** 炎→風→水→炎、光⇄闇の有利攻撃だけ1.2倍。苦手減衰はない。 */
export function attributeMultiplier(attacker?: Element, defender?: Element): number {
  if (!attacker || !defender) return 1;
  if (attacker === 'fire' && defender === 'wind') return 1.2;
  if (attacker === 'wind' && defender === 'water') return 1.2;
  if (attacker === 'water' && defender === 'fire') return 1.2;
  if (attacker === 'light' && defender === 'dark') return 1.2;
  if (attacker === 'dark' && defender === 'light') return 1.2;
  return 1;
}
