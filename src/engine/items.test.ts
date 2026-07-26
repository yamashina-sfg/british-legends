import { describe,expect,it } from 'vitest';
import { createNewSave } from './save';
import { canReceiveItem,grantItem,itemCountAfterGrant,ITEM_STACK_MAX } from './items';

describe('consumable item inventory',()=>{
  it('caps all item stacks at 99 and keeps acquisition history at zero',()=>{
    let save=createNewSave(1);
    save=grantItem(save,'recovery_potion',120);
    expect(save.items.recovery_potion).toBe(ITEM_STACK_MAX);
    expect(save.acquiredItemIds).toContain('recovery_potion');
    save={...save,items:{...save.items,recovery_potion:0}};
    expect(save.acquiredItemIds).toContain('recovery_potion');
    expect(itemCountAfterGrant(98,5)).toBe(99);
  });

  it('rejects paid bundles that would exceed the maximum',()=>{
    const save={...createNewSave(1),items:{exp_boost:98}};
    expect(canReceiveItem(save,'exp_boost',1)).toBe(true);
    expect(canReceiveItem(save,'exp_boost',10)).toBe(false);
  });
});
