import type { OwnedPet, SaveData, Stats } from '@/types';
import { getPet, petForEnemy } from '@/data/pets';

export const PET_LEVEL_MAX = 99;
export const PET_ENHANCE_MAX = 10;
export const PET_EVOLVE_LEVEL = 30;
export const PET_EXP_RATE = 0.3;
export const PET_SLOT_COUNT = 3;

export function petEvolutionProgress(owned: OwnedPet): { originRank: 1 | 2 | 3; stars: number; slots: number } {
  const currentRank = getPet(owned.petId).rank;
  const originRank = owned.originRank ?? Math.max(1, currentRank - (owned.rarityStars ?? currentRank - 1)) as 1 | 2 | 3;
  const slots = Math.max(0, 3 - originRank);
  return { originRank, slots, stars: Math.min(slots, Math.max(0, owned.rarityStars ?? currentRank - originRank)) };
}

export function petStats(owned: OwnedPet): Stats {
  const pet = getPet(owned.petId);
  const lv = Math.max(0, owned.level - 1);
  const boost = owned.enhance;
  const value = (key: keyof Stats) => (pet.baseStats[key] ?? 0) + (pet.growth[key] ?? 0) * lv + boost;
  return { hp:value('hp'),mp:value('mp'),atk:value('atk'),int:value('int'),def:value('def'),mdef:value('mdef'),spd:value('spd'),luk:value('luk') };
}

export function petExpForLevel(level: number, scale: number): number { return Math.floor(Math.max(0, level - 1) ** 2 * 24 * scale); }

export function gainPetExp(owned: OwnedPet, amount: number): OwnedPet {
  const pet = getPet(owned.petId);
  const exp = owned.exp + Math.max(0, amount);
  let level = owned.level;
  while (level < PET_LEVEL_MAX && exp >= petExpForLevel(level + 1, pet.expScale)) level += 1;
  const next = { ...owned, exp, level };
  return { ...next, currentHp: level > owned.level ? petStats(next).hp : Math.min(next.currentHp, petStats(next).hp) };
}

export function awardSummonedPetExp(save: SaveData, heroExp: number): SaveData {
  const active = new Set((save.petSlots ?? []).filter(Boolean));
  return { ...save, pets:(save.pets ?? []).map((pet) => active.has(pet.uid) ? gainPetExp(pet, Math.floor(heroExp * PET_EXP_RATE)) : pet) };
}

export function tryCapturePet(save: SaveData, enemyIds: string[], roll = Math.random()): { save: SaveData; captured?: OwnedPet } {
  if (roll >= 0.05) return { save };
  const definition = enemyIds.map(petForEnemy).find(Boolean);
  if (!definition || (save.pets ?? []).some((pet) => pet.petId === definition.id)) return { save };
  const captured: OwnedPet = { uid:`pet_${definition.id}_${Date.now()}`, petId:definition.id, level:1, exp:0, enhance:0, currentHp:definition.baseStats.hp, originRank:definition.rank, rarityStars:0 };
  return { save:{ ...save, pets:[...(save.pets ?? []),captured] }, captured };
}

export function trainPet(save: SaveData, uid: string): SaveData | null {
  const owned = (save.pets ?? []).find((pet) => pet.uid === uid);
  if (!owned || owned.enhance >= PET_ENHANCE_MAX) return null;
  const definition = getPet(owned.petId); const cost = owned.enhance + 1;
  if ((save.inventory[definition.enhanceMaterialId] ?? 0) < cost) return null;
  return { ...save, inventory:{...save.inventory,[definition.enhanceMaterialId]:(save.inventory[definition.enhanceMaterialId]??0)-cost}, pets:(save.pets??[]).map((pet)=>pet.uid===uid?{...pet,enhance:pet.enhance+1}:pet) };
}

export function evolvePet(save: SaveData, uid: string): SaveData | null {
  const owned = (save.pets ?? []).find((pet) => pet.uid === uid); if (!owned) return null;
  const definition = getPet(owned.petId); if (!definition.evolveTo || owned.level < PET_EVOLVE_LEVEL) return null;
  if ((save.pets ?? []).some((pet)=>pet.petId===definition.evolveTo)) return null;
  const evolvedDef=getPet(definition.evolveTo); const cost=500*definition.rank; if(save.gold<cost)return null;
  const progress=petEvolutionProgress(owned);
  const evolved:OwnedPet={...owned,petId:evolvedDef.id,level:1,exp:0,enhance:0,currentHp:evolvedDef.baseStats.hp,originRank:progress.originRank,rarityStars:Math.min(progress.slots,progress.stars+1)};
  return {...save,gold:save.gold-cost,pets:(save.pets??[]).map((pet)=>pet.uid===uid?evolved:pet)};
}

export function setPetSlot(save: SaveData, slot: number, uid: string | null): SaveData {
  const slots=Array.from({length:PET_SLOT_COUNT},(_,i)=>save.petSlots?.[i]??null);
  if(uid){const old=slots.indexOf(uid);if(old>=0)slots[old]=slots[slot];} slots[slot]=uid;
  return {...save,petSlots:slots};
}
