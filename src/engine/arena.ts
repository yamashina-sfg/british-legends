import type { SaveData } from '@/types';

export const ARENA_ENTRY_FEE=20;
export const ARENA_WAVE_LIMIT_MS=5*60_000;
export const ARENA_MAX_WAVE=10;
export const ARENA_WAVES:Record<number,string[]>={1:['ghost'],2:['ghost','royal_guard'],3:['grendel'],4:['witch','banquos_ghost'],5:['grendels_mother'],6:['lilliput_soldier','giant_bird'],7:['wild_beast','pirate'],8:['failed_experiment','electric_spirit'],9:['vampire','zombie'],10:['dragon']};
export interface ArenaRankingEntry{rank:number;name:string;timeMs:number;wave:number;isPlayer:boolean;partyLabel:string}
export function arenaTimerTone(remainingSeconds:number):'normal'|'warning'|'danger'{return remainingSeconds<=30?'danger':remainingSeconds<=90?'warning':'normal'}
export function formatArenaTime(remainingSeconds:number):string{const seconds=Math.max(0,Math.ceil(remainingSeconds));return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`}
const RIVAL_NAMES=['Gawain','Morgana','Dodger','Ishmael','Mina','Friday','Rabbit','Lestrade','Clarissa','Winston'];
export function arenaRanking(wave:number,playerName:string,playerTime?:number):ArenaRankingEntry[]{const rivals=Array.from({length:1000},(_,index)=>{const tier=Math.floor(index/90);const rivalWave=Math.max(1,10-tier);return{name:`${RIVAL_NAMES[index%RIVAL_NAMES.length]}-${String(index+1).padStart(3,'0')}`,timeMs:18_000+(index%90)*1_137+tier*4_000,wave:rivalWave,isPlayer:false,partyLabel:index%3===0?'Knight / Scholar / Familiar':'Hero / Wanderer'}});const rows=playerTime?[...rivals,{name:playerName,timeMs:playerTime,wave,isPlayer:true,partyLabel:'British Legends Party'}]:rivals;const sorted=rows.sort((a,b)=>b.wave-a.wave||a.timeMs-b.timeMs);let lastRank=0;return sorted.map((entry,index)=>{if(index===0||entry.wave!==sorted[index-1].wave||entry.timeMs!==sorted[index-1].timeMs)lastRank=index+1;return{...entry,rank:lastRank}})}
export function nearbyArenaRanking(rows:ArenaRankingEntry[],radius=2):ArenaRankingEntry[]{const index=rows.findIndex(row=>row.isPlayer);if(index<0)return rows.slice(0,5);return rows.slice(Math.max(0,index-radius),index+radius+1)}
export function arenaRankingPage(rows:ArenaRankingEntry[],page:number):ArenaRankingEntry[]{const safe=Math.max(0,Math.min(9,Math.trunc(page)));return rows.filter(row=>!row.isPlayer||row.rank<=1000).slice(safe*100,safe*100+100)}
const BLOCKED_NICKNAME_FRAGMENTS=['ばか','あほ','死ね','ころす','fuck','shit'];
export function validateArenaNickname(value:string):{ok:boolean;value:string;message:string}{const name=value.trim();const length=Array.from(name).length;if(length<1||length>6)return{ok:false,value:name,message:'ニックネームは1〜6文字で入力してください。'};if(!/^[\p{L}\p{N}_ー]+$/u.test(name)||BLOCKED_NICKNAME_FRAGMENTS.some(word=>name.toLowerCase().includes(word)))return{ok:false,value:name,message:'このニックネームは使えません。別の名前を入力してください。'};return{ok:true,value:name,message:'登録しました。'}}

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
