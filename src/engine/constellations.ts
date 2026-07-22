import type { SaveData } from '@/types';

export type ConstellationPhase=0|1|2;
export function constellationPhase(save:SaveData,worldId:string):ConstellationPhase{return save.constellations?.[worldId]??0}
export function awakenConstellation(save:SaveData,worldId:string):SaveData{if(constellationPhase(save,worldId)>=1)return save;return{...save,constellations:{...(save.constellations??{}),[worldId]:1}}}
export function restoreConstellationStatue(save:SaveData,worldId:string):SaveData|null{if(constellationPhase(save,worldId)!==1||!save.progress.clearedWorldIds.includes(worldId))return null;return{...save,constellations:{...(save.constellations??{}),[worldId]:2},ownedBodySkins:[...new Set([...(save.ownedBodySkins??[]),worldId])]}}
export function unlockedConstellationIds(save:SaveData):string[]{return Object.entries(save.constellations??{}).filter(([,phase])=>phase===2).map(([id])=>id)}
