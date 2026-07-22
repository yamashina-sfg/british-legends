import type { Stats } from '@/types';

export interface PetDefinition {
  id: string; name: string; sourceEnemyId: string; rank: 1 | 2 | 3; element: 'fire' | 'wind' | 'water' | 'light' | 'dark';
  baseStats: Stats; growth: Stats; skillIds: string[]; enhanceMaterialId: string; evolveTo?: string; expScale: number;
}

export const PETS: Record<string, PetDefinition> = {
  star_fox: { id:'star_fox', name:'星詠みの白狐', sourceEnemyId:'ghost', rank:3, element:'light', baseStats:{hp:55,mp:30,atk:12,int:20,def:10,mdef:18,spd:19,luk:8}, growth:{hp:5,mp:3,atk:2,int:4,def:2,mdef:3,spd:2,luk:1}, skillIds:['familiar_hymn','curse_word','story_barrier'], enhanceMaterialId:'ghost_fragment', expScale:2 },
  marsh_imp: { id:'marsh_imp', name:'沼頁の幼鬼', sourceEnemyId:'grendel', rank:1, element:'dark', baseStats:{hp:35,mp:8,atk:8,int:2,def:5,mdef:3,spd:7,luk:1}, growth:{hp:4,mp:1,atk:2,int:1,def:1,mdef:1,spd:1,luk:0}, skillIds:['enemy_bite'], enhanceMaterialId:'monster_fang', evolveTo:'marsh_guardian', expScale:1 },
  marsh_guardian: { id:'marsh_guardian', name:'沼頁の守護鬼', sourceEnemyId:'grendel', rank:2, element:'dark', baseStats:{hp:70,mp:15,atk:18,int:5,def:12,mdef:8,spd:11,luk:2}, growth:{hp:6,mp:1,atk:3,int:1,def:2,mdef:1,spd:1,luk:0}, skillIds:['enemy_bite','grendel_crush'], enhanceMaterialId:'grendel_claw', expScale:1.5 },
  archive_wisp: { id:'archive_wisp', name:'書庫の鬼火', sourceEnemyId:'ghost', rank:1, element:'light', baseStats:{hp:24,mp:20,atk:3,int:12,def:3,mdef:10,spd:12,luk:3}, growth:{hp:3,mp:2,atk:1,int:3,def:1,mdef:2,spd:2,luk:0}, skillIds:['curse_word'], enhanceMaterialId:'ghost_fragment', evolveTo:'royal_wisp', expScale:1.2 },
  royal_wisp: { id:'royal_wisp', name:'王冠の鬼火', sourceEnemyId:'ghost', rank:2, element:'light', baseStats:{hp:48,mp:35,atk:6,int:24,def:7,mdef:18,spd:18,luk:5}, growth:{hp:4,mp:3,atk:1,int:4,def:1,mdef:3,spd:2,luk:1}, skillIds:['curse_word','poisoned_cup'], enhanceMaterialId:'broken_crown', expScale:1.8 },
  prophecy_raven: { id:'prophecy_raven', name:'予言の鴉', sourceEnemyId:'witch', rank:1, element:'wind', baseStats:{hp:28,mp:16,atk:7,int:10,def:4,mdef:7,spd:16,luk:4}, growth:{hp:3,mp:2,atk:1,int:2,def:1,mdef:1,spd:3,luk:1}, skillIds:['witch_curse'], enhanceMaterialId:'witch_scroll', expScale:1.4 },
};

export const getPet = (id: string) => PETS[id];
export const petForEnemy = (enemyId: string) => Object.values(PETS).find((pet) => pet.rank === 1 && pet.sourceEnemyId === enemyId);
