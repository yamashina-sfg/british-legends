import type { SaveData } from '@/types';

export const ARENA_ENTRY_FEE=20;
export const ARENA_WAVE_LIMIT_MS=60_000;
export const ARENA_MAX_WAVE=10;
export const ARENA_WAVES:Record<number,string[]>={1:['ghost'],2:['ghost','royal_guard'],3:['grendel'],4:['witch','banquos_ghost'],5:['grendels_mother'],6:['lilliput_soldier','giant_bird'],7:['wild_beast','pirate'],8:['failed_experiment','electric_spirit'],9:['vampire','zombie'],10:['dragon']};
export interface ArenaRankingEntry{rank:number;name:string;timeMs:number;wave:number;isPlayer:boolean;partyLabel:string}
const RIVAL_NAMES=['The Green Knight','Lady Macbeth','Artful Dodger','Ishmael','Mina Harker','Friday','White Rabbit','Inspector Lestrade','Clarissa','Winston'];
export function arenaRanking(wave:number,playerName:string,playerTime?:number):ArenaRankingEntry[]{const rivals=Array.from({length:20},(_,index)=>({name:RIVAL_NAMES[index%RIVAL_NAMES.length]+(index>=10?` ${index-9}`:''),timeMs:9200+wave*1450+index*1730,wave,isPlayer:false,partyLabel:index%3===0?'Knight / Scholar / Familiar':'Hero / Wanderer'}));const rows=playerTime?[...rivals,{name:playerName,timeMs:playerTime,wave,isPlayer:true,partyLabel:'British Legends Party'}]:rivals;return rows.sort((a,b)=>a.timeMs-b.timeMs).map((entry,index)=>({...entry,rank:index+1}))}
export function nearbyArenaRanking(rows:ArenaRankingEntry[],radius=2):ArenaRankingEntry[]{const index=rows.findIndex(row=>row.isPlayer);if(index<0)return rows.slice(0,5);return rows.slice(Math.max(0,index-radius),index+radius+1)}

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
