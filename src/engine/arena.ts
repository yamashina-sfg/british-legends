import type { SaveData } from '@/types';

export const ARENA_ENTRY_FEE=20;
export const ARENA_WAVE_LIMIT_MS=60_000;
export const ARENA_MAX_WAVE=10;
export const ARENA_WAVES:Record<number,string[]>={1:['ghost'],2:['ghost','royal_guard'],3:['grendel'],4:['witch','banquos_ghost'],5:['grendels_mother'],6:['lilliput_soldier','giant_bird'],7:['wild_beast','pirate'],8:['failed_experiment','electric_spirit'],9:['vampire','zombie'],10:['dragon']};

export interface ArenaReward { gold:number; itemId?:string; equipmentId?:string; label:string }
export function arenaReward(wave:number,first:boolean):ArenaReward{
  if(first&&wave===5)return{gold:120,equipmentId:'iron_sword',label:'初回宝箱: 鉄の剣'};
  if(first&&wave===10)return{gold:300,equipmentId:'hero_sword',label:'初回宝箱: 英雄の剣'};
  return{gold:20+wave*8,itemId:wave%5===0?'high_recovery_potion':'recovery_potion',label:`WAVE ${wave} 宝箱`};
}
export function applyArenaReward(save:SaveData,wave:number):{save:SaveData;reward:ArenaReward}{
  const arena=save.arena??{bestWave:0,selectedStartWave:1,bestTimes:{},claimedFirstWaves:[],attempts:0};
  const first=!arena.claimedFirstWaves.includes(wave);const reward=arenaReward(wave,first);
  const next={...save,gold:save.gold+reward.gold,arena:{...arena,bestWave:Math.max(arena.bestWave,wave),claimedFirstWaves:first?[...arena.claimedFirstWaves,wave]:arena.claimedFirstWaves}};
  if(reward.itemId)next.items={...next.items,[reward.itemId]:(next.items[reward.itemId]??0)+1};
  if(reward.equipmentId)next.equipmentInventory=[...new Set([...(next.equipmentInventory??[]),reward.equipmentId])];
  return{save:next,reward};
}
