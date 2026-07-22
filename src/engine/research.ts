export interface EnemyResearchBenefit {
  level: number;
  expRate: number;
  goldRate: number;
  dropRateBonus: number;
  nextThreshold: number | null;
}

export const ENEMY_RESEARCH_THRESHOLDS = [1, 5, 15] as const;
export const DEFEAT_BONUS_UNIT=100;
export const DEFEAT_BONUS_MAX_COUNT=10000;
const DEFEAT_STATS=['atk','int','def','mdef','spd','luk'] as const;

export function enemyDefeatStatBonus(enemyId:string,defeatCount:number){const hash=[...enemyId].reduce((sum,char)=>sum+char.charCodeAt(0),0);const stat=DEFEAT_STATS[hash%DEFEAT_STATS.length];const value=Math.min(DEFEAT_BONUS_MAX_COUNT,Math.max(0,defeatCount));return{stat,value:Math.floor(value/DEFEAT_BONUS_UNIT),unit:DEFEAT_BONUS_UNIT,maxCount:DEFEAT_BONUS_MAX_COUNT};}

export function totalEnemyDefeatStats(defeatCounts:Record<string,number>){const stats={atk:0,int:0,def:0,mdef:0,spd:0,luk:0};for(const[id,count]of Object.entries(defeatCounts)){const bonus=enemyDefeatStatBonus(id,count);stats[bonus.stat]+=bonus.value;}return stats;}

/**
 * 同じ怪異と戦うほど記録が充実し、再戦時の報酬が増える。
 * dropRateBonus は倍率ではなく確率への加算値（0.05 = 5ポイント）。
 */
export function enemyResearchBenefit(defeatCount: number): EnemyResearchBenefit {
  const level = ENEMY_RESEARCH_THRESHOLDS.filter((threshold) => defeatCount >= threshold).length;
  return {
    level,
    expRate: level >= 1 ? 0.05 : 0,
    goldRate: level >= 2 ? 0.1 : 0,
    dropRateBonus: level >= 3 ? 0.05 : 0,
    nextThreshold: ENEMY_RESEARCH_THRESHOLDS.find((threshold) => defeatCount < threshold) ?? null,
  };
}

export function addDefeats(
  current: Record<string, number>,
  enemyIds: string[],
): Record<string, number> {
  const next = { ...current };
  for (const enemyId of enemyIds) next[enemyId] = (next[enemyId] ?? 0) + 1;
  return next;
}

export function crossedResearchLevels(before: number, after: number): number[] {
  return ENEMY_RESEARCH_THRESHOLDS
    .map((threshold, index) => ({ threshold, level: index + 1 }))
    .filter(({ threshold }) => before < threshold && after >= threshold)
    .map(({ level }) => level);
}
