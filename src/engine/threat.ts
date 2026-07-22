import type { Stats } from '@/types';

export type ThreatBand='purple'|'red'|'white'|'green'|'gray';
export const combatStatTotal=(stats:Stats)=>(stats.atk??0)+(stats.int??0)+(stats.def??0)+(stats.mdef??0)+(stats.spd??0)+(stats.luk??0);

/** 敵と操作キャラの6能力合計差を仕様書の±20/±10%帯へ分類する。 */
export function threatBand(enemy:Stats,player:Stats):ThreatBand{
  const base=Math.max(1,combatStatTotal(player));const ratio=combatStatTotal(enemy)/base;
  if(ratio>=1.2)return'purple';if(ratio>=1.1)return'red';if(ratio>=.9)return'white';if(ratio>=.8)return'green';return'gray';
}
