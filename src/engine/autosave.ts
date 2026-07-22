import type { SaveData } from '@/types';

export const AUTOSAVE_INTERVAL_MS=5*60*1000;
export function advancePlayTime(save:SaveData,seconds:number,now=Date.now()):SaveData{
  return {...save,playTimeSec:(save.playTimeSec??0)+Math.max(0,Math.floor(seconds)),lastSavedAt:now};
}
