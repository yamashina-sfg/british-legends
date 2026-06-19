import { SKILLS } from './skills';
import { MATERIALS } from './materials';
import { ENEMIES } from './enemies';
import { CHARACTERS } from './characters';
import { DUNGEONS } from './dungeons';
import { WORLDS } from './worlds';
import { CODEX } from './codex';

export { SKILLS, MATERIALS, ENEMIES, CHARACTERS, DUNGEONS, WORLDS, CODEX };
export { WORLD_ORDER } from './worlds';

// --- ルックアップヘルパ（存在しないIDは例外で早期検知） ---
export const getSkill = (id: string) => {
  const s = SKILLS[id];
  if (!s) throw new Error(`Unknown skill: ${id}`);
  return s;
};
export const getMaterial = (id: string) => {
  const m = MATERIALS[id];
  if (!m) throw new Error(`Unknown material: ${id}`);
  return m;
};
export const getEnemy = (id: string) => {
  const e = ENEMIES[id];
  if (!e) throw new Error(`Unknown enemy: ${id}`);
  return e;
};
export const getCharacter = (id: string) => {
  const c = CHARACTERS[id];
  if (!c) throw new Error(`Unknown character: ${id}`);
  return c;
};
export const getDungeon = (id: string) => {
  const d = DUNGEONS[id];
  if (!d) throw new Error(`Unknown dungeon: ${id}`);
  return d;
};
export const getWorld = (id: string) => {
  const w = WORLDS[id];
  if (!w) throw new Error(`Unknown world: ${id}`);
  return w;
};
