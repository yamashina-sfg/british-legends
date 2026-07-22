import { describe,expect,it } from 'vitest';
import { createNewSave,createOwnedCharacter } from './save';
import { grantSandboxDiamonds,purchaseProduct,useTimedBoost } from './commerce';

describe('commerce',()=>{
  it('grants sandbox diamonds once and records purchases',()=>{let save={...createNewSave(1),party:[createOwnedCharacter('beowulf_young')]};save=grantSandboxDiamonds(save);save=grantSandboxDiamonds(save);expect(save.commerce?.diamonds).toBe(500);const result=purchaseProduct(save,'status_5');expect(result.ok).toBe(true);expect(result.save.commerce?.diamonds).toBe(476);expect(result.save.party[0].paidStatusPoints).toBe(5);expect(result.save.commerce?.purchaseHistory).toHaveLength(1)});
  it('enforces one-time purchases',()=>{let save=grantSandboxDiamonds(createNewSave(1));const first=purchaseProduct(save,'premium_pet');expect(first.ok).toBe(true);const second=purchaseProduct(first.save,'premium_pet');expect(second.ok).toBe(false);expect(first.save.pets?.[0].petId).toBe('star_fox')});
  it('extends timed boosts by 30 minutes',()=>{let save={...createNewSave(1),items:{exp_boost:2}};const first=useTimedBoost(save,'exp_boost',1000)!;const second=useTimedBoost(first,'exp_boost',2000)!;expect(second.commerce?.activeBoosts.expUntil).toBe(1000+60*60*1000);expect(second.items.exp_boost).toBe(0)});
});
