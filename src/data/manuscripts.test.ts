import { describe,expect,it } from 'vitest';
import { fragmentsForWorld,manuscriptBlessingLevel,manuscriptStats,manuscriptWorldLevel } from './manuscripts';
describe('16分割写本アルバム',()=>{
  const ids=fragmentsForWorld('beowulf').map((fragment)=>fragment.id);
  it('各巻16マスを持ち、4/8/12/16片で累積バフを解放する',()=>{expect(ids).toHaveLength(16);expect(manuscriptWorldLevel(ids.slice(0,4),'beowulf')).toBe(1);expect(manuscriptStats(ids.slice(0,8))).toMatchObject({hp:20,atk:2});expect(manuscriptStats(ids)).toEqual({hp:60,mp:5,atk:4,int:2,def:4,mdef:2,spd:2,luk:2});});
  it('重複ピースはランクへ数えない',()=>{expect(manuscriptBlessingLevel([ids[0],ids[0]])).toBe(0);});
});
