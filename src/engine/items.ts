import type { SaveData } from '@/types';

export const ITEM_STACK_MAX = 99;

export function itemCountAfterGrant(current:number,quantity:number):number {
  return Math.min(ITEM_STACK_MAX,Math.max(0,current)+Math.max(0,quantity));
}

export function canReceiveItem(save:SaveData,itemId:string,quantity:number):boolean {
  return (save.items[itemId]??0)+Math.max(0,quantity)<=ITEM_STACK_MAX;
}

export function grantItem(save:SaveData,itemId:string,quantity:number):SaveData {
  if(quantity<=0)return save;
  return {
    ...save,
    items:{...save.items,[itemId]:itemCountAfterGrant(save.items[itemId]??0,quantity)},
    acquiredItemIds:[...new Set([...(save.acquiredItemIds??[]),itemId])],
  };
}
