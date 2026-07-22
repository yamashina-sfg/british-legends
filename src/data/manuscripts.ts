import type { Stats } from '@/types';

export interface ManuscriptFragment { id:string;worldId:string;name:string;hint:string;pieceNumber:number }

const NAMED:Record<string,Array<[string,string,string]>>={
  beowulf:[['heorot-song','ヘオロットの歌','Beowulfの宝箱を調べる'],['mere-descent','沼底への降下','Beowulfの深層を探索する'],['dragon-cup','竜塚の杯','Beowulfの最終層を探索する'],['dragon-funeral','英雄の葬送','Dragonを討伐する']],
  hamlet:[['ghost-record','亡霊の証言','Hamletの宝箱を調べる'],['players-note','旅役者の覚書','Hamletの深層を探索する'],['poisoned-cup','毒杯の記録','Hamletの最終層を探索する'],['elsinore-confession','エルシノアの告白','Claudiusを討伐する']],
  macbeth:[['witch-prophecy','魔女の予言','Macbethの宝箱を調べる'],['duncan-blood','消えない血痕','Macbethの深層を探索する'],['birnam-branch','バーナムの枝','Macbethの最終層を探索する'],['birnam-comes','森が動く夜',"Macbeth's Fateを討伐する"]],
};

export const ALBUM_WORLD_IDS=['beowulf','hamlet','macbeth'] as const;
export const MANUSCRIPT_FRAGMENTS:ManuscriptFragment[]=ALBUM_WORLD_IDS.flatMap((worldId)=>Array.from({length:16},(_,index)=>{
  const named=NAMED[worldId][index];return named?{id:named[0],worldId,name:named[1],hint:named[2],pieceNumber:index+1}:{id:`${worldId}-folio-${String(index+1).padStart(2,'0')}`,worldId,name:`復元写本 ${index+1}`,hint:'魔物・宝箱・釣りから低確率で発見',pieceNumber:index+1};
}));

export const MANUSCRIPT_BLESSING_THRESHOLDS=[4,8,12,16] as const;
export function fragmentsForWorld(worldId:string):ManuscriptFragment[]{return MANUSCRIPT_FRAGMENTS.filter((fragment)=>fragment.worldId===worldId)}
export function manuscriptWorldLevel(fragmentIds:string[],worldId:string):number{const owned=new Set(fragmentIds);const count=fragmentsForWorld(worldId).filter((fragment)=>owned.has(fragment.id)).length;return MANUSCRIPT_BLESSING_THRESHOLDS.filter((threshold)=>count>=threshold).length}
export function manuscriptStats(fragmentIds:string[]):Stats {
  const levels=ALBUM_WORLD_IDS.map((worldId)=>manuscriptWorldLevel(fragmentIds,worldId));const milestones=levels.reduce((sum,value)=>sum+value,0);const completes=levels.filter((value)=>value===4).length;
  return{hp:milestones*10+completes*20,mp:completes*5,atk:levels.filter((value)=>value>=2).length*2+completes*2,int:completes*2,def:levels.filter((value)=>value>=3).length*2+completes*2,mdef:completes*2,spd:completes*2,luk:completes*2};
}
export function manuscriptBlessingLevel(fragmentIds:string[]):number{return ALBUM_WORLD_IDS.reduce((sum,worldId)=>sum+manuscriptWorldLevel(fragmentIds,worldId),0)}
